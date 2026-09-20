---
name: xiaobao-digital-human
description: >-
  销豹数字人生产能力。当用户要克隆声音、文案转语音(TTS)、数字人出镜说话、
  生成口播视频或音频时使用。已内置公共音色和公共形象，未要求「用我的声音」时不要克隆。
  直连 apis.xiaobao.ink；不负责模版混剪/新闻混剪/视频包装
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
用户自己克隆的音色：`~/.xiaobao-skills/voices.json`（按名称查找，勿向用户展示 id）

创建配音 / 克隆 / 数字人时会自动带 `notify`（默认 `https://xiaobao.ink/api/digitalhuman/notifyTTS`）。只为过平台校验；结果仍用查询接口轮询，不依赖回调内容。可用 `--notify`、凭据里的 `notify_url` 或环境变量 `XIAOBAO_NOTIFY_URL` 覆盖。

公共音色和公共形象已经内置在 `scripts/lib/public-catalog.mjs`。**默认用公共的，不要让用户重新克隆。** 只有用户明确说「用我的声音 / 克隆这段录音」时才走克隆。

### 公共音色

未指定音色时用 **热情娜娜**。用户说「女声」也用她；说「男声」用 **阳光男生**。可以按名字指定，把试听链接给用户，不要把 voice_id 给用户。

| 称呼 | 性别 | 试听 |
|------|------|------|
| 热情娜娜 | 女 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/f443f03396f943c6d93a767baa41e5aa_1778296406.wav |
| 悠悠 | 女 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/2ff8775941da6a8be38a7028cf0382ce_1778295258.wav |
| 阳光男生 | 男 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/4db777fd7fb9bee0010cb6cf32ab769e_1778296375.wav |
| 故事解读 | 男 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/6b28c94190242046e31c2d43534d69e5_1778296353.wav |
| 磁性男士 | 男 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/digital_human/voice/20260509/975294e26d8c2894c42f458449c9ee02_1778296333.wav |

### 公共形象

未指定形象时：女声用 **年轻女性商务**，男声用 **中年稳重主播**。`--person-video` 可直接传称呼，脚本会换成地址。

| 称呼 | 视频 |
|------|------|
| 中年稳重主播 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/video/20260910/202609100859527333c4612.mp4 |
| 年轻女性商务 | https://wikixiaobao.oss-accelerate.aliyuncs.com/uploads/video/20260910/20260910085951e1d8c1631.mp4 |

---

## 何时触发

- 把这段文案生成语音 / TTS
- 用我的声音读这段文案 / 克隆这个声音
- 用这个数字人说这段话 / 生成数字人视频
- 「生成数字人后再做成完整短视频」→ 本 Skill 出 video_url，再交接 **viral-agent**

不要用本 Skill：选剪辑模版、素材混剪、新闻混剪、视频包装。

---

## 用户层 vs 内部层

**可问用户：** 文案、想要的公共音色称呼（女声/男声或上表名字）、是否用自己的声音

**不必问：** 公共音色的 id、公共形象的文件地址。未指定就用默认公共组合。

**禁止要求用户填写：** `voice_id`、`voice_type`、`task_id`、API endpoint

只有用户要克隆自己的声音时，才要声音样本链接，并写入 `voices.json`。脚本输出里的 `_internal` 仅排障用，默认不对用户展示。

---

## 任务识别

| 用户说法 | 动作 |
|----------|------|
| 生成一段 TTS / 文案转语音 | `tts.mjs`，未指定音色则 `--voice-name 热情娜娜` |
| 用女声 / 用男声 / 点名公共音色 | `tts.mjs` 或 `speak.mjs` 的 `--voice-name`，不要克隆 |
| 克隆我的声音 | 仅此时 `clone-voice.mjs` |
| 用我的声音读文案 | 已保存名称用 `--voice-name`；否则 `--audio-url` 样本边克隆边合成 |
| 用数字人说这段话 | `speak.mjs`。形象可省略，或 `--person-video 年轻女性商务` |
| 数字人视频后再做完整短视频 | speak/create-avatar → **xiaobao-viral-agent** |

---

## 工作流（必须轮询到终态再交付）

### 声音克隆

样本音频 URL → `clone-voice.mjs` 提交后用 [声音克隆查询](https://apis.xiaobao.ink/doc/47) 轮询到 `voice_id` → 保存音色名称 → 告诉用户「已保存为××音色」

### TTS

文案 + 音色名称（公共名或已克隆名；省略则热情娜娜）→ `tts.mjs` 提交后用 [语音合成查询](https://apis.xiaobao.ink/doc/45) 到 **audio_url**

### 数字人

人物视频（可写公共形象称呼）+ 音频或文案 → `create-avatar.mjs` / `speak.mjs` 提交后用 [数字人合成查询](https://apis.xiaobao.ink/doc/48) 轮询到 **video_url**

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

node scripts/tts.mjs --text "大家好" --voice-name 热情娜娜
node scripts/tts.mjs --text "大家好" --voice-name 阳光男生
node scripts/speak.mjs --text "大家好" --voice-name 悠悠 --person-video 年轻女性商务
node scripts/speak.mjs --text "大家好" --voice-name 磁性男士 --person-video 中年稳重主播
```

---

## 错误处理

用中文说明：密钥、余额、权限、音视频格式、任务失败、超时。见 `references/workflows.md`。

---

## 参考

- `references/api-map.md`
- `references/workflows.md`
- `examples/natural-language.md`
