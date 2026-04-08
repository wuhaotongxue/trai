# Agent - 速率限制规范

---

## 1. 核心原则

> **三层速率限制：全局限流 + 端点限流 + 用户限流**

---

## 2. PostgreSQL 表设计

### 2.1 rate_limit_configs 表 (速率限制配置表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| config_key | VARCHAR(100) | 配置键 (唯一) |
| limit_type | VARCHAR(20) | 限流类型: endpoint/user/global |
| max_requests | INT | 最大请求数 |
| window_seconds | INT | 时间窗口 (秒) |
| user_role | VARCHAR(20) | 用户角色 (可选) |
| strategy | VARCHAR(20) | 策略: reject/delay/queue |

### 2.2 默认配置

| 配置键 | 限流类型 | 最大请求数 | 时间窗口 (秒) |
|--------|----------|-----------|--------------|
| global:default | global | 1000 | 60 |
| user:guest | user | 10 | 60 |
| user:basic | user | 60 | 60 |
| user:vip | user | 300 | 60 |
| endpoint:image.generate | endpoint | 10 | 60 |
| endpoint:audio.synthesize | endpoint | 20 | 60 |
| endpoint:chat.message.send | endpoint | 60 | 60 |

### 2.3 rate_limit_events 表 (速率限制事件表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| event_type | ENUM | 事件类型: rate_limited/whitelisted/blacklisted |
| user_id | UUID | 用户 ID |
| ip_address | INET | IP 地址 |
| endpoint | VARCHAR(200) | 端点 |
| request_count | INT | 请求数 |
| limit_count | INT | 限制数 |
| created_at | TIMESTAMPTZ | 创建时间 |

---

## 3. Redis 滑动窗口限流

### 3.1 限流算法

| 组件 | 说明 |
|------|------|
| 滑动窗口 | 使用 Redis ZSET 实现滑动窗口 |
| 原子操作 | 使用 Lua 脚本保证原子性 |
| 过期清理 | 自动清理过期记录 |

### 3.2 限流返回值

| 字段 | 说明 |
|------|------|
| allowed | 是否允许请求 |
| remaining | 剩余请求数 |
| retry_after_seconds | 重试等待秒数 |

---

## 4. API 中间件

### 4.1 限流检查顺序

| 顺序 | 检查项 | 说明 |
|------|--------|------|
| 1 | 全局限流 | 检查全局请求限制 |
| 2 | 用户级限流 | 检查用户请求限制 |
| 3 | 端点级限流 | 检查特定端点限制 |

### 4.2 限流响应

| HTTP 状态码 | 说明 |
|-------------|------|
| 429 | Too Many Requests |
| Retry-After | 重试等待秒数 (Header) |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>API 端点无速率限制</li>
    <li>限流配置写死在代码中 (必须在 PG 配置表中管理)</li>
    <li>限流使用数据库锁而非 Redis (性能不足)</li>
    <li>VIP 用户也受端点限流 (VIP 应有更高限额)</li>
    <li>返回 500 错误而非 429</li>
  </ul>
</div>
