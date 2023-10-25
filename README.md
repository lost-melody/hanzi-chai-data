# 拆·后台

## DTO

- 用户模型 (`User`):

```json
{
	"id": "user-id",
	"name": "User Name",
	"email": "username@email.com",
	"password": "unhashed",
	"avatar": "https://url/to/img"
}
```

- 用户列表 (`UserList`, 其中 `items` 字段为 `User[]` 模型列表):

```json
{
	"total": 50,
	"page": 1,
	"size": 20,
	"items": []
}
```

- 用户登录请求体 (`LoginReq`):

```json
{
	"username": "user-id",
	"password": "unhashed"
}
```

- 用户登录返回数据 (`Login`, 其中 `user` 为 `User` 模型):

```json
{
	"user": {},
	"token": "header.payload.signature"
}
```

- 错误 (Err):

```json
{
	"code": "SYS-10000001",
	"msg": "系统内部错误"
}
```

## API

- 所有接口出错后统一返回 `Err` 模型, 根据错误类型, 状态码可能为 `200`, `4xx` 或 `5xx`
- 登录 *API*:
	- `POST /login`: 登录, 传入 `LoginReq` 模型, 返回 `Login` 模型
- 用户 *API*:
	- `GET /users?page=1&size=20`: 查询用户列表, 返回 `UserList` 模型
	- `GET /users/:id`: 查询用户信息, 返回 `User` 模型
	- `POST /users`: 新增用户, 传入 `User` 模型
		- 需要 `Authorization` 请求头
		- 需要管理员身份
	- `DELETE /users/:id`: 删除用户
		- 需要 `Authorization` 请求头
		- 当删除的用户与当前登录用户不一致时, 需要管理员身份
	- `PUT /users/:id`: 更新用户, 传入 `User` 模型
		- 需要 `Authorization` 请求头
		- 需要管理员身份
