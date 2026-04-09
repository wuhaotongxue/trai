# Agent_编排器与路由规范

---

## 1. 核心定位

> Orchestrator = 多 Agent 系统的中央调度器，负责任务分解、Agent 路由、结果聚合、异常处理。

---

## 2. 编排器职责

|| 职责 | 说明 |
||------|------|
| **任务分解** | 将复杂任务拆分为子任务树 | 复杂度 >= 5 触发 |
| **Agent 路由** | 根据子任务类型选择目标 Agent | 匹配工具/技能 |
| **并行调度** | 独立子任务并行执行 | 减少等待时间 |
| **结果聚合** | 合并多个 Agent 的输出 | 生成最终响应 |
| **异常处理** | 子任务失败时的补偿策略 | 重试/降级/回滚 |

---

## 3. 任务分解模型

### 3.1 分解流程

```
[User Input]
     |
     v
+------------------+
|  Task Analyzer   |  (复杂度评估)
+------------------+
     |
     +---> 复杂度 < 5 ---> [单 Agent 处理]
     |
     +---> 复杂度 >= 5 ---> [Task Decomposer]
                                   |
                      +------------+------------+
                      |            |            |
                      v            v            v
                 [SubTask1]   [SubTask2]   [SubTask3]
                 (并行执行)    (并行执行)    (并行执行)
                      |            |            |
                      +------------+------------+
                                   |
                                   v
                          [Result Aggregator]
                                   |
                                   v
                              [Final Output]
```

### 3.2 复杂度评估标准

|| 等级 | 分值 | 处理方式 |
||------|------|----------|
| 简单 | 1-2 | 单 Agent 直接处理 |
| 普通 | 3-4 | 单 Agent + 工具链 |
| 复杂 | 5-7 | 编排器 + 2-3 个 Agent |
| 超复杂 | 8-10 | 编排器 + 多层级 Agent 树 |

---

## 4. Agent 路由规则

### 4.1 路由决策矩阵

|| 任务特征 | 路由目标 | 示例 |
||----------|----------|------|
| 会议相关 | MeetingAgent | 会议录制/纪要/分析 |
| 报告生成 | ReportAgent | 周报/月报/Git 分析 |
| 对话相关 | ChatAgent | 翻译/总结/回复 |
| 音视频生成 | MediaAgent | 图像/音频/视频生成 |
| 系统管理 | AdminAgent | 用户/配额/配置 |
| 搜索查询 | SearchAgent | 知识库/RAG 查询 |

### 4.2 路由优先级

```
1. 精确匹配 --> 查找 exact match
2. 模糊匹配 --> 查找相似 intent
3. 默认路由 --> CoordinatorAgent
4. 兜底处理 --> 返回"无法理解"
```

### 4.3 路由上下文传递

```typescript
interface RouteContext {
  task_id: string;           // 任务 ID
  user_id: string;           // 用户 ID
  intent: string;            // 用户意图
  confidence: number;        // 置信度
  priority: TaskPriority;    // 优先级
  deadline?: timestamp;      // 超时时间
  history: string[];        // 历史 Agent IDs
}
```

---

## 5. 并行调度策略

### 5.1 任务依赖图

```
串行依赖 (必须顺序执行)
A --> B --> C

并行独立 (可同时执行)
    +--> B --+
A --|        |---> D
    +--> C --+

混合场景
A --> B --> D
A --> C --> D
```

### 5.2 并行执行配置

|| 配置 | 值 | 说明 |
||------|------|------|
| max_parallel | 5 | 最大并行 Agent 数 |
| timeout_per_agent | 300s | 单个 Agent 超时 |
| retry_count | 2 | 重试次数 |
| retry_backoff | 2s | 重试间隔 |

---

## 6. 结果聚合策略

### 6.1 聚合模式

|| 模式 | 适用场景 | 策略 |
||------|----------|------|
| **顺序合并** | 有前后依赖 | 按执行顺序拼接 |
| **层级汇总** | 有父子关系 | 从子到父逐级汇总 |
| **投票决策** | 多个结果需共识 | 多数/加权 |
| **优先级选择** | 多结果竞争 | 选最高优先级 |

### 6.2 聚合输出格式

```typescript
interface AggregatedResult {
  task_id: string;
  status: "success" | "partial" | "failed";
  summary: string;
  details: SubTaskResult[];
  metadata: {
    total_agents: number;
    total_duration: number;
    failed_count: number;
  };
}
```

---

## 7. 异常处理

### 7.1 异常分类

|| 类型 | 触发条件 | 处理策略 |
||------|----------|----------|
| **Agent 无响应** | 超时 | 重试 -> 降级 -> 跳过 |
| **工具执行失败** | 返回 error | 重试 -> 替换工具 |
| **循环依赖** | 检测到环 | 终止 -> 报告错误 |
| **配额耗尽** | 达到限制 | 排队 -> 通知用户 |

### 7.2 降级策略

```
Level 1: 重试 (2次，间隔 2s)
Level 2: 降级 (换更简单工具)
Level 3: 跳过 (记录缺失，继续)
Level 4: 终止 (报告给用户)
```

---

## 8. 编排器状态机

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  IDLE    │ --> │  PARSING    │ --> │  ROUTING     │
└──────────┘     └─────────────┘     └──────────────┘
                                             |
        ┌────────────────────────────────────+
        |
        v
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  EXECUTING  │ --> │ AGGREGATING │ --> │  COMPLETED   │
└──────────────┘     └─────────────┘     └──────────────┘
        |
        v
┌──────────────┐
│   FAILED     │
└──────────────┘
```

---

## 9. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>无限制递归调用 Agent</li>
    <li>循环依赖不检测</li>
    <li>Agent 超时不处理</li>
    <li>结果聚合丢失子任务信息</li>
    <li>异常不记录审计日志</li>
  </ul>
</div>

---

## 10. 快速参考

| 配置 | 默认值 |
|------|--------|
| max_parallel | 5 |
| timeout_per_agent | 300s |
| retry_count | 2 |
| retry_backoff | 2s |
| complexity_threshold | 5 |