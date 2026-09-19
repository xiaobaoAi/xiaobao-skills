# 用量与计费说明

Skill 只负责编排调用，计费以 [apis.xiaobao.ink](https://apis.xiaobao.ink/) 各接口页面为准。下列为查阅时的常见口径（可能随平台调整）：

| 能力 | 文档 | 常见计费口径（参考） |
|------|------|----------------------|
| TTS 语音合成 | [doc/10](https://apis.xiaobao.ink/doc/10) | 按字数/次数，见文档 |
| 数字人高清合成 | [doc/11](https://apis.xiaobao.ink/doc/11) | 约按成片秒数（如点数/秒） |
| 声音克隆 | [doc/9](https://apis.xiaobao.ink/doc/9) | 按次，见文档 |
| 真人口播 / 混剪 / 新闻混剪 | smartclip 系列 | 按任务或时长，见对应文档 |

**Agent 提示用户时：**

1. 提醒余额不足会导致 create/poll 失败，错误信息常含「余额」「点数」「权限」。
2. 不要在对话里估算精确费用；引导用户打开开放平台产品页核对。
3. 长任务会多次 query，本身一般不计多次创建费；创建失败通常不扣成片费（以平台规则为准）。

**本 Skill 版本：** 见根目录 `package.json` 的 `version` 字段。
