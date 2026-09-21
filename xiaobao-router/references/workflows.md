# Workflow

用户不选择 Skill。`route.mjs` 命中后，由 `run-workflow.mjs --id <id>` 顺序执行。

## Workflow 1 · `w1_video_digital_clip`

视频解析 → 数字人 → **包装确认** → 智能剪辑

触发：「把这个视频改成我的数字人口播。」

1. `video-agent` `analyze-video --intent analyze` → `copy`
2. `digital-human` `speak.mjs` → `video_url`
3. **停住**：`await_user` / `pack_confirm`（模版 / 素材 / 封面标题；或用户说全自动）
4. 确认后 `viral-agent` `realMan` create/poll → 成片（可用 `--auto-pack --video-url`）

需要：原视频链接、形象视频、音色名称。

## Workflow 2 · `w2_copy_tts_digital_clip`

文案 → TTS → 数字人 → **包装确认** → 智能剪辑

触发：「把这段文案用数字人做成短视频。」

1. `speak.mjs`（内部 TTS + 数字人）
2. **停住**：`await_user` / `pack_confirm`（同上；禁止默认闷头剪辑）
3. 确认后 `viral-agent` `realMan`

需要：文案、形象视频、音色名称。

## Workflow 3 · `w3_video_rewrite_digital_clip`

视频 → 文案 → 改写 → 数字人 → 智能剪辑

触发：「把这个视频文案改写后，用数字人做成片。」

**推荐（改写一轮到位；包装仍须确认）：**

1. `video-agent` `extract-copy.mjs` 拿原文案  
2. Agent **当场改写**（不要问用户代写）  
3. `run-workflow.mjs --id w3_video_rewrite_digital_clip --url … --rewritten-copy "改写稿"` → 数字人后停在包装确认
4. 用户确认或全自动后再剪辑

**兼容：** 若直接跑 workflow 且未带 `--rewritten-copy`，会返回 `await_agent` + 原文案；Agent 须同一轮改写后立刻重跑，不要当成失败或交给用户。

## Workflow 4 · `w4_video_subtitle_pack`

视频 → 字幕 → **包装确认** → 视频包装

触发：「给这个视频加字幕和包装。」

1. `video-agent --intent subtitle`（或 viral 内 `recognize.mjs`）
2. **包装确认闸门**（见 viral `workflows.md` §4）：模版自选/自动、是否补素材、封面标题确认或全自动；用户说「全自动」可跳过
3. `viral-agent` `videoPackaging`（create → poll）

## 单 Skill（depth = 1）

| 说法 | route id | Skill |
|------|----------|-------|
| 提取这个视频的文案 | `extract_copy` | video |
| 用我的数字人说这段话 | `digital_speak` | digital-human |
| 把这个数字人视频做成爆款视频 | `viral_only` | viral |
