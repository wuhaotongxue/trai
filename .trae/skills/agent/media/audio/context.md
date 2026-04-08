# Audio - 上下文模板

---

## 1. 音频上下文结构

### 1.1 AudioContext 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| audio_session | object | L2: 音频会话状态 |
| analysis_results | AudioAnalysisResult[] | L4: 音频分析结果 |

### 1.2 audio_session 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 会话类型: meeting/call/streaming/ai_generated |
| meeting_id | string | 会议 ID (可选) |
| call_id | string | 通话 ID (可选) |
| stream_id | string | 流 ID (可选) |

### 1.3 AudioAnalysisResult 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| audio_id | string | 音频 ID |
| upload_by | string | 上传者 |
| analysis_time | string | 分析时间 |
| transcription | TranscriptionResult | 转写结果 (可选) |
| translation | TranslationResult | 翻译结果 (可选) |
| duration_seconds | number | 音频时长 |
| is_ai_generated | boolean | 是否 AI 生成 |
| watermark_applied | boolean | 是否已添加水印 |
| watermark_skipped | boolean | 是否被跳过水印 |
| skip_reason | string | 跳过原因 (可选) |

### 1.4 TranscriptionResult 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 转写文本 |
| language | string | 检测语言 |
| segments | Segment[] | 分段 |
| confidence | number | 置信度 |

### 1.5 TranslationResult 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| source_text | string | 源文本 |
| target_text | string | 目标文本 |
| source_language | string | 源语言 |
| target_language | string | 目标语言 |
| confidence | number | 置信度 |

---

## 2. 上下文注入优先级

| 层级 | 内容 | Token 权重 |
|------|------|----------|
| L1 | 用户指令 | 1.0 |
| L2 | 音频会话状态 | 0.8 |
| L3 | 历史对话 | 0.6 |
| L4 | 音频分析结果 | 0.4 |
| L5 | 背景知识 | 0.2 |
