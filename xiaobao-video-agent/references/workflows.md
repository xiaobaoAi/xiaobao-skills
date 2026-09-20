# 视频理解工作流

脚本目录：`xiaobao-video-agent/scripts/`（安装后见 `~/.agents/skills/xiaobao-video-agent/scripts/`）。

---

## 1. 视频解析 workflow

**触发：** 分析视频、解析链接、拿无水印直链与基础信息  

**输入：** 分享链接 / 口令 / 直链 mp4  

**自动处理：**

1. 直链 → 填入 `video_url`，跳过平台解析  
2. 分享链 → `parse-video.mjs`（videoparse）  

**输出：** insight 中的 video_url、cover_url、title、description、materials 等  

**命令：**

```bash
node scripts/analyze-video.mjs --url "$URL" --intent analyze
# 或
node scripts/parse-video.mjs --url "$URL"
```

---

## 2. 文案提取 workflow

**触发：** 提取文案、口播文字、文案是什么  

**输入：** 分享链接或视频 URL  

**自动处理：** `extract-copy.mjs` 提交 `/api/video/text`。响应里已有 `resultText` 就直接返回；只有还在处理时才按 `taskId` 再查。  

**输出：** `copy`（及可能的 title/duration）  

```bash
node scripts/extract-copy.mjs --url "$URL"
```

---

## 3. 字幕提取 workflow

**触发：** 提取字幕、时间轴口播  

**输入：** 优先先解析得到 `video_url`，再 recognition  

**自动处理：** parse（如需要）→ `extract-subtitle.mjs --file-url`  

**输出：** `subtitle` 数组；可同步填 `copy`  

```bash
node scripts/analyze-video.mjs --url "$URL" --intent subtitle
```

---

## 4. 封面提取 workflow

**触发：** 提取封面、封面图  

**输入：** 平台分享链接（直链通常无封面元数据）  

**自动处理：** `extract-cover.mjs`  

**输出：** `cover_url`  

```bash
node scripts/extract-cover.mjs --url "$URL"
```

---

## 5. 结构分析（附）

**触发：** 内容结构、怎么讲的、钩子/结尾  

**自动处理：** analyze + 文案/字幕 → `inferStructure` 写入 materials  

```bash
node scripts/analyze-video.mjs --url "$URL" --intent structure
```

---

## 6. 交接 viral-agent（生成类似视频）

**触发：** 「根据这个视频生成一个类似结构的新视频」  

**步骤：**

1. 本 Skill：`analyze-video.mjs --url ... --intent analyze`（含文案/字幕更佳）  
2. 向用户确认：要数字人口播 / 素材混剪 / 包装等（或按原片形态推断）  
3. 启用 **xiaobao-viral-agent**：把 `copy`、结构摘要、`materials` 中的图/视频 URL 作为用户层输入；由 viral 自动选模版并 create→poll  
4. **不要**在本 Skill 内复制 viral 的剪辑脚本  

```
video-agent（insight）→ viral-agent（成片 URL）
```
