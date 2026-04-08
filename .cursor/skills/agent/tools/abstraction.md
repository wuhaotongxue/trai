# Agent - 工具抽象层规范

---

## 1. 核心原则

> **工具类必须与业务逻辑解耦，任何工具的修改不应影响整体系统**

---

## 2. 三层架构

```
[Business Logic (Agent/Service)]
           |
           v
[  Tool Interface (统一抽象层)  ]
           |
    +-----+-----+-----+
    v     v     v     v
[Backend] [Frontend] [Client]
    |        |         |
    v        v         v
[Python] [Next.js]  [PyQt6]
```

---

## 3. 统一工具接口

| 接口 | 说明 |
|------|------|
| `execute(toolId, params, context)` | 执行工具 |
| `getCapabilities()` | 获取工具能力列表 |
| `checkAvailability()` | 检查工具可用性 |
| `healthCheck()` | 健康检查 |

**ExecutionContext 必需字段**：

| 字段 | 说明 |
|------|------|
| user_id | 用户 ID |
| user_role | 用户角色 |
| session_id | 会话 ID |
| meeting_id | 会议 ID (可选) |

---

## 4. 统一工具注册表 (Registry)

| 方法 | 说明 |
|------|------|
| `register(tool)` | 注册工具定义 |
| `registerAdapter(toolId, adapter)` | 注册适配器 |
| `getTool(toolId)` | 获取工具定义 |
| `getAdapter(toolId)` | 获取适配器 |
| `getToolsByCategory(category)` | 按分类获取工具 |

---

## 5. 三端 Adapter 接口

| 字段 | 说明 |
|------|------|
| tool_id | 工具 ID |
| platform | 平台: `backend` \| `frontend` \| `client` |
| execute(params, context) | 执行工具 |
| checkAvailability() | 检查可用性 |
| healthCheck() | 健康检查 |

---

## 6. 扩展步骤

| 步骤 | 操作 |
|------|------|
| 1 | 在 `UnifiedToolDefinition` 中定义工具接口 |
| 2 | 在 `ToolRegistry` 中注册工具定义 |
| 3 | 在 backend/frontend/client 三端实现 Adapter |
| 4 | 在 RBAC 中注册权限 |
| 5 | 在 AuditLog 中配置审计事件 |

---

## 7. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>业务层直接调用工具实现类 (必须通过 Registry + Adapter)</li>
    <li>工具代码中硬编码权限检查 (必须在 RBAC 层统一处理)</li>
    <li>新增工具不注册到 Registry</li>
    <li>仅在一端实现 Adapter (三端必须全部实现)</li>
  </ul>
</div>
