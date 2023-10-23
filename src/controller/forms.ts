import { Env } from "../dto/context";

export async function List(request: Request, env: Env) {
	const { results } = await env.CHAI.prepare('SELECT * FROM form').all();
	return results;
}

export async function Create(request: Request, env: Env) {
	const data: any[] = await request.json();
	const stmt = env.CHAI.prepare(
		'INSERT INTO form (unicode, name, default_type, gf0014_id, component, compound) VALUES (?, ?, ?, ?, ?, ?)'
	);
	const result = await env.CHAI.batch(
		data.map(({ unicode, name, default_type, gf0014_id, component, compound }) => {
			return stmt.bind(unicode, name, default_type, gf0014_id, component, compound);
		})
	);
	return result;
}
