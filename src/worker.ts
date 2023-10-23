import { Router, error, json } from 'itty-router';
import { createCors } from 'itty-router';

const { preflight, corsify } = createCors();
import { Env } from "./dto/context";
import { Err, ErrCode } from "./error/error";
import { routerApi } from "./router/router";

const router = Router()
	// 主路由
	.all("/api/*", routerApi.handle)
	// fallback
	.all('*', () => error(404, new Err(ErrCode.ResourceNotFound, "资源不存在")));

/*
# 目录结构

- `src`
	- `router`: 所有路由定义
	- `dto`: 所有交互数据类型定义
	- `error`: 错误类型定义和枚举
	- `controller`: 所有请求处理逻辑
	- `model`: 所有数据库操作接口
*/

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return await router.handle(request, env).then(json).then(corsify);
	},
};
