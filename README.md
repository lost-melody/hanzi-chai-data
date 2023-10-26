# 拆·后台

## DTO

<details>
<summary> 用户模型 <code> User </code></summary>

```json
{
	"id": "user-id",
	"name": "User Name",
	"email": "username@email.com",
	"password": "unhashed",
	"avatar": "https://url/to/img"
}
```

> - `id`: 用户ID, 由用户输入, 满足 `/^[a-zA-Z]+([_-][a-zA-Z0-9]+)*$/`
> - `name`: 用户名, 由用户输入, 基本可用任意字符
> - `email`: 邮箱, 可代替用户ID作登录用, 引入 *SMTP* 后也可作为找回
> - `password`: 用户密码, 为原始密码经 *MD5* 并 *Base64* 编码后得到

</details>

<details>
<summary> 用户列表 <code> DataList&lt;User&gt; </code></summary>

```json
{
	"total": 50,
	"page": 1,
	"size": 20,
	"items": []
}
```

> - `total`: 数据库中的用户总数
> - `page`: 当前返回的数据分页
> - `size`: 当前的分页大小
> - `items`: 用户数据列表, 为 `User[]` 模型列表

</details>

<details>
<summary> 用户登录请求模型 <code> LoginReq </code></summary>

```json
{
	"username": "user-id",
	"password": "unhashed"
}
```

> - `username`: 可以为用户ID或用户邮箱, 当包含 `@` 字符时, 作为邮箱处理
> - `password`: 用户密码, `base64(md5(passwd))`

</details>

<details>
<summary> 用户登录返回数据模型 <code> Login </code></summary>

```json
{
	"user": {},
	"token": "header.payload.signature"
}
```

> - `user`: 用户模型 `User`
> - `token`: *JWT* 字符串, 在前端请求的任意接口中 (或仅在需要身份验证的接口中), 均增加 `Authorization: "Bearer header.payload.signature"` 请求头

</details>

<details>
<summary> 错误模型 <code> Err </code></summary>

```json
{
	"err": "SYS-10000001",
	"msg": "系统内部错误"
}
```

> - `err` (原 `code`): 只要返回的 *JSON* 中包含此字段, 说明接口处理错误
> - `msg`: 当发生错误时, 一并返回错误描述信息. 一般可将 `err: msg` 展示为 *Toast*

</details>

<details>
<summary> 字形信息 <code> Form </code> </summary>

```json
{
	"unicode": 1,
	"name": "name",
	"default_type": 0,
	"gf0014_id": 0,
	"component": "",
	"compound": "",
	"slice": "",
}
```

</details>

## API

- 所有接口出错后统一返回 `Err` 模型, 根据错误类型, 状态码可能为 `200`, `4xx` 或 `5xx`
- 登录 *API*:
	- `POST /login`: 登录, 传入 `LoginReq` 模型, 返回 `Login` 模型
- 用户 *API*:
	- `GET /users?page=1&size=20`: 查询用户列表, 返回 `DataList<User>` 模型
	- `GET /users/:id`: 查询用户信息, 返回 `User` 模型
	- `POST /users`: 新增用户, 传入 `User` 模型
		- 需要 `Authorization` 请求头
		- ~需要管理员身份~, 当前未引入 *SMTP* 服务, 此接口作用户注册用
	- `DELETE /users/:id`: 删除用户
		- 需要 `Authorization` 请求头
		- 需要管理员身份
	- `PUT /users/:id`: 更新用户, 传入 `User` 模型
		- 需要 `Authorization` 请求头
		- 当修改的用户与当前登录用户不一致时, 需要管理员身份
- 字形管理 *API*
	- `GET /form?page=1&size=20`, 返回 `DataList<Form>`
	- `GET /form/all`, 查询所有字形数据
		- 原 `GET /form` 接口
	- `GET /form/:unicode`: 查询字形信息, 返回 `Form`
	- `POST /form`: 新增字形数据, 传入 `Form` 模型
		- 需要 `Authorization` 请求头
		- 需要管理员身份
	- `POST /form/batch`: 批量添加字形数据
		- 原 `POST /form` 接口
		- 需要 `Authorization` 请求头
		- 需要管理员身份
	- `DELETE /form/:unicode`: 删除字形数据
		- 需要 `Authorization` 请求头
		- 需要管理员身份
	- `PUT /form/:unicode`: 更新字形数据, 传入 `Form` 模型
		- 需要 `Authorization` 请求头
		- 需要管理员身份
