import { Env } from "../dto/context";
import { Err, ErrCode, Result } from "../error/error";
import { loadNumber, loadString } from "../dto/load";

const tableUsers = "users";

export class UserModel {
	id: string = "";
	name: string = "";
	email: string = "";
	password: string = "";
	avatar: string = "";
	role: number = 0;
	state: number = 0;

	public static modelFromRecord(record: Record<string, any>): UserModel {
		var userModel = new UserModel();
		userModel.id = loadString(record.id);
		userModel.name = loadString(record.name);
		userModel.email = loadString(record.email);
		userModel.password = loadString(record.password);
		userModel.avatar = loadString(record.avatar);
		userModel.role = loadNumber(record.role);
		userModel.state = loadNumber(record.state);
		return userModel;
	}

	public static async byId(env: Env, id: string): Promise<Result<UserModel>> {
		const res = await env.CHAI.prepare(
			`SELECT * FROM ${tableUsers} WHERE id=? LIMIT 1`
		).bind(id).first();

		if (res === null) {
			return new Err(ErrCode.RecordNotFound, "用户不存在");
		}

		return UserModel.modelFromRecord(res);
	}

	public static async byEmail(env: Env, email: string): Promise<Result<UserModel>> {
		const res = await env.CHAI.prepare(
			`SELECT * FROM ${tableUsers} WHERE email=? LIMIT 1`
		).bind(email).first();

		if (res === null) {
			return new Err(ErrCode.RecordNotFound, "用户不存在");
		}

		return UserModel.modelFromRecord(res);
	}

	public static async count(env: Env): Promise<Result<number>> {
		const res = await env.CHAI.prepare(`SELECT COUNT(0) total FROM ${tableUsers}`).first("total");
		return loadNumber(res);
	}

	public static async list(env: Env, offset: number, limit: number): Promise<Result<UserModel[]>> {
		const res = await env.CHAI.prepare(
			`SELECT * FROM ${tableUsers} LIMIT ${limit} OFFSET ${offset}`
		).all();

		const { results } = res;
		return results.map((record) => UserModel.modelFromRecord(record));
	}

	public static async create(env: Env, user: UserModel): Promise<Result<boolean>> {
		await env.CHAI.prepare(
			`INSERT INTO ${tableUsers} (id, name, email, avatar, password) VALUES (?, ?, ?, ?, ?)`
		).bind(user.id, user.name, user.email, user.avatar, user.password).run();
		return true;
	}

	public static async delete(env: Env, id: string): Promise<Result<boolean>> {
		await env.CHAI.prepare(
			`DELETE FROM ${tableUsers} WHERE id=?`
		).bind(id).run();
		return true;
	}
}
