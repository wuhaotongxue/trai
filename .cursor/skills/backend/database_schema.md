# TRAI 数据库表总览

---

## 概述

本文档是 TRAI 后端数据库的完整表清单，每张表、每个字段都有详细注释。
字段级注释必须与 Model 源代码严格一致，每次新增/修改表后同步更新本文档。

---

## 用户与认证

### users（用户表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| user_id | VARCHAR(64) | 用户唯一标识 UUID |
| username | VARCHAR(64) | 用户名，唯一索引 |
| display_name | VARCHAR(128) | 显示名称 |
| email | VARCHAR(255) | 邮箱地址，唯一索引 |
| password_hash | VARCHAR(255) | 密码哈希（argon2） |
| avatar_url | TEXT | 头像 URL |
| role | VARCHAR(32) | 用户角色：admin/vip/normal |
| status | VARCHAR(32) | 状态：active/disabled/pending |
| tenant_id | VARCHAR(64) | 租户 ID（多租户场景） |
| wecom_user_id | VARCHAR(64) | 企业微信用户 ID（SSO） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| deleted_at | TIMESTAMP | 软删除时间（空=未删） |

**说明**：核心用户表，存储所有账户信息，支持软删除。

---

## 对话与消息

### chat_sessions（对话会话表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| session_id | VARCHAR(64) | 会话唯一标识 UUID |
| user_id | VARCHAR(64) | 所属用户 ID |
| title | VARCHAR(255) | 会话标题，可自定义 |
| model | VARCHAR(64) | 使用的 AI 模型名称 |
| messages | JSON | 消息历史 JSON 数组 |
| extra_data | JSON | 扩展数据字段（避免用 metadata） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| deleted_at | TIMESTAMP | 软删除时间（空=未删） |

**说明**：存储 AI 对话会话元数据，包含消息历史 JSON。

### messages（消息表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| session_id | VARCHAR(64) | 关联的会话 ID |
| role | VARCHAR(32) | 消息角色：system/user/assistant |
| content | TEXT | 消息内容 |
| msg_metadata | JSON | 消息扩展元数据 |
| created_at | TIMESTAMP | 创建时间 |

**说明**：AI 对话的单条消息记录，按会话组织。

---

## 配额管理

### quota_plans（配额套餐表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| plan_name | VARCHAR(50) | 套餐名称，唯一 |
| user_role | VARCHAR(20) | 用户角色：admin/vip/normal/guest |
| image_generation_limit | INTEGER | 图片生成配额（0=无限制） |
| audio_synthesis_limit | INTEGER | 语音合成配额（0=无限制） |
| transcription_minutes_limit | INTEGER | 语音转录配额（分钟） |
| meeting_summary_limit | INTEGER | 会议摘要配额 |
| ai_translation_limit | INTEGER | AI 翻译配额 |
| ai_summarization_limit | INTEGER | AI 摘要配额 |
| agent_tool_call_limit | INTEGER | Agent 工具调用配额 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**说明**：定义各角色的月度配额上限，按 user_role 一对一映射。

### user_quota_usage（用户配额使用表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| user_id | VARCHAR(64) | 用户 ID |
| billing_month | VARCHAR(7) | 账单月份 YYYY-MM |
| image_generation_used | INTEGER | 图片生成已用次数 |
| audio_synthesis_used | INTEGER | 语音合成已用次数 |
| transcription_minutes_used | INTEGER | 语音转录已用分钟数 |
| meeting_summary_used | INTEGER | 会议摘要已用次数 |
| ai_translation_used | INTEGER | AI 翻译已用次数 |
| ai_summarization_used | INTEGER | AI 摘要已用次数 |
| agent_tool_call_used | INTEGER | Agent 工具调用已用次数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**说明**：按自然月记录各用户各类型的配额消耗量，user_id + billing_month 唯一。

