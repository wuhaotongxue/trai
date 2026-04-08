# Agent_月度配额管理规范

---

## 1. 核心原则

> **配额必须在 DB 层强制约束，非提示词层**

| 原则 | 说明 |
|------|------|
| DB 层约束 | 配额必须在数据库层强制约束 |
| VIP 无限 | VIP 用户不受配额限制，但需记录审计日志 |
| 月度重置 | 配额重置周期为自然月 |
| 直接拒绝 | 配额耗尽后直接拒绝操作 |

---

## 2. PostgreSQL 表设计

### 2.1 quota_plans 表 (配额套餐表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| plan_name | VARCHAR(50) | 套餐名称 |
| user_role | VARCHAR(20) | 用户角色 (唯一) |
| image_generation_limit | INT | 图片生成限制 |
| audio_synthesis_limit | INT | 语音合成限制 |
| transcription_minutes_limit | INT | 转录分钟数限制 |
| meeting_summary_limit | INT | 会议摘要限制 |
| ai_translation_limit | INT | AI 翻译限制 |
| ai_summarization_limit | INT | AI 摘要限制 |

### 2.2 默认套餐

| 角色 | 图片生成 | 语音合成 | 转录(分钟) | 会议摘要 | AI翻译 | AI摘要 |
|------|----------|----------|-----------|---------|--------|--------|
| Guest | 5 | 10 | 30 | 2 | 20 | 10 |
| User | 50 | 100 | 300 | 20 | 200 | 100 |
| VIP | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) |
| Admin | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) | 0 (无限制) |

### 2.3 user_quota_usage 表 (用户配额使用表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| billing_month | VARCHAR(7) | 账单月份 (YYYY-MM) |
| image_generation_used | INT | 图片生成已用 |
| audio_synthesis_used | INT | 语音合成已用 |

### 2.4 quota_transaction_log 表 (配额变动流水表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| billing_month | VARCHAR(7) | 账单月份 |
| transaction_type | ENUM | 交易类型: deduct/reset/grant/purchase |
| quota_type | VARCHAR(50) | 配额类型 |
| delta | INT | 变动数量 |
| balance_before | INT | 变动前余额 |
| balance_after | INT | 变动后余额 |
| tool_id | VARCHAR(100) | 工具 ID |
| created_at | TIMESTAMPTZ | 创建时间 |

---

## 3. 工具配额绑定

| 工具 ID | 配额类型 | User 限制/月 | VIP |
|---------|---------|------------|-----|
| image.generate | image_generation | 50 | 无限 |
| audio.synthesize | audio_synthesis | 100 | 无限 |
| audio.transcribe | transcription_minutes | 300 分钟 | 无限 |
| meeting.summary.generate | meeting_summary | 20 | 无限 |
| chat.message.translate | ai_translation | 200 | 无限 |
| chat.message.summarize | ai_summarization | 100 | 无限 |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>配额检查写在业务代码中 (必须在 QuotaService 统一入口)</li>
    <li>配额表字段无注释</li>
    <li>配额扣减不记录 transaction_log</li>
    <li>VIP 用户扣减配额 (VIP 不扣减，需记录审计日志)</li>
    <li>配额超限后降级服务 (必须直接拒绝)</li>
  </ul>
</div>
