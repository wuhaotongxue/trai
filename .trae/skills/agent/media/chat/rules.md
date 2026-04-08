# Chat_Rules

---

## 1. 对话 Rules 总表

### 1.1 AI 标注规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| CR-001 | ai_speech | AI 翻译必须标注 AI 生成 | tool_call: chat.message.translate | audit_log | info |
| CR-002 | ai_speech | AI 摘要必须标注 AI 生成 | tool_call: chat.message.summarize | audit_log | info |
| CR-003 | ai_speech | AI 回复建议必须标注 | tool_call: chat.message.reply_suggest | audit_log | info |

### 1.2 群组管理规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| CR-GROUP-001 | permission | 群组禁言需要确认 | tool_call: chat.group.mute | require_confirmation | warning |
| CR-GROUP-002 | permission | 取消禁言需要确认 | tool_call: chat.group.unmute | require_confirmation | warning |

### 1.3 配额规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| CR-QUOTA-001 | permission | 非 VIP 翻译需检查配额 | tool_call: chat.message.translate | audit_log | warning |
| CR-QUOTA-002 | permission | 非 VIP 摘要需检查配额 | tool_call: chat.message.summarize | audit_log | warning |

---

## 2. Rules 快速参考

| 规则 ID | 描述 | 严重程度 |
|---------|------|---------|
| CR-001 | 翻译标注 AI | info |
| CR-002 | 摘要标注 AI | info |
| CR-003 | 回复建议标注 AI | info |
| CR-GROUP-001 | 禁言需确认 | warning |
| CR-QUOTA-001 | 翻译配额检查 | warning |
| CR-QUOTA-002 | 摘要配额检查 | warning |
