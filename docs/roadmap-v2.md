# V2 Roadmap

> 状态：MVP 结束，进入 v2。v2 的第一件事不是继续堆功能，而是先把 UI 框架定下来，让项目从可用工具升级成商用 SaaS 工作台。

## Git 存档建议

推荐做法：**先 commit 一个 MVP 结束点，再打 tag，同时保留一个 archive 分支。**

原因：

- `tag` 适合标记一个不可变版本点，比如 `mvp-final` 或 `v1.0-mvp`。
- `archive` 分支适合以后随时 checkout、部署、对比旧版本，比如 `archive/mvp-final`。
- 后续 v2 可以继续在 `main` 或新分支上开发，不会把 MVP 状态弄丢。

建议流程：

```bash
git status
git add .
git commit -m "Close MVP and define v2 UI foundation"
git tag v1.0-mvp
git branch archive/mvp-final
git push
git push origin v1.0-mvp
git push origin archive/mvp-final
```

如果想更正式一点，可以在 GitHub/GitLab 上用 `v1.0-mvp` tag 发一个 release，说明：

- MVP 已完成：商品图 / 海报 / 白底图 / 登录注册 / 激活码 / 积分扣费。
- v2 开始：UI Foundation、脚本生成、视频生成、素材资产管理。

## V2 产品方向

v2 的核心目标：**从单功能 MVP，升级成一个面向商用的内容生成工作台。**

暂定主线：

1. UI Foundation：统一 App Shell、导航、页面布局、组件标准。
2. Image Studio：把现有图片生成能力放进新框架，并优化移动端流程。
3. Copy Studio：广告文案、标题、CTA、商品卖点脚本。
4. Video Studio：商品短视频生成、脚本到视频、素材到视频。
5. Assets：历史图片、海报、文案、视频素材管理。
6. Account/Admin：套餐、积分、激活码、用户管理继续产品化。

## M0: UI Foundation Sprint

目标：打开项目后，第一眼就像一个商用 SaaS，而不是 demo 工具。

范围：

- 整理 shadcn/ui 基础组件。
- 建立登录后的统一 `AppShell`。
- 桌面端使用 sidebar + topbar。
- 手机端使用 bottom nav 或 sheet menu。
- 建立 Dashboard 首页。
- 统一 Create / Assets / Account / Admin 路由结构。
- 把现有 Image 页面套进新框架。
- 写 `docs/ui-standard.md`，固定视觉和交互规范。

验收标准：

- 桌面端看起来像稳定的 Studio/Admin 工作台。
- 手机端可以顺畅完成上传、生成、下载。
- 新增 copy/video 页面时不需要重新设计导航和布局。
- Button、Card、Badge、Tabs、Input、Textarea、Sheet、Dropdown、Sidebar 有统一用法。
- 页面背景、卡片、间距、标题、状态提示、空状态风格一致。

## M1: Image Studio Refresh

目标：把现有图片功能从“页面功能”整理成“工作台模块”。

范围：

- 图片生成入口统一到 `Create / Image`。
- 商品图、海报、白底图用 tab 或 mode switch 管理。
- 手机端改成 step-by-step：上传 -> 选择模式 -> 编辑 -> 生成 -> 下载。
- 桌面端可以保留左右两栏：输入设置 + 预览结果。
- 海报编辑继续保留当前 v1 能力，但样式并入 UI 标准。
- 增加更清晰的 loading、失败、积分不足、结果为空状态。

验收标准：

- 老功能不丢。
- 移动端不挤、不乱、不像桌面页面缩小版。
- 用户能清楚知道当前在哪一步、下一步做什么。

## M2: Copy Studio

目标：先做低成本、高复用的文案生成模块，为视频功能铺路。

范围：

- 广告标题生成。
- 商品卖点提炼。
- CTA 生成。
- 小红书 / TikTok / Instagram 风格短文案。
- 视频脚本雏形：开头 hook、镜头段落、字幕文案、CTA。
- 支持把图片生成结果或商品描述作为输入上下文。

验收标准：

- 生成结果可以复制、重新生成、保存到 Assets。
- 文案模块和图片模块共用同一套 AppShell 和 UI 组件。
- 视频脚本格式后续可以直接进入 Video Studio。

## M3: Assets

目标：让用户不是“一次性生成”，而是能管理自己的素材。

范围：

- 历史生成图片。
- 海报导出记录。
- 文案记录。
- 后续视频记录预留。
- 简单筛选：类型、时间、状态。
- 支持打开、下载、复制文案。

验收标准：

- 用户能找回自己生成过的内容。
- Assets 可以成为 Create 页面生成后的自然落点。

## M4: Video Studio

目标：在 UI 和脚本能力稳定后，再进入视频生成。

范围：

- 商品短视频入口。
- 从商品图 + 脚本生成视频。
- 先支持少量固定模板，不做复杂编辑器。
- 明确视频上传大小、超时、队列、失败重试策略。
- 服务端先解决 Nginx body size、proxy timeout、长任务状态管理。

验收标准：

- 视频生成不是阻塞页面的黑盒。
- 用户能看到状态：排队中、生成中、成功、失败。
- 失败后能保留输入内容，方便重试。

## UI 原则

- 先是 App，再是功能页面。
- 先统一框架，再扩展图片、文案、视频。
- 桌面端强调效率和信息密度。
- 手机端强调一步一步完成任务。
- 避免 landing page 感，登录后第一屏就是可工作的 dashboard。
- 不做玩具感：减少花哨装饰，增加清晰结构、稳定状态、可信细节。

## 下一步执行顺序

1. 提交当前状态，打 `v1.0-mvp` tag，建 `archive/mvp-final` 分支。
2. 开始 `M0: UI Foundation Sprint`。
3. M0 完成后再做 Image Studio Refresh。
4. Copy Studio 和 Video Studio 不要抢在 UI Foundation 前面做。

