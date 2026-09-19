# Router 架构

```text
User
  ↓ 自然语言
Router（xiaobao-router）
  ↓ 选择 1 个 Skill 或 1 条 Workflow
Skill（video / digital-human / viral）
  ↓ 现有 scripts
API（apis.xiaobao.ink，仅 Skill 内）
  ↓
Task（异步 task）
  ↓
Result（统一信封）
```

## 职责边界

- **Router** 只读 `scripts/lib/registry.mjs`，用 `route.mjs` 决策，用 `run-workflow.mjs` 按序 `spawn` 已安装 Skill 的脚本。
- **不**复制 `shared/xiaobao-api` 的请求代码。
- **不**修改三个业务 Skill 的脚本行为；它们的 stdout 由 `invoke.mjs` 的 `adapt()` 收成协议。

## 安装后的发现顺序

1. `XIAOBAO_SKILLS_DIR/<skill>`
2. `~/.agents/skills/<skill>`
3. `~/.codex/skills/<skill>`
4. 本仓库并列目录（开发时）

## 防循环

- 登记表里没有任何 Skill 的下游包含 `xiaobao-router`
- `callSkill('xiaobao-router')` 直接失败
- 单次工作流深度不超过 6
