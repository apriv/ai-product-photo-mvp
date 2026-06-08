# Local Testing

## 测试账号

使用 `npm run dev` 启动，并通过本机 `:3000` 或 Codespaces
`*-3000.app.github.dev` 测试地址访问时，可使用以下测试账号：

- 用户名：`test`
- 密码：`test123`
- 初始积分：`10000`

首次成功登录时，账号会按需创建在当前本地测试数据库中。测试账号仅在
`NODE_ENV !== "production"` 且请求地址为本机 `:3000` 或 Codespaces 的
`*-3000.app.github.dev` 时启用。正式环境无法使用，也不会在正式环境数据库中
自动创建。