### quota_transaction_log（配额变动流水表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| user_id | VARCHAR(64) | 用户 ID |
| billing_month | VARCHAR(7) | 账单月份 YYYY-MM |
| transaction_type | VARCHAR(20) | 交易类型：deduct/reset/grant/purchase |
| quota_type | VARCHAR(50) | 配额类型名称 |
| delta | INTEGER | 变动数量（正=增，负=减） |
| balance_before | INTEGER | 变动前余额 |
| balance_after | INTEGER | 变动后余额 |
| tool_id | VARCHAR(100) | 关联工具 ID |
| session_id | VARCHAR(64) | 关联会话 ID |
| trace_id | VARCHAR(64) | 链路追踪 ID |
| created_at | TIMESTAMP | 创建时间 |

**说明**：记录每次配额增减的完整流水，用于审计和对账。

---

## AI 任务

### image_generations（图片生成表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| task_id | VARCHAR(64) | 任务唯一标识 UUID |
| user_id | VARCHAR(64) | 用户 ID |
| prompt | TEXT | 图片生成提示词 |
| negative_prompt | TEXT | 反向提示词 |
| style | VARCHAR(32) | 图片风格 |
| size | VARCHAR(16) | 图片尺寸 |
| status | VARCHAR(32) | 任务状态：pending/processing/completed/failed |
| result_url | TEXT | 生成结果 URL |
| error_message | TEXT | 错误信息 |
| model | VARCHAR(64) | 使用的模型 |
| width | INTEGER | 图片宽度 |
| height | INTEGER | 图片高度 |
| steps | INTEGER | 采样步数 |
| seed | INTEGER | 随机种子（-1=随机） |
| session_id | VARCHAR(64) | 关联会话 ID |
| trace_id | VARCHAR(64) | 链路追踪 ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**说明**：存储 AI 图片生成任务的完整参数和结果。

---

## 文件上传

### upload_tasks（上传任务表）

|| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID |
| task_id | VARCHAR(64) | 任务唯一标识 UUID |
| user_id | VARCHAR(64) | 用户 ID |
| file_name | VARCHAR(255) | 文件名 |
| file_type | VARCHAR(32) | 文件类型：image/video/audio/document |
| file_size | INTEGER | 文件大小（字节） |
| content_type | VARCHAR(64) | MIME 类型 |
| status | VARCHAR(32) | 任务状态：pending/uploading/completed/failed |
| file_url | TEXT | 文件访问 URL |
| error_message | TEXT | 错误信息 |
| session_id | VARCHAR(64) | 关联会话 ID |
| trace_id | VARCHAR(64) | 链路追踪 ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**说明**：文件上传任务记录，支持多种文件类型和上传状态追踪。

---

## 表关系图

```
users (用户)
  ├── chat_sessions (1:N) 对话会话
  │     └── messages (1:N) 消息
  ├── user_quota_usage (1:N) 配额使用（按月）
  │     └── quota_transaction_log (N:1) 配额流水
  ├── quota_plans (N:1) 配额套餐（按角色）
  ├── image_generations (1:N) 图片生成任务
  └── upload_tasks (1:N) 上传任务
```

---

## 必备字段规范

所有表必须包含以下四个时间戳字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 自增主键 ID（BigInt Identity） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| deleted_at | TIMESTAMP | 软删除时间（空=未删） |

---

## 主键规范

| 方案 | 适用场景 | 字段类型 |
|------|----------|----------|
| BigInt Identity | 生产环境推荐 | BIGINT（64 位） |
| UUID | 跨系统唯一 | VARCHAR(64) |

禁止使用 Serial（PostgreSQL 旧式自增）。

---

## 保留字禁止

| 字段名 | 原因 | 替代方案 |
|--------|------|----------|
| metadata | SQLAlchemy Declarative 保留字 | extra_data / msg_metadata |
| query | ORM 查询属性保留字 | - |
| items | 字典式访问保留字 | - |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.1 | 2026-04-13 | 字段与 Model 源码严格对齐，补充所有缺失字段注释 |
| v1.0 | 2026-04-13 | 初版发布，完整表清单和关系图 |