# Backend_数据库规范

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

## 2. SQLAlchemy 模型字段注释规范

**所有字段必须有中文注释，格式如下：**

```python
from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

class ChatSessionModel(Base):
    """对话会话模型"""
    __tablename__ = "chat_sessions"
    __comment__ = "AI 对话会话表，存储会话元数据和消息历史"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    """自增主键 ID"""
    session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    """会话唯一标识 UUID"""
    user_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    """用户 ID，用于多用户场景"""
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    """会话标题，可由用户自定义"""
    model: Mapped[str] = mapped_column(String(64), nullable=False)
    """使用的 AI 模型名称"""
    messages: Mapped[dict[str, Any]] = mapped_column(JSON, default=list)
    """消息历史 JSON 数组"""
    extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    """扩展数据字段，用于存储自定义元数据"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    """创建时间"""
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    """最后更新时间"""
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    """软删除时间，为空表示未删除"""
```

**约束**：
- 每个字段后必须紧跟 `"""中文注释"""` docstring
- 表类必须有 `__tablename__` 和 `__comment__`
- 字段注释禁止留空或写英文

---

## 3. SQLAlchemy 保留字警告

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止使用的保留字段名</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><code>metadata</code> — SQLAlchemy Declarative 保留字，必须改为 <code>extra_data</code> 或 <code>msg_metadata</code></li>
    <li><code>query</code> — ORM 查询属性保留字</li>
    <li><code>items</code> — 字典式访问保留字</li>
  </ul>
</div>

**正确示例**：
```python
# ❌ 错误 - metadata 是保留字
metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

# ✅ 正确 - 使用替代名称
extra_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
msg_metadata: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
```

---

## 4. 表命名规范

| 规则 | 说明 |
|------|------|
| 复数 snake_case | `users`, `meeting_records`, `chat_messages` |
| ❌ 禁止驼峰 | `User`, `MeetingRecords`, `ChatMessages` |
| ❌ 禁止单数 | `user`, `meeting` |

---

## 5. 主键规范

**��束**：
- ✅ UUID
- ✅ BigInt Identity
- ❌ 禁止 Serial (PostgreSQL 自增)

---

## 6. 必备字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `created_at` | TIMESTAMP(0) | 创建时间 |
| `updated_at` | TIMESTAMP(0) | 更新时间 |
| `deleted_at` | TIMESTAMP(0) | 软删除时间（用时间戳代替 is_deleted） |

---

## 7. 强制注释

**约束**：
- 必须为表本身添加 `__comment__`
- 必须为所有字段添加 docstring 注释
- 无注释拒绝创建表

---

## 8. 查询红线

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 查询禁止</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>禁止 <code>SELECT *</code>，必须显式指定列</li>
    <li>禁止 N+1 查询，必须使用 <code>joinedload</code> 预加载</li>
    <li>禁止裸 SQL 拼接，必须使用 SQLAlchemy 表达式</li>
  </ul>
</div>

---

## 9. 数据库迁移

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 严禁在生产环境执行 DDL</strong>
  <div style="margin-top:8px;font-size:13px;">
    必须使用 <code>Alembic</code> 进行数据库结构迁移，禁止手动执行 CREATE/ALTER TABLE
  </div>
</div>

---

## 10. 快速参考

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
    <strong style="font-size:13px;color:#D32F2F;">禁止 metadata</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">SQLAlchemy 保留字</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">字段必须有注释</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每个字段后加 docstring</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Alembic 迁移</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止手动 DDL</div>
  </div>

</div>
