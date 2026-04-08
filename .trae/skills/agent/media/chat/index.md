# Agent - 对话处理规范索引

---

## 快速索引

| 子规范 | 文件 | 说明 |
|--------|------|------|
| 能力矩阵 | `chat/overview.md` | 对话工具总览 |
| 消息发送 | `chat/message.md` | 消息发送与接收 |
| AI 翻译 | `chat/translate.md` | AI 翻译 |
| AI 摘要 | `chat/summarize.md` | AI 摘要 |
| 回复建议 | `chat/reply.md` | 回复建议 |
| 群组管理 | `chat/group.md` | 群组管理 |
| 消息审核 | `chat/moderate.md` | 消息审核 |
| Rules | `chat/rules.md` | 对话操作规则 |
| 上下文 | `chat/context.md` | 对话上下文模板 |

---

## 对话工具矩阵

| 工具 ID | 能力 | 风险等级 | AI 标注 | 月配额 |
|---------|------|---------|--------|-------|
| chat.message.send | 发送消息 | safe | - | - |
| chat.message.translate | 翻译消息 | safe | required | ai_translation |
| chat.message.summarize | 摘要消息 | safe | required | ai_summarization |
| chat.message.reply_suggest | 回复建议 | safe | required | - |
| chat.group.mute | 群组禁言 | approval | - | - |
| chat.message.search | 消息搜索 | safe | - | - |
| chat.message.moderate | 消息审核 | monitored | - | - |

---

## RBAC 权限

| 角色 | AI 翻译 | AI 摘要 | 回复建议 | 群组禁言 |
|------|---------|--------|---------|---------|
| Guest | 有限配额 | 有限配额 | - | 禁止 |
| User | 有限配额 | 有限配额 | 是 | 需确认 |
| VIP | 无限 | 无限 | 是 | 需确认 |
| Admin | 无限 | 无限 | 是 | 可跳过 |
