# API 对照（数字人）

HTTP 实现见各 Skill 内 `scripts/vendor/xiaobao-api`（源码：`shared/xiaobao-api`，用 `scripts/sync-shared.mjs` 同步）。

| 能力 | Path | 文档 | 脚本 |
|------|------|------|------|
| 文件上传 | POST `/api/file/upload` | [doc/49](https://apis.xiaobao.ink/doc/49) | `upload.mjs`；克隆/合成遇本地路径会自动上传 |
| 声音克隆 | POST `/api/aihuman/clonevoice` | [doc/9](https://apis.xiaobao.ink/doc/9) | `clone-voice.mjs` |
| 声音克隆查询 | GET `/api/aihuman/clonevoice_query` | [doc/47](https://apis.xiaobao.ink/doc/47) | `clone-voice.mjs` 内置轮询 |
| TTS | POST `/api/aihuman/tts` | [doc/10](https://apis.xiaobao.ink/doc/10) | `tts.mjs` |
| 语音合成查询 | GET `/api/aihuman/tts_query` | [doc/45](https://apis.xiaobao.ink/doc/45) | `tts.mjs` 内置轮询 |
| 数字人合成 | POST `/api/aihuman/create` | [doc/11](https://apis.xiaobao.ink/doc/11) | `create-avatar.mjs` |
| 数字人合成查询 | GET `/api/aihuman/create_query` | [doc/48](https://apis.xiaobao.ink/doc/48) | `create-avatar.mjs` 内置轮询 |

### 克隆 body

`voice_url`、`name`、`lang`、`notify`（默认自动填）

### TTS body

`text`、`voice_id`、`voice_type`（public|custom）、`speed`、`volume`、`lang`、`notify`

### 数字人 body

`video_url`（形象源视频）、`audio_url`、`notify`

### 查询约定

- 克隆：`clonevoice_query`，`data.status` 0 处理中 / 1 成功 / 2 失败；成功读 `voice_id`、`demo_url`
- 配音：`tts_query`，成功读 `audio_url`、`srt_url`
- 数字人成片：`create_query`，成功读 `video_url`、`video_time`

不要用 `/api/v1/task/query` 查克隆、配音或数字人成片。
