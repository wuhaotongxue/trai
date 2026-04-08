# Audio_Rules

---

## 1. 音频 Rules 总表

### 1.1 语音合成规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| AR-001 | vip_privilege | VIP 可跳过语音合成水印 | tool_call: audio.synthesize | skip_watermark | info |
| AR-002 | ai_speech | 非 VIP 语音合成必须水印 | tool_call: audio.synthesize | require_confirmation | error |

### 1.2 录制规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| AR-REC-001 | permission | 录制需用户确认 | tool_call: audio.recording.start | require_confirmation | error |
| AR-REC-002 | notification | 录制开始通知所有参会者 | action: recording_started | notify_all_participants | info |
| AR-REC-003 | notification | 录制停止通知所有参会者 | action: recording_stopped | notify_all_participants | info |

### 1.3 音频流规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| AR-STREAM-001 | permission | 音频流推送需用户确认 | tool_call: audio.stream.push | require_confirmation | warning |

### 1.4 配额规则

| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|------|---------|------|--------|
| AR-QUOTA-001 | permission | 非 VIP 转写需检查配额 | tool_call: audio.transcribe | audit_log | warning |

---

## 2. Rules 快速参考

| 规则 ID | 描述 | 严重程度 |
|---------|------|---------|
| AR-001 | VIP 可跳过水印 | info |
| AR-002 | 非 VIP 必须水印 | error |
| AR-REC-001 | 录制需确认 | error |
| AR-REC-002 | 录制开始通知 | info |
| AR-STREAM-001 | 流推送需确认 | warning |
| AR-QUOTA-001 | 转写配额检查 | warning |
