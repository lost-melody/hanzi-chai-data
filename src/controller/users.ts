import { IRequest } from "itty-router";
import { compareSync, hashSync } from "bcrypt";
import { Env } from "../dto/context";
import { BcryptSaltRounds } from "../def/constants";
import { Err, ErrCode, Ok, Result } from "../error/error";
import { User, UserList, UserLogin } from "../dto/users";
import { loadString } from "../dto/load";
import { UserModel } from "../model/users";
import { Claims } from "../dto/jwt";

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

function hashPassword(password: string): string {
	return hashSync(password, BcryptSaltRounds);
}

function verifyPassword(password: string, hash: string) {
	return compareSync(password, hash);
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

	// TODO: 确保用户名和邮箱都无重, 需要加锁

	var userModel = new UserModel();
	userModel.id = loadString(args.id);
	userModel.name = loadString(args.name);
	userModel.email = loadString(args.email);
	// TODO: 头像上传需要对象存储功能, 现在可以存为 url 或图像 base64
	userModel.avatar = loadString(args.avatar);
	// 密码在前端请求中使用 md5 或 sha1, 后端再将之存为 bcrypt
	userModel.password = hashPassword(loadString(args.password));
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
		return userModel;
	}

	return await UserModel.delete(env, userId);
}

/** POST:/api/login */
export async function Login(request: IRequest, env: Env): Promise<Result<UserLogin>> {
	var args: any = {};
	try {
		const body: any = await request.json();
		if (body.username && body.password) {
			args = body;
		} else {
			return new Err(ErrCode.ResourceNotFound, "用户名不正确");
		}
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	const username = loadString(args.username);
	const password = loadString(args.password);

	var userModel;
	if (username.match(/@/)) {
		// 通过邮箱登录
		userModel = await UserModel.byEmail(env, username);
	} else {
		// 通过用户名登录
		userModel = await UserModel.byId(env, username);
	}
	if (!Ok(userModel)) {
		return userModel;
	}

	if (verifyPassword(password, userModel.password)) {
		// 密码正确
		const user = userFromModel(userModel);
		const token = Claims.new(user.id).sign();
		// 返回用户信息和 jwt
		return new UserLogin(user, token);
	} else {
		return new Err(ErrCode.ResourceNotFound, "用户名或密码错误");
	}
}
