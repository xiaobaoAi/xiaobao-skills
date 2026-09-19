# 扩展新 Skill

1. 新建目录 `xiaobao-<name>/`，内含 `SKILL.md` 与 `scripts/`。业务 API 只写在该 Skill（或继续用 `shared/xiaobao-api`），不要写进 Router。
2. 在 `xiaobao-router/scripts/lib/registry.mjs` 增加一条：
   - `name` / `description` / `capabilities` / `input` / `output`
   - **不要**把 `xiaobao-router` 写进它的调用列表
3. 若输出形状不同，只在 `invoke.mjs` 的 `adapt()` 增加一个分支，把 stdout 收成 `{ success, data, error }`。
4. 新的用户说法：在 `ROUTES` 或 `WORKFLOWS` 增加测试函数。多 Skill 流程放在 `run-workflow.mjs`，步数不得超过 `MAX_WORKFLOW_DEPTH`（6）。
5. 更新 `install-local.sh` 与本文件的验收表。
6. 跑 `node xiaobao-router/scripts/route.mjs --text "..."` 确认不会误伤旧路由。

禁止：

- 在新 Skill 里启动 Router
- 复制一份 HTTP Client
- 让用户在对话里选择 Skill 名字
