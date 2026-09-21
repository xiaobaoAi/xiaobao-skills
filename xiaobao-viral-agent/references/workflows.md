# 用户任务工作流

面向「用户要完成什么」，不是面向「调用哪个参数」。  
脚本路径以 Skill 安装目录为准，例如 `~/.agents/skills/xiaobao-viral-agent/scripts/`。

对用户：只确认需求与交付成片；`styleId` / `task_id` / `apiType` 仅 Agent 内部使用。

---

## 1. 数字人口播（realMan）

### 触发条件

- 「做数字人口播 / 老板口播 / 人物出镜讲解」
- 已有真人口播视频，要套风格模版成片

### 用户输入（最小）

- 口播视频链接 **或**（形象源视频 + 文案/音频）
- 可选：主题、风格、横竖屏、平台

### 自动处理

1. 判定 `realMan`
2. `list-templates --scene realMan` → 按风格/画幅选模版
3. 若无成片口播视频：内部 TTS（及可选数字人合成）得到口播视频 URL
4. 素材/字幕：可按文案切分或 `recognize`
5. 组装 payload（参考 `examples/realMan.json`）

### API 调用（内部）

- 可选：调用 **xiaobao-digital-human** 的 `tts.mjs` / `create-avatar.mjs`（本目录同名文件只转发）
- `create-task.mjs --mode realMan`
- `poll-task.mjs --task-id <id>`（统一 [doc/46](https://apis.xiaobao.ink/doc/46) 查询）

### 输出

成片 URL；一句话说明已按所选风格生成。

---

## 2. 素材混剪（oralMixCutting）

### 触发条件

- 「文案配音再和图片/视频混剪」
- 「种草混剪」「只要旁白 + 素材画面」

### 用户输入（最小）

- 文案或音频链接
- ≥1 个画面素材 URL
- 可选：主题、风格、时长、平台

### 自动处理

1. 判定 `oralMixCutting`
2. 列模版 `--scene oralMixCutting` 并匹配
3. 仅有文案时：内部 TTS 得到音频 URL（用户只描述声音偏好）
4. 组装 `examples/oralMixCutting.json` 形态 payload

### API 调用（内部）

- 可选：调用 **xiaobao-digital-human** 的 `clone-voice.mjs` / `tts.mjs`（不要在剪辑 Skill 里另记音色）
- `create-task.mjs --mode oralMixCutting`
- `poll-task.mjs --task-id <id>`

### 输出

成片 URL。

---

## 3. 新闻混剪（newsMixCutting）

### 触发条件

- 「新闻 / 资讯 / 热点 / 事件解读」短视频

### 用户输入（最小）

- 标题或一句话主题
- ≥1 个画面素材 URL
- 可选：风格、平台

### 自动处理

1. 判定 `newsMixCutting`
2. 列模版 `--scene newsMixCutting` 并匹配
3. 标题写入用户可见主题；**不要**强行加口播字幕字段
4. 组装 `examples/newsMixCutting.json` 形态 payload

### API 调用（内部）

- `create-task.mjs --mode newsMixCutting`
- `poll-task.mjs --task-id <id>`

### 输出

资讯成片 URL。

---

## 4. 视频包装（videoPackaging）

### 触发条件

- 「已有视频加字幕 / 包装 / 封面 / 特效 / 科技感」

### 用户输入（最小）

- 成片视频公网 URL（本地路径先 `upload.mjs`）

### 确认闸门（创建任务前必做）

**不要一上来就 create。** 先问清下面三项；用户若说「全自动 / 你来安排 / 智能安排」，三项全部跳过并由你决定。

建议**一次问清**（减少来回）：

```text
做视频包装前请选一下（也可直接说「全自动，你来安排」）：

1. 模版：A 我来选（你列几个风格） / B 系统自动选
2. 补充素材：A 只要这条主视频 / B 我再传几段视频或图片
3. 封面与标题：A 先给我草案，我确认后再生成 / B 你全权智能安排
```

| 项 | 用户选 A | 用户选 B / 全自动 |
|----|----------|-------------------|
| 模版 | `list-templates` 后给 **2～4 个中文风格名** 供选，禁止甩 styleId | 按风格关键词自动匹配，回复里一句话说明选用了什么风格 |
| 补充素材 | 等用户给 URL 或本地文件；本地先上传；写入 `materials` | 不追加 `materials`（仅主视频） |
| 封面与标题 | 先拟标题 + 封面方案（可用识别文案/抽帧思路），**等用户确认**再 create；用户可改标题或换封面图 | 自行定标题；有合适封面图则 `imageUrl`，否则交给模版默认 |

主视频仍须符合 [media-requirements.md](media-requirements.md)。补充素材同样受 materials 规则约束。

### 自动处理（确认之后）

1. 判定 `videoPackaging`
2. 按闸门结果选模版（自选或自动）
3. 需要字幕时：`recognize.mjs --file-url ...` → 映射为内部 subtitle
4. 若有补充素材 / 确认后的封面：写入 `materials` / `imageUrl` + `title`
5. 组装 `examples/videoPackaging.json` 形态 payload → validate → create → poll

### API 调用（内部）

- 可选：`upload.mjs`、`recognize.mjs`
- `create-task.mjs --mode videoPackaging`
- `poll-task.mjs --task-id <id>`

### 输出

包装后成片 URL；若用户选了封面标题确认，交付前可再贴一句最终标题。

---

## 通用流水线（所有模式）

```
理解需求 → 判定模式 → 收集用户层缺口 → list-templates → 选模版
→ 检查素材 URL 与 [media-requirements.md](media-requirements.md)  
→ （可选 TTS / 数字人 / 识别字幕）  
→ validate-media / create-task（默认校验）→ poll-task → 只返回成片或中文失败说明
```

编排细节与字段白名单：`api-map.md`。错误话术：`errors.md`。
