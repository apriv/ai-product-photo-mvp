# V2 Roadmap

> 状态：待办。v2 的目标是把项目从单功能 MVP 升级成商用内容生成工作台。第一优先级是 UI Foundation，不先做视频和脚本生成。

## 存档前置

- [ ] 确认当前功能可作为 MVP 结束点。
- [ ] 提交文档和代码。
- [ ] 打 `v1.0-mvp` tag。
- [ ] 建 `archive/mvp-final` 分支。
- [ ] 推送 tag 和 archive 分支到远端。

建议命令：

```bash
git status
git add .
git commit -m "Close MVP and define v2 roadmap"
git tag v1.0-mvp
git branch archive/mvp-final
git push
git push origin v1.0-mvp
git push origin archive/mvp-final
```

## M0: UI Foundation

目标：打开项目后，第一眼就是商用 SaaS 工作台，而不是 demo 工具。确定UI基础，未来统一。不再做UI决策。

- [x] 阅读当前 Next.js 版本文档：`node_modules/next/dist/docs/`。
- [x] 写 `docs/features/ui-standard.md`。根据 `features/ui-foundation.md` 做 UI
- [ ] 整理 shadcn/ui 基础组件。
- [x] 添加 Button。
- [x] 添加 Card。
- [x] 添加 Badge。
- [ ] 添加 Tabs。
- [ ] 添加 Input。
- [ ] 添加 Textarea。
- [ ] 添加 Sheet。
- [ ] 添加 Dropdown。
- [x] 添加 Sidebar。
- [x] 建立统一 `AppShell`。
- [x] 建桌面端 sidebar。
- [x] 建桌面端 topbar。
- [x] 建移动端 bottom nav 或 sheet menu。
- [x] 建 Dashboard 页面。
- [x] 统一 Create / Assets / Account / Admin 路由结构。
- [x] 把现有 Image 页面套进 AppShell。

验收标准：

- [x] 桌面端像稳定的 Studio/Admin 工作台。
- [ ] 手机端可以顺畅上传、生成、下载。
- [x] 新增 Copy/Video 页面时不用重新设计导航和布局。
- [ ] 页面背景、卡片、间距、标题、按钮、状态提示、空状态风格一致。未来统一模板。

## M1: Image Studio Refresh

目标：把现有图片能力从独立页面整理成工作台模块。

- [ ] 图片生成入口迁到 `Create / Image`。
- [ ] 商品图、海报、白底图用 tabs 或 mode switch 管理。
- [ ] 手机端改成 step-by-step：上传 -> 选择模式 -> 编辑 -> 生成 -> 下载。
- [ ] 桌面端保留高效工作区：输入设置 + 预览结果。
- [ ] 海报编辑并入 UI 标准。
- [ ] 优化 loading 状态。
- [ ] 优化失败状态。
- [ ] 优化积分不足状态。
- [ ] 优化空状态。
- [ ] 保留 v1 所有图片功能。

验收标准：

- [ ] 老功能不丢。
- [ ] 移动端不挤、不乱。
- [ ] 用户能清楚知道当前步骤和下一步。

## M2: Copy Studio

目标：先做低成本、高复用的文案生成模块，为视频功能铺路。

- [ ] 广告标题生成。
- [ ] 商品卖点提炼。
- [ ] CTA 生成。
- [ ] 小红书风格短文案。
- [ ] TikTok 风格短文案。
- [ ] Instagram 风格短文案。
- [ ] 视频脚本雏形：开头 hook。
- [ ] 视频脚本雏形：镜头段落。
- [ ] 视频脚本雏形：字幕文案。
- [ ] 视频脚本雏形：结尾 CTA。
- [ ] 支持商品描述作为输入上下文。
- [ ] 支持图片生成结果作为输入上下文。
- [ ] 支持复制、重新生成、保存到 Assets。

验收标准：

- [ ] 文案结果可以直接复制使用。
- [ ] 视频脚本结构可以进入 Video Studio。
- [ ] Copy Studio 复用同一套 AppShell 和 UI 标准。

## M3: Assets

目标：让用户能找回和管理生成过的内容。

- [ ] 历史生成图片。
- [ ] 海报导出记录。
- [ ] 文案记录。
- [ ] 视频记录预留。
- [ ] 按类型筛选。
- [ ] 按时间筛选。
- [ ] 按状态筛选。
- [ ] 支持打开图片。
- [ ] 支持下载图片。
- [ ] 支持复制文案。
- [ ] 支持从生成结果保存到 Assets。

验收标准：

- [ ] 用户能找回自己生成过的内容。
- [ ] Assets 成为 Create 页面生成后的自然落点。

## M4: Video Studio

目标：在 UI、脚本和素材管理稳定后，再进入商品短视频生成。

- [ ] 明确视频模型和成本。
- [ ] 明确视频积分价格。
- [ ] 调整 Nginx `client_max_body_size`。
- [ ] 调整 Nginx `proxy_read_timeout`。
- [ ] 设计长任务状态：排队中、生成中、成功、失败。
- [ ] 设计失败重试。
- [ ] 商品图 + 脚本生成视频。
- [ ] 少量固定视频模板。
- [ ] 生成后保存到 Assets。
- [ ] 不做复杂视频编辑器。

验收标准：

- [ ] 视频生成不是阻塞页面的黑盒。
- [ ] 失败后能保留输入内容，方便重试。
- [ ] 用户能看到任务状态。

## M5: Account/Admin 产品化

目标：让账户、积分、激活码和统计更像正式后台。

- [ ] Account 页面并入新 AppShell。
- [ ] Admin 页面并入新 AppShell。
- [ ] 优化余额、套餐到期、流水展示。
- [ ] 优化激活码批量生成和导出。
- [ ] 增加成本统计入口。
- [ ] 增加模型调用失败原因统计。
- [ ] 梳理套餐文案。

## UI 原则

- [ ] 先是 App，再是功能页面。
- [ ] 先统一框架，再扩展图片、文案、视频。
- [ ] 桌面端强调效率和信息密度。
- [ ] 手机端强调一步一步完成任务。
- [ ] 登录后第一屏是可工作的 dashboard。
- [ ] 减少花哨装饰，增加清晰结构、稳定状态、可信细节。
