/**
 * 上下文环境
 * CHAI: 数据库访问对象, 这应该只在 `data` 层使用
 * UserId: 当前用户 ID, 由鉴权中间件注入
 */
export interface Env {
	CHAI: D1Database;
	UserId: string;
	JWT_KEY: string;
}
