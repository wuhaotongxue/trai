# Agent - 监控指标规范

---

## 1. 核心指标

| 类别 | 指标 | 说明 |
|------|------|------|
| 性能 | avg_latency_ms | 平均响应延迟 |
| 性能 | p99_latency_ms | P99 响应延迟 |
| 可用性 | uptime_ratio | 服务可用率 |
| 错误 | error_rate | 错误率 |
| 纠错 | correction_rate | 纠错率 |
| 纠错 | self_correction_success_rate | 自纠错成功率 |

---

## 2. Agent 特定指标

### 2.1 执行指标

| 指标 | 说明 |
|------|------|
| total_executions | 总执行次数 |
| successful_executions | 成功执行次数 |
| failed_executions | 失败执行次数 |

### 2.2 思考链指标

| 指标 | 说明 |
|------|------|
| reasoning_chains_enabled | 启用的思考链数量 |
| avg_reasoning_steps | 平均推理步数 |

### 2.3 纠错指标

| 指标 | 说明 |
|------|------|
| corrections_triggered | 触发的纠错次数 |
| self_corrections_success | 自我纠错成功次数 |
| escalations | 升级次数 |
| avg_recovery_time_ms | 平均恢复时间 |

---

## 3. 告警阈值

| 指标 | 阈值 | 严重程度 |
|------|------|---------|
| error_rate | > 5% | critical |
| avg_latency_ms | > 2000ms | warning |
| self_correction_rate | < 60% | warning |
| uptime_ratio | < 99.5% | critical |

---

## 4. PostgreSQL 表设计

### 4.1 agent_metrics 表

| 字段 | 类型 | 说明 |
|------|------|------|
| agent_id | VARCHAR(100) | Agent ID |
| metric_name | VARCHAR(50) | 指标名称 |
| metric_value | FLOAT | 指标值 |
| timestamp | TIMESTAMPTZ | 时间戳 |

### 4.2 索引

| 索引 | 字段 |
|------|------|
| idx_metrics_agent | agent_id, timestamp |
| idx_metrics_name | metric_name, timestamp |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>无监控指标，无法评估 Agent 性能</li>
    <li>纠错成功率低于阈值不告警</li>
    <li>延迟异常不告警</li>
  </ul>
</div>
