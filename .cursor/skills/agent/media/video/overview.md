# Video_能力总览

---

## 1. 视频工具矩阵

|| 工具 ID | 能力 | 风险等级 | 水印 | VIP 跳过 | 审核 | 月配额 |
||---------|------|---------|------|---------|------|-------|
|| video_stream_push | 视频流推送 | approval | required | yes | required | video_stream |
|| video_generate | 视频生成 | approval | required | yes | required | video_stream |
|| video_recording_start | 视频录制 | approval | - | - | - | - |
|| video_recording_stop | 停止录制 | monitored | - | - | - | - |
|| video_screenshot | 截图 | safe | - | - | - | - |
|| video_watermark_apply | 水印 | safe | required | no | - | - |
|| video_moderate | 内容审核 | monitored | - | - | - | - |

---

## 2. 风险等级说明

|| 等级 | 行为 | 示例 |
||------|------|------|
|| safe | 自动执行 | 截图 |
|| monitored | 自动执行，记录日志 | 内容审核 |
|| requires_approval | 等待用户确认 | 视频生成、录制 |

---

## 3. 视频子目录结构

|| 文件 | 说明 |
||------|------|
|| `generate.md` | AI 视频生成详细规范 |
|| `stream.md` | 视频流推送详细规范 |
|| `recording.md` | 录制详细规范 |
|| `screenshot.md` | 截图详细规范 |
|| `rules.md` | 视频操作规则 |
|| `context.md` | 视频上下文模板 |
