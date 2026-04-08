# Video_上下文模板

---

## 1. 视频上下文结构

### 1.1 VideoContext 结构

|| 字段 | 类型 | 说明 |
||------|------|------|
|| video_session | object | L2: 视频会话状态 |
|| analysis_results | VideoAnalysisResult[] | L4: 视频分析结果 |

### 1.2 video_session 结构

|| 字段 | 类型 | 说明 |
||------|------|------|
|| type | string | 会话类型: meeting/streaming/ai_generated |
|| meeting_id | string | 会议 ID (可选) |
|| stream_id | string | 流 ID (可选) |
|| duration_seconds | number | 视频时长 (可选) |

### 1.3 VideoAnalysisResult 结构

|| 字段 | 类型 | 说明 |
||------|------|------|
|| video_id | string | 视频 ID |
|| upload_by | string | 上传者 |
|| analysis_time | string | 分析时间 |
|| screenshots | ScreenshotResult[] | 截图结果 (可选) |
|| moderation | ModerationResult | 审核结果 (可选) |
|| duration_seconds | number | 视频时长 |
|| is_ai_generated | boolean | 是否 AI 生成 |
|| watermark_applied | boolean | 是否已添加水印 |
|| watermark_skipped | boolean | 是否被跳过水印 |
|| skip_reason | string | 跳过原因 (可选) |

### 1.4 ScreenshotResult 结构

|| 字段 | 类型 | 说明 |
||------|------|------|
|| timestamp | number | 时间戳 |
|| image_url | string | 图片 URL |
|| format | string | 格式 |

### 1.5 ModerationResult 结构

|| 字段 | 类型 | 说明 |
||------|------|------|
|| safe | boolean | 是否安全 |
|| categories | string[] | 违规类别 |
|| confidence | number | 置信度 |

---

## 2. 上下文注入优先级

|| 层级 | 内容 | Token 权重 |
||------|------|----------|
|| L1 | 用户指令 | 1.0 |
|| L2 | 视频会话状态 | 0.8 |
|| L3 | 历史对话 | 0.6 |
|| L4 | 视频分析结果 | 0.4 |
|| L5 | 背景知识 | 0.2 |
