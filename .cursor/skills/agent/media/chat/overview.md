# Chat - 能力总览

---

## 1. 对话工具矩阵

| 工具 ID | 能力 | 风险等级 | AI 标注 | 月配额 |
|---------|------|---------|--------|-------|
| chat.message.send | 发送消息 | safe | - | - |
| chat.message.translate | 翻译消息 | safe | required | ai_translation |
| chat.message.summarize | 摘要消息 | safe | required | ai_summarization |
| chat.message.reply_suggest | 回复建议 | safe | required | - |
| chat.group.mute | 群组禁言 | approval | - | - |
| chat.group.unmute | 取消禁言 | approval | - | - |
| chat.message.search | 消息搜索 | safe | - | - |
| chat.message.moderate | 消息审核 | monitored | - | - |

---

## 2. 风险等级说明

| 等级 | 行为 | 示例 |
|------|------|------|
| safe | 自动执行 | 发送消息、翻译 |
| monitored | 自动执行，记录日志 | 消息审核 |
| requires_approval | 等待用户确认 | 群组禁言 |

---

## 3. 对话子目录结构

| 文件 | 说明 |
|------|------|
| `message.md` | 消息发送详细规范 |
| `translate.md` | AI 翻译详细规范 |
| `summarize.md` | AI 摘要详细规范 |
| `reply.md` | 回复建议详细规范 |
| `group.md` | 群组管理详细规范 |
| `moderate.md` | 消息审核详细规范 |
| `rules.md` | 对话操作规则 |
| `context.md` | 对话上下文模板 |
