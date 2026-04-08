# Video_Rules

---

## 1. 视频 Rules 总表

### 1.1 水印规则

|| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
||---------|------|------|---------|------|--------|
|| VR_001 | vip_privilege | VIP 可跳过视频生成水印 | tool_call: video_generate | skip_watermark | info |
|| VR_002 | vip_privilege | VIP 可跳过视频流推送水印 | tool_call: video_stream_push | skip_watermark | info |

### 1.2 内容审核规则

|| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
||---------|------|------|---------|------|--------|
|| VR_010 | ai_speech | AI 生成视频必须审核 (VIP 不可跳过) | tool_call: video_generate | require_confirmation | error |
|| VR_011 | permission | 不安全视频必须阻止 | tool_call: video_moderate | deny | error |

### 1.3 录制规则

|| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
||---------|------|------|---------|------|--------|
|| VR_REC_001 | permission | 视频录制需用户确认 | tool_call: video_recording_start | require_confirmation | error |
|| VR_REC_002 | notification | 录制开始通知所有参会者 | action: video_recording_started | notify_all_participants | info |
|| VR_REC_003 | notification | 录制停止通知所有参会者 | action: video_recording_stopped | notify_all_participants | info |

### 1.4 配额规则

|| 规则 ID | 分类 | 描述 | 触发条件 | 动作 | 严重程度 |
||---------|------|------|---------|------|--------|
|| VR_QUOTA_001 | permission | 非 VIP 视频生成需检查配额 | tool_call: video_generate | audit_log | warning |

---

## 2. Rules 快速参考

|| 规则 ID | 描述 | 严重程度 |
||---------|------|---------|
|| VR_001 | VIP 生成可跳过水印 | info |
|| VR_002 | VIP 流推送可跳过水印 | info |
|| VR_010 | 生成必须审核 | error |
|| VR_011 | 不安全视频阻止 | error |
|| VR_REC_001 | 录制需确认 | error |
|| VR_QUOTA_001 | 配额检查 | warning |
