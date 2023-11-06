import { IRequest } from 'itty-router';
import { Ctx, Env } from '../dto/context';
import { Err, ErrCode, Ok, Result } from '../error/error';
import { Form } from '../dto/form';
import { DataList } from '../dto/list';
import { FormModel } from '../model/form';
import { loadNumber, loadString } from '../dto/load';
import { Schema, Validator } from '@cfworker/json-schema';
import schema from '../../schema.json';

const validateGlyph = new Validator(schema.definitions.Glyph as Schema);
const validateNamed = new Validator(schema.definitions.NamedGlyph as Schema);

const charToCode = (char: string) => char.codePointAt(0)!;
const codeToChar = (code: number) => String.fromCodePoint(code);

const sliceForward = (c: any) => ({ ...c, source: codeToChar(c.source) });
const sliceReverse = (c: any) => ({ ...c, source: charToCode(c.source) });

const compoundForward = (c: any) => ({ ...c, operandList: c.operandList.map(codeToChar) });
const compoundReverse = (c: any) => ({ ...c, operandList: c.operandList.map(charToCode) });

function glyphFromGlyphModel(model: GlyphModel): Glyph {
	return {
		...model,
		component: model.component ? JSON.parse(model.component) : undefined,
		slice: model.slice ? sliceForward(JSON.parse(model.slice)) : undefined,
		compound: model.compound ? JSON.parse(model.compound).map(compoundForward) : undefined,
	};
}

function glyphToGlyphModel(glyph: Glyph): GlyphModel {
	return {
		...glyph,
		component: glyph.component ? JSON.stringify(glyph.component) : null,
		slice: glyph.slice ? JSON.stringify(sliceReverse(glyph.slice)) : null,
		compound: glyph.compound ? JSON.stringify(glyph.compound.map(compoundReverse)) : null,
	};
}

export async function validateUnicode(request: IRequest, env: Env, ctx: Ctx) {
	const unicode = parseInt(request.params['unicode']);
	if (!Number.isInteger(unicode)) {
		// TODO: 增加具体范围
		return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
	}
	ctx.unicode = unicode;
}

export async function checkExist(request: IRequest, env: Env, ctx: Ctx) {
	// 记录是否已存在
	let exist = await FormModel.exist(env, ctx.unicode);
	if (!Ok(exist)) {
		return exist;
	}
	if (!exist) {
		return new Err(ErrCode.RecordExists, `${ctx.unicode} 记录不存在`);
	}
}

// 记录是否已存在
export async function checkNotExist(request: IRequest, env: Env, ctx: Ctx) {
	let exist = await FormModel.exist(env, ctx.unicode);
	if (!Ok(exist)) {
		return exist;
	}
	if (exist) {
		return new Err(ErrCode.RecordExists, `${ctx.unicode} 记录已存在`);
	}
}

/** GET:/form/all */
export async function ListAll(request: Request, env: Env): Promise<Result<Glyph[]>> {
	const { results } = await env.CHAI.prepare('SELECT * FROM form').all();
	return (results as unknown as GlyphModel[]).map(glyphFromGlyphModel);
}

/** POST:/form/batch */
export async function CreateBatch(request: Request, env: Env) {
	const data: any[] = await request.json();
	const stmt = env.CHAI.prepare(
		'INSERT INTO form (unicode, name, default_type, gf0014_id, component, compound, slice) VALUES (?, ?, ?, ?, ?, ?, ?)',
	);
	const result = await env.CHAI.batch(
		data.map(({ unicode, name, default_type, gf0014_id, component, compound, slice }) => {
			return stmt.bind(unicode, name, default_type, gf0014_id, component, compound, slice);
		}),
	);
	return result;
}

/** GET:/form?page=1&size=20 */
export async function List(request: IRequest, env: Env): Promise<Result<DataList<Glyph>>> {
	// 第 `page` 页, 每页 `size` 条
	const { page, size } = request.query;

	// 查询记录总数
	const result = await FormModel.count(env);
	if (!Ok(result)) {
		return result as Err;
	}

	var formList = new DataList<Glyph>();
	formList.total = result;
	formList.page = parseInt(loadString(page)) || 1;
	formList.size = parseInt(loadString(size)) || 20;

	if (formList.total > (formList.page - 1) * formList.size) {
		// 本页有数据时, 查询数据
		const result = await FormModel.list(env, (formList.page - 1) * formList.size, formList.size);
		if (!Ok(result)) {
			return result as Err;
		}

		formList.items = result.map(glyphFromGlyphModel);
	}

	return formList;
}

/** GET:/form/:unicode */
export async function Info(request: IRequest, env: Env, ctx: Ctx): Promise<Result<Glyph>> {
	const glyphModel = await FormModel.byUnicode(env, ctx.unicode);
	if (!Ok(glyphModel)) {
		return glyphModel as Err;
	}

	return glyphFromGlyphModel(glyphModel);
}

/** POST:/form/:unicode */
export async function Create(request: IRequest, env: Env): Promise<Result<number>> {
	let glyph: unknown;
	try {
		glyph = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	if (!validateGlyph.validate(glyph)) {
		return new Err(ErrCode.ParamInvalid, '请求不合法');
	}

	return await FormModel.create(env, glyphToGlyphModel(glyph as Glyph));
}

/** POST:/form */
export async function CreateWithoutUnicode(request: IRequest, env: Env): Promise<Result<number>> {
	let glyph: unknown;
	try {
		glyph = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	if (!validateNamed.validate(glyph)) {
		return new Err(ErrCode.ParamInvalid, '请求不合法');
	}
	const unicode = await FormModel.generateUnicode(env, (glyph as Glyph).default_type);

	if (!Ok(unicode)) {
		return unicode;
	}

	return await FormModel.create(env, glyphToGlyphModel({ ...(glyph as Glyph), unicode }));
}

/** DELETE:/form/:unicode */
export async function Delete(request: IRequest, env: Env, ctx: Ctx): Promise<Result<boolean>> {
	const { results: s_ref } = await env.CHAI.prepare('SELECT * FROM form WHERE json_extract(slice, "$.source") = ?').bind(ctx.unicode).all();
	const { results: c_ref } = await env.CHAI.prepare(`SELECT * FROM form WHERE compound like ?`).bind(`%${ctx.unicode}%`).all();
	if (s_ref.length > 0 || c_ref.length > 0) {
		return new Err(ErrCode.PermissionDenied, '无法删除，因为还有别的字形引用它');
	}
	return await FormModel.delete(env, ctx.unicode);
}

/** PUT:/form/:unicode */
export async function Update(request: IRequest, env: Env): Promise<Result<boolean>> {
	// 请求参数
	let glyph: unknown;
	try {
		glyph = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	if (!validateGlyph.validate(glyph)) {
		return new Err(ErrCode.ParamInvalid, '请求不合法');
	}

	return await FormModel.update(env, glyphToGlyphModel(glyph as Glyph));
}

/** PATCH:/form/:unicode */
export async function Mutate(request: IRequest, env: Env, ctx: Ctx): Promise<Result<boolean>> {
	// 请求参数
	let unicode_new: unknown;
	try {
		unicode_new = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	if (typeof unicode_new !== 'number' || !Number.isInteger(unicode_new)) {
		return new Err(ErrCode.ParamInvalid, '不是整数');
	}

	return await FormModel.mutate(env, ctx.unicode, unicode_new);
}
