# API 对照表（apis.xiaobao.ink）

Base URL 默认 `https://apis.xiaobao.ink`。鉴权：JSON body 内字段 `key`（部分查询接口用 `Authorization` 头）。

## 智能剪辑

| 能力 | Method | Path | Query | 文档 |
|------|--------|------|-------|------|
| 模版列表 | POST | `/api/smartclip/template` | — | [doc/23](https://apis.xiaobao.ink/doc/23) |
| 真人口播 create/query | POST | `/api/smartclip/realman_broadcast` | `action=create\|query` | [doc/25](https://apis.xiaobao.ink/doc/25) |
| 素材/口播混剪 create/query | POST | `/api/smartclip/broadcast_mixcut` | `action=create\|query` | 开放平台 smartclip |
| 新闻混剪 create/query | POST | `/api/smartclip/news_mixcut` | `action=create\|query` | 开放平台 smartclip |

### 模版列表 body

```json
{ "key": "...", "scene": "realMan", "pageSize": 20 }
```

`scene` 可选：`realMan` | `oralMixCutting` | `newsMixCutting`（视频包装选 `realMan` 模版）。

### realman_broadcast create 白名单字段

`styleId`、`videoUrl`、`language`、`title`、`materials`、`materialSoundSwitch`、`packRules`、`structLayers`、`processRules`、`introduceCard`、`subtitle`、`callback_url` / `notify`

建议默认：`processRules.watermarkShow = false`

### broadcast_mixcut create 白名单字段

`styleId`、`materials`、`audioUrl`、`resolution`、`content`、`callback_url`、`title`、`language`、`packRules`、`structLayers`、`processRules`、`introduceCard`

### news_mixcut

与混剪类似，使用 `title` + `materials` + `styleId`；不要传 `subtitle`。

### query body

```json
{ "key": "...", "task_id": "..." }
```

Query：`?action=query`

成功时从响应中取成片 URL（常见字段：`data.video_url` / `data.url` / `data.result_url`，以实际返回为准）。

## 数字人 / 语音（编排辅助）

| 能力 | Path | 鉴权 | 文档 |
|------|------|------|------|
| 声音克隆 | `/api/aihuman/clonevoice` | body `key` | [doc/9](https://apis.xiaobao.ink/doc/9) |
| TTS | `/api/aihuman/tts` | body `key` | [doc/10](https://apis.xiaobao.ink/doc/10) |
| 数字人合成 | `/api/aihuman/create` | body `key` | [doc/11](https://apis.xiaobao.ink/doc/11) |
| 任务查询 | `GET /api/v1/task/query?task_id=&type=` | Header `Authorization: <api_key>` | type=`voice`/`video`/`avatar` |
| 语音转字幕 | `/api/xiaobao/recognition` | body `key` + `fileUrl` | [doc/42](https://apis.xiaobao.ink/doc/42) |

### TTS body

`text`、`voice_id`、`voice_type`（`public`\|`custom`）、`speed`、`volume`、`lang`、`notify`

开放平台**无公开音色列表接口**；`voice_id` 来自：控制台系统音色、或 `clone-voice` 终态结果。

### 数字人合成 body

`video_url`（形象源视频）、`audio_url`、`notify`

## 模式 → apiType

| mode | create/query apiType |
|------|----------------------|
| `realMan` | `realman_broadcast` |
| `videoPackaging` | `realman_broadcast` |
| `oralMixCutting` | `broadcast_mixcut` |
| `newsMixCutting` | `news_mixcut` |

## materials 结构

```json
[
  { "type": "image", "fileUrl": "https://..." },
  { "type": "video", "fileUrl": "https://..." }
]
```

## 业务错误

HTTP 200 但 `code` 非成功时，脚本会抛出 `msg` / `data.fail_reason` 拼成的可读错误；轮询失败同理。
