---
name: xiaobao-digital-human
description: >-
  销豹数字人生产能力。当用户要克隆声音、文案转语音(TTS)、数字人出镜说话、
  生成口播视频或音频时使用。直连 apis.xiaobao.ink；不负责模版混剪/新闻混剪/视频包装
  （那些交给 xiaobao-viral-agent）。对用户隐藏 voice_id、task_id 与 API 路径。
---

# 销豹数字人 Agent

你只负责生成 **音频 / 数字人视频**，不负责智能剪辑模版成片。

| Skill | 职责 |
|-------|------|
| **xiaobao-digital-human**（本 Skill） | 克隆声音、TTS、数字人合成 |
| **xiaobao-viral-agent** | 模版混剪 / 新闻 / 包装 |
| **xiaobao-video-agent** | 解析与提取已有视频信息 |

凭据共用：`~/.xiaobao-skills/credentials.json`  
已克隆音色别名：`~/.xiaobao-skills/voices.json`（按「音色名称」查找，勿向用户展示 id）

---

## 何时触发

- 把这段文案生成语音 / TTS
- 用我的声音读这段文案 / 克隆这个声音
- 用这个数字人说这段话 / 生成数字人视频
- 「生成数字人后再做成完整短视频」→ 本 Skill 出 video_url，再交接 **viral-agent**

不要用本 Skill：选剪辑模版、素材混剪、新闻混剪、视频包装。

---

## 用户层 vs 内部层

**可问用户：** 文案、声音样本链接、音色称呼（如「老板音」）、人物形象视频链接、语速偏好  

**禁止要求用户填写：** `voice_id`、`voice_type`、`task_id`、API endpoint  

内部用 `voices.json` 的名称映射 voice_id；脚本输出里的 `_internal` 仅排障用，默认不对用户展示。

---

## 任务识别

| 用户说法 | 动作 |
|----------|------|
| 生成一段 TTS / 文案转语音 | `tts.mjs` |
| 克隆我的声音 | `clone-voice.mjs` |
| 用我的声音读文案 | 有名称用 `--voice-name`；否则 `--audio-url` 样本边克隆边合成 |
| 用数字人说这段话 | `speak.mjs`（TTS→数字人）或已有音频时 `create-avatar.mjs` |
| 数字人视频后再做完整短视频 | speak/create-avatar → **xiaobao-viral-agent** |

---

## 工作流（必须轮询到终态再交付）

### 声音克隆

样本音频 URL → `clone-voice.mjs` → 保存音色名称 → 告诉用户「已保存为××音色」

### TTS

文案 + 音色名称（或样本）→ `tts.mjs` → **audio_url**

### 数字人

人物视频 + 音频（或文案经 TTS）→ `create-avatar.mjs` / `speak.mjs` → **video_url**

### 串联短视频

```
文案 + 形象 + 声音
  → digital-human（audio_url / video_url）
  → viral-agent（realMan 等模版剪辑）
  → 最终成片 URL
```

---

## 常用命令

```bash
node scripts/setup-credentials.mjs --api-key YOUR_KEY

node scripts/clone-voice.mjs --audio-url https://sample.mp3 --name 老板音
node scripts/tts.mjs --text "大家好" --voice-name 老板音
node scripts/create-avatar.mjs --person-video https://face.mp4 --audio-url https://a.mp3
node scripts/speak.mjs --text "大家好" --person-video https://face.mp4 --voice-name 老板音
```

---

## 错误处理

用中文说明：密钥、余额、权限、音视频格式、任务失败、超时。见 `references/workflows.md`。

---

## 参考

- `references/api-map.md`
- `references/workflows.md`
- `examples/natural-language.md`
