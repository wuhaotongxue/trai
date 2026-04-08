# Audio - 音频录制

---

## 1. 工具定义

### 1.1 开始录制

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.recording.start |
| name | string | Start Audio Recording |
| description | string | Start recording audio in a meeting or call |
| category | string | audio |
| sub_category | string | recording |
| risk_level | string | requires_approval |
| requires_notification | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| meeting_id | string | 是 | - | 会议 ID |
| include_system_audio | boolean | 否 | false | 是否包含系统音频 |

### 1.2 停止录制

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.recording.stop |
| name | string | Stop Audio Recording |
| description | string | Stop ongoing audio recording |
| category | string | audio |
| sub_category | string | recording |
| risk_level | string | monitored |
| requires_notification | boolean | true |
| audit_log | boolean | true |

---

## 2. 录制 Rules

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| AR-REC-001 | 录制需用户确认 | tool_call: audio.recording.start | require_confirmation | error |
| AR-REC-002 | 录制开始通知所有参会者 | action: recording_started | notify_all_participants | info |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>未经用户同意开始录制</li>
    <li>录制开始不通知参会者</li>
    <li>录制结束不通知参会者</li>
    <li>录制文件存储无加密</li>
  </ul>
</div>
