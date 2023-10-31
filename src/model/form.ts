import { Env } from '../dto/context';
import { Err, ErrCode, Result } from '../error/error';
import { loadNumber, loadString } from '../dto/load';

const tableForm = 'form';

export class FormModel {
	unicode: number = 0;
	name: string = '';
	default_type: number = 0;
	gf0014_id: number = 0;
	component: string = '';
	compound: string = '';
	slice: string = '';

	public static modelFromRecord(record: Record<string, any>): FormModel {
		var formModel = new FormModel();
		formModel.unicode = loadNumber(record.unicode);
		formModel.name = loadString(record.name);
		formModel.default_type = loadNumber(record.default_type);
		formModel.gf0014_id = loadNumber(record.gf0014_id);
		formModel.component = loadString(record.component);
		formModel.compound = loadString(record.compound);
		formModel.slice = loadString(record.slice);
		return formModel;
	}

	public static async byUnicode(env: Env): Promise<Result<GlyphModel>> {
		let res: GlyphModel | null;
		try {
			res = await env.CHAI.prepare(`SELECT * FROM ${tableForm} WHERE unicode=? LIMIT 1`).bind(env.unicode).first();
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataQueryFailed, '数据查询失败');
		}

		if (res === null) {
			return new Err(ErrCode.RecordNotFound, '字形数据不存在');
		}

		return res;
	}

	public static async generateUnicode(env: Env, type: number): Promise<Result<number>> {
		var res: any[];
		const breakpoint = [0xe000, 0xe400, 0xe800, 0xf000] as const;
		const from = breakpoint[type];
		const to = breakpoint[type + 1];
		try {
			const { results } = await env.CHAI.prepare(`SELECT unicode FROM ${tableForm} WHERE unicode >= ? AND unicode < ?`)
				.bind(from, to)
				.all();
			res = results;
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataQueryFailed, '数据查询失败');
		}

		if (res === null) {
			return new Err(ErrCode.RecordNotFound, '字形数据不存在');
		}

		let code = from;
		for (const { unicode } of res) {
			if (unicode !== code) {
				return code;
			}
			code += 1;
		}

		if (code === to) {
			return new Err(ErrCode.UnknownInnerError, '已达上限，无法继续创建');
		}
		return code;
	}

	public static async exist(env: Env): Promise<Result<boolean>> {
		var res;
		try {
			res = await env.CHAI.prepare(`SELECT COUNT(0) total FROM ${tableForm} WHERE unicode=?`).bind(env.unicode).first('total');
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataQueryFailed, '数据查询失败');
		}
		return loadNumber(res) !== 0;
	}

	public static async count(env: Env): Promise<Result<number>> {
		var res;
		try {
			res = await env.CHAI.prepare(`SELECT COUNT(0) total FROM ${tableForm}`).first('total');
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataQueryFailed, '数据查询失败');
		}
		return loadNumber(res);
	}

	public static async list(env: Env, offset: number, limit: number): Promise<Result<FormModel[]>> {
		var res;
		try {
			res = await env.CHAI.prepare(`SELECT * FROM ${tableForm} LIMIT ? OFFSET ?`).bind(limit, offset).all();
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataQueryFailed, '数据查询失败');
		}

		const { results } = res;
		return results.map((record) => FormModel.modelFromRecord(record));
	}

	public static async create(env: Env, form: GlyphModel): Promise<Result<number>> {
		try {
			await env.CHAI.prepare(
				`INSERT INTO ${tableForm} (unicode, name, default_type, gf0014_id, component, compound, slice) VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(form.unicode, form.name, form.default_type, form.gf0014_id, form.component, form.compound, form.slice)
				.run();
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataCreateFailed, '数据创建失败');
		}
		return form.unicode;
	}

	public static async delete(env: Env): Promise<Result<boolean>> {
		try {
			await env.CHAI.prepare(`DELETE FROM ${tableForm} WHERE unicode=?`).bind(env.unicode).run();
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataDeleteFailed, '数据删除失败');
		}
		return true;
	}

	public static async update(env: Env, form: GlyphModel): Promise<Result<boolean>> {
		try {
			await env.CHAI.prepare(
				`UPDATE ${tableForm} SET name=?, default_type=?, gf0014_id=?, component=?, compound=?, slice=? WHERE unicode=?`
			)
				.bind(form.name, form.default_type, form.gf0014_id, form.component, form.compound, form.slice, form.unicode)
				.run();
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataUpdateFailed, '数据更新失败');
		}
		return true;
	}

	public static async mutate(env: Env, unicode_new: number): Promise<Result<boolean>> {
		try {
			await env.CHAI.prepare(`UPDATE ${tableForm} SET unicode = ? where unicode = ?`).bind(unicode_new, env.unicode).run();
			await env.CHAI.prepare(`UPDATE ${tableForm} SET slice = json_replace(slice, '$.source', ?) where json_extract(slice, '$.source') = ?`)
				.bind(unicode_new, env.unicode)
				.run();
			for (const index of [0, 1]) {
				await env.CHAI.prepare(
					`UPDATE ${tableForm} SET compound = json_replace(compound, '$.operandList[${index}]', ?) where json_extract(compound, '$.operandList[${index}]') = ?`
				)
					.bind(unicode_new, env.unicode)
					.run();
			}
		} catch (err) {
			console.warn({ message: (err as Error).message });
			return new Err(ErrCode.DataUpdateFailed, '数据更新失败');
		}
		return true;
	}
}
