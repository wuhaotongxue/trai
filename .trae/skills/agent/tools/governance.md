# Agent_工具治理规范

---

## 1. 核心原则

> **工具不是裸奔接口，必须成为可治理系统**

---

## 2. 工具注册类型

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识: `meeting.transcription.start` |
| name | string | 工具名称 |
| description | string | 工具描述 |
| category | ToolCategory | 分类 |
| risk_level | RiskLevel | 风险等级 |
| parameters | ToolParameter[] | 参数定义 |
| requires_watermark | boolean | 是否需要水印 |
| watermark_skip_allowed | boolean | 水印跳过是否允许 |
| monthly_quota_check | boolean | 是否检查月度配额 |
| audit_log | boolean | 是否记录审计日志 |
| version | string | 版本号 |

**ToolCategory 类型**：`meeting` | `chat` | `audio` | `video` | `image` | `ai` | `notification` | `system`

**RiskLevel 类型**：`safe` | `monitored` | `requires_approval` | `blocked`

---

## 3. 风险分级

| 等级 | 行为 | 示例 |
|------|------|------|
| safe | 自动执行 | 查询列表 |
| monitored | 自动执行，记录日志 | 发送通知 |
| requires_approval | 等待确认 | 生成纪要 |
| blocked | 直接拒绝 | 删除配置 |

---

## 4. 统一拦截器

| 步骤 | 说明 |
|------|------|
| 1. 参数校验 | 验证所有参数是否符合定义 |
| 2. 风险检查 | blocked 级别直接拒绝 |
| 3. 用户确认 | requires_approval 级别等待用户确认 |
| 4. 角色/配额/限流检查 | RBAC + QuotaService + RateLimiter |
| 5. 审计日志 | 记录工具调用到 AuditLog |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>工具无校验直接执行</li>
    <li>高风险工具无确认流程</li>
    <li>AI 生成内容不配置 watermark/content_review</li>
    <li>工具调用无审计日志</li>
    <li>新增分类但不更新 SKILL.md</li>
  </ul>
</div>

---

## 6. 快速参考

| 风险等级 | 处理方式 |
|---------|---------|
| safe | 自动执行 |
| monitored | 自动执行 + 审计日志 |
| requires_approval | 等待用户确认 |
| blocked | 直接拒绝 |
