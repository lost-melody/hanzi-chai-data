import { JwtPayload, sign, verify } from "jsonwebtoken";
import { UnixHour } from "../def/constants";
import { random } from "../utils/random";
import { nowUnix } from "../utils/time";
import { Err, ErrCode, Result } from "../error/error";

/** JWT 有效期, 默认 2 小时 */
const JwtExpires = 2 * UnixHour;
/** JWT 签名密钥: 应该出现在非公开配置文件中 */
const JwtKey = Math.round(random(0, 0xffffffff)).toString(16);
/** JWT 签名公钥: 应该出现在配置文件中 */
const JwtPubKey = JwtKey;

export class Claims implements JwtPayload {
	jti: string = "";
	iat: number = 0;
	exp: number = 0;
	uid: string = "";

	public sign(key?: string): string {
		return sign(this, key || JwtKey);
	}

	public static new(userId: string, expires?: number): Claims {
		var claims = new Claims();
		claims.jti = Math.round(random(0, 0xffffffff)).toString();
		claims.iat = nowUnix();
		claims.exp = claims.iat + (expires || JwtExpires);
		claims.uid = userId;
		return claims;
	}

	public static parse(token: string, key?: string): Result<Claims> {
		try {
			const payload = verify(token, key || JwtPubKey);
			if (typeof payload === "string") {
				return new Err(ErrCode.Unauthorized, "invalid token");
			}
			var claims = new Claims();
			claims.jti = payload.jti || "";
			claims.iat = payload.iat || 0;
			claims.exp = payload.exp || 0;
			claims.uid = payload.uid || "";
			return claims;
		} catch (err) {
			return new Err(ErrCode.Unauthorized, "invalid token");
		}
	}
};
