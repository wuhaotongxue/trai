# PostgreSQL 数据库锁死 (Deadlock/Idle in Transaction) 问题排查与解决指南

## 1. 问题现象
在执行简单的查询语句（如 `SELECT * FROM t_users LIMIT 10;`）时，数据库长时间卡死（超过数分钟）没有响应，最终可能报 `canceling statement due to statement timeout`，同时后台日志出现大量 `idle in transaction` 或 `Connection reset by peer` 的报错。

## 2. 根本原因 (Root Cause)
这个问题的根本原因在于**后端代码中存在数据库连接/事务泄漏**。

### 2.1 具体场景分析：
1. **未关闭的事务 (`idle in transaction`)**：后端代码调用 `get_session()` 获取了数据库连接，并执行了查询（比如登录时查询密码，或者查询聊天记录）。在 SQLAlchemy 中，一旦执行 `session.execute()` 就会隐式开启一个事务。但是，代码**没有在执行完毕后调用 `session.commit()`、`session.rollback()` 或 `session.close()`**。
2. **连接池被占满并持有读锁**：这导致连接被抛弃但并没有真正关闭，在 PostgreSQL 中处于 `idle in transaction` 状态，这会一直持有 `t_users` 或 `t_messages` 表的共享锁 (AccessShareLock)。
3. **DDL 被阻塞引发“大塞车”**：与此同时，当系统启动或尝试调用 `_ensure_postgres_user_schema` 时，执行了 `ALTER TABLE t_users ADD COLUMN ...`。修改表结构需要获取独占锁 (AccessExclusiveLock)。由于前面有泄漏的读锁没释放，`ALTER TABLE` 只能无限期等待。
4. **后续查询全部卡死**：PostgreSQL 遵循队列机制，当有一个 `ALTER TABLE` 在等待独占锁时，后面所有尝试访问该表的普通查询（哪怕是 `SELECT`）都会被排队阻塞。这就导致了“查询 10 条数据需要 5 分钟”的诡异现象。

## 3. 代码层面的排查与修复方案

### 3.1 发现的问题
在现有的 `trai` 后端代码中：
1. `get_session()` 被广泛用作 FastAPI 的依赖注入 (`Depends(get_session)`)，但它原本只是简单地 `return session`，这导致 FastAPI 请求结束后**不会自动关闭连接**。
2. 多处后台脚本或路由函数中存在手动的 `db = get_session()` 调用，执行完查询后直接 `return`，缺少了 `finally: db.close()` 的清理逻辑。

### 3.2 修复策略
为了彻底避免该问题，已进行了以下规范和改造：

**第一步：重构 FastAPI 依赖注入（使用 Generator）**
在 `infrastructure/database/database.py` 中，新增 `get_db_session` 作为 FastAPI 专用的依赖，它利用 `yield` 确保请求结束时一定会关闭会话：
```python
def get_db_session():
    """获取数据库会话生成器(用于 FastAPI Depends)"""
    session = get_database().get_session()
    try:
        yield session
    finally:
        session.close()
```
*所有 Router 里的 `Depends(get_session)` 都应该替换为 `Depends(get_db_session)`。*

**第二步：手动调用的地方必须使用上下文管理器 (`with`)**
对于非 FastAPI 路由（比如定时任务、工具函数、手动获取 db 的地方），务必使用 `with` 语法：
```python
# ❌ 错误写法（导致连接泄漏）
db = get_session()
user = db.execute(select(User)).scalar()
return user

# ✅ 正确写法（离开 with 块时自动 close）
with get_session() as db:
    user = db.execute(select(User)).scalar()
    return user
```

## 4. 紧急处理方案（杀锁命令）
如果下次再遇到类似问题，可以使用以下 SQL 快速恢复数据库：

```sql
-- 1. 查看是谁导致了阻塞 (重点看 state 为 'idle in transaction' 的)
SELECT pid, usename, state, query, state_change 
FROM pg_stat_activity 
WHERE state != 'idle';

-- 2. 杀掉特定的僵尸进程 (替换 12345 为实际的 pid)
SELECT pg_terminate_backend(12345);

-- 3. 【终极方案】直接杀掉所有处于 'idle in transaction' 的连接
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle in transaction';
```

## 5. 总结
**任何数据库 Session 使用完毕后必须关闭**。
对于 FastAPI，利用 `yield` 配合 `Depends` 让框架自动管理；对于普通脚本，利用 `with get_session() as session:` 自动管理。这是保持数据库健康、避免锁死的铁律。
