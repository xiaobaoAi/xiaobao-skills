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
| 把这个视频改成我的数字人口播 | Workflow 1 |
| 文案做成数字人口播短视频 | Workflow 2 |
| 提取后改写再做成数字人口播 | Workflow 3（改写由你完成，再 `--rewritten-copy`） |
| 视频加字幕并包装 | Workflow 4 |

细节：`references/workflows.md`。协议：`references/protocol.md`。

---

## 执行

单 Skill：按该 Skill 的 SKILL.md 调它的脚本。  
多 Skill：

```bash
node scripts/run-workflow.mjs --id w1_video_digital_clip \
  --url "原视频" --voice-name "热情娜娜" --person-video "年轻女性商务"
```

形象和音色可省略，数字人 Skill 会用公共形象和公共音色，不要让用户先克隆。

每步返回：

```json
{ "success": true, "data": {}, "error": null }
```

失败则停止，把 `error.message` 用中文告诉用户。  
`status: "await_agent"` 表示该你改写文案，不要把内部字段甩给用户。

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
