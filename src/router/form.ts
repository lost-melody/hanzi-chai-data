import { Router } from 'itty-router';
import * as form from '../controller/form';
import { authorizedAdmin, authorizedUser } from '../middleware/jwt';

export const routerForm = Router({ base: '/form' })
	.get('/', form.List)
	.get('/all', form.ListAll)
	.get('/:unicode', form.validateUnicode, form.Info)
	.post('/batch', authorizedUser, authorizedAdmin, form.CreateBatch)
	.post('/', authorizedUser, authorizedAdmin, form.CreateWithoutUnicode)
	.post('/:unicode', authorizedUser, authorizedAdmin, form.validateUnicode, form.checkNotExist, form.Create)
	.put('/:unicode', authorizedUser, authorizedAdmin, form.validateUnicode, form.checkExist, form.Update)
	.delete('/:unicode', authorizedUser, authorizedAdmin, form.validateUnicode, form.Delete);
