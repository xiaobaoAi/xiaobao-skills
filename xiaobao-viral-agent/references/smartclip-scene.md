# 智能剪辑场景（开放平台）

来源：[智能剪辑场景页](https://xiaoapis.com/scenes/smartclip/)。字段以对应 Markdown 为准，不要编造。

本 Skill 用客户本机 API Key **直连** `https://xiaoapis.com`。下面「客户路由」是产品方自己封装时的建议名字，不是本 Skill 要请求的地址。

Base：`https://xiaoapis.com`。POST JSON 时 `key` 写在 JSON Body。查询不扣费。

---

## 四种模式

先选定模式，再走那一条接口。`scene` 和合成接口必须成对，不能混用模板。

| 模式 | scene | 最终接口 | 要文案 | 要真人/数字人视频 | 要音色 | 要模板详情 |
|------|-------|----------|--------|-------------------|--------|------------|
| 真人口播 | `realMan` | `realman_broadcast` | 要 | 要 | 音色在配音阶段用，**不要传进合成接口** | 要 |
| 素材混剪 | `oralMixCutting` | `broadcast_mixcut` | 要 | 不要 | 要，先合成音频再传 `audioUrl` | 按素材要求 |
| 新闻混剪 | `newsMixCutting` | `news_mixcut` | 要（标题） | 不要 | 不要 | 按素材要求 |
| 视频包装 | `realMan` | `realman_broadcast` | 不要 | 要（已有成片） | 不要 | 要 |

真人口播和视频包装共用 `scene=realMan` 与 `realman_broadcast`。差别在输入：口播要文案、视频和事先做好的配音视频；包装只要已有成片和包装素材。

统一顺序：选模式 → 拿文案（包装跳过）→ 定音色（仅需要配音的模式）→ 选模板 → 备素材 → 合成 → 取成片。

模板列表按 `scene` 取，可以缓存。用户选定某一个模板后再读详情。合成时 `styleId` 用模板 id。

---

## 1. 真人口播

真人视频 + 文案 + 配音 + 素材包装。

1. 口播文案：用已确认文案，或 [视频文案](https://xiaoapis.com/model/video/text.md) `POST /api/video/text`。
2. 真人视频：使用已经保存的公网地址，不必每次重新克隆数字人。
3. 音色：用已有音色做配音，得到口播视频后再进入合成。合成接口本身不收音色 ID。
4. 模板：`POST /api/smartclip/template`，JSON 里 `scene` 固定 `realMan`。文档 [template.md](https://xiaoapis.com/model/smartclip/template.md)。
5. 选定后：`POST /api/smartclip/template_detail`，JSON 带 `id`（也兼容 `template_id`），按图层准备素材。文档 [template_detail.md](https://xiaoapis.com/model/smartclip/template_detail.md)。
6. 合成：`POST /api/smartclip/realman_broadcast?action=create`。文档 [realman_broadcast.md](https://xiaoapis.com/model/smartclip/realman_broadcast.md)、[doc/25](https://xiaoapis.com/doc/25)。

必填：`key`、`styleId`、`videoUrl`、`callback_url`。

- `videoUrl`：已有真人视频公网地址，`mp4` 或 `mov`。
- `resolution` 只用 `720p` 或 `1080p`。
- `title`、`materials`、`subtitle`、`packRules`、`processRules`、`structLayers` 按文档选填。
- `materials` 每项要有 `type`（`image` 或 `video`）和 `fileUrl`。
- **不要**把音色 ID 传给这个接口。
- **不要**使用 `oralMixCutting` 或 `newsMixCutting` 的模板。

---

## 2. 素材混剪

口播文案 + 配音 + 多个素材。不需要真人视频。

1. 文案：已确认文案，或 `POST /api/video/text`。`content` 传视频或音频公网 URL；不带 `taskId` 是提交，带 `taskId` 是查询，结果在 `resultText`。文档 [text.md](https://xiaoapis.com/model/video/text.md)、[doc/28](https://xiaoapis.com/doc/28)。
2. 配音：用已保存的 `voice_id` 调 `POST /api/aihuman/tts`，文本不超过 2000 字。`voice_type` 为 `custom`（克隆）或 `public`（系统）。克隆音色的 `lang` 只用 `zh-cn` 或 `en`。`volume`、`speed` 取值 0 到 2，默认 1。再用 `GET /api/aihuman/tts_query` 拿 `audio_url`。文档 [tts.md](https://xiaoapis.com/model/aihuman/tts.md)、[tts_query.md](https://xiaoapis.com/model/aihuman/tts_query.md)。
3. 模板：`scene` 固定 `oralMixCutting`。不要拿 `realMan` 的模板来混剪。
4. 合成：`POST /api/smartclip/broadcast_mixcut?action=create`。文档 [broadcast_mixcut.md](https://xiaoapis.com/model/smartclip/broadcast_mixcut.md)、[doc/26](https://xiaoapis.com/doc/26)。

必填：`key`、`styleId`、`materials`（至少 1 条）、`callback_url`。

- 口播声音放 `audioUrl`，格式 `mp3`、`wav` 或 `m4a`，短于 5 分钟。
- **不要**传 `content` 和 `speakerId`。当前平台不支持这条分支，会返回 `unsupported_speaker_branch`。

---

## 3. 新闻混剪

新闻文案 + 新闻素材。不要音色，不要真人视频。

1. 文案：用已有标题，或先抽出文案让用户确认。标题 3 到 1800 字。
2. 模板：`scene` 固定 `newsMixCutting`。
3. 素材由调用方保存为公网 URL。
4. 合成：`POST /api/smartclip/news_mixcut?action=create`。文档 [news_mixcut.md](https://xiaoapis.com/model/smartclip/news_mixcut.md)、[doc/27](https://xiaoapis.com/doc/27)。

必填：`key`、`styleId`、`title`、`materials`、`callback_url`。

- `materials` 至少 1 条，`type` 为 `image` 或 `video`，带 `fileUrl`。图片按 2 秒估算时长。
- 可选 `processRules.videoDuration`（5 到 300 秒）和 `materialComposition`（`random` 或 `order`）。
- **不要**传入 `realMan` 或 `oralMixCutting` 的模板。

---

## 4. 视频包装

已有成片 + 字幕 / 特效 / 封面。和真人口播是同一个接口，输入不同。

1. 成片地址由调用方保存。剪辑时只提交公网 `videoUrl`。
2. 模板：`scene` 固定 `realMan`。选定后读模板详情，按图层准备字幕、特效或封面。
3. 合成：`POST /api/smartclip/realman_broadcast?action=create`。包装素材放进 `materials`、`subtitle`、`packRules` 或 `structLayers`。
4. **不要**口播文案，**不要**音色，**不要**把这个接口做成第二次口播配音。

必填：`key`、`styleId`、`videoUrl`、`callback_url`。

---

## 共用约束

- `videoUrl`、素材地址、背景音乐地址不能重名。
- 素材 URL 必须公网可访问。视频地址无法解析时长时，请求会被拒绝。
- 格式、数量、尺寸、时长在提交前校验。不合规模板要求会生成失败。细则见 [media-requirements.md](media-requirements.md)。
- 视频和音色只存一次，剪辑时引用，不要每次重新克隆。

### 取成片

`GET /api/smartclip/task_query?task_id=...&key=...`  
文档 [task_query.md](https://xiaoapis.com/model/smartclip/task_query.md)、[doc/46](https://xiaoapis.com/doc/46)。

提交后约 2 秒开始，间隔 2 到 5 秒。`status` 为 `completed` 时取 `video_url`；`failed` 时把 `error.message` 或 `fail_reason` 交给调用方。查询不扣费。

---

## 前置能力

可以接在剪辑前面，也可以从已确认文案直接开始。

| 能力 | 创建 | 查询 | Markdown |
|------|------|------|----------|
| 分享链接解析 | `GET` 或 `POST /api/video/videoparse` | 同步返回 | [videoparse.md](https://xiaoapis.com/model/video/videoparse.md) |
| 口播正文 | `POST /api/video/text` | 同一路径带 `taskId` | [text.md](https://xiaoapis.com/model/video/text.md) |
| 声音克隆 | `POST /api/aihuman/clonevoice` | `GET /api/aihuman/clonevoice_query` | [clonevoice.md](https://xiaoapis.com/model/aihuman/clonevoice.md) |
| 语音合成 | `POST /api/aihuman/tts` | `GET /api/aihuman/tts_query` | [tts.md](https://xiaoapis.com/model/aihuman/tts.md) |

解析接口返回标题、描述、封面和视频地址，**不返回口播正文**。正文走文案接口，确认后再进配音或剪辑。

克隆：`audio_url` 为原音频公网地址；`lang` 只用 `zh-cn` 或 `en`。完成后保存 `voice_id`。文档 [doc/9](https://xiaoapis.com/doc/9)、查询 [doc/47](https://xiaoapis.com/doc/47)。

两条组合：

- 已有视频或分享链接 → 解析出视频地址 → 抽出文案并确认 → 配音 → 按模式剪辑 → 查询成片。
- 用户直接给文案 → 从配音开始 → 选模板和素材 → 剪辑。

声音克隆、TTS、数字人视频由 **xiaobao-digital-human** 执行。本 Skill 只做剪辑。

---

## 产品方自行封装时的客户路由

这些路径留给客户自己的业务后端，前端不能看到 API Key，也不能直接请求 `xiaoapis.com`。本 Skill 不实现这些路由。

| 客户路由 | 内部销豹接口 |
|----------|----------------|
| `GET /api/smartclip/templates` | `POST /api/smartclip/template`，query 带 `scene` |
| `GET /api/smartclip/template/{id}` | `POST /api/smartclip/template_detail` |
| `POST /api/smartclip/realman` | `realman_broadcast`，`scene=realMan` |
| `POST /api/smartclip/mixcut` | `broadcast_mixcut`，`scene=oralMixCutting` |
| `POST /api/smartclip/news` | `news_mixcut`，`scene=newsMixCutting` |
| `POST /api/smartclip/package` | 仍是 `realman_broadcast`，`scene=realMan`，但不接收文案和音色 |
