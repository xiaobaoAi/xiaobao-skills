# 自然语言用例（xiaobao-digital-human）

| 用户说法 | 脚本路径 |
|----------|----------|
| 生成一段 TTS / 把这段文案生成语音 | `tts.mjs --text ... --voice-name ...` |
| 克隆我的声音 | `clone-voice.mjs --audio-url ... --name ...` |
| 用我的声音读这段文案 | `tts.mjs --text ... --voice-name ...` 或带 `--audio-url` |
| 用这个数字人说这段话 | `speak.mjs --text ... --person-video ...` |
| 生成数字人视频后再做成完整短视频 | `speak.mjs` → 交接 `xiaobao-viral-agent` |

## 验收串联

1. 克隆声音 → 得到音色名  
2. TTS → 得到 audio_url  
3. speak → 得到 video_url  
4. viral-agent realMan → 最终成片
