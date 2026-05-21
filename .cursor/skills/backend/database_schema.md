# TRAI 数据库表总览

---

## 概述

本文档是 TRAI 后端数据库的完整表清单，每张表、每个字段都有详细注释。
字段级注释必须与 Model 源代码严格一致，每次新增/修改表后同步更新本文档。
**所有表和字段必须以 `t_` 开头，防止与 SQL 关键字冲突。**

---

## 表清单

### t_users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_user_id | VARCHAR(64) | 用户唯一标识 UUID |
| t_username | VARCHAR(64) | 用户名，唯一索引 |
| t_display_name | VARCHAR(128) | 显示名称 |
| t_email | VARCHAR(255) | 邮箱地址，唯一索引 |
| t_password_hash | VARCHAR(255) | 密码哈希（argon2） |
| t_avatar_url | TEXT | 头像 URL |
| t_role | VARCHAR(32) | 用户角色：admin/vip/normal |
| t_status | VARCHAR(32) | 状态：active/disabled/pending |
| t_tenant_id | VARCHAR(64) | 租户 ID（多租户场景） |
| t_wecom_user_id | VARCHAR(64) | 企业微信用户 ID（SSO） |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |
| t_deleted_at | TIMESTAMP | 软删除时间（空=未删） |
| t_deleted_by | VARCHAR(64) | 删除操作人 user_id |

**说明**：核心用户表，存储所有账户信息，支持软删除和审计追踪。

---

### t_chat_sessions（对话会话表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_session_id | VARCHAR(64) | 会话唯一标识 UUID |
| t_user_id | VARCHAR(64) | 用户 ID |
| t_title | VARCHAR(255) | 会话标题 |
| t_model | VARCHAR(64) | 使用的 AI 模型名称 |
| t_messages | JSON | 消息历史 JSON 数组 |
| t_extra_data | JSON | 扩展数据字段 |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |
| t_deleted_at | TIMESTAMP | 软删除时间（空=未删） |
| t_deleted_by | VARCHAR(64) | 删除操作人 user_id |

**说明**：存储 AI 对话会话元数据，包含消息历史 JSON。

---

### t_messages（消息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_session_id | VARCHAR(64) | 关联的会话 session_id |
| t_role | VARCHAR(32) | 消息角色：system/user/assistant |
| t_content | TEXT | 消息内容 |
| t_msg_metadata | JSON | 消息扩展元数据 |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |

**说明**：AI 对话的单条消息记录，按会话组织。

---

### t_quota_plans（配额套餐表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_plan_name | VARCHAR(50) | 套餐名称，唯一 |
| t_user_role | VARCHAR(20) | 用户角色：admin/vip/normal/guest |
| t_image_generation_limit | INTEGER | 图片生成配额（0=无限制） |
| t_audio_synthesis_limit | INTEGER | 语音合成配额（0=无限制） |
| t_transcription_minutes_limit | INTEGER | 语音转录配额（分钟） |
| t_meeting_summary_limit | INTEGER | 会议摘要配额 |
| t_ai_translation_limit | INTEGER | AI 翻译配额 |
| t_ai_summarization_limit | INTEGER | AI 摘要配额 |
| t_agent_tool_call_limit | INTEGER | Agent 工具调用配额（0=无限制） |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |

**说明**：定义各角色的月度配额上限，按 user_role 一对一映射。

---

### t_user_quota_usage（用户配额使用表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_user_id | VARCHAR(64) | 用户 ID |
| t_billing_month | VARCHAR(7) | 账单月份 YYYY-MM |
| t_image_generation_used | INTEGER | 图片生成已用次数 |
| t_audio_synthesis_used | INTEGER | 语音合成已用次数 |
| t_transcription_minutes_used | INTEGER | 语音转录已用分钟数 |
| t_meeting_summary_used | INTEGER | 会议摘要已用次数 |
| t_ai_translation_used | INTEGER | AI 翻译已用次数 |
| t_ai_summarization_used | INTEGER | AI 摘要已用次数 |
| t_agent_tool_call_used | INTEGER | Agent 工具调用已用次数 |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |

**说明**：按自然月记录各用户各类型的配额消耗量，user_id + billing_month 唯一。

