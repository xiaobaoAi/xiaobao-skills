# API 对照表（apis.xiaobao.ink）

Base URL 默认 `https://apis.xiaobao.ink`。鉴权：JSON body 内字段 `key`（部分查询接口用 `Authorization` 头）。

## 智能剪辑

| 能力 | Method | Path | Query | 文档 |
|------|--------|------|-------|------|
| 文件上传 | POST multipart | `/api/file/upload` | `key` | [doc/49](https://apis.xiaobao.ink/doc/49) |
| 模版列表 | POST | `/api/smartclip/template` | — | [doc/23](https://apis.xiaobao.ink/doc/23) |
| 真人口播 create | POST | `/api/smartclip/realman_broadcast` | `action=create` | [doc/25](https://apis.xiaobao.ink/doc/25) |
| 素材/口播混剪 create | POST | `/api/smartclip/broadcast_mixcut` | `action=create` | 开放平台 smartclip |
| 新闻混剪 create | POST | `/api/smartclip/news_mixcut` | `action=create` | 开放平台 smartclip |
| 智能剪辑任务查询 | GET/POST | `/api/smartclip/task_query` | `task_id` + `key` | [doc/46](https://apis.xiaobao.ink/doc/46) |

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

### 任务查询（统一）

创建后不要再对 create 路径带 `action=query`。用 [doc/46](https://apis.xiaobao.ink/doc/46)：

```
GET /api/smartclip/task_query?task_id=...&key=...
```

也可用 POST JSON / 表单传 `task_id`。查询不扣费。

`data.status`：`pending` | `processing` | `completed` | `failed`  
成功时取 `data.video_url`（或 `data.result.video_url`）。失败看 `fail_reason` / `error.message`。  
`local_status`：1 处理中，2 完成，3 失败。

建议提交约 2 秒后开始轮询，间隔 3～5 秒。默认最多等约 15 分钟（可用 `--interval` / `--attempts` 加长）。`completed` / `failed` 时停止。超时后可用同一 `task_id` 再查，任务往往仍在跑。

### 旧 query（已弃用）

各 create 路径的 `?action=query` 仅兼容旧调用，Agent 新流程统一走 `task_query`。

## 数字人 / 语音（编排辅助）

| 能力 | Path | 鉴权 | 文档 |
|------|------|------|------|
| 声音克隆 | `/api/aihuman/clonevoice` | body `key` | [doc/9](https://apis.xiaobao.ink/doc/9) |
| 声音克隆查询 | `GET /api/aihuman/clonevoice_query` | query `key` | [doc/47](https://apis.xiaobao.ink/doc/47) |
| TTS | `/api/aihuman/tts` | body `key` | [doc/10](https://apis.xiaobao.ink/doc/10) |
| 语音合成查询 | `GET /api/aihuman/tts_query` | query `key` | [doc/45](https://apis.xiaobao.ink/doc/45) |
| 数字人合成 | `/api/aihuman/create` | body `key` | [doc/11](https://apis.xiaobao.ink/doc/11) |
| 数字人合成查询 | `GET /api/aihuman/create_query` | query `key` | [doc/48](https://apis.xiaobao.ink/doc/48) |
| 语音转字幕 | `/api/xiaobao/recognition` | body `key` + `fileUrl` | [doc/42](https://apis.xiaobao.ink/doc/42) |

### TTS body

`text`、`voice_id`、`voice_type`（`public`\|`custom`）、`speed`、`volume`、`lang`、`notify`

开放平台**无公开音色列表接口**；`voice_id` 来自：控制台系统音色、或 `clone-voice` 终态结果。

### 数字人合成 body

`video_url`（形象源视频）、`audio_url`、`notify`

## 模式 → apiType

| mode | create apiType |
|------|----------------|
| `realMan` | `realman_broadcast` |
| `videoPackaging` | `realman_broadcast` |
| `oralMixCutting` | `broadcast_mixcut` |
| `newsMixCutting` | `news_mixcut` |

查询统一：`/api/smartclip/task_query`（与 mode 无关，只需 task_id）。

## materials 结构

```json
[
  { "type": "image", "fileUrl": "https://..." },
  { "type": "video", "fileUrl": "https://..." }
]
```

## 业务错误

HTTP 200 但 `code` 非成功时，脚本会抛出 `msg` / `data.fail_reason` 拼成的可读错误；轮询失败同理。
