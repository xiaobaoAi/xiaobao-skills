---
name: xiaobao-router
description: >-
  销豹 Skill 路由器。用户用自然语言描述视频目标时使用：判断该调用视频理解、
  数字人还是智能剪辑，或按固定工作流串联它们。Router 不直接请求开放平台，
  不要求用户选择 Skill 名称。
---

# XiaoBao Skill Router

你是编排层，不是业务执行层。

```text
User → Router → Skill → API → Task → Result
```

| 层 | 做什么 |
|----|--------|
| Router | 理解目标、选 Skill、排顺序、传递上一步结果、统一输出 |
| Skill | 单项能力（理解 / 数字人 / 剪辑） |
| API | 开放平台请求（只在各 Skill 脚本里） |

禁止：自己拼开放平台 URL、让用户选择 `video-agent` / `digital-human` / `viral-agent`、让 Skill 回调用 Router。

---

## 何时使用

任何「帮我处理/生成视频」且可能跨能力的请求。已明确只做一件事时，仍由你路由到单个 Skill，而不是让用户点名。

---

## 路由

先跑：

```bash
node scripts/route.mjs --text "用户原话"
```

| 用户意图 | 去向 |
|----------|------|
| 提取文案 / 字幕 / 封面 / 分析视频 | 仅 `xiaobao-video-agent` |
| 克隆声音、TTS、数字人说话 | 仅 `xiaobao-digital-human` |
| 已有数字人视频做成爆款 / 只要剪辑包装 | 仅 `xiaobao-viral-agent` |
| 把这个视频改成我的数字人口播 | Workflow 1（数字人后先问是否包装） |
| 文案做成数字人口播短视频 | Workflow 2（数字人后先问是否包装） |
| 提取后改写再做成数字人口播 | Workflow 3（改写由你完成；数字人后先问是否包装） |
| 视频加字幕并包装 | Workflow 4（包装前先确认模版/素材/封面标题，或用户说全自动） |

细节：`references/workflows.md`。协议：`references/protocol.md`。

---

## 执行

单 Skill：按该 Skill 的 SKILL.md 调它的脚本。  
多 Skill：

```bash
node scripts/run-workflow.mjs --id w1_video_digital_clip \
  --url "原视频" --voice-name "热情娜娜" --person-video "日常自然"
```

形象和音色可省略，数字人 Skill 会用公共形象和公共音色，不要让用户先克隆。

### 数字人完成后的确认（W1 / W2 / W3）

数字人完成后，`run-workflow.mjs` **默认停在** `status: "await_user"` / `stage: "need_pack"`。

**必须先把口播 `video_url` 交给用户，并问：**

- A 需要继续模版包装成片  
- B 不用包装，数字人视频就可以  

| 用户选择 | 你怎么做 |
|----------|----------|
| B / 不用包装 | **到此结束**，交付数字人视频；禁止 create-task |
| A / 需要包装 | 再问三项：模版自选或自动、是否补素材、封面标题确认或全自动 |
| 「全自动」 | 视为要包装，三项全权安排后剪辑 |

要包装且已确认后，用已有 `video_url` 走 `xiaobao-viral-agent`，或：

```bash
node scripts/run-workflow.mjs --id w2_copy_tts_digital_clip \
  --auto-pack --video-url "上一步 video_url" --title "标题" [--style-hint 科技]
```

不要重新 `speak`。未确认「要包装」前不要 create-task。

W4（用户已明确要包装）可直接进入模版/素材/标题三项确认。

每步返回：

```json
{ "success": true, "data": {}, "error": null }
```

失败则停止，把 `error.message` 用中文告诉用户。

### Workflow 3 改写（不要当成卡住）

脚本不会写文案，所以改写必须由你完成。**优先走一轮到位，避免中途停：**

1. 先跑 `xiaobao-video-agent` 的 `extract-copy.mjs`（或 analyze）拿到原文案  
2. **你自己改写**（同一轮思考里完成，不要把改写作业甩给用户）  
3. 再跑 workflow，并带上改写结果：

```bash
node scripts/run-workflow.mjs --id w3_video_rewrite_digital_clip \
  --url "原视频" --rewritten-copy "改写后的完整口播文案"
```

若误跑了没带 `--rewritten-copy`，会返回 `status: "await_agent"` 和原文案：

- **同一轮内立刻改写并重跑**（带 `--rewritten-copy`）  
- 不要对用户说「卡住了 / 请你改写」  
- 不要把 `await_agent`、`task_id`、下一步命令原文甩给用户  
- 只有用户明确说「先给我看文案 / 我来改」时，才把文案摘要交给用户确认

对用户只说进度：「正在改写口播文案，随后生成数字人成片。」然后直接继续执行。

---

## 深度

最大步骤 `MAX_WORKFLOW_DEPTH = 6`。Router 不能调用 Router。不要在 Skill 里再启动一条完整工作流。

---

## 对用户怎么说

只说结果：文案摘要、音频/数字人视频、最终成片链接，或失败原因。  
不要展示 Skill 名菜单，不要默认展示 `voice_id` / `task_id` / `styleId`。

---

## 参考

- `references/architecture.md`
- `references/protocol.md`
- `references/workflows.md`
- `references/extension.md`
- `examples/natural-language.md`
