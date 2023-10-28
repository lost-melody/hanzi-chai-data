import { IRequest } from 'itty-router';
import { Env } from '../dto/context';
import { Err, ErrCode, Ok, Result } from '../error/error';
import { Form } from '../dto/form';
import { DataList } from '../dto/list';
import { FormModel } from '../model/form';
import { loadNumber, loadString } from '../dto/load';

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

async function formToModel(form: any): Promise<Result<FormModel>> {
	var formModel = new FormModel();
	formModel.unicode = loadNumber(form.unicode);
	formModel.name = loadString(form.name);
	formModel.default_type = loadNumber(form.default_type);
	formModel.gf0014_id = loadNumber(form.gf0014_id);
	formModel.component = loadString(form.component);
	formModel.compound = loadString(form.compound);
	formModel.slice = loadString(form.slice);
	if (formModel.unicode) {
		return formModel;
	} else {
		return new Err(ErrCode.ParamInvalid, '参数格式不正确');
	}
}

/** GET:/form/all */
export async function ListAll(request: Request, env: Env) {
	const { results } = await env.CHAI.prepare('SELECT * FROM form').all();
	return results;
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
export async function Info(request: IRequest, env: Env): Promise<Result<Form>> {
	const unicode = parseInt(request.params['unicode']);
	if (!unicode) {
		return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
	}

	const formModel = await FormModel.byUnicode(env, unicode);
	if (!Ok(formModel)) {
		return formModel as Err;
	}

	const form = formFromModel(formModel);
	return form;
}

/** POST:/form */
export async function Create(request: IRequest, env: Env): Promise<Result<number>> {
	var args: any = {};
	try {
		const body: any = await request.json();
		if (body.unicode) {
			args = body;
		} else if (body.name && body.default_type !== undefined) {
			args = body;
			const unicode = await FormModel.generateUnicode(env, args.default_type);
			args.unicode = unicode;
		} else {
			return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
		}
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	const formModel = await formToModel(args);
	if (!Ok(formModel)) {
		return formModel as Err;
	}

	// 记录是否已存在
	var exist = await FormModel.exist(env, formModel.unicode);
	if (!Ok(exist)) {
		return exist as Err;
	}
	if (exist) {
		return new Err(ErrCode.RecordExists, `${formModel.unicode} 记录已存在`);
	}

	return await FormModel.create(env, formModel);
}

/** DELETE:/form/:unicode */
export async function Delete(request: IRequest, env: Env): Promise<Result<boolean>> {
	const unicode = parseInt(request.params['unicode']);
	if (!unicode) {
		return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
	}

	const formModel = await FormModel.byUnicode(env, unicode);
	if (!Ok(formModel)) {
		return formModel as Err;
	}

	return await FormModel.delete(env, unicode);
}

/** PUT:/form/:unicode */
export async function Update(request: IRequest, env: Env): Promise<Result<boolean>> {
	const unicode = parseInt(request.params['unicode']);
	if (!unicode) {
		return new Err(ErrCode.ParamInvalid, 'Unicode不正确');
	}

	// 记录存在
	const formModel = await FormModel.byUnicode(env, unicode);
	if (!Ok(formModel)) {
		return formModel as Err;
	}

	// 请求参数
	var args: any = {};
	try {
		args = await request.json();
	} catch (err) {
		return new Err(ErrCode.UnknownInnerError, (err as Error).message);
	}

	// 更新
	var newModel = await formToModel(args);
	if (!Ok(newModel)) {
		return newModel as Err;
	}

	newModel.unicode = unicode;
	newModel.name = newModel.name || formModel.name;
	newModel.default_type = newModel.default_type || formModel.default_type;
	newModel.gf0014_id = newModel.gf0014_id || formModel.gf0014_id;
	newModel.component = newModel.component || formModel.component;
	newModel.compound = newModel.compound || formModel.compound;
	newModel.slice = newModel.slice || formModel.slice;
	return await FormModel.update(env, formModel);
}
