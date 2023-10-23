export class User {
	/** 用户记录ID */
	id: string = "";
	/** 用户名: `/^[a-zA-Z]+([-]+[a-zA-Z0-9]+)*$/` */
	name: string = "";
	/** 用户注册邮箱 */
	email: string = "";
}

export class UserList {
	/** 库中用户记录总数 */
	total: number = 0;
	/** 查询的用户数据列表 */
	items: User[] = [];
}
