# 发布目标

仓库：[xiaobaoAi/xiaobao-skills](https://github.com/xiaobaoAi/xiaobao-skills)

远程仓库目前是空的，推送 `main` 之后客户才能安装。

客户安装：

```bash
npx skills add xiaobaoAi/xiaobao-skills --skill xiaobao-viral-agent
```

后续更新：在本目录提交后 push 到 `origin`（`main`）。

```bash
git add .
git commit -m "docs: 修正安装仓库地址"
git push origin main
```

不要提交：`~/.xiaobao-skills/credentials.json`、任何 `.env`、真实 API Key。
