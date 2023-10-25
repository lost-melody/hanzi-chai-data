import { decode, sign, verify } from '@tsndr/cloudflare-worker-jwt';
import { UnixHour } from '../def/constants';
import { random } from '../utils/random';
import { nowUnix } from '../utils/time';
import { Err, ErrCode, Result } from '../error/error';

/** JWT 有效期, 默认 2 小时 */
const JwtExpires = 2 * UnixHour;
/** JWT 签名密钥: 应该出现在非公开配置文件中 */
const JwtKey = Math.round(random(0, 0xffffffff)).toString(16);
/** JWT 签名公钥: 应该出现在配置文件中 */
const JwtPubKey = JwtKey;

export class Claims {
	jti: string = '';
	iat: number = 0;
	exp: number = 0;
	uid: string = '';

	public async sign(key?: string): Promise<string> {
		return await sign(this, key || JwtKey);
	}

	public static new(userId: string, expires?: number): Claims {
		var claims = new Claims();
		claims.jti = Math.round(random(0, 0xffffffff)).toString();
		claims.iat = nowUnix();
		claims.exp = claims.iat + (expires || JwtExpires);
		claims.uid = userId;
		return claims;
	}

	public static async parse(token: string, key?: string): Promise<Result<Claims>> {
		try {
			if (!(await verify(token, key || JwtPubKey))) {
				return new Err(ErrCode.Unauthorized, 'invalid token');
			}
		} catch (err) {
			return new Err(ErrCode.Unauthorized, 'invalid token');
		}

		const { payload } = decode(token);
		var claims = new Claims();
		claims.jti = payload.jti || '';
		claims.iat = payload.iat || 0;
		claims.exp = payload.exp || 0;
		claims.uid = payload.uid || '';
		return claims;
	}
}
