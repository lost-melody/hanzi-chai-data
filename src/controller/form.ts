import { IRequest } from 'itty-router';
import { Env } from '../dto/context';
import { Err, ErrCode, Ok, Result } from '../error/error';
import { Form } from '../dto/form';
import { DataList } from '../dto/list';
import { FormModel } from '../model/form';
import { loadNumber, loadString } from '../dto/load';
import { Schema, Validator } from '@cfworker/json-schema';
import schema from '../../schema.json';

const validateGlyph = new Validator(schema.definitions.Glyph as Schema);
const validateNamed = new Validator(schema.definitions.NamedGlyph as Schema);

function formFromModel(formModel: FormModel): Form {
	var form = new Form();
	form.unicode = formModel.unicode;
	form.name = formModel.name;
	form.default_type = formModel.default_type;
	form.gf0014_id = formModel.gf0014_id;
	form.component = formModel.component;
	form.compound = formModel.compound;
	form.slice = formModel.slice;
	return form;
}

function glyphFromGlyphModel(model: GlyphModel): Glyph {
	return {
		...model,
		component: model.component ? JSON.parse(model.component) : undefined,
		slice: model.slice ? JSON.parse(model.slice) : undefined,
		compound: model.compound ? JSON.parse(model.compound) : undefined,
	};
}

function glyphToGlyphModel(glyph: Glyph): GlyphModel {
	return {
		...glyph,
		component: glyph.component ? JSON.stringify(glyph.component) : null,
		slice: glyph.slice ? JSON.stringify(glyph.slice) : null,
		compound: glyph.compound ? JSON.stringify(glyph.compound) : null,
	};
}

export async function validateUnicode(request: IRequest, env: Env) {
	const unicode = parseInt(request.params['unicode']);
	if (!Number.isInteger(unicode)) {
		// TODO: 增加具体范围
		return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
	}
	env.unicode = unicode;
}

export async function checkExist(request: IRequest, env: Env) {
	// 记录是否已存在
	let exist = await FormModel.exist(env);
	if (!Ok(exist)) {
		return exist;
	}
	if (!exist) {
		return new Err(ErrCode.RecordExists, `${env.unicode} 记录不存在`);
	}

}

// 记录是否已存在
export async function checkNotExist(request: IRequest, env: Env) {
	let exist = await FormModel.exist(env);
	if (!Ok(exist)) {
		return exist;
	}
	if (exist) {
		return new Err(ErrCode.RecordExists, `${env.unicode} 记录已存在`);
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
		'INSERT INTO form (unicode, name, default_type, gf0014_id, component, compound, slice) VALUES (?, ?, ?, ?, ?, ?, ?)'
	);
	const result = await env.CHAI.batch(
		data.map(({ unicode, name, default_type, gf0014_id, component, compound, slice }) => {
			return stmt.bind(unicode, name, default_type, gf0014_id, component, compound, slice);
		})
	);
	return result;
}

/** GET:/form?page=1&size=20 */
export async function List(request: IRequest, env: Env): Promise<Result<DataList<Form>>> {
	// 第 `page` 页, 每页 `size` 条
	const { page, size } = request.query;

	// 查询记录总数
	const result = await FormModel.count(env);
	if (!Ok(result)) {
		return result as Err;
	}

	var formList = new DataList<Form>();
	formList.total = result;
	formList.page = parseInt(loadString(page)) || 1;
	formList.size = parseInt(loadString(size)) || 20;

	if (formList.total > (formList.page - 1) * formList.size) {
		// 本页有数据时, 查询数据
		const result = await FormModel.list(env, (formList.page - 1) * formList.size, formList.size);
		if (!Ok(result)) {
			return result as Err;
		}

		formList.items = result.map((formModel) => formFromModel(formModel));
	}

	return formList;
}

/** GET:/form/:unicode */
export async function Info(request: IRequest, env: Env): Promise<Result<Glyph>> {
	const glyphModel = await FormModel.byUnicode(env);
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
export async function Delete(request: IRequest, env: Env): Promise<Result<boolean>> {
	return await FormModel.delete(env);
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
