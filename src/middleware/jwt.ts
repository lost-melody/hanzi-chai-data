import { error, IRequest } from 'itty-router';
import { Env } from '../dto/context';
import { Err, ErrCode, Ok, Result } from '../error/error';
import { UserRole } from '../dto/users';
import { UserModel } from '../model/users';
import { Claims } from '../dto/jwt';

async function parseJwt(token: string): Promise<Result<string>> {
	const claims = await Claims.parse(token);
	if (!Ok(claims)) {
		return new Err(ErrCode.Unauthorized, '用户身份凭证无效');
	}
	// 校验通过, 返回用户ID
	return claims.uid;
}

/** 身份认证中间件 */
export async function authorizedUser(request: IRequest, env: Env): Promise<any> {
	// 从请求头提取 jwt
	const token = request.headers.get('Authorization');
	if (token === null) {
		return error(401, new Err(ErrCode.Unauthorized, '需要身份认证'));
	}

	// 校验 jwt
	const userId = await parseJwt(token.replace(/^Bearer /, ''));
	if (!Ok(userId)) {
		return error(401, userId);
	}

	// 向上下文中注入用户ID
	env.UserId = userId;
	return;
}

/** 管理员身份认证. **注意**: 必须有前置身份认证 */
export async function authorizedAdmin(request: IRequest, env: Env): Promise<any> {
	// 从上下文中取出用户ID, 并验证管理员身份
	const userModel = await UserModel.byId(env, env.UserId);
	if (!Ok(userModel) || userModel.role === UserRole.Normal) {
		return error(403, new Err(ErrCode.PermissionDenied, '权限不足'));
	}

	return;
}

/** 超级管理员身份认证. **注意**: 必须有前置身份认证 */
export async function authorizedSuper(request: IRequest, env: Env): Promise<any> {
	// 从上下文中取出用户ID, 并验证管理员身份
	const userModel = await UserModel.byId(env, env.UserId);
	if (!Ok(userModel) || userModel.role !== UserRole.Super) {
		return error(403, new Err(ErrCode.PermissionDenied, '权限不足'));
	}

	return;
}
