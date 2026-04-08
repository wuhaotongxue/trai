# Chat - 群组管理

---

## 1. 工具定义

### 1.1 群组禁言

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.group.mute |
| name | string | Mute Group |
| description | string | Mute a chat group for specified duration |
| category | string | chat |
| sub_category | string | group_management |
| risk_level | string | requires_approval |
| requires_admin_role | boolean | false |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| group_id | string | 是 | - | 群组 ID |
| duration_minutes | number | 否 | 30 | 禁言时长 (最大 1440 分钟) |
| reason | string | 否 | - | 原因 |

### 1.2 取消禁言

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | chat.group.unmute |
| name | string | Unmute Group |
| description | string | Cancel group mute |
| category | string | chat |
| sub_category | string | group_management |
| risk_level | string | requires_approval |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| group_id | string | 是 | 群组 ID |

---

## 2. 群组管理 Rules

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| CR-GROUP-001 | 群组禁言需要确认 | tool_call: chat.group.mute | require_confirmation | warning |
| CR-GROUP-002 | 禁言操作记录审计日志 | tool_call: chat.group.mute | audit_log | info |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>群组禁言无确认流程</li>
    <li>禁言时长超过 24 小时不拒绝</li>
    <li>群组管理操作无审计日志</li>
    <li>非管理员执行敏感群组操作</li>
  </ul>
</div>
