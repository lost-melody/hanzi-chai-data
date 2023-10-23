import { IRequest } from "itty-router";
import { Env } from "../dto/context";
import { Err, ErrCode, Ok, Result } from "../error/error";
import { User, UserList } from "../dto/users";
import { UserModel } from "../model/users";

/** GET:/api/users?page=1&size=20 */
export async function List(request: IRequest, env: Env): Promise<Result<UserList>> {
	// 第 `page` 页, 每页 `size` 条
	const { page, size } = request.query;
	// TODO: 查询用户列表
	return new UserList();
}

/** GET:/api/users/:id */
export async function Info(request: IRequest, env: Env): Promise<Result<User>> {
	const userId = request.params["id"];

	// 从 `model` 层取回数据
	const result = await UserModel.byId(userId);
	if (!Ok(result)) {
		// 返回错误
		console.warn("failed to query user data:", result.msg);
		return new Err(ErrCode.UnknownInnerError, "数据查询失败");
	}

	// 返回用户信息
	var user = new User();
	user.id = result.id;
	return user;
}

/** POST:/api/login */
export async function Login(request: IRequest, env: Env): Promise<Result<User>> {
	// TODO: 查询用户信息, 校验登录密码
	return new Err(ErrCode.RecordNotFound, "用户不存在");
}
