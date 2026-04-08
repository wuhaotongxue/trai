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

## 2. 表命名规范

| 规则 | 说明 |
|------|------|
| 复数 snake_case | `users`, `meeting_records`, `chat_messages` |
| ❌ 禁止驼峰 | `User`, `MeetingRecords`, `ChatMessages` |
| ❌ 禁止单数 | `user`, `meeting` |

---

## 3. 主键规范

```python
# ✅_正确:_UUID
id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
)

# ✅_正确:_BigInt_Identity
id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

# ❌_禁止:_Serial_(PostgreSQL_自增)
id = Column(Integer, primary_key=True, autoincrement=True)  # Serial
```

---

## 4. 必备字段

```python
created_at: Mapped[datetime] = mapped_column(
    DateTime(0),
    server_default=func.current_timestamp(0),
    nullable=False,
    comment="创建时间",
)
updated_at: Mapped[datetime] = mapped_column(
    DateTime(0),
    server_default=func.current_timestamp(0),
    onupdate=func.current_timestamp(0),
    nullable=False,
    comment="更新时间",
)
is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")
```

---

## 5. 强制注释

```python
# ✅_正确:_所有字段带_comment
class MeetingModel(Base):
    __tablename__ = "meeting_records"
    __table_args__ = {"comment": "会议记录表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, comment="主键 ID")
    title: Mapped[str] = mapped_column(String(255), nullable=False, comment="会议标题")
    start_time: Mapped[datetime] = mapped_column(DateTime(0), nullable=False, comment="开始时间")

# ❌_禁止:_无注释
class MeetingModel(Base):
    __tablename__ = "meeting_records"
    id = Column(UUID, primary_key=True)
```

---

## 6. 查询红线

```python
# ❌_禁止:_SELECT_*
query = select(MeetingModel)

# ✅_正确:_指定列
query = select(MeetingModel.id, MeetingModel.title, MeetingModel.start_time)

# ❌_禁止:_N+1_查询
for meeting in meetings:
    user = await db.execute(select(User).where(User.id == meeting.user_id))

# ✅_正确:_joinedload_预加载
query = select(MeetingModel).options(joinedload(MeetingModel.user))

# ❌_禁止:_裸_SQL_拼接
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅_正确:_SQLAlchemy_表达式
query = select(User).where(User.id == user_id)
```

---

## 7. 事务规范

```python
# ✅_正确:_显式事务
async with db.begin():
    db.add(model1)
    db.add(model2)

# ✅_正确:_自动提交
async with db.begin_nested():
    db.add(detail)
```

---

## 8. 数据库迁移

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 严禁在生产环境执行 DDL</strong>
  <div style="margin-top:8px;font-size:13px;">
    必须使用 <code>Alembic</code> 进行数据库结构迁移，禁止手动执行 CREATE/ALTER TABLE
  </div>
</div>

---

## 9. 快速参考

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