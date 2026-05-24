# 项目文档

## 简介

电商 AI 助手：上传一张商品照片，调用 fal.ai 生成不同风格的电商商品图。后续计划加入视频生成。

## 当前功能

### 图片生成（`/image`）

四个模板，前端选择后调 `/api/image/generate`。每个模板有积分价格，生成成功才扣，失败自动退回：

- **社媒海报** — fal `xai/grok-imagine-image/edit`，生成 Instagram 风格高端海报（**10 积分**）
- **白底商品展示图** — 同上模型，换 prompt，生成多角度展示版（**10 积分**）
- **仅抠图** — fal `fal-ai/birefnet`，只做背景去除（**5 积分**）
- **占位预览** — sharp 生成 SVG placeholder，不调外部 API，用于测试（**0 积分**）

扣费流程：先 `chargeCredits()` 原子扣费 + 写 ledger → 调 fal → fal 失败时 `refund()` 退回并写 ledger。每次生成（成功/失败）都写一行 `GenerationLog`，用于后续统计成本和成功率。

### 访问控制

用户系统 + cookie session：
- 必须注册（用户名 + 密码 + **激活码**）后才能登录
- Session 用 HttpOnly cookie，30 天有效
- 路由保护用 `src/proxy.ts`（Next 16 的 proxy/中间件）：仅检查 cookie 是否存在，真正鉴权在 route handler 里 `requireUser()`
- 激活码来自外部售卖渠道；通过 `npm run generate-codes -- --plan <ID> --count N` 生成
- 详细设计见 [`user-management.md`](./user-management.md)

### 视频生成（`/video`）

占位页，未实现。注意事项见 [`dev-notes.md`](./dev-notes.md) 的 Todo。

## 技术栈

- Next.js 16.2.6（App Router，Turbopack）
- React 19 + Tailwind CSS 4
- `@fal-ai/client` — 调用 fal.ai 模型
- `sharp` — 服务端图像处理（占位图）
- `react-dropzone` — 拖拽上传
- `winston` — 日志（控制台 + 文件，路径默认 `./logs`）
- **Prisma 7 + SQLite**（`@prisma/adapter-better-sqlite3`）— 用户/积分/激活码数据持久化
- **bcryptjs** — 密码哈希

## 目录结构

```
src/
├── proxy.ts                        # Next 16 路由保护（未登录 → /login）
├── app/
│   ├── layout.tsx                  # root layout
│   ├── page.tsx                    # 首页：功能导航
│   ├── login/                      # 登录页（公开）
│   ├── register/                   # 注册页（公开，需激活码）
│   ├── account/                    # 账户页：余额 / 激活 / 流水
│   ├── image/
│   │   ├── page.tsx                # /image 路由入口
│   │   └── ImageGenerator.tsx      # 客户端组件，承载所有交互
│   ├── video/page.tsx              # 视频功能占位
│   └── api/
│       ├── auth/{login,logout,register}/route.ts
│       ├── account/{wallet,activate}/route.ts
│       └── image/generate/route.ts # POST /api/image/generate — 图片生成
│
├── features/                       # 按业务功能拆分的领域配置
│   ├── image/templates.ts          # 图片模板单一数据源：name + kind + model + prompt
│   └── video/templates.ts          # 视频模板占位
│
├── generated/prisma/               # 自动生成，gitignore，prisma generate 产出
│
└── lib/                            # 跨功能共享工具
    ├── auth.ts                     # session + bcrypt + requireUser / requireAdmin
    ├── activation.ts               # 激活码消费 + wallet 更新（事务）
    ├── credits.ts                  # chargeCredits + 余额/到期校验 + InsufficientCreditsError
    ├── generation-log.ts           # 写 GenerationLog（成功/失败都写）
    ├── fal-client.ts               # fal.config() 统一入口
    ├── prisma.ts                   # PrismaClient 单例（server-only）
    ├── image-compression.ts        # 浏览器端图片压缩（压到 1MB 内）
    ├── logger.ts                   # winston 实例
    └── request-meta.ts             # 请求 ID + 客户端 IP 提取

prisma/
├── schema.prisma                   # 数据模型（7 张表）
├── migrations/                     # 历史迁移，受 git 管理
├── seed.ts                         # 插入基础套餐（STD / TOPUP-100）
└── dev.db                          # SQLite 文件，gitignore

scripts/
├── create-admin.ts                 # 创建管理员账号
└── generate-codes.ts               # 批量生成激活码

prisma.config.ts                    # Prisma 7 配置（DATABASE_URL 来源）
```

## 关键约定

- **新增图片模板** = 只改 `src/features/image/templates.ts`。API route 按 `kind`（`fal-poster` / `fal-birefnet` / `placeholder`）dispatch，不用动 route 文件。
- **新增页面** = 在 `src/app/<name>/page.tsx` 加路由，proxy 自动要求登录。如果是公开页面，需要在 `src/proxy.ts` 的 `PUBLIC_PATHS` 加白名单。
- **服务端拿用户** = `requireUser()` / `requireAdmin()`，throw `AuthError` 时 catch 块自动转 HTTP 状态码。

## 环境变量（`.env.local`）

```
FAL_KEY=...                       # fal.ai API key
LOG_LEVEL=info                    # 可选，默认 info
LOG_DIR=./logs                    # 可选，winston 文件日志目录
DATABASE_URL="file:./prisma/dev.db"   # SQLite 路径（相对项目根 cwd）
```

`APP_PASSWORD` 已废弃，可以从生产 env 中删除。

## 本地运行

```bash
npm install                                # 自动跑 prisma generate
npx prisma migrate deploy                  # 首次：建库 + 跑迁移
npm run db:seed                            # 写入基础套餐
npx tsx scripts/create-admin.ts \
  --username admin --password <pwd>        # 创建第一个管理员
npm run dev                                # http://localhost:3000
npm run build
npm run lint
```

## 部署

服务器：腾讯云 ubuntu，PM2 + Nginx + Let's Encrypt（域名 xenra.xyz）。常用命令见 [`dev-notes.md`](./dev-notes.md)。

注意：Nginx 当前没有显式 `client_max_body_size`，默认 1MB。前端压缩已经兜底，但要上更高画质或视频前要先调 Nginx，详见 [`dev-notes.md`](./dev-notes.md) 的 Todo。

## 未来计划

按优先级排列。详细设计见 `docs/` 下的对应文档。

### 近期（小改动，ROI 高）

- 海报文字自定义：用户输入文案 + 选预设字体，注入 prompt
- 常用尺寸预设：banner / 主图 / 详情图 等比例

### 中期（变现前置，三件事必须捆绑做）

- 用户账号 + 卡密激活 + 登录 → 见 [`user-management.md`](./user-management.md)
- 数据库：用户素材管理
- 管理面板：使用量、成功率、用户管理、成本监控

### 远期（重投入，等基础稳了再上）

- 视频生成：图生视频，多素材合成，保证商品一致性
- 队列系统：长任务（视频）调度
- 前端持续打磨