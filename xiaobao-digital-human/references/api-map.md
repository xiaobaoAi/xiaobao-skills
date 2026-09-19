# API 对照（数字人）

HTTP 实现见各 Skill 内 `scripts/vendor/xiaobao-api`（源码：`shared/xiaobao-api`，用 `scripts/sync-shared.mjs` 同步）。

| 能力 | Path | 文档 | 脚本 |
|------|------|------|------|
| 声音克隆 | POST `/api/aihuman/clonevoice` | [doc/9](https://apis.xiaobao.ink/doc/9) | `clone-voice.mjs` |
| TTS | POST `/api/aihuman/tts` | [doc/10](https://apis.xiaobao.ink/doc/10) | `tts.mjs` |
| 数字人合成 | POST `/api/aihuman/create` | [doc/11](https://apis.xiaobao.ink/doc/11) | `create-avatar.mjs` |
| 任务查询 | GET `/api/v1/task/query` | Authorization=api_key | `query-task.mjs` / 内置 poll |

### 克隆 body

`voice_url`、`name`、`lang`、可选 `notify`

### TTS body

`text`、`voice_id`、`voice_type`（public|custom）、`speed`、`volume`、`lang`

### 数字人 body

`video_url`（形象源视频）、`audio_url`、可选 `notify`

轮询 `type`：`voice` | `video` | `avatar`
