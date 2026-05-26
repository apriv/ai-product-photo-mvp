# 海报生成功能 v1

> 状态：v1 已完成。本文档记录当前海报文字层能力和后续升级方向。

## 目标

海报生成拆成两层：

- **Layer 1**：AI 或用户上传图作为底图。社媒海报由 fal 生成；“添加标题”直接使用上传后的压缩图。
- **Layer 2**：用户在图片上直接编辑标题、副标题、CTA，并选择 4 个固定文字模板。

确认后，前端直接导出当前浏览器预览 DOM 为 PNG。这样最终图尽量和用户看到的预览一致，包括字体、阴影、按钮大小和位置。

## v1 范围

做：

- 1:1 海报画布。
- 4 个固定文字模板。
- 标题 / 副标题 / CTA 直接悬浮在图片上编辑。
- 字号随内容长度自动缩放。
- “确认并生成海报”后导出 PNG，并沿用当前打开/下载入口。
- “社媒海报”扣积分；“添加标题”免费、不调外部模型。

不做：

- 拖拽文字位置。
- 自定义字体上传。
- 自动推荐文案。
- 自动避让商品。
- 多尺寸、多格式、历史工程文件。

## 用户流程

```
上传商品图
  -> 选择“社媒海报”或“添加标题”
  -> 得到底图
  -> 选择文字模板
  -> 直接在图上改标题 / 副标题 / CTA
  -> 确认并生成海报
  -> 打开/下载图片
```

## 四个文字模板

字体优先用 Google Fonts，并通过 `next/font/google` 自托管。英文标题可以用更有风格的 display 字体；中文输入走中文系统 fallback，保证可读。

### 1. Editorial

高级杂志广告感，适合美妆、香水、饰品、家居摆件、礼品。

- 标题：`Playfair Display` / `Fraunces`
- 副标题和 CTA：`Space Grotesk` / system sans
- 色彩：黑、象牙白、香槟金、深棕
- CTA：细边框或深色小胶囊
- 默认文案：`Quiet Luxury` / `A refined everyday essential` / `Discover`

### 2. Studio Pop

年轻品牌 campaign 感，适合服饰、宠物用品、潮玩、生活方式小物。

- 标题：`Bebas Neue`
- 副标题和 CTA：`Space Grotesk`
- 色彩：奶白、墨黑、珊瑚红、草绿、柔和粉
- CTA：收敛的实心圆角按钮，避免大块黄色
- 默认文案：`Fresh Drop` / `Made for your daily rotation` / `Shop the edit`

### 3. Street Note

手写、涂鸦、贴纸感，适合运动、潮牌、配饰、饮品、玩具、节日促销。

- 标题：`Permanent Marker`
- 副标题：`Space Grotesk`
- CTA：`Bebas Neue` / `Space Grotesk`
- 色彩：白、黑、辣椒红、少量荧光青绿，避免整块蓝色
- 视觉：标题可轻微旋转，像贴纸或手写标注
- 默认文案：`Just Landed` / `Limited vibe, everyday use` / `Grab it`

### 4. Soft Social

温柔生活方式感，适合母婴、宠物、家居、食品、手作、小红书式分享。

- 标题：`Caveat` / `Fraunces`
- 副标题和 CTA：`Space Grotesk` / system sans
- 色彩：暖白、奶油色、鼠尾草绿、玫瑰棕、深灰
- 视觉：底部柔和渐变保证复杂背景上的可读性
- 默认文案：`Little Joys` / `Soft details for everyday moments` / `Take a look`

## 实现要点

- 文字模板配置在 `src/features/poster/text-templates.ts`。
- 模型和 prompt 配置在 `src/features/image/model-config.ts`。
- `/api/image/generate` 返回可安全导出的 data URL 底图。
- `ImageGenerator.tsx` 负责悬浮编辑、字体加载、预览导出。
- 导出方式：克隆预览 DOM，内联计算样式，把 input/textarea 转成普通文字节点，再用 SVG `foreignObject` + Canvas 输出 PNG。

## 验收

- 4 个模板视觉明显不同，不只是换位置。
- 4 个模板默认文案不同，能给用户灵感。
- 预览和最终 PNG 的字体、阴影、按钮尺寸基本一致。
- “添加标题”免费、不调 fal，直接进入同一套文字编辑。
- 中文输入不乱码，至少保持清晰可读。
- `npm run lint` 和 `npm run build` 通过。

## v2+ 待办

- [ ] 更多模板和尺寸。
- [ ] 自动推荐标题、副标题、CTA。
- [ ] 智能 typography。
- [ ] 根据商品位置动态布局。
- [ ] 自动避让商品主体。
- [ ] 品牌色、品牌字体、常用 CTA。
- [ ] 保存可再次编辑的工程文件。
