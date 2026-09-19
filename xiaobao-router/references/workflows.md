# Workflow

用户不选择 Skill。`route.mjs` 命中后，由 `run-workflow.mjs --id <id>` 顺序执行。

## Workflow 1 · `w1_video_digital_clip`

视频解析 → 数字人 → 智能剪辑

触发：「把这个视频改成我的数字人口播。」

1. `video-agent` `analyze-video --intent analyze` → `copy`
2. `digital-human` `speak.mjs` → `video_url`
3. `viral-agent` 选模版 + `realMan` create/poll → 成片

需要：原视频链接、形象视频、音色名称。

## Workflow 2 · `w2_copy_tts_digital_clip`

文案 → TTS → 数字人 → 智能剪辑

触发：「把这段文案用数字人做成短视频。」

1. `speak.mjs`（内部 TTS + 数字人）
2. `viral-agent` `realMan`

需要：文案、形象视频、音色名称。

## Workflow 3 · `w3_video_rewrite_digital_clip`

视频 → 文案 → 改写 → 数字人 → 智能剪辑

触发：「把这个视频文案改写后，用数字人做成片。」

1. `video-agent` 提取文案
2. Router 停下，交给 Agent 改写
3. 带改写文案继续 `speak` + `realMan`

## Workflow 4 · `w4_video_subtitle_pack`

视频 → 字幕 → 视频包装

触发：「给这个视频加字幕和包装。」

1. `video-agent --intent subtitle`
2. `viral-agent` `videoPackaging`

## 单 Skill（depth = 1）

| 说法 | route id | Skill |
|------|----------|-------|
| 提取这个视频的文案 | `extract_copy` | video |
| 用我的数字人说这段话 | `digital_speak` | digital-human |
| 把这个数字人视频做成爆款视频 | `viral_only` | viral |
