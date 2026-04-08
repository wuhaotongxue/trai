# Agent_安全与规则规范

---

## 1. 核心原则

> **安全不能靠模型自觉，必须落在运行时**

只要 Agent 能写文件、跑 shell、改配置，它就是操作系统参与者。真正的高质量 Agent 靠的是"即便模型不听话，系统也有边界"。

---

## 2. Rules Engine 架构

### 2.1 Rule 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 规则唯一标识 |
| category | RuleCategory | 分类 |
| description | string | 规则描述 |
| trigger | RuleTrigger | 触发条件 |
| action | RuleAction | 执行动作 |
| severity | `error` \| `warning` \| `info` | 严重程度 |
| enabled | boolean | 是否启用 |

**RuleCategory**：`permission` | `notification` | `ai_speech` | `privacy` | `vip_privilege`

**RuleTrigger 类型**：

| 类型 | 说明 |
|------|------|
| action | 特定动作触发 |
| tool_call | 工具调用触发 |
| keyword | 关键词触发 |

**RuleAction 类型**：

| 类型 | 说明 |
|------|------|
| allow | 允许执行 |
| deny | 拒绝执行 |
| require_confirmation | 需要用户确认 |
| notify_all_participants | 通知所有参会者 |
| audit_log | 记录审计日志 |
| skip_watermark | 跳过水印 |
| skip_review | 跳过审核 |

---

## 3. RBAC 权限体系

### 3.1 用户角色

| 角色 | 说明 |
|------|------|
| GUEST | 访客 |
| USER | 普通用户 |
| VIP | 会员用户 |
| ADMIN | 管理员 |

### 3.2 权限列表

| 权限 | 说明 |
|------|------|
| SKIP_AUDIO_WATERMARK | 跳过音频水印 |
| SKIP_VIDEO_WATERMARK | 跳过视频水印 |
| SKIP_IMAGE_WATERMARK | 跳过图片水印 |
| SKIP_AI_CONTENT_REVIEW | 跳过 AI 内容审核 |
| UNLIMIT_AI_GENERATION | 无限 AI 生成 |
| UNLIMIT_TRANSCRIPTION | 无限转录 |
| MANAGE_USERS | 管理用户 |
| VIEW_AUDIT_LOG | 查看审计日志 |

### 3.3 角色权限映射

| 角色 | Guest | User | VIP | Admin |
|------|-------|------|-----|-------|
| 基础功能 | - | 是 | 是 | 是 |
| 水印 (音频/视频/图片) | - | 是 | 可跳过 | 可跳过 |
| 内容审核 | - | 是 | 是 | 可跳过 |
| AI 配额 | 有限 | 有限 | 无限 | 无限 |
| 用户管理 | - | - | - | 是 |
| 审计日志 | - | - | - | 是 |

---

## 4. 会议 Rules

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| MR-001 | 禁止 AI 自行共享屏幕 | action: share_screen | deny | error |
| MR-002 | 禁止 AI 自行结束会议 | action: end_meeting | deny | error |
| MR-010 | 录制开始通知所有参会者 | action: start_recording | notify_all_participants | info |
| MR-011 | 录制停止通知所有参会者 | action: stop_recording | notify_all_participants | info |
| MR-020 | AI 生成内容需用户确认 | action: ai_speak | require_confirmation | warning |
| MR-021 | 会议纪要发送前需确认 | tool_call: meeting.summary.send | require_confirmation | warning |
| MR-030 | 会议纪要只能发给参会者 | action: send_summary | audit_log | info |
| MR-031 | 录制需参会者同意 | action: start_recording | require_confirmation | error |

---

## 5. VIP 特权规则

| 规则 ID | 描述 | 触发条件 | 动作 |
|---------|------|---------|------|
| VIP-001 | VIP 可无水印生成图片 | tool_call: image.generate | skip_watermark |
| VIP-002 | VIP 可无水印推流视频 | tool_call: video.stream.push | skip_watermark |
| VIP-003 | VIP 可无水印合成语音 | tool_call: audio.synthesize | skip_watermark |
| VIP-010 | VIP 无限 AI 配额 | tool_call: image.generate | audit_log |

---

## 6. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>把安全边界写在提示词里 (提示词不可靠)</li>
    <li>Rules 无版本化 (不知道哪条规则在生效)</li>
    <li>高风险操作无用户确认流程</li>
    <li>Rules 变更无审计日志</li>
    <li>VIP 水印跳过逻辑硬编码在工具代码中 (必须在 RBAC 层统一管理)</li>
    <li>权限检查遗漏 AuditLog (每次权限操作必须记录)</li>
  </ul>
</div>

---

## 7. 快速参考

| 角色 | 水印 | 审核 | 配额 | 管理 |
|------|------|------|------|------|
| Guest | 必须 | 必须 | 有限 | 无 |
| User | 必须 | 必须 | 有限 | 无 |
| VIP | 可跳过 | 不可跳过 | 无限 | 无 |
| Admin | 可跳过 | 可跳过 | 无限 | 全部 |
