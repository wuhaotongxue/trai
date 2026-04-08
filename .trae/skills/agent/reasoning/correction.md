# Agent - 纠错机制 (Self-Correction) 规范

---

## 1. 核心概念

纠错是 Agent 自我检测并修正错误的能力。

| 类型 | 说明 | 处理方式 |
|------|------|---------|
| 即时纠错 | 执行前检测 | 返回错误，要求重新输入 |
| 回退纠错 | 执行中检测 | 回退到上一状态，重试或替代 |
| 验证纠错 | 执行后检测 | 修正结果或重新执行 |
| 反思纠错 | 决策后发现 | 反思推理过程，调整策略 |

---

## 2. 错误分类

| 分类 | 说明 | 可自我纠错 |
|------|------|-----------|
| validation | 参数验证错误 | 否 |
| permission | 权限不足 | 否 |
| quota | 配额不足 | 否 |
| rate_limit | 频率限制 | 是 |
| tool_execution | 工具执行失败 | 是 |
| business_logic | 业务逻辑错误 | 部分 |
| external | 外部服务错误 | 是 |
| system | 系统级错误 | 否 |

---

## 3. 纠错策略

| 错误类型 | 推荐策略 | 详细说明 |
|---------|---------|---------|
| 频率限制 | retry_with_backoff | 退避重试: 1s/2s/4s/8s |
| 工具执行失败 | retry → alternative → rollback | 重试 → 替代方案 → 回退 |
| 业务逻辑错误 | rollback | 回退到上一状态 |
| 权限/配额不足 | escalate | 通知用户 |

---

## 4. 纠错状态机

```
detected -> attempting_correction -> resolved (terminal)
                      |
               CORRECTION_FAILED_MAX_RETRIES
                      |
                 rolling_back -> resolved (terminal)
                      |
                 ROLLBACK_FAILED
                      |
                    escalating -> escalated (terminal)
```

### 4.1 状态说明

| 状态 | 说明 |
|------|------|
| detected | 错误检测 |
| attempting_correction | 尝试纠错中 |
| resolved | 纠错成功终止 |
| rolling_back | 回退中 |
| ROLLBACK_FAILED | 回退失败 |
| escalating | 升级中 |
| escalated | 升级终止 |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>错误不分类，遇到错误就重试</li>
    <li>重试无退避策略，导致雪崩</li>
    <li>回退无 checkpoint，无法恢复状态</li>
    <li>纠错失败不通知用户</li>
    <li>权限/配额错误尝试自我纠错</li>
  </ul>
</div>

---

## 6. 快速参考

| 错误类型 | 策略 |
|---------|------|
| rate_limit | retry_with_backoff |
| tool_execution | retry → alternative → rollback |
| business_logic | rollback |
| 其他 | escalate |
