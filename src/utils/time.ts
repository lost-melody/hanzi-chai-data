/** 当前时间的 Unix 时间戳 */
export function nowUnix(): number {
	return Math.floor(Date.now() / 1000);
}
