import { Router } from 'itty-router';
import * as form from '../controller/form';

export const routerForm = Router({ base: '/form' }).get('/', form.List).post('/', form.Create);
