import { Router } from 'itty-router';
import * as repertoire from '../controller/repertoire';

export const routerRepertoire = Router({ base: '/repertoire' }).get('/', repertoire.List).post('/', repertoire.Create);
