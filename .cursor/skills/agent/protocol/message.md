# Agent_通信协议规范

---

## 1. 核心定位

> Agent 间通过标准消息进行通信，确保消息可追踪、可路由、可审计。

---

## 2. 消息结构

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息唯一 ID (UUID) |
| conversation_id | string | 对话 ID |
| parent_id | string | 父消息 ID (用于追踪) |
| sender | AgentEndpoint | 发送方 |
| receiver | AgentEndpoint | 接收方 |
| type | MessageType | 消息类型 |
| action | string | 具体动作 |
| payload | any | 消息负载 |
| metadata | object | 元信息 (task_id/priority/ttl) |
| security | object | 安全信息 (token/signature) |
| timestamp | object | 时间戳 |

---

## 3. 消息类型

| 类型 | 说明 | 典型场景 |
|------|------|----------|
| REQUEST | 请求消息 | 用户发起任务 |
| RESPONSE | 响应消息 | Agent 返回结果 |
| EVENT | 事件消息 | 状态变更通知 |
| BROADCAST | 广播消息 | 群发通知 |
| HEARTBEAT | 心跳消息 | 健康检查 |
| ERROR | 错误消息 | 异常通知 |

---

## 4. 通信模式

```
点对点通信:
Agent A --REQUEST--> Agent B
Agent A <--RESPONSE-- Agent B

广播通信:
Coordinator --BROADCAST--> [Agent1, Agent2, Agent3]

心跳检测:
Agent A --HEARTBEAT--> Agent B
```

---

## 5. 消息追踪

| 字段 | 说明 |
|------|------|
| parent_id | 父消息 ID |
| correlation_id | 关联 ID (全局) |
| trace_id | 追踪 ID (Zipkin/Jaeger) |

---

## 6. 队列配置

| 队列 | 用途 | 配置 |
|------|------|------|
| `agent.request.{agent_type}` | 请求队列 | 持久化 |
| `agent.response.{task_id}` | 响应队列 | TTL: 300s |
| `agent.event.{event_type}` | 事件队列 | 持久化 |
| `agent.broadcast.{channel}` | 广播队列 | 非持久化 |
| `agent.heartbeat.{agent_id}` | 心跳队列 | TTL: 60s |

---

## 7. 安全规范

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| Token | Bearer Token | 内部通信 |
| mTLS | 双向 TLS | 跨服务 |
| Signature | 消息签名 | 高安全场景 |

---

## 8. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>消息不含 message_id</li>
    <li>消息不含 parent_id (除根消息)</li>
    <li>敏感信息不加密</li>
    <li>不记录消息审计日志</li>
  </ul>
</div>

---

## 9. 快速参考

| 配置项 | 值 |
|--------|-----|
| 消息 TTL | 300s |
| 最大重试 | 3 次 |
| 心跳间隔 | 30s |
| 心跳超时 | 90s |