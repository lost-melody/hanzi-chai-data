import { Router } from 'itty-router';
import { routerUsers } from './users';
import { routerRepertoire } from './repertoire';
import { routerForms } from './forms';
import { Login } from '../controller/users';

/** 主路由, 以 `/api` 为前缀 */
export const routerApi = Router({ base: "/api" })
	// 登录接口
	.post('/login', Login)
	// 用户子路由
	.all('/users/*', routerUsers.handle)
	// 待编码汉字子路由
	.all('/repertoire/*', routerRepertoire.handle)
	// 字形信息子路由
	.all('/forms/*', routerForms.handle);
