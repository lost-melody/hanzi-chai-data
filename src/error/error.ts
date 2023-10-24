/** 通用错误结构定义 */
export class Err {
	/** 错误码: `/^[A-Z]{2,5}-[0-9]{8}$/` */
	code: string;
	/** 错误信息 */
	msg: string;

	constructor(code?: string, msg?: string) {
		this.code = code || ErrCode.UnknownInnerError;
		this.msg = msg || "未知内部错误";
	}
};

/** 错误码枚举 */
export enum ErrCode {
	/** 未知错误 */
	UnknownInnerError = "SYS-00000001",
	/** 资源不存在 */
	ResourceNotFound = "RES-00000002",
	/** 记录不存在 */
	RecordNotFound = "DB-10000001",
	/** 用户JWT无效 */
	Unauthorized = "AUTH-10000001",
	/** 用户权限不足 */
	PermissionDenied = "AUTH-10000002",
};

/** 带有错误的返回值 */
export type Result<T> = T | Err;

/** 判断返回值是否有错误 */
export function Ok<T>(result: Result<T>): result is T {
	return !(result instanceof Err);
}
