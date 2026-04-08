# Agent_反馈与状态规范

---

## 1. 核心原则

> **Agent 之所以能持续做事，是因为它会不断收到反馈**

---

## 2. 反馈类型

| 类型 | 说明 | 模型可消费 |
|------|------|-----------|
| 工具执行结果 | 成功/失败/超时 | 是 |
| 用户显式反馈 | 确认/拒绝/修改 | 是 |
| 用户隐式反馈 | 使用模式/停留时间 | 是 |
| 系统状态反馈 | 配额/限流/错误率 | 是 |
| 思考链反馈 | 推理结果验证 | 是 |

---

## 3. 状态定义

### 3.1 Agent 状态枚举

| 状态 | 说明 |
|------|------|
| IDLE | 空闲等待 |
| REASONING | 推理中 |
| EXECUTING | 执行工具中 |
| WAITING_CONFIRMATION | 等待用户确认 |
| CORRECTING | 纠错中 |
| COMPLETED | 任务完成 |
| FAILED | 任务失败 |

### 3.2 AgentSession 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 会话 ID |
| state | AgentState | 当前状态 |
| current_task | AgentTask | 当前任务 |
| reasoning_chain | ChainOfThought | 思考链 |
| checkpoints | Checkpoint[] | 检查点列表 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 4. 状态转换

```
IDLE -> REASONING -> EXECUTING -> COMPLETED
    |           |           |
    +-> WAITING_CONFIRMATION -> EXECUTING
    |           |
    +-> CORRECTING -> REASONING
    |
    +-> FAILED
```

### 4.1 转换规则

| 从状态 | 到状态 | 触发条件 |
|--------|--------|----------|
| IDLE | REASONING | 接收新任务 |
| REASONING | EXECUTING | 决策完成 |
| EXECUTING | WAITING_CONFIRMATION | 需要用户确认 |
| EXECUTING | CORRECTING | 检测到错误 |
| EXECUTING | COMPLETED | 任务成功完成 |
| CORRECTING | REASONING | 纠错成功 |
| CORRECTING | FAILED | 纠错失败 |
| WAITING_CONFIRMATION | EXECUTING | 用户确认 |
| WAITING_CONFIRMATION | FAILED | 用户拒绝 |

---

## 5. Checkpoint 管理

### 5.1 Checkpoint 管理要求

| 操作 | 说明 |
|------|------|
| save(session) | 保存会话状态到检查点 |
| restore(session_id, checkpoint_id) | 恢复到指定检查点 |
| list_checkpoints(session_id) | 列出所有检查点 |

### 5.2 Checkpoint 触发时机

| 时机 | 说明 |
|------|------|
| 工具执行前 | 保存当前状态 |
| 状态转换前 | 保存转换状态 |
| 纠错前 | 保存纠错前状态 |
| 长时间等待前 | 保存等待状态 |

---

## 6. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Agent 输出不透明</li>
    <li>长任务无 checkpoint</li>
    <li>状态转换无记录</li>
    <li>纠错过程不反馈给模型</li>
  </ul>
</div>
