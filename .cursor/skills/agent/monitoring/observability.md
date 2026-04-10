---
name: "agent_observability"
description: "Agent 可观测性规范：OpenTelemetry 集成、Tracing、Metrics、日志规范"
---

# Agent 可观测性规范

> 参考：[Agent Harness 论文 2026](https://mp.weixin.qq.com/s/Ymy252ZBM98nKT1z4AYhMw)
>
> **核心原则**：Agent 问题排查必须从"看聊天记录"升级到"看分布式追踪"。

---

## 1. 必须采集的数据

### 1.1 模型调用追踪

| 字段 | 说明 | 必填 |
|------|------|------|
| `trace_id` | 全局追踪 ID | ✅ |
| `span_id` | 当前调用 ID | ✅ |
| `parent_span_id` | 父调用 ID | ✅ |
| `model_name` | 模型名称 | ✅ |
| `input_tokens` | 输入 Token 数 | ✅ |
| `output_tokens` | 输出 Token 数 | ✅ |
| `total_tokens` | 总 Token 数 | ✅ |
| `latency_ms` | 响应延迟（毫秒） | ✅ |
| `status` | 调用状态（success/error/timeout） | ✅ |
| `error_type` | 错误类型 | 当 status=error 时 |
| `error_message` | 错误信息 | 当 status=error 时 |

### 1.2 工具调用追踪

| 字段 | 说明 | 必填 |
|------|------|------|
| `trace_id` | 关联的追踪 ID | ✅ |
| `tool_name` | 工具名称 | ✅ |
| `tool_input` | 工具输入参数（脱敏后） | ✅ |
| `tool_output` | 工具输出（截断至 500 字符） | ✅ |
| `latency_ms` | 工具执行延迟 | ✅ |
| `status` | 执行状态 | ✅ |
| `risk_level` | 风险等级（low/medium/high） | ✅ |

### 1.3 会话级别统计

| 字段 | 说明 | 必填 |
|------|------|------|
| `session_id` | 会话唯一 ID | ✅ |
| `user_id` | 用户 ID | ✅ |
| `total_tokens` | 本会话消耗的总 Token | ✅ |
| `total_cost` | 本会话总成本 | ✅ |
| `total_latency_ms` | 本会话总延迟 | ✅ |
| `message_count` | 消息数量 | ✅ |
| `retry_count` | 重试次数 | ✅ |
| `error_count` | 错误次数 | ✅ |

### 1.4 策略判定追踪

| 字段 | 说明 | 必填 |
|------|------|------|
| `trace_id` | 关联追踪 ID | ✅ |
| `action` | 申请的动作 | ✅ |
| `decision` | 判定结果（allow/deny/ask） | ✅ |
| `reason` | 判定原因 | ✅ |
| `user_role` | 当前用户角色 | ✅ |
| `budget_left` | 剩余预算 | ✅ |

---

## 2. OpenTelemetry 集成规范

### 2.1 语义约定

使用 OpenTelemetry GenAI 语义约定标准：

```
span.kind = client
gen_ai.system = openai
gen_ai.operation.name = chat
gen_ai.request.model = gpt-4o
gen_ai.response.model = gpt-4o
gen_ai.request.temperature = 0.7
gen_ai.request.max_tokens = 4096
gen_ai.usage.input_tokens = 150
gen_ai.usage.output_tokens = 300
gen_ai.usage.total_tokens = 450
```

### 2.2 Agent Spans 约定

```
span.name = /api/ai/chat
span.kind = server
trai.agent.session_id = uuid
trai.agent.user_id = uuid
trai.agent.role = admin
trai.agent.tools_count = 5
trai.agent.policy_decisions = [allow, allow, ask]
```

### 2.3 推荐集成方案

| 方案 | 适用场景 | 特点 |
|------|---------|------|
| **Langfuse** | 通用 LLM 工程平台 | tracing + metrics + evals + prompt 管理 |
| **Phoenix** | 研究与工程混合 | OpenTelemetry-based + 回放 + 实验 |
| **OpenLIT** | 云原生团队 | OpenTelemetry-native + GPU 监控 + Guardrails |

---

## 3. 日志规范

### 3.1 日志级别

| 级别 | 使用场景 |
|------|---------|
| DEBUG | 工具输入输出详情、推理过程 |
| INFO | 正常流程：会话创建、消息发送、工具调用成功 |
| WARNING | 可恢复错误：重试、超时、配额警告 |
| ERROR | 不可恢复错误：认证失败、工具执行失败 |
| CRITICAL | 系统级错误：数据库宕机、AI 服务不可用 |

### 3.2 日志格式

```json
{
  "timestamp": "2026-04-10T08:30:00.000Z",
  "level": "INFO",
  "trace_id": "abc123",
  "span_id": "def456",
  "session_id": "session_uuid",
  "user_id": "user_uuid",
  "action": "ai.chat",
  "model": "gpt-4o",
  "latency_ms": 1234,
  "tokens": {"input": 150, "output": 300},
  "status": "success",
  "message": "AI chat completed"
}
```

### 3.3 禁止事项

- ❌ 禁止在日志中记录用户密码、API 密钥、Token
- ❌ 禁止在日志中记录完整的文件上传内容
- ❌ 禁止在日志中记录未经脱敏的个人信息
- ❌ 禁止日志无 trace_id 关联（无法追踪请求链路）

---

## 4. Metrics 规范

### 4.1 必填指标

| 指标名称 | 类型 | 说明 |
|---------|------|------|
| `trai_agent_requests_total` | Counter | Agent 请求总数（按 status 标签） |
| `trai_agent_request_duration_seconds` | Histogram | 请求延迟分布 |
| `trai_agent_tokens_total` | Counter | Token 消耗总量（按 model 标签） |
| `trai_agent_cost_total` | Counter | 成本消耗总量 |
| `trai_agent_errors_total` | Counter | 错误总数（按 error_type 标签） |
| `trai_agent_tools_calls_total` | Counter | 工具调用总数（按 tool_name 标签） |
| `trai_agent_policy_decisions_total` | Counter | 策略判定总数（按 decision 标签） |

### 4.2 Prometheus 格式示例

```prometheus
# HELP trai_agent_tokens_total Token消耗总量
# TYPE trai_agent_tokens_total counter
trai_agent_tokens_total{model="gpt-4o"} 1234567

# HELP trai_agent_request_duration_seconds 请求延迟分布
# TYPE trai_agent_request_duration_seconds histogram
trai_agent_request_duration_seconds_bucket{le="0.5"} 100
trai_agent_request_duration_seconds_bucket{le="1.0"} 200
trai_agent_request_duration_seconds_bucket{le="2.0"} 300
```

---

## 5. 评测与回放

### 5.1 基准任务集

建立 20-50 个最典型任务的固定测试集：
- 输入固定、环境固定、工具版本固定
- 记录每次执行的 trace_id 和结果
- 用于版本回归对比

### 5.2 评测指标

| 指标 | 说明 |
|------|------|
| 成功率 | 任务完成比例 |
| 平均延迟 | P50 / P90 / P99 |
| Token 效率 | 输出 Token / 总 Token |
| 成本效率 | 成本 / 有用输出 |
| 失败归因 | 按错误类型分类统计 |

### 5.3 回归验证

每次模型升级或提示词变更后：
1. 在基准任务集上重新运行
2. 对比成功率、延迟、成本变化
3. 生成回归报告
4. 变化超过阈值则阻止上线

---

## 6. 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2026-04-10 | 初版发布 |
