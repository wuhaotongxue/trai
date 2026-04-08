# Chat - 回复建议

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.message.reply_suggest |
| name | string | Generate Reply Suggestions |
| description | string | Generate AI reply suggestions for a message |
| category | string | chat |
| sub_category | string | ai_reply |
| risk_level | string | safe |
| requires_ai_disclosure | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| message_id | string | 是 | - | 消息 ID |
| count | number | 否 | 3 | 建议数量 (最大 5) |
| tone | string | 否 | neutral | 语气: formal/casual/friendly/neutral |

---

## 2. 回复建议结果

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息 ID |
| suggestions | Suggestion[] | 建议列表 |
| is_ai_generated | boolean | 是否 AI 生成 (固定为 true) |
| ai_disclosure | string | AI 标注: `[AI Suggested Reply]` |

### 2.1 Suggestion 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 建议文本 |
| tone | string | 语气 |
| confidence | number | 置信度 |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>回复建议不标注 AI 生成</li>
    <li>回复建议不记录审计日志</li>
    <li>回复建议用于自动回复 (必须用户手动选择)</li>
  </ul>
</div>
