# Video - 视频流推送

---

## 1. 工具定义

### 1.1 视频流推送

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | video.stream.push |
| name | string | Push Video Stream |
| description | string | Push video stream to destination |
| category | string | video |
| sub_category | string | streaming |
| risk_level | string | requires_approval |
| requires_watermark | boolean | true |
| watermark_skip_allowed | boolean | true |
| requires_ai_content_review | boolean | true |
| monthly_quota_check | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| video_data | string | 是 | - | 视频数据 |
| stream_id | string | 是 | - | 流 ID |
| format | string | 否 | mp4 | 格式: mp4/webm/hls |
| quality | string | 否 | 1080p | 质量: 720p/1080p/4k |

### 1.2 视频录制 (开始)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | video.recording.start |
| name | string | Start Video Recording |
| description | string | Start recording video in a meeting |
| category | string | video |
| sub_category | string | recording |
| risk_level | string | requires_approval |
| requires_notification | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| meeting_id | string | 是 | - | 会议 ID |
| include_audio | boolean | 否 | true | 是否包含音频 |

### 1.3 视频录制 (停止)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | video.recording.stop |
| name | string | Stop Video Recording |
| description | string | Stop ongoing video recording |
| category | string | video |
| sub_category | string | recording |
| risk_level | string | monitored |
| requires_notification | boolean | true |
| audit_log | boolean | true |

---

## 2. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>视频流推送不经过水印和审核</li>
    <li>VIP 水印跳过逻辑硬编码</li>
    <li>录制无用户同意</li>
    <li>录制开始不通知参会者</li>
  </ul>
</div>
