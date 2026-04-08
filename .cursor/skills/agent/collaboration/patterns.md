# Agent_多Agent协作模式详解

---

## 1. 协作模式分类

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **串行协作** | Agent 顺序执行，一个完成另一个接手 | 有前后依赖的任务 |
| **并行协作** | 多个 Agent 同时工作，结果合并 | 独立子任务 |
| **层次协作** | 多个 Agent 形成层次结构 | 复杂任务分解 |
| **混合协作** | 串行 + 并行组合 | 复杂业务场景 |

---

## 2. 串行协作模式

### 2.1 模式图

```
[User] --> [Agent A] --> [Agent B] --> [Agent C] --> [Result]
              |              |              |
           output          output         output
           作为输入        作为输入       作为输入
```

### 2.2 适用场景

| 场景 | Agent A | Agent B | Agent C |
|------|---------|---------|---------|
| 会议纪要 | 转录 | 分析 | 摘要 |
| 报告生成 | 数据收集 | 内容撰写 | 审核发布 |
| 内容翻译 | 原文识别 | 翻译 | 校对 |

### 2.3 上下文传递

```typescript
// Agent A 输出作为 Agent B 输入
interface SerialContext {
  previous_agent_id: string;
  previous_result: any;
  accumulated_context: {
    steps_completed: string[];
    key_findings: string[];
    pending_tasks: string[];
  };
}
```

---

## 3. 并行协作模式

### 3.1 模式图

```
                 [User]
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
   [Agent A]   [Agent B]   [Agent C]
        |           |           |
        +-----------+-----------+
                    |
                    v
            [Result Aggregator]
                    |
                    v
               [Final Result]
```

### 3.2 适用场景

| 场景 | Agent A | Agent B | Agent C |
|------|---------|---------|---------|
| 会议多维度分析 | 转录 | 说话人分离 | 情感分析 |
| 报告多数据源 | Git 统计 | 日志分析 | 指标收集 |
| 内容多语言翻译 | 中文 | 英文 | 日文 |

### 3.3 结果聚合配置

| 配置 | 值 | 说明 |
|------|-----|------|
| `wait_all` | true | 等待所有 Agent 完成 |
| `partial_threshold` | 0.5 | 部分成功阈值 |
| `timeout` | 300s | 等待超时 |
| `merge_strategy` | priority | 合并策略 |

---

## 4. 层次协作模式

### 4.1 模式图

```
                    [Orchestrator]
                          |
            +-------------+-------------+
            |                           |
            v                           v
     [MeetingAgent]            [ReportAgent]
            |                           |
     +------+------+               +-----+-----+
     |             |               |           |
     v             v               v           v
[Transcribe]  [Summarize]    [GitAnalyzer] [Writer]
```

### 4.2 职责分层

| 层级 | Agent | 职责 |
|------|-------|------|
| L1 | Orchestrator | 任务分解、路由协调 |
| L2 | DomainAgent | 领域专家 (Meeting/Report/Chat) |
| L3 | SkillAgent | 技能执行 (Transcribe/Summarize/Write) |

---

## 5. 协作通信机制

### 5.1 消息类型

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| `TASK_ASSIGN` | 任务分配 | Coordinator -> Agent |
| `TASK_RESULT` | 任务结果 | Agent -> Coordinator |
| `CONTEXT_UPDATE` | 上下文更新 | Agent -> Agent |
| `STATUS_REPORT` | 状态报告 | Agent -> Monitor |
| `ERROR_NOTIFY` | 错误通知 | Agent -> Coordinator |

### 5.2 共享上下文

| 存储 | 说明 | 适用场景 |
|------|------|----------|
| **内存共享** | Redis/Memcached | 实时数据、低延迟 |
| **数据库** | PostgreSQL | 持久化、长周期 |
| **消息队列** | RabbitMQ/Kafka | 事件驱动、解耦 |

---

## 6. 依赖管理

### 6.1 依赖类型

| 类型 | 说明 | 处理方式 |
|------|------|----------|
| **数据依赖** | A 的输出是 B 的输入 | 等待 A 完成 |
| **状态依赖** | A 执行后 B 才能执行 | 状态同步 |
| **资源依赖** | 需要特定资源才能执行 | 资源排队 |

### 6.2 依赖图表示

```json
{
  "task_id": "report-generation",
  "dependencies": [
    {
      "from": "git-analyzer",
      "to": "writer",
      "type": "data",
      "required": true
    },
    {
      "from": "metrics-collector",
      "to": "writer",
      "type": "data",
      "required": true
    }
  ]
}
```

---

## 7. 冲突处理

### 7.1 冲突类型

| 类型 | 说明 | 处理策略 |
|------|------|----------|
| **结果冲突** | 多个 Agent 结果不一致 | 投票/仲裁/优先级 |
| **资源冲突** | 多个 Agent 争抢资源 | 锁机制/排队 |
| **状态冲突** | Agent 状态不一致 | 状态同步/重置 |

### 7.2 冲突解决策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **Last-Write-Wins** | 以最后结果为准 | 简单场景 |
| **Voting** | 多数投票决定 | 结果比较 |
| **Priority** | 高优先级覆盖 | 有主 Agent |
| **Manual** | 人工介入 | 关键决策 |

---

## 8. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Agent 间直接传递敏感数据</li>
    <li>循环依赖不检测</li>
    <li>并行任务无限等待</li>
    <li>冲突结果不记录</li>
  </ul>
</div>

---

## 9. 快速参考

| 配置 | 值 |
|------|-----|
| 最大并行 Agent | 5 |
| 依赖等待超时 | 60s |
| 结果聚合超时 | 300s |
| 冲突解决策略 | priority |