# Agent_视频处理规范索引

---

## 快速索引

| 子规范 | 文件 | 说明 |
|--------|------|------|
| 能力矩阵 | `video/overview.md` | 视频工具总览 |
| AI 视频生成 | `video/generate.md` | AI 视频生成 |
| 视频流推送 | `video/stream.md` | 视频流推送 |
| 视频录制 | `video/recording.md` | 视频录制 |
| 视频截图 | `video/screenshot.md` | 视频截图 |
| Rules | `video/rules.md` | 视频操作规则 |
| 上下文 | `video/context.md` | 视频上下文模板 |

---

## 视频工具矩阵

| 工具 ID | 能力 | 风险等级 | 水印 | VIP 跳过 | 审核 | 月配额 |
|---------|------|---------|------|---------|------|-------|
| video_stream_push | 视频流推送 | approval | required | yes | required | video_stream |
| video_generate | 视频生成 | approval | required | yes | required | video_stream |
| video_recording_start | 视频录制 | approval | - | - | - | - |
| video_recording_stop | 停止录制 | monitored | - | - | - | - |
| video_screenshot | 截图 | safe | - | - | - | - |

---

## RBAC 权限

| 角色 | 视频生成水印 | 视频流推送水印 | 录制 | 审核 |
|------|-------------|-------------|------|------|
| Guest | 必须 | 必须 | 禁止 | - |
| User | 必须 | 必须 | 需确认 | 必须 |
| VIP | 可跳过 | 可跳过 | 需确认 | 必须 |
| Admin | 可跳过 | 可跳过 | 可跳过 | 可跳过 |
