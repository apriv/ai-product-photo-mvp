# V1 Project Summary

> 状态：已完成。v1 是 AI Product Photo 的 MVP 版本，目标是验证电商图片生成、海报导出、账号激活和积分扣费闭环。

## 产品定位

v1 是一个可部署、可收费、可管理的电商 AI 图片生成 MVP。用户上传商品照片后，可以生成商品宣传图、白底展示图、抠图结果，或在原图上添加海报文字。

## 已完成范围

### 图片生成

入口：`/image`

- 社媒海报：调用 fal `xai/grok-imagine-image/edit`，生成 Instagram 风格商品海报，10 积分。
- 白底商品展示图：调用 fal `xai/grok-imagine-image/edit`，生成多角度白底商品图，10 积分。
- 仅抠图：调用 fal `fal-ai/birefnet`，只做背景去除，5 积分。
- 添加标题：不调用外部模型，使用上传图作为底图进入海报文字编辑，0 积分。

### 海报文字层

详见 [`../features/poster-generation-v1.md`](../features/poster-generation-v1.md)。

- 1:1 海报画布。
- 4 个固定文字模板。
- 标题、副标题、CTA 可直接编辑。
- 字号随内容长度自动缩放。
- 浏览器端导出 PNG。
- 添加标题模式免费，不扣积分。

### 用户系统

详见 [`../features/user-management.md`](../features/user-management.md)。

- 用户名 + 密码注册登录。
- 注册时使用激活码。
- HttpOnly cookie session。
- 路由保护使用 `src/proxy.ts`。
- route handler 内使用 `requireUser()` / `requireAdmin()` 做真实鉴权。

### 积分系统

- 每个图片模板有独立积分价格。
- 生成前原子扣费。
- fal 调用失败时自动退款。
- 每次扣费、退款、管理员调整都写 `CreditLedger`。
- 每次生成成功或失败都写 `GenerationLog`。

### 管理后台

入口：`/admin`

- 概览：用户数、激活码数量、生成次数。
- 用户管理：搜索用户、调整余额、写流水。
- 激活码管理：列表、状态筛选、批量生成、复制、导出 CSV。
- 统计面板：成功/失败、成功率、模板拆分、Top 用户。

## 技术实现

```text
src/
├── proxy.ts
├── app/
│   ├── login/
│   ├── register/
│   ├── account/
│   ├── admin/
│   ├── image/
│   ├── video/
│   └── api/
├── features/
│   ├── image/
│   └── poster/
└── lib/
    ├── auth.ts
    ├── activation.ts
    ├── credits.ts
    ├── generation-log.ts
    ├── fal-client.ts
    ├── prisma.ts
    └── logger.ts
```

关键约定：

- 新增图片模板主要改 `src/features/image/templates.ts`。
- 新增公开页面要加入 `src/proxy.ts` 的公开路径。
- 服务端鉴权统一用 `requireUser()` / `requireAdmin()`。
- 数据模型由 Prisma 管理，SQLite 数据库文件不进 git。

## 环境变量

```bash
FAL_KEY=...
LOG_LEVEL=info
LOG_DIR=./logs
DATABASE_URL="file:./prisma/dev.db"
```

`APP_PASSWORD` 已废弃。

## 部署状态

v1 支持 PM2 + Nginx 部署。常用命令见 [`../operations/deployment-runbook.md`](../operations/deployment-runbook.md)。

当前 Nginx 上传大小仍以小图为主。要支持高画质上传或视频，v2 需要先调整：

- `client_max_body_size`
- `proxy_read_timeout`
- 上传和长任务策略

## v1 结论

v1 已经完成 MVP 闭环，可以作为正式存档点：

```bash
git tag v1.0-mvp
git branch archive/mvp-final
```

后续功能进入 v2，不再继续按 MVP 页面形态叠加。
