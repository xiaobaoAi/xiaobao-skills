# 任务类型判定与最小输入

Agent 先根据自然语言判定下表「模式」，再收集用户层最小输入。  
括号内为内部 mode 名，**不要要求用户背这些英文名**。

---

## realMan · 数字人 / 真人口播

**触发语义：** 数字人口播、真人口播、老板出镜、人物讲解、形象口播。

**用户最小输入（二选一）：**

1. 已有口播视频的公网链接 + 主题/风格偏好  
2. 形象源视频 + 文案（或音频）+ 风格偏好  

**Agent 内部：** 选模版 →（可选 TTS / 数字人）→ create `realMan` → poll  
**内部 apiType：** `realman_broadcast`  
**payload 参考：** `examples/realMan.json`

---

## oralMixCutting · 素材混剪

**触发语义：** 文案+素材、配音+图片/视频、种草混剪、无人物出镜。

**用户最小输入：**

- 文案 **或** 音频链接  
- ≥1 个画面素材（图/视频公网 URL）  
- 可选：风格、时长、平台  

**Agent 内部：** 选模版 →（可选 TTS）→ create `oralMixCutting` → poll  
**内部 apiType：** `broadcast_mixcut`  
**payload 参考：** `examples/oralMixCutting.json`

---

## newsMixCutting · 新闻混剪

**触发语义：** 新闻、资讯、热点、事件解读、快讯。

**用户最小输入：**

- 标题或一句话主题  
- ≥1 个画面素材  

**Agent 内部：** 选模版 → create `newsMixCutting` → poll（不要强塞 subtitle）  
**内部 apiType：** `news_mixcut`  
**payload 参考：** `examples/newsMixCutting.json`

---

## videoPackaging · 视频包装

**触发语义：** 已有成片、加字幕、包装、封面、特效、科技感处理。

**用户最小输入：**

- 成片公网视频链接  
- 可选：标题、包装风格  

**Agent 内部：** 选模版（scene=`realMan`）→ 可选识别字幕 → create `videoPackaging` → poll  
**内部 apiType：** `realman_broadcast`（成片作 videoUrl）  
**payload 参考：** `examples/videoPackaging.json`

---

## 判定优先级（冲突时）

1. 已有视频 + 包装/字幕 → `videoPackaging`  
2. 新闻/资讯/热点 → `newsMixCutting`  
3. 人物/数字人出镜 → `realMan`  
4. 文案或旁白 + 素材画面 → `oralMixCutting`  
5. 仍不清 → 用人话问一句（见 SKILL.md）
