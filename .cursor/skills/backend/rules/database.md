# Backend - 数据库规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 表命名规范

| 规则 | 说明 |
|------|------|
| 复数 snake_case | `users`, `meeting_records`, `chat_messages` |
| ❌ 禁止驼峰 | `User`, `MeetingRecords`, `ChatMessages` |
| ❌ 禁止单数 | `user`, `meeting` |

---

## 3. 主键规范

**约束**：
- ✅ UUID
- ✅ BigInt Identity
- ❌ 禁止 Serial (PostgreSQL 自增)

---

## 4. 必备字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `created_at` | TIMESTAMP(0) | 创建时间 |
| `updated_at` | TIMESTAMP(0) | 更新时间 |
| `is_deleted` | Boolean | 软删除标记 |

---

## 5. 强制注释

**约束**：
- 必须为表本身添加 `comment`
- 必须为所有字段添加 `comment`
- 无注释拒绝创建表

---

## 6. 查询红线

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 查询禁止</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>禁止 <code>SELECT *</code>，必须显式指定列</li>
    <li>禁止 N+1 查询，必须使用 <code>joinedload</code> 预加载</li>
    <li>禁止裸 SQL 拼接，必须使用 SQLAlchemy 表达式</li>
  </ul>
</div>

---

## 7. 数据库迁移

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 严禁在生产环境执行 DDL</strong>
  <div style="margin-top:8px;font-size:13px;">
    必须使用 <code>Alembic</code> 进行数据库结构迁移，禁止手动执行 CREATE/ALTER TABLE
  </div>
</div>

---

## 8. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 SELECT *</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须显式指定列</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 Serial</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">用 UUID 或 BigInt</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止裸 SQL</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">用 SQLAlchemy 表达式</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">必备三字段</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">created_at/updated_at/is_deleted</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">复数表名</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">users / meetings</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Alembic 迁移</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止手动 DDL</div>
  </div>

</div>
