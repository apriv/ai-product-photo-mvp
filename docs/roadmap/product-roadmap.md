# Product Roadmap

> 目标：把 AI Product Photo 从图片生成 MVP，逐步做成面向电商卖家的 AI 内容生成工作台。

## 总路线

### v1: MVP

状态：已完成。

目标：验证基础商业闭环。

- [x] 商品图生成。
- [x] 白底商品展示图。
- [x] 抠图。
- [x] 海报文字层编辑。
- [x] PNG 导出。
- [x] 用户注册登录。
- [x] 激活码。
- [x] 积分扣费和退款。
- [x] 管理后台。
- [x] 基础部署。

说明见 [`../releases/v1-mvp.md`](../releases/v1-mvp.md)。

### v2: Commercial Studio

状态：待办。

目标：从 MVP 页面升级成商用 SaaS 工作台。

- [ ] UI Foundation。
- [ ] Image Studio Refresh。
- [ ] Copy Studio。
- [ ] Assets。
- [ ] Video Studio。
- [ ] Account/Admin 产品化。

详细待办见 [`v2-roadmap.md`](./v2-roadmap.md)。

### v3: 全流程功能

状态：待办。

目标：完善功能。提升生产效率、稳定性和商业化能力。

- [ ] 队列系统和长任务管理。
- [ ] 视频任务异步状态追踪。
- [ ] 素材库搜索、标签、批量操作。
- [ ] 品牌资产：品牌色、字体、Logo、常用 CTA。
- [ ] 多尺寸批量生成。
- [ ] 团队账号和权限。
- [ ] 成本监控和模型路由。

## 当前优先级

1. 完成 v1 存档：commit + tag + archive 分支。
2. 开始 v2 M0：UI Foundation。
3. 在新 UI 框架内重组 Image Studio。
4. 先做 Copy Studio，再做 Video Studio。

## 不要提前做的事

- 不要在 UI Foundation 前继续堆新页面。
- 不要先做复杂视频编辑器。
- 不要在没有 Assets 的情况下做大量历史记录功能。
- 不要把移动端当桌面端缩小版。
