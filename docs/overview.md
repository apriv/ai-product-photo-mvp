# AI Product Photo

AI Product Photo 是一个面向电商卖家的 AI 内容生成工具。v1 已完成 MVP：用户可以上传商品图，生成电商商品图、白底图、海报文字图，并通过账号、激活码和积分系统控制使用额度。

v2 的方向是把项目从单功能 MVP 升级成商用内容生成工作台：先建立统一 UI 框架，再扩展图片、文案、视频和素材管理。

## 当前阶段

- 当前版本：v1 MVP 已完成。
- 下一阶段：v2 UI Foundation。
- 当前重点：先定 App Shell、导航、页面结构、组件标准，再做文案生成和视频生成。

## 文档结构

- [`README.md`](./README.md)：docs 目录索引。
- [`roadmap/product-roadmap.md`](./roadmap/product-roadmap.md)：项目总路线图。
- [`roadmap/v2-roadmap.md`](./roadmap/v2-roadmap.md)：v2 版本待办清单。
- [`releases/v1-mvp.md`](./releases/v1-mvp.md)：v1 MVP 已完成功能和项目说明。
- [`features/ui-foundation.md`](./features/ui-foundation.md)：v2 UI 基座设计文档。
- [`features/poster-generation-v1.md`](./features/poster-generation-v1.md)：海报生成 v1 功能文档。
- [`features/user-management.md`](./features/user-management.md)：用户、激活码、积分系统功能文档。
- [`operations/deployment-runbook.md`](./operations/deployment-runbook.md)：部署、服务器、PM2、Nginx、数据库操作手册。

## 产品模块

```text
登录后 App
├── Dashboard
├── Create
│   ├── Image Studio       商品图 / 海报 / 白底图
│   ├── Copy Studio        广告文案 / 标题 / CTA / 视频脚本
│   └── Video Studio       商品短视频
├── Assets                 图片 / 海报 / 文案 / 视频素材
├── Account                余额 / 套餐 / 激活码 / 流水
└── Admin                  用户 / 激活码 / 统计
```

## v1 已完成

- 商品图生成。
- 白底商品展示图。
- 抠图。
- 海报文字层编辑和 PNG 导出。
- 添加标题免费模式。
- 用户注册、登录、HttpOnly cookie session。
- 激活码注册和账户激活。
- 积分扣费、失败退款、积分流水。
- 管理后台：用户、激活码、统计。
- SQLite + Prisma 数据持久化。
- PM2 + Nginx 服务器部署流程。

详细说明见 [`releases/v1-mvp.md`](./releases/v1-mvp.md)。

## v2 待办

v2 的第一阶段不是继续堆功能，而是统一 UI 框架。

- [ ] 建立统一 App Shell。
- [ ] 统一桌面端 sidebar + topbar。
- [ ] 统一移动端 bottom nav 或 sheet menu。
- [ ] 建 Dashboard。
- [ ] 重组 Create / Assets / Account / Admin 路由。
- [ ] 把现有图片功能迁入 Image Studio。
- [ ] 写 `docs/ui-standard.md`。
- [ ] 完成 Copy Studio。
- [ ] 完成 Assets。
- [ ] 完成 Video Studio。

详细待办见 [`roadmap/v2-roadmap.md`](./roadmap/v2-roadmap.md)。

## 技术栈

- Next.js 16.2.6，App Router，Turbopack。
- React 19。
- Tailwind CSS 4。
- Prisma 7 + SQLite。
- `@fal-ai/client`。
- `sharp`。
- `react-dropzone`。
- `winston`。
- `bcryptjs`。

## 本地运行

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npx tsx scripts/create-admin.ts --username admin --password <pwd>
npm run dev
```

常用验证：

```bash
npm run build
npm run lint
```

## 部署说明

服务器部署、PM2、Nginx、数据库迁移、日志命令统一放在 [`operations/deployment-runbook.md`](./operations/deployment-runbook.md)。

上线视频或更高画质上传前，需要先调整 Nginx `client_max_body_size`、超时和上传策略。
