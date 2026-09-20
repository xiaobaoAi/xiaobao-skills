# API 对照（视频理解）

Base：`https://apis.xiaobao.ink`  
鉴权：query / body 中的 `key`（与 viral-agent 同一本机凭据）。

本 Skill **只读理解**，不调用 smartclip create。

## 接口

| 能力 | Method | Path | 文档 | 脚本 |
|------|--------|------|------|------|
| 全平台解析 | POST JSON | `/api/video/videoparse` | [doc/43](https://apis.xiaobao.ink/doc/43) | `parse-video.mjs` / `extract-cover.mjs` |
| 文案提取 | POST form | `/api/video/text` | [doc/28](https://apis.xiaobao.ink/doc/28) | `extract-copy.mjs` |
| 字幕识别 | POST JSON | `/api/xiaobao/recognition` | [doc/42](https://apis.xiaobao.ink/doc/42) | `extract-subtitle.mjs` |

### videoparse body

```json
{ "key": "...", "url": "分享链接", "content": "同 url", "link": "同 url", "flat": 2 }
```

常用返回：`title`、`desc`、`video_url`、`cover_url`、`audio_url`、`imagelist`、`platform`、`type`、`video_list[].resolution`

### /api/video/text

- 提交：`content=<链接>`
- 当次响应里已有 `data.resultText` 时直接读取，不必再查
- 只有还在处理中、且返回了 `taskId` 时，才用 `taskId` 再查
- 文案字段是 `resultText`，描述是 `videoDesc`

### recognition

```json
{ "key": "...", "fileUrl": "https://...mp4" }
```

需要**可访问的媒体直链**（通常来自 videoparse 的 `video_url`）。

## 统一 insight 映射

| insight 字段 | 主要来源 |
|--------------|----------|
| video_url | videoparse.video_url / 用户直链 |
| cover_url | videoparse.cover_url |
| title | videoparse.title |
| description | videoparse.desc |
| copy | title+desc 或 /api/video/text 或字幕拼接 |
| subtitle | recognition 分段 |
| duration | text 接口或解析侧（有则填） |
| width/height | video_list.resolution 解析 |
| materials | 视频/封面/图集/音频 + 可选 structure |

缺失一律 `null`。
