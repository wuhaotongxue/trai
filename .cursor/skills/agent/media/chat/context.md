# Chat_上下文模板

---

## 1. 对话上下文结构

### 1.1 ChatContext 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| chat_session | object | L2: 对话会话状态 |
| recent_messages | Message[] | L3: 历史消息 (可选) |
| ai_analysis | object | L4: AI 分析结果 (可选) |

### 1.2 chat_session 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| conversation_id | string | 会话 ID |
| type | string | 会话类型: direct/group |
| participant_count | number | 参与者数量 |
| is_muted | boolean | 是否被禁言 |

### 1.3 ai_analysis 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| translation | TranslationResult | 翻译结果 (可选) |
| summarization | SummarizationResult | 摘要结果 (可选) |
| reply_suggestions | ReplySuggestionResult[] | 回复建议 (可选) |
| moderation | ModerationResult | 审核结果 (可选) |

### 1.4 Message 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| message_id | string | 消息 ID |
| sender_id | string | 发送者 ID |
| content | string | 消息内容 |
| timestamp | string | 时间戳 |
| is_ai_generated | boolean | 是否 AI 生成 |
| ai_disclosure | string | AI 标注 (可选) |

---

## 2. AI 标注 Disclosure

| AI 功能 | 标注内容 |
|---------|---------|
| 翻译 | [AI Translated] |
| 摘要 | [AI Summarized] |
| 回复建议 | [AI Suggested Reply] |

---

## 3. 上下文注入优先级

| 层级 | 内容 | Token 权重 |
|------|------|----------|
| L1 | 用户指令 | 1.0 |
| L2 | 对话会话状态 | 0.8 |
| L3 | 历史消息 (最近 20 条) | 0.6 |
| L4 | AI 分析结果 | 0.4 |
| L5 | 背景知识 | 0.2 |
