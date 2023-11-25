import { IRequest, Router } from 'itty-router';
import { Env } from '../dto/context';

async function download(request: IRequest, env: Env) {
	const name = request.params['name'];
	const value = await env.REFERENCE.get(name);
	return JSON.parse(value!);
}

export const routerReference = Router({ base: '/reference' }).get('/:name', download);
