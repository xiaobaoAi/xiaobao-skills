# 用户层参数 vs 内部参数

Agent 只与用户讨论「用户层」；组装 API 时再映射到「内部层」。

## 用户层（可问用户）

| 字段 | 说明 | 常见说法 |
|------|------|----------|
| 视频主题 | 内容主题 / 标题方向 | 「新品发布」「双十一预热」 |
| 视频文案 | 口播或旁白全文 | 用户粘贴文案，或请 Agent 代写 |
| 视频时长 | 目标时长 | 「15 秒」「大约半分钟」 |
| 视频类型 | 任务形态 | 口播 / 混剪 / 新闻 / 包装 |
| 人物 | 出镜主体 | 老板、数字人、已有口播录像 |
| 声音 | 音色偏好 | 女声、沉稳、品牌样音链接 |
| 视频风格 | 视觉调性 | 科技感、政务、种草、活泼 |
| 素材 | 图/视频/音频 | 须符合 [media-requirements.md](media-requirements.md)；公网 URL 或先 `upload.mjs` |
| 平台 | 发布渠道 | 抖音、视频号、小红书、B 站 |
| 横竖屏 | 画幅 | 竖屏、横屏、1:1 |

## 内部层（禁止要求用户填写）

| 字段 | 用途 | 谁负责 |
|------|------|--------|
| `styleId` | 模版 ID | `list-templates` + Agent 匹配 |
| `apiType` | 接口类型 | 由 mode 映射（见 modes.md） |
| `task_id` | 异步任务号 | create / poll 内部流转 |
| `voice_id` / `voice_type` | TTS 音色 | 克隆结果或控制台系统音色；用户只说偏好 |
| `processRules` | 水印等工艺 | 默认 `watermarkShow: false` |
| `packRules` / `structLayers` | 包装结构 | 按模版/产品默认，非必要不改 |
| `callback_url` / `notify` | 回调 | 创建时自动填默认地址；结果靠 task_query，一般不用改 |
| `subtitle` 结构化数组 | 字幕分段 | recognize 或按文案切分 |

## 映射示例

| 用户说 | Agent 内部做 |
|--------|----------------|
| 「竖屏发抖音，科技感」 | list-templates → 筛 9:16 + 名称含科技 → 写入 styleId |
| 「用这段文案」 | oralMix：TTS 得 audioUrl；或 realMan：字幕/数字人音频 |
| 「这个 mp4 加字幕包装」 | videoPackaging：先确认闸门 → recognize → subtitle + styleId |
| 「全自动包装」 | 跳过闸门，自动选模版与标题 |
| 「我选模版 + 再传素材」 | 列风格选项；upload 后写入 materials |
| 「标题封面先给我确认」 | 先出草案，确认后再 create |
| 「热点解读 + 这几张图」 | newsMixCutting，title=主题，materials=图 |

## 追问话术（好 vs 坏）

- 好：「成片是竖屏发抖音，还是横屏？」
- 好：「更想要科技感，还是干净字幕风？（二选一）」
- 坏：「请提供 styleId」
- 坏：「请填写 apiType=realman_broadcast 和 task_id」
