import { Router } from 'itty-router';
import { authorizedUser, authorizedAdmin } from '../middleware/jwt';
import * as users from '../controller/users';

export const routerUsers = Router({ base: '/users' })
	.get('/', users.List)
	.get('/:id', users.Info)
	.post('/', users.Create)
	.delete('/:id', authorizedUser, authorizedAdmin, users.Delete)
	.put('/:id', authorizedUser, users.Delete);
