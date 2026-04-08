# Agent_审计日志规范

---

## 1. 核心原则

> **所有安全相关操作必须同时记录到 PostgreSQL 和 S3**

---

## 2. 双写架构

```
[Audit Event]
     |
     +---> [PostgreSQL] ---> 快速查询/统计分析
     |
     +---> [S3] ---> 原始归档/长期存储
```

| 存储位置 | 用途 | 保留期限 |
|----------|------|----------|
| PostgreSQL | 快速查询、统计分析 | 90 天 |
| S3 | 原始归档、长期存储 | 永久 |

> **任一失败均需告警并重试**

---

## 3. PostgreSQL 表设计

### 3.1 audit_logs 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| event_id | VARCHAR(100) | 事件 ID (唯一, 幂等键) |
| user_id | UUID | 用户 ID |
| user_role | VARCHAR(20) | 用户角色 |
| action | VARCHAR(100) | 操作类型 |
| category | VARCHAR(50) | 分类 |
| tool_id | VARCHAR(100) | 工具 ID |
| resource_type | VARCHAR(50) | 资源类型 |
| resource_id | VARCHAR(100) | 资源 ID |
| result | VARCHAR(20) | 结果: success/failure/denied |
| reason | TEXT | 原因 |
| metadata | JSONB | 元数据 |
| ip_address | INET | IP 地址 |
| user_agent | TEXT | User Agent |
| session_id | UUID | 会话 ID |
| created_at | TIMESTAMPTZ | 创建时间 |

### 3.2 索引

| 索引 | 字段 |
|------|------|
| idx_audit_user | user_id, created_at |
| idx_audit_action | action, created_at |
| idx_audit_tool | tool_id, created_at |
| idx_audit_category | category, created_at |

---

## 4. 审计事件类型

| 事件类型 | 说明 |
|---------|------|
| permission_check | 权限检查 |
| vip_watermark_skip | VIP 水印跳过 |
| quota_deducted | 配额扣减 |
| quota_exceeded | 配额超限 |
| tool_executed | 工具执行 |
| rule_triggered | Rules 触发 |
| correction_triggered | 纠错触发 |
| correction_failed | 纠错失败 |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>安全操作不记录审计日志</li>
    <li>仅写入 PostgreSQL，不归档到 S3</li>
    <li>审计日志中包含敏感信息 (密码/token)</li>
    <li>审计日志无索引，无法快速查询</li>
    <li>审计日志不关联工具 ID，无法追溯</li>
  </ul>
</div>
