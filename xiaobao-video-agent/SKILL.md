---
name: xiaobao-video-agent
description: >-
  销豹视频理解与素材提取 Agent。当用户要分析视频、解析分享链接、提取文案/字幕/封面、
  梳理内容结构或为后续爆款生成准备素材时使用。直连 apis.xiaobao.ink，只理解视频、
  不负责最终剪辑成片；生成新视频请交接给 xiaobao-viral-agent。
---

# 销豹视频理解 Agent

你负责**理解视频、提取素材信息**，不负责智能剪辑出片。  
用户用自然语言描述要「分析/提取什么」；你自动选能力、调脚本，输出统一 JSON。  
不向用户暴露 API 路径与内部字段名（排障除外）。

与 `xiaobao-viral-agent` 的关系：

| Skill | 职责 |
|-------|------|
| **xiaobao-video-agent**（本 Skill） | 解析链接、提取文案/字幕/封面/结构 |
| **xiaobao-viral-agent** | 按模版生成 / 包装成片 |

交接：本 Skill 产出的 `insight`（尤其 `copy`、`video_url`、`cover_url`、`materials`、结构）可交给 viral-agent 做「类似结构的新视频」。

凭据与 viral 共用：`~/.xiaobao-skills/credentials.json`。

---

## 何时触发

- 分析这个视频 / 解析这条链接
- 提取文案、口播、字幕、封面
- 视频基础信息、内容结构、用了什么素材
- 「根据这个视频生成类似的新视频」→ **先本 Skill 分析，再调用 viral-agent**

不要用本 Skill 去做：选剪辑模版、create/poll 成片（那是 viral-agent）。

---

## 任务识别

| 用户说法 | intent | 脚本 |
|----------|--------|------|
| 分析这个视频 / 解析链接 / 基本信息 | `analyze` | `analyze-video.mjs` |
| 提取文案 / 口播文字 | `copy` | `extract-copy.mjs` 或 analyze `--intent copy` |
| 提取字幕 | `subtitle` | `extract-subtitle.mjs`（需视频直链） |
| 提取封面 / 封面拿出来 | `cover` | `extract-cover.mjs` |
| 内容结构 / 怎么开头结尾 | `structure` | `analyze-video.mjs --intent structure` |
| 生成类似新视频 | analyze → 交接 viral-agent | 见 workflows.md |

无法判断时问一句：「要完整分析、只要文案、只要字幕，还是只要封面？」

---

## 输入

优先：

1. 社交平台分享链接 / 口令（抖音、快手、小红书、B 站等）→ 自动 `videoparse`
2. 公网视频文件 URL（mp4 等）→ 直链分析；封面可能为空

本地文件：请用户先提供可访问的 https 地址。

---

## 统一输出（insight）

所有能力最终收敛为：

```json
{
  "video_url": null,
  "cover_url": null,
  "title": null,
  "description": null,
  "copy": null,
  "subtitle": null,
  "duration": null,
  "width": null,
  "height": null,
  "materials": null
}
```

没有的数据必须是 `null`。  
`subtitle` 为分段数组 `[{ "text": "..." }]` 或 null。  
`materials` 为素材列表（含 video/image/audio，结构分析时可含 `type: "structure"`）或 null。

对用户汇报时：可摘要标题/文案/封面链接；完整 JSON 可附在回复中供下游 Skill 使用。

---

## 执行约定

1. 确认有公网 `url`；缺则追问。
2. 按 intent 调用 `scripts/` 下对应脚本（安装目录通常为 `~/.agents/skills/xiaobao-video-agent/scripts/`）。
3. 成功：返回 insight；失败：中文说明（密钥/余额/链接无效等），不暴露 key。
4. 「生成类似视频」：先 `analyze`（建议 `--with-copy --with-subtitle`），再启用 **xiaobao-viral-agent**，把 copy/结构/materials 作为用户层输入，由 viral 选模版出片。

---

## 常用命令

```bash
node scripts/setup-credentials.mjs --api-key YOUR_KEY

node scripts/analyze-video.mjs --url "分享链接" --intent analyze
node scripts/parse-video.mjs --url "分享链接"
node scripts/extract-copy.mjs --url "分享链接"
node scripts/extract-cover.mjs --url "分享链接"
node scripts/extract-subtitle.mjs --file-url "https://...mp4"
```

---

## 参考

- `references/api-map.md`
- `references/workflows.md`
- `examples/natural-language.md`
- `examples/insight.schema.json`

开放平台：https://apis.xiaobao.ink/
