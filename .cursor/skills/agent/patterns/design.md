# Agent - 设计模式规范

---

## 1. 单 Agent 模式 (Simple Agent)

适用于：单一任务、确定性流程。

```
[User Input] --> [Context Assembler] --> [LLM] --> [Tool Executor] --> [Output]
                                    |
                              [Rules Engine]
                                    |
                              [Audit Service]
```

### 1.1 组件职责

| 组件 | 说明 |
|------|------|
| Context Assembler | 组装上下文信息 |
| LLM | 大语言模型推理 |
| Tool Executor | 执行工具 |
| Rules Engine | 规则校验 |
| Audit Service | 审计日志 |

---

## 2. 多 Agent 协作模式

适用于：复杂任务、多角色协作。

```
[User Input]
     |
     +---> [Coordinator Agent] ---> [Specialist Agent A]
                |                        |
                |                        v
                |                  [Specialist Agent B]
                |                        |
                +------------------------+
                           |
                      [Output]
```

### 2.1 组件职责

| 组件 | 说明 |
|------|------|
| Coordinator Agent | 协调者，负责任务分解和调度 |
| Specialist Agent A | 专业 Agent A |
| Specialist Agent B | 专业 Agent B |

---

## 3. Agent 核心循环

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Loop                            │
├─────────────────────────────────────────────────────────┤
│  1. 思考链推理 ──> 2. 决策选择 ──> 3. 执行工具         │
│         │              │                │               │
│         v              v                v               │
│  context.reasoning   action         result              │
│  _chain = chain      selected       obtained            │
│                                                         │
│  4. 纠错检查 ──> 5. 状态更新                            │
│         │              │                                │
│         v              v                                │
│  correction         context                             │
│  detected           update(result)                      │
└─────────────────────────────────────────────────────────┘
```

### 3.1 循环步骤

| 步骤 | 说明 |
|------|------|
| 1. 思考链推理 | 使用 ReasoningEngine 生成推理链 |
| 2. 决策选择 | 使用 DecisionEngine 选择动作 |
| 3. 执行工具 | 使用 ToolExecutor 执行工具 |
| 4. 纠错检查 | 使用 CorrectionEngine 检测错误 |
| 5. 状态更新 | 更新上下文和会话状态 |

---

## 4. 状态持久化

### 4.1 AgentSession 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 会话 ID |
| user_id | string | 用户 ID |
| task_id | string | 任务 ID |
| state | AgentState | 状态 |
| checkpoints | Checkpoint[] | 检查点列表 |
| reasoning_chain | ChainOfThought | 思考链 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>长任务无 checkpoint</li>
    <li>Agent 输出不透明</li>
    <li>决策无思考链记录</li>
    <li>状态不持久化</li>
  </ul>
</div>
