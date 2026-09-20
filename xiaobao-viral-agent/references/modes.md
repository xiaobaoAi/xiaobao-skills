# 任务类型判定与最小输入

Agent 先根据自然语言判定下表「模式」，再收集用户层最小输入。  
括号内为内部 mode 名，**不要要求用户背这些英文名**。

---

## realMan · 数字人 / 真人口播

**触发语义：** 数字人口播、真人口播、老板出镜、人物讲解、形象口播。

**用户最小输入（二选一）：**

1. 已有口播视频的公网链接 + 主题/风格偏好  
2. 形象源视频 + 文案（或音频）+ 风格偏好  

**媒体硬性要求：** 见 [media-requirements.md](media-requirements.md)。`videoUrl` 须为 mp4/mov、&lt;5 分钟、&lt;500MB，片中可转写人声；帧率推荐 25，单边 &lt;2000px。

**Agent 内部：** 选模版 →（可选 TTS / 数字人）→ **校验素材** → create `realMan` → poll  
**内部 apiType：** `realman_broadcast`  
**payload 参考：** `examples/realMan.json`

---

## oralMixCutting · 素材混剪

**触发语义：** 文案+素材、配音+图片/视频、种草混剪、无人物出镜。

**用户最小输入：**

- 文案 **或** 音频链接  
- ≥1 个画面素材（图/视频公网 URL）  
- 可选：风格、时长、平台  

**媒体硬性要求：** 图片 jpg/png/webp；素材视频 mp4/mov 且 ≤60 秒；全部素材合计 ≤5 分钟（图按 2 秒）；音频 mp3/wav/m4a ≤120MB ≤5 分钟。详见 [media-requirements.md](media-requirements.md)。

**Agent 内部：** 选模版 →（可选 TTS）→ **校验素材** → create `oralMixCutting` → poll  
**内部 apiType：** `broadcast_mixcut`  
**payload 参考：** `examples/oralMixCutting.json`

---

## newsMixCutting · 新闻混剪

**触发语义：** 新闻、资讯、热点、事件解读、快讯。

**用户最小输入：**

- 标题或一句话主题  
- ≥1 个画面素材  

**媒体硬性要求：** 同混剪素材规则，见 [media-requirements.md](media-requirements.md)。

**Agent 内部：** 选模版 → **校验素材** → create `newsMixCutting` → poll（不要强塞 subtitle）  
**内部 apiType：** `news_mixcut`  
**payload 参考：** `examples/newsMixCutting.json`

---

## videoPackaging · 视频包装

**触发语义：** 已有成片、加字幕、包装、封面、特效、科技感处理。

**用户最小输入：**

- 成片公网视频链接  
- 可选：标题、包装风格  

**媒体硬性要求：** 同 `videoUrl` 口播主视频规则；封面若传须 jpg/png ≤10MB。见 [media-requirements.md](media-requirements.md)。

**Agent 内部：** 选模版（scene=`realMan`）→ 可选识别字幕 → **校验素材** → create `videoPackaging` → poll  
**内部 apiType：** `realman_broadcast`（成片作 videoUrl）  
**payload 参考：** `examples/videoPackaging.json`

---

## 判定优先级（冲突时）

1. 已有视频 + 包装/字幕 → `videoPackaging`  
2. 新闻/资讯/热点 → `newsMixCutting`  
3. 人物/数字人出镜 → `realMan`  
4. 文案或旁白 + 素材画面 → `oralMixCutting`  
5. 仍不清 → 用人话问一句（见 SKILL.md）
