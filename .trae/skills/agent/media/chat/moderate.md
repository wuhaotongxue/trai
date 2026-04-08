# Chat_消息审核

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.message.moderate |
| name | string | Moderate Chat Messages |
| description | string | Check messages for unsafe or inappropriate content |
| category | string | chat |
| sub_category | string | moderation |
| risk_level | string | monitored |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| message_ids | array | 是 | - | 消息 ID 列表 |
| check_categories | array | 否 | all | 检查类别 |

---

## 2. 审核结果

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息 ID |
| safe | boolean | 是否安全 |
| categories | CategoryResult[] | 违规类别 |
| action | string | 处理动作: allow/warn/block |

### 2.1 CategoryResult 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 类别名称 |
| confidence | number | 置信度 |
| flagged | boolean | 是否标记 |

---

## 3. 审核类别

| 类别 | 说明 |
|------|------|
| hate_speech | 仇恨言论 |
| harassment | 骚扰 |
| violence | 暴力内容 |
| sexual | 色情内容 |
| misinformation | 虚假信息 |
| spam | 垃圾信息 |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>审核结果不记录审计日志</li>
    <li>不安全消息不阻止直接发送</li>
    <li>审核超时不影响消息发送</li>
  </ul>
</div>
