# Chat_AI_摘要

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.message.summarize |
| name | string | Summarize Chat Messages |
| description | string | Summarize conversation using AI |
| category | string | chat |
| sub_category | string | ai_summarization |
| risk_level | string | safe |
| requires_ai_disclosure | boolean | true |
| monthly_quota_check | boolean | true |
| quota_type | string | ai_summarization |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| conversation_id | string | 是 | - | 会话 ID |
| message_count | number | 否 | 50 | 消息数量 (最大 500) |
| summary_length | string | 否 | medium | 摘要长度: short/medium/long |

---

## 2. 摘要结果

| 字段 | 类型 | 说明 |
|------|------|------|
| conversation_id | string | 会话 ID |
| summary | string | 摘要内容 |
| key_points | string[] | 关键点 |
| participant_count | number | 参与者数量 |
| time_range | object | 时间范围 |
| message_count | number | 消息数量 |
| is_ai_generated | boolean | 是否 AI 生成 (固定为 true) |
| ai_disclosure | string | AI 标注: `[AI Summarized]` |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>AI 摘要不标注 AI 生成</li>
    <li>摘要不记录审计日志</li>
    <li>超过月配额不拒绝操作</li>
    <li>摘要包含敏感信息不脱敏</li>
  </ul>
</div>