---

### t_quota_transaction_log（配额变动流水表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_user_id | VARCHAR(64) | 用户 ID |
| t_billing_month | VARCHAR(7) | 账单月份 YYYY-MM |
| t_transaction_type | VARCHAR(20) | 交易类型：deduct/reset/grant/purchase |
| t_quota_type | VARCHAR(50) | 配额类型 |
| t_delta | INTEGER | 变动数量（正=增，负=减） |
| t_balance_before | INTEGER | 变动前余额 |
| t_balance_after | INTEGER | 变动后余额 |
| t_tool_id | VARCHAR(100) | 关联工具 ID |
| t_session_id | VARCHAR(64) | 关联会话 session_id |
| t_trace_id | VARCHAR(64) | 链路追踪 ID |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |

**说明**：记录每次配额增减的完整流水，用于审计和对账。

---

### t_image_records（AI 图片记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_task_id | VARCHAR(64) | 任务唯一标识 UUID，唯一索引 |
| t_record_type | VARCHAR(32) | 记录类型：text_to_image / image_to_image / image_edit |
| t_user_id | VARCHAR(64) | 用户 ID（游客为空字符串） |
| t_username | VARCHAR(100) | 用户名/昵称 |
| t_client_ip | VARCHAR(50) | 客户端 IP 地址，索引 |
| t_request_ip | VARCHAR(50) | 请求来源 IP（可能与 client_ip 不同） |
| t_user_agent | VARCHAR(500) | 浏览器 User-Agent |
| t_is_guest | BOOLEAN | 是否为游客 |
| t_tenant_id | VARCHAR(64) | 租户 ID |
| t_prompt | TEXT | 图片生成/编辑提示词 |
| t_source_image_url | TEXT | 源图片 URL（图生图/图片编辑） |
| t_result_url | TEXT | 结果图片 S3 URL |
| t_result_base64 | TEXT | 结果图片 base64（临时，存入 S3 后清空） |
| t_status | VARCHAR(32) | 任务状态：pending / processing / completed / failed |
| t_error_message | TEXT | 错误信息 |
| t_model | VARCHAR(64) | 使用的模型 |
| t_width | INTEGER | 图片宽度 |
| t_height | INTEGER | 图片高度 |
| t_steps | INTEGER | 采样步数 |
| t_seed | INTEGER | 随机种子（-1=随机） |
| t_session_id | VARCHAR(64) | 关联会话 session_id |
| t_trace_id | VARCHAR(64) | 链路追踪 ID |
| t_feishu_notified | BOOLEAN | 是否已发送飞书通知 |
| t_notify_status | VARCHAR(20) | 通知状态：pending / success / failed |
| t_extra_data | JSON | 扩展数据字段 |
| t_created_at | TIMESTAMP | 创建时间，索引 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |
| t_completed_at | TIMESTAMP | 任务完成时间 |
| t_deleted_at | TIMESTAMP | 软删除时间（空=未删） |
| t_deleted_by | VARCHAR(64) | 删除操作人 user_id |
| t_deleted_ip | VARCHAR(50) | 删除时的客户端 IP 地址 |

**说明**：统一存储文生图、图生图、图片编辑三种类型任务的完整信息，支持追溯：请求 IP、登录用户/游客、操作人、任务参数、结果 URL、通知状态。

---

### t_image_generations（图片生成表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_task_id | VARCHAR(64) | 任务唯一标识 UUID |
| t_user_id | VARCHAR(64) | 用户 ID |
| t_prompt | TEXT | 图片生成提示词 |
| t_negative_prompt | TEXT | 反向提示词 |
| t_style | VARCHAR(32) | 图片风格 |
| t_size | VARCHAR(16) | 图片尺寸 |
| t_status | VARCHAR(32) | 任务状态：pending/processing/completed/failed |
| t_result_url | TEXT | 生成结果 URL |
| t_error_message | TEXT | 错误信息 |
| t_model | VARCHAR(64) | 使用的模型 |
| t_width | INTEGER | 图片宽度 |
| t_height | INTEGER | 图片高度 |
| t_steps | INTEGER | 采样步数 |
| t_seed | INTEGER | 随机种子（-1=随机） |
| t_session_id | VARCHAR(64) | 关联会话 session_id |
| t_trace_id | VARCHAR(64) | 链路追踪 ID |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |

