# 自然语言用例（xiaobao-digital-human）

| 用户说法 | 脚本路径 |
|----------|----------|
| 生成一段 TTS / 把这段文案生成语音 | `tts.mjs --text ...`（默认热情娜娜） |
| 用女声悠悠读 | `tts.mjs --text ... --voice-name 悠悠` |
| 用男声说这段话 | `speak.mjs --text ... --voice-name 阳光男生`（形象自动用男生新闻主播） |
| 克隆我的声音 | 仅用户明确要求时 `clone-voice.mjs` |
| 用日常自然说这段话 | `speak.mjs --text ... --person-video 日常自然` |
| 用新闻主播说这段话 | `speak.mjs --text ... --person-video 新闻主播` |
| 用男生新闻主播说这段话 | `speak.mjs --text ... --person-video 男生新闻主播` |
| 生成数字人视频后再做成完整短视频 | `speak.mjs` → 交接 `xiaobao-viral-agent` |

公共音色：热情娜娜、悠悠、阳光男生、故事解读、磁性男士。  
公共形象：新闻主播（女·专业）、日常自然（女·日常）、男生新闻主播（男·新闻）。

## 验收串联

1. 不克隆，直接 `--voice-name 热情娜娜` → audio_url  
2. `speak.mjs --voice-name 磁性男士 --person-video 男生新闻主播` → video_url  
3. 用户明确要求克隆后，才写入自己的音色名  
4. viral-agent realMan → 最终成片
