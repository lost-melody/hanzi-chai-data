import { Router } from 'itty-router';
import { routerUsers } from './users';
import { routerRepertoire } from './repertoire';
import { routerForm } from './form';
import { Login } from '../controller/users';
import { routerReference } from './reference';

/** 主路由, 以 `/api` 为前缀 */
export const routerApi = Router()
	// 登录接口
	.post('/login', Login)
	// 用户子路由
	.all('/users/*', routerUsers.handle)
	// 待编码汉字子路由
	.all('/repertoire/*', routerRepertoire.handle)
	// 字形信息子路由
	.all('/form/*', routerForm.handle)
	// 参考码表子路由
	.all('/reference/*', routerReference.handle);
