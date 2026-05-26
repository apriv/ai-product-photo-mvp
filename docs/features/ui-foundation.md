# UI Foundation

> 状态：v2 待办。目标是先定 UI 标准和 App 框架，再继续做文案生成、视频生成等新功能。

## 目标

- 把项目做成商用 SaaS 工作台，而不是 demo 工具。
- 所有登录后的页面都使用统一 App Shell。
- 后续新增 Image / Copy / Video / Assets 页面时，不再重新纠结布局、颜色、按钮、卡片和导航。
- 从第一版 UI 基座开始同时支持手机和电脑。

## 产品结构

```text
登录后 App
├── Dashboard
├── Create
│   ├── Image Studio       商品图 / 海报 / 白底图
│   ├── Copy Studio        广告文案 / 标题 / CTA / 视频脚本
│   └── Video Studio       商品短视频
├── Assets
├── Account
└── Admin
```

## UI 标准

- 框架：Next.js App Router。
- 组件基础：shadcn/ui 官方 blocks。
- 图标：lucide-react。
- 桌面布局：sidebar + topbar。
- 移动布局：bottom nav 或 sheet menu。
- 页面风格：浅灰背景、白色卡片、清晰步骤、明确状态。
- 视觉参考：Vercel dashboard / Studio Admin dashboard。

## 布局原则

- 登录后第一屏是可工作的 Dashboard，不做营销 landing page。
- 桌面端强调效率和信息密度，可以使用左右两栏。
- 手机端强调 step-by-step，不能只是桌面端缩小版。
- 手机端核心流程必须顺畅：拍照或上传商品图 -> 选择模式 -> 生成 -> 下载。
- 常用操作使用清晰按钮，工具操作使用 lucide 图标。
- 卡片用于具体对象、表单区块、结果区块，不把整页堆成卡片墙。
- 任何新增页面都必须放进 AppShell。

## M0 待办

- [ ] 阅读当前 Next.js 版本文档：`node_modules/next/dist/docs/`。
- [ ] 安装/整理 shadcn/ui。
- [ ] 添加 Button / Card / Badge / Tabs / Input / Textarea。
- [ ] 添加 Sheet / Dropdown / Sidebar。
- [ ] 建 `AppShell`。
- [ ] 建桌面 Sidebar。
- [ ] 建桌面 Topbar。
- [ ] 建移动 MobileNav。
- [ ] 建 Dashboard 页面。
- [ ] 统一 Create / Assets / Account / Admin 路由结构。
- [ ] 把现有 Image 页面套进 AppShell。
- [ ] 写 `docs/ui-standard.md`。

## 验收标准

- [ ] 打开项目后，看起来像一个商用 SaaS 工作台。
- [ ] 手机端可以正常上传图片和操作。
- [ ] 以后新增 Copy / Video 页面不用重新设计整体框架。
- [ ] 基础组件样式一致。
- [ ] 页面状态一致：loading、empty、error、success、insufficient credits。