**说明**：存储 AI 图片生成任务的完整参数和结果。

---

### t_upload_tasks（上传任务表）

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID |
| t_task_id | VARCHAR(64) | 任务唯一标识 UUID |
| t_user_id | VARCHAR(64) | 用户 ID |
| t_file_name | VARCHAR(255) | 文件名 |
| t_file_type | VARCHAR(32) | 文件类型：image/video/audio/document |
| t_file_size | INTEGER | 文件大小（字节） |
| t_content_type | VARCHAR(64) | MIME 类型 |
| t_status | VARCHAR(32) | 任务状态：pending/uploading/completed/failed |
| t_file_url | TEXT | 文件访问 URL |
| t_error_message | TEXT | 错误信息 |
| t_session_id | VARCHAR(64) | 关联会话 session_id |
| t_trace_id | VARCHAR(64) | 链路追踪 ID |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |

**说明**：文件上传任务记录，支持多种文件类型和上传状态追踪。

---

## 表关系图

```
t_users (用户)
  ├── t_chat_sessions (1:N) 对话会话
  │     └── t_messages (1:N) 消息
  ├── t_user_quota_usage (1:N) 配额使用（按月）
  │     └── t_quota_transaction_log (N:1) 配额流水
  ├── t_quota_plans (N:1) 配额套餐（按角色）
  ├── t_image_generations (1:N) 图片生成任务
  ├── t_image_records (1:N) AI 图片记录（统一记录，含图片编辑）
  └── t_upload_tasks (1:N) 上传任务
```

---

## 必备字段规范

所有表必须包含以下审计字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| t_id | BIGINT | 自增主键 ID（BigInt Identity） |
| t_created_at | TIMESTAMP | 创建时间 |
| t_created_by | VARCHAR(64) | 创建人 user_id |
| t_updated_at | TIMESTAMP | 更新时间 |
| t_updated_by | VARCHAR(64) | 最后修改人 user_id |
| t_deleted_at | TIMESTAMP | 软删除时间（空=未删） |
| t_deleted_by | VARCHAR(64) | 删除操作人 user_id |

---

## 主键规范

| 方案 | 适用场景 | 字段类型 |
|------|----------|----------|
| BigInt Identity | 生产环境推荐 | BIGINT（64 位） |
| UUID | 跨系统唯一 | VARCHAR(64) |

禁止使用 Serial（PostgreSQL 旧式自增）。

---

## 软删除规范

**必须使用软删除**，禁止物理删除数据：

| 字段 | 类型 | 说明 |
|------|------|------|
| t_deleted_at | TIMESTAMP | 软删除时间（NULL=未删除，时间戳=已删除） |
| t_deleted_by | VARCHAR(64) | 删除操作人 user_id |

**查询已删除数据**：`WHERE t_deleted_at IS NOT NULL`
**查询未删除数据**：`WHERE t_deleted_at IS NULL`
**软删除恢复**：`UPDATE SET t_deleted_at = NULL, t_deleted_by = NULL`

---

## 保留字禁止

| 字段名 | 原因 | 替代方案 |
|--------|------|----------|
| t_metadata | SQLAlchemy Declarative 保留字 | t_extra_data / t_msg_metadata |
| t_query | ORM 查询属性保留字 | - |
| t_items | 字典式访问保留字 | - |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v2.3 | 2026-05-20 | 新增 t_image_records 表，统一存储文生图/图生图/图片编辑记录，含 IP 追溯、游客标识、飞书通知状态 |
| v2.2 | 2026-04-13 | 补充完整表说明、软删除规范、主键规范、保留字禁止 |
| v2.1 | 2026-04-13 | 所有字段改用 t_ 前缀，与表名前缀保持一致 |
| v2.0 | 2026-04-13 | 所有表改用 t_ 前缀，新增 created_by/updated_by/deleted_by 审计字段 |
| v1.1 | 2026-04-13 | 字段与 Model 源码严格对齐，补充所有缺失字段注释 |
| v1.0 | 2026-04-13 | 初版发布，完整表清单和关系图 |
