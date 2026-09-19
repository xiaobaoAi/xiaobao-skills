# Skill 协议

每个能力在 `scripts/lib/registry.mjs` 登记：

| 字段 | 含义 |
|------|------|
| `name` | Skill 目录名 |
| `description` | 一句话职责 |
| `capabilities` | 能力枚举 |
| `input` | 用户层输入（中文说明） |
| `output` | 机器可传递字段 |

## 统一返回

```json
{ "success": true, "data": {}, "error": null }
```

```json
{ "success": false, "data": null, "error": { "message": "中文原因", "code": "SKILL_FAILED" } }
```

Router 只把 `error.message` 给用户。`code` 供程序分支。

## 标准 data

**video-agent**

```json
{
  "copy": null,
  "subtitle": null,
  "cover_url": null,
  "video_url": null,
  "title": null,
  "description": null,
  "materials": null
}
```

**digital-human**

```json
{
  "audio_url": null,
  "video_url": null,
  "voice_name": null,
  "voice_id": null
}
```

`voice_id` 只在 Skill 之间传递，不对用户展示。

**viral-agent**

```json
{
  "video_url": null,
  "task_id": null,
  "status": "completed"
}
```

`task_id` 同样只用于内部排障。

## 人工步骤

Workflow 3 在改写前返回：

```json
{
  "success": true,
  "data": { "status": "await_agent", "stage": "rewrite", "copy": "..." },
  "error": null
}
```

由当前 Agent 改写文案后，用 `--rewritten-copy` 继续。这不是第四个业务 Skill。
