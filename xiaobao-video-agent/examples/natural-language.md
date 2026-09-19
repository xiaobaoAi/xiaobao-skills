# 自然语言用例（xiaobao-video-agent）

| 用户说法 | intent | 期望 |
|----------|--------|------|
| 分析这个视频 | analyze | 完整 insight |
| 提取这个视频的文案 | copy | copy 非空（尽量） |
| 提取字幕 | subtitle | subtitle 数组 |
| 提取封面 / 把封面拿出来 | cover | cover_url |
| 分析这个视频用了什么内容结构 | structure | materials 含 structure |
| 根据这个视频生成一个类似结构的新视频 | analyze → viral-agent | 先 insight，再交接生成 |

## 示例对话要点

**用户：** 分析这个视频 https://v.douyin.com/xxx/

- 跑 `analyze-video.mjs --url ... --intent analyze`
- 回复标题、封面、直链是否拿到、文案摘要；附 insight JSON

**用户：** 提取字幕（已有 mp4）

- `extract-subtitle.mjs --file-url https://...mp4`

**用户：** 根据这个视频做一条类似的

1. 本 Skill 分析  
2. 说明将用其文案/结构交给爆款生成 Skill  
3. 调用 xiaobao-viral-agent（不要在本目录造剪辑任务）
