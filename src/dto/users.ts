export enum UserRole {
	Normal = 0,
	Admin = 1,
}

export enum UserState {
	Normal = 0,
	Disabled = 1,
}

export class User {
	/** 用户记录ID */
	id: string = '';
	/** 用户名: `/^[a-zA-Z]+([-]+[a-zA-Z0-9]+)*$/` */
	name: string = '';
	/** 用户注册邮箱 */
	email: string = '';
	/** 用户头像地址 */
	avatar: string = '';
	/** 用户角色: 0: 普通; 1: 管理员 */
	role: UserRole = 0;
	/** 用户状态: 0: 正常; 1: 停用 */
	state: UserState = 0;
}

export class UserList {
	/** 库中用户记录总数 */
	total: number = 0;
	/** 页码 */
	page: number = 0;
	/** 每页记录数 */
	size: number = 0;
	/** 查询的用户数据列表 */
	items: User[] = [];
}

export class UserLogin {
	user: User;
	token: string;

	constructor(user: User, token: string) {
		this.user = user;
		this.token = token;
	}
}
