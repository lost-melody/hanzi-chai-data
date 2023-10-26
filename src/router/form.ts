import { Router } from 'itty-router';
import * as form from '../controller/form';
import { authorizedAdmin, authorizedUser } from '../middleware/jwt';

export const routerForm = Router({ base: '/form' })
	.get('/', form.List)
	.get('/all', form.ListAll)
	.get('/:unicode', form.Info)
	.post('/batch', authorizedUser, authorizedAdmin, form.CreateBatch)
	.post('/', authorizedUser, authorizedAdmin, form.Create)
	.delete('/:unicode', authorizedUser, authorizedAdmin, form.Delete)
	.put('/:unicode', authorizedUser, authorizedAdmin, form.Update);
