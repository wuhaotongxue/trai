# Chat_消息发送

---

## 1. 工具定义

### 1.1 发送消息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat_message_send |
| name | string | Send Chat Message |
| description | string | Send a message to chat |
| category | string | chat |
| sub_category | string | message |
| risk_level | string | safe |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| conversation_id | string | 是 | - | 会话 ID |
| content | string | 是 | - | 消息内容 (最大 10000 字符) |
| reply_to | string | 否 | - | 回复的消息 ID |

### 1.2 消息搜索

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat_message_search |
| name | string | Search Messages |
| description | string | Search messages in chat history |
| category | string | chat |
| sub_category | string | message |
| risk_level | string | safe |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| conversation_id | string | 是 | - | 会话 ID |
| query | string | 是 | - | 搜索关键词 (最大 500 字符) |
| limit | number | 否 | 20 | 返回数量 (最大 100) |

---

## 2. 消息上下文

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息 ID |
| conversation_id | string | 会话 ID |
| sender_id | string | 发送者 ID |
| content | string | 消息内容 |
| timestamp | string | 时间戳 |
| reply_to | string | 回复的消息 ID (可选) |
| attachments | Attachment[] | 附件 (可选) |
| is_ai_generated | boolean | 是否 AI 生成 |
| ai_disclosure | string | AI 标注 (可选) |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>消息内容不记录审计日志</li>
    <li>超过 10000 字符的消息不截断</li>
    <li>跨用户消息无权限检查</li>
  </ul>
</div>
