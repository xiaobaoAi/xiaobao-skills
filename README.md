# 销豹 Agent Skills

| Skill | 定位 |
|-------|------|
| `xiaobao-viral-agent` | **剪辑成片**：口播混剪 / 素材混剪 / 新闻 / 包装 |
| `xiaobao-video-agent` | **理解视频**：解析、文案/字幕/封面 |
| `xiaobao-digital-human` | **数字人生产**：克隆声音、TTS、数字人视频 |
| `xiaobao-router` | **编排**：按自然语言选择并串联上面三个 Skill |

用户只描述目标。开发者安装 Router 后，由它决定调用顺序。

```bash
npx skills add xiaobaoAi/xiaobao-skills --skill xiaobao-router
bash install-local.sh
node xiaobao-router/scripts/route.mjs --text "把这个视频改成我的数字人口播"
```

API：[apis.xiaobao.ink](https://apis.xiaobao.ink/)  
仓库：[xiaobaoAi/xiaobao-skills](https://github.com/xiaobaoAi/xiaobao-skills)

## 界面一览

### 图一：抓取全媒体平台的文案

![抓取全媒体平台的文案](docs/images/01-extract-copy.png)

### 图二：文本合成语音

![文本合成语音](docs/images/02-tts.png)

### 图三：这个 SKILL 的几个模式

![这个 SKILL 的几个模式](docs/images/03-modes.png)

### 图四：视频包装模版

![视频包装模版](docs/images/04-templates.png)

公共 HTTP 客户端：`shared/xiaobao-api`（同步到各 Skill `scripts/vendor/xiaobao-api`）。

```bash
node scripts/sync-shared.mjs
```

## 安装

```bash
npx skills add xiaobaoAi/xiaobao-skills --skill xiaobao-viral-agent
npx skills add xiaobaoAi/xiaobao-skills --skill xiaobao-video-agent
npx skills add xiaobaoAi/xiaobao-skills --skill xiaobao-digital-human

bash install-local.sh              # 全部
bash install-local.sh digital      # 仅数字人
bash install-local.sh --codex

node ~/.agents/skills/xiaobao-digital-human/scripts/setup-credentials.mjs --api-key YOUR_KEY
```

凭据共用：`~/.xiaobao-skills/credentials.json`

## 串联示例

```text
文案 + 形象 + 声音样本
  → digital-human（speak）→ 数字人视频
  → viral-agent（realMan）→ 最终短视频
```

```text
分享链接 → video-agent（分析）→ viral-agent（仿结构出片）
```

## 目录

```
shared/xiaobao-api/       # 公共 Client（源）
xiaobao-viral-agent/
xiaobao-video-agent/
xiaobao-digital-human/
scripts/sync-shared.mjs
```
