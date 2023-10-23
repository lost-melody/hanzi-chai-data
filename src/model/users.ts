import { Result } from "../error/error";

export class UserModel {
	id: string = "";

	constructor() {
	}

	public static async byId(id: string): Promise<Result<UserModel>> {
		// TODO: 查询用户数据
		var userModel = new UserModel();
		userModel.id = id;
		return userModel;
	}
}
