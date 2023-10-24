import { Router, error, json } from 'itty-router';
import { createCors } from 'itty-router';

const { preflight, corsify } = createCors();

export interface Env {
	CHAI: D1Database;
}

const router = Router();

router
	.all('*', preflight)
	.get('/repertoire', async (request: Request, env: Env) => {
		const { results } = await env.CHAI.prepare('SELECT * FROM repertoire').all();
		return results;
	})
	.post('/repertoire', async (request: Request, env: Env) => {
		const data: any[] = await request.json();
		const stmt = env.CHAI.prepare('INSERT INTO repertoire (unicode, tygf, gb2312, pinyin) VALUES (?, ?, ?, ?)');
		const result = await env.CHAI.batch(
			data.map(({ unicode, tygf, gb2312, pinyin }) => {
				return stmt.bind(unicode, tygf, gb2312, pinyin);
			})
		);
		return result;
	})
	.get('/form', async (request: Request, env: Env) => {
		const { results } = await env.CHAI.prepare('SELECT * FROM form').all();
		return results;
	})
	.post('/form', async (request: Request, env: Env) => {
		const data: any[] = await request.json();
		const stmt = env.CHAI.prepare(
			'INSERT INTO form (unicode, name, default_type, gf0014_id, component, compound, slice) VALUES (?, ?, ?, ?, ?, ?, ?)'
		);
		const result = await env.CHAI.batch(
			data.map(({ unicode, name, default_type, gf0014_id, component, compound, slice }) => {
				return stmt.bind(unicode, name, default_type, gf0014_id, component, compound, slice);
			})
		);
		return result;
	})
	.all('*', () => error(404));

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return await router.handle(request, env).then(json).then(corsify);
	},
};
