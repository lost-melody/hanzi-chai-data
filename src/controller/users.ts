import { IRequest } from "itty-router";
import { Env } from "../dto/context";
import { Err, ErrCode, Ok, Result } from "../error/error";
import { User, UserList, UserLogin } from "../dto/users";
import { loadString } from "../dto/load";
import { UserModel } from "../model/users";
import { Claims } from "../dto/jwt";
import { authorizedAdmin } from "../middleware/jwt";

function userFromModel(userModel: UserModel): User {
	var user = new User();
	user.id = userModel.id;
	user.name = userModel.name;
	user.email = userModel.email;
	user.avatar = userModel.avatar;
	user.role = userModel.role;
	user.state = userModel.state;
	return user;
}

async function userToModel(user: any): Promise<UserModel> {
	var userModel = new UserModel();
	userModel.id = loadString(user.id);
	userModel.name = loadString(user.name);
	userModel.email = loadString(user.email);
	// TODO: 头像上传需要对象存储功能, 现在可以存为 url 或图像 base64
	userModel.avatar = loadString(user.avatar);
	// 密码在前端请求中使用 md5 或 sha1, 后端再将之存为 bcrypt
	userModel.password = await hashPassword(loadString(user.password));
	return userModel;
}

/** 输入 -> SHA1 -> Base64 -> 输出 */
async function hashPassword(password: string): Promise<string> {
	const buffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/** 将给定的密码与库中记录比对 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const newHash = await hashPassword(password);
	return newHash === hash;
}

/** GET:/api/users?page=1&size=20 */
export async function List(request: IRequest, env: Env): Promise<Result<UserList>> {
	// 第 `page` 页, 每页 `size` 条
	const { page, size } = request.query;

	// 查询用户记录总数
	const result = await UserModel.count(env);
	if (!Ok(result)) {
		return result as Err;
	}

	var userList = new UserList();
	userList.total = result;
	userList.page = parseInt(loadString(page)) || 1;
	userList.size = parseInt(loadString(size)) || 20;

	if (userList.total > (userList.page - 1) * userList.size) {
		// 本页有数据时, 查询数据
		const result = await UserModel.list(env, (userList.page - 1) * userList.size, userList.size);
		if (!Ok(result)) {
			return result as Err;
		}

		userList.items = result.map((userModel) => userFromModel(userModel));
	}

	return userList;
}

/** GET:/api/users/:id */
export async function Info(request: IRequest, env: Env): Promise<Result<User>> {
	const userId = request.params["id"];

	// 从 `model` 层取回数据
	const result = await UserModel.byId(env, userId);
	if (!Ok(result)) {
		// 返回错误
		return result as Err;
	}

	// 返回用户信息
	return userFromModel(result);
}

/** POST:/api/users */
export async function Create(request: IRequest, env: Env): Promise<Result<boolean>> {
	var args: any = {};
	try {
		const body: any = await request.json();
		if (body.id && body.email) {
			args = body;
		} else {
			return new Err(ErrCode.ResourceNotFound, "用户名或邮箱不正确");
		}
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	const userModel = await userToModel(args);
	// 用户名或邮箱是否已存在
	var exist = await UserModel.exist(env, userModel.id, userModel.email);
	if (!Ok(exist)) {
		return exist as Err;
	}
	// TODO: 需要确保这个 if-then 的原子性
	if (exist) {
		return new Err(ErrCode.RecordExists, "用户已存在");
	}

	return await UserModel.create(env, userModel);
}

/** DELETE:/api/users/:id */
export async function Delete(request: IRequest, env: Env): Promise<Result<boolean>> {
	const userId = request.params["id"];
	if (!userId) {
		return new Err(ErrCode.ResourceNotFound, "用户名不正确");
	}

	const userModel = await UserModel.byId(env, userId);
	if (!Ok(userModel)) {
		return userModel as Err;
	}

	return await UserModel.delete(env, userId);
}

/** PUT:/api/users/:id */
export async function Update(request: IRequest, env: Env): Promise<Result<boolean>> {
	const userId = request.params["id"];
	if (!userId) {
		return new Err(ErrCode.ResourceNotFound, "用户名不正确");
	}

	if (userId !== env.UserId) {
		// 修改他人信息, 要求管理员
		const auth = await authorizedAdmin(request, env);
		if (!Ok(auth)) {
			return auth as Err;
		}
	}

	// 用户存在
	const userModel = await UserModel.byId(env, userId);
	if (!Ok(userModel)) {
		return userModel as Err;
	}

	// 请求参数
	var args: any = {};
	try {
		args = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	// 更新
	var newModel = await userToModel(args);
	newModel.id = userId;
	newModel.name = newModel.name || userModel.name;
	newModel.email = newModel.email || userModel.email;
	newModel.avatar = newModel.avatar || userModel.avatar;
	newModel.password = newModel.password || userModel.password;
	return await UserModel.update(env, userModel);
}

/** POST:/api/login */
export async function Login(request: IRequest, env: Env): Promise<Result<UserLogin>> {
	var args: any = {};
	try {
		const body: any = await request.json();
		if (body.username && body.password) {
			args = body;
		} else {
			return new Err(ErrCode.ResourceNotFound, "用户名或密码不正确");
		}
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	const username = loadString(args.username);
	const password = loadString(args.password);

	var userModel;
	// if (username.match(/@/)) {
	// 	// 通过邮箱登录
	// 	userModel = await UserModel.byEmail(env, username);
	// } else {
	// 	// 通过用户名登录
	// 	userModel = await UserModel.byId(env, username);
	// }
	userModel = await UserModel.byId(env, username);
	if (!Ok(userModel)) {
		return userModel as Err;
	}

	if (await verifyPassword(password, userModel.password)) {
		// 密码正确
		const user = userFromModel(userModel);
		const token = await Claims.new(user.id).sign();
		// 返回用户信息和 jwt
		return new UserLogin(user, token);
	} else {
		return new Err(ErrCode.ResourceNotFound, "用户名或密码错误");
	}
}
