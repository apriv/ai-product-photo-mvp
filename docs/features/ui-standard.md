# UI Standard

> 状态：v2 M0 初版。本文档记录登录后 App 的基础 UI 规则，后续功能默认遵守这里的约定。

## App Shell

- 登录后页面统一使用 `AppShell`。
- 桌面端：左侧 sidebar + 顶部 topbar + 内容区。
- 移动端：顶部 bar + bottom nav + sheet menu。
- 登录、注册页面不进入 App Shell。
- 旧路由保留兼容，新功能入口逐步使用 `/create/*`。

## 路由结构

```text
/
/create/image
/create/copy
/create/video
/assets
/account
/admin
/admin/users
/admin/codes
/admin/stats
```

兼容路由：

- `/image` 继续可用，内容等同 Image Studio。
- `/video` 继续可用，内容等同 Video Studio 占位页。

## 页面结构

- 页面顶部使用 `PageHeader`。
- 页面主体用 1 到 2 个主要工作区，不堆装饰性卡片。
- 桌面端内容最大宽度由 App Shell 控制。
- 手机端核心任务按步骤自然向下排列。

## 基础组件

当前初版组件位置：

- `src/components/app-shell.tsx`
- `src/components/ui.tsx`

已提供：

- `AppShell`
- `Button`
- `LinkButton`
- `Card`
- `Badge`
- `Tabs`
- `Input`
- `Textarea`
- `PageHeader`
- `EmptyState`

后续如果引入 shadcn/ui，优先把这些组件迁移到 shadcn 风格，而不是在页面里散写新样式。

## 视觉规则

- 背景：浅灰。
- 内容容器：白色、1px 边框、8px radius。
- 主按钮：近黑色。
- 次按钮：白底边框。
- 状态色：绿色成功、红色失败、琥珀色警告。
- 字体：使用项目 root layout 中的 Geist。
- 字号：dashboard 和工作台页面保持紧凑，不使用 landing page 式大标题。

## 移动端规则

- bottom nav 只放最高频入口：Home / Create / Assets / Account。
- 复杂导航放进 sheet menu。
- Create 流程必须适合手机拍照上传。
- 不把桌面左右两栏硬缩到手机。

## 状态规则

所有新页面都要考虑：

- loading
- empty
- error
- success
- insufficient credits
- disabled / coming soon
