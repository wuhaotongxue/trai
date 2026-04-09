# Agent_消息路由规范

---

## 1. 核心定位

> 消息路由 = 根据消息特征（action/type/priority）将消息投递给正确的 Agent。

---

## 2. 路由决策流程

```
[收到消息]
     |
     v
+------------------+
|  Parse Action    |  (解析 action)
+------------------+
     |
     v
+------------------+
|  Match Pattern   |  (模式匹配)
+------------------+
     |
     +---> 精确匹配 ---> [直接路由]
     |
     +---> 正则匹配 ---> [模糊路由]
     |
     +---> 广播匹配 ---> [广播路由]
     |
     v
+------------------+
|  Check Perms     |  (权限校验)
+------------------+
     |
     v
+------------------+
|  Deliver         |  (投递消息)
+------------------+
```

---

## 3. 路由规则表

### 3.1 Action 路由规则

| Action Pattern | 路由目标 | 说明 |
|---------------|----------|------|
| `meeting.*` | MeetingAgent | 会议相关 |
| `report.*` | ReportAgent | 报告相关 |
| `chat.*` | ChatAgent | 对话相关 |
| `media.*` | MediaAgent | 媒体相关 |
| `admin.*` | AdminAgent | 管理相关 |
| `search.*` | SearchAgent | 搜索相关 |
| `task.*` | CoordinatorAgent | 任务编排 |

### 3.2 类型路由规则

| MessageType | 路由策略 |
|-------------|----------|
| REQUEST | 点对点路由到目标 Agent |
| RESPONSE | 路由到原始请求的 sender |
| EVENT | 路由到订阅该事件的 Agent |
| BROADCAST | 路由到所有订阅该 channel 的 Agent |
| ERROR | 路由到 Orchestrator 进行处理 |

---

## 4. 路由匹配算法

### 4.1 匹配优先级

```
1. exact match     (完全匹配 action)
2. wildcard match  (* 匹配，如 meeting.*)
3. regex match     (正则匹配)
4. default match   (兜底到 CoordinatorAgent)
```

### 4.2 路由表结构

```typescript
interface RoutingRule {
  pattern: string;         // action 模式
  target_agent: string;   // 目标 Agent ID
  priority: number;        // 优先级
  requires_auth: boolean; // 是否需要认证
  rate_limit?: number;    // 速率限制
}
```

---

## 5. 动态路由配置

| 配置项 | 说明 |
|--------|------|
| `routing.enabled` | 是否启用动态路由 |
| `routing.cache_ttl` | 路由缓存 TTL |
| `routing.fallback_agent` | 兜底 Agent |
| `routing.max_hops` | 最大跳数 |

---

## 6. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>循环路由不检测</li>
    <li>路由表硬编码</li>
    <li>路由失败不重试</li>
  </ul>
</div>

---

## 7. 快速参考

| 配置项 | 值 |
|--------|-----|
| max_hops | 10 |
| cache_ttl | 300s |
| fallback_agent | coordinator |