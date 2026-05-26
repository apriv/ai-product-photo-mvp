- 目标：定一个 UI 标准 + App 框架。以后所有功能都按这个标准加进去，避免每做一个页面都重新纠结布局、颜色、按钮、卡片、导航。
- 现在就做成像一个商用项目，而不是玩具的。
- 需要支持手机+电脑。用起来简单。

# 结构
```
登录后 App
├── 首页
├── Create
│   ├── 图片生成       商品图 / 海报 / 白底图
│   ├── 文案生成     广告文案 / 标题 / CTA
│   └── 视频生成       商品短视频
├── Assets
├── Account
└── Admin
```

# UI标准
```
框架：Next.js App Router
主模板：shadcn/ui 官方 blocks
图标：lucide-react
布局：Desktop sidebar + Mobile bottom nav / sheet menu
页面风格：浅灰背景 + 白色卡片 + 大按钮 + 清晰步骤
视觉参考：Vercel / Studio Admin dashboard
```

# 使用模板
1. 参考 layout
2. 复制组件结构
3. 固定视觉规范

# 落地
先做 UI 基座。
建立统一 App Shell，所有登录后的页面都包在 AppShell 里。
统一路由结构。
视觉规则也要一次定死，直接写进项目文档，比如 docs/ui-standard.md。
- 手机拍商品图，然后直接上传生成。不要只做桌面 dashboard。App Shell 必须从一开始支持手机页面。桌面端可以左右两栏；手机端必须变成 step-by-step。

# M0
- 做一个 UI Foundation Sprint
```
[ ] 安装/整理 shadcn/ui
[ ] 添加 Button / Card / Badge / Tabs / Input / Textarea / Sheet / Dropdown / Sidebar
[ ] 建 AppShell
[ ] 建 Sidebar
[ ] 建 Topbar
[ ] 建 MobileNav
[ ] 建 Dashboard 页面
[ ] 把现有 Image 页面套进 AppShell
[ ] 写 docs/ui-standard.md
```
验收标准
打开项目后，看起来像一个商用 SaaS 工作台
手机端可以正常上传图片和操作
以后新增 copy/video 页面不用重新设计
