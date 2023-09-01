/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	CHAI: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { url, method } = request;
		const { pathname } = new URL(url);
		const name = pathname.slice(1);
		switch (method) {
			case "GET":
				const { keys } = await env.CHAI.list();
				const result: Record<string, any> = {};
				const promises = keys.map(key => env.CHAI.get(key.name));
				const values = await Promise.all(promises);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i].name;
					const value = values[i];
					result[key] = JSON.parse(value!);
				}
				return new Response(JSON.stringify(result));
			case "PUT":
				const upload = await request.json();
				const { commit } = (upload as any).context;
				const key = `${name}#${commit}`;
				await env.CHAI.put(key, JSON.stringify(upload));
				return new Response(JSON.stringify({ success: true }));
			default:
				return new Response("Unknown method");
		}
	},
};
