# Agent - 通知与告警规范

---

## 1. 告警级别

| 级别 | 说明 | 通知方式 |
|------|------|---------|
| critical | 立即处理 | 短信 + 邮件 + 钉钉 |
| warning | 尽快处理 | 邮件 + 钉钉 |
| info | 记录观察 | 日志 |

---

## 2. 告警规则

| 规则 | 条件 | 级别 |
|------|------|------|
| Agent 崩溃 | 服务不可用 | critical |
| 错误率飙升 | error_rate > 5% | critical |
| 延迟过高 | avg_latency > 2000ms | warning |
| 纠错失败 | self_correction_rate < 60% | warning |
| 配额耗尽 | quota_usage > 90% | warning |

---

## 3. 通知渠道

| 级别 | 短信 | 邮件 | 钉钉 | 日志 |
|------|------|------|------|------|
| critical | 是 | 是 | 是 | 是 |
| warning | - | 是 | 是 | 是 |
| info | - | - | - | 是 |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>critical 告警无短信通知</li>
    <li>告警无记录，无法追溯</li>
    <li>告警风暴 (同问题重复通知)</li>
  </ul>
</div>
