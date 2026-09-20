# 路由测试案例

期望 `route.mjs` 的 `data.route`：

| 用户原话 | route |
|----------|-------|
| 提取这个视频的文案 | `extract_copy` |
| 把这个视频的文案拿出来 | `extract_copy` |
| 分析这个视频的文案 | `extract_copy` |
| 提取字幕 | `extract_subtitle` |
| 把封面拿出来 | `extract_cover` |
| 分析这个视频 | `analyze_video` |
| 帮我分析下这条视频 | `analyze_video` |
| 用我的数字人说这段话 | `digital_speak` |
| 把这个数字人视频做成爆款视频 | `viral_only` |
| 把这个视频改成我的数字人口播版本 | `w1_video_digital_clip` |
| 把抖音这条换成我出镜讲 | `w1_video_digital_clip` |
| 把这段文案用数字人做成短视频 | `w2_copy_tts_digital_clip` |
| 把口播文案配音后用数字人剪成片 | `w2_copy_tts_digital_clip` |
| 把这段文案改写后用数字人做成短视频 | `w2_copy_tts_digital_clip`（先改写） |
| 把这个视频文案改写后用数字人做成片 | `w3_video_rewrite_digital_clip`（先提取→Agent 改写→带 `--rewritten-copy` 一次跑完） |
| 给这个视频加字幕和包装 | `w4_video_subtitle_pack` |
| 给这个视频加字幕 | `w4_video_subtitle_pack` |
| 帮我做个视频 | 不猜测，请用户补充目标 |

本地复跑（不请求开放平台）：

```bash
node --test scripts/check.mjs
```

```bash
node xiaobao-router/scripts/route.mjs --text "提取这个视频的文案"
```

执行层（需 Key 与素材 URL）：

```bash
node xiaobao-router/scripts/run-workflow.mjs --id w1_video_digital_clip \
  --url "原视频" --person-video "形象.mp4" --voice-name "老板音"
```
