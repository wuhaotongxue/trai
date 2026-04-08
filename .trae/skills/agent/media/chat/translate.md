# Chat - AI 翻译

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.message.translate |
| name | string | Translate Chat Message |
| description | string | Translate message content using AI |
| category | string | chat |
| sub_category | string | ai_translation |
| risk_level | string | safe |
| requires_ai_disclosure | boolean | true |
| monthly_quota_check | boolean | true |
| quota_type | string | ai_translation |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| message_id | string | 是 | - | 消息 ID |
| target_language | string | 是 | - | 目标语言 |
| source_language | string | 否 | auto | 源语言 |

---

## 2. 翻译结果

| 字段 | 类型 | 说明 |
|------|------|------|
| original_message_id | string | 原消息 ID |
| original_text | string | 原文 |
| translated_text | string | 译文 |
| source_language | string | 源语言 |
| target_language | string | 目标语言 |
| confidence | number | 置信度 |
| is_ai_generated | boolean | 是否 AI 生成 (固定为 true) |
| ai_disclosure | string | AI 标注: `[AI Translated]` |

---

## 3. AI 标注规则

| AI 功能 | 标注内容 |
|---------|---------|
| 翻译 | [AI Translated] |
| 摘要 | [AI Summarized] |
| 回复建议 | [AI Suggested Reply] |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>AI 翻译不标注 AI 生成</li>
    <li>翻译结果不记录审计日志</li>
    <li>超过月配额不拒绝操作</li>
  </ul>
</div>
