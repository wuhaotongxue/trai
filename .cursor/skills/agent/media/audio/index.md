# Agent - 音频处理规范索引

---

## 快速索引

| 子规范 | 文件 | 说明 |
|--------|------|------|
| 能力矩阵 | `audio/overview.md` | 音频工具总览 |
| 语音合成 | `audio/synthesis.md` | TTS 语音合成 |
| 语音转写 | `audio/transcribe.md` | STT 语音转文字 |
| 音频录制 | `audio/recording.md` | 通话录制 |
| 音频流 | `audio/stream.md` | 实时音频流推送 |
| Rules | `audio/rules.md` | 音频操作规则 |
| 上下文 | `audio/context.md` | 音频上下文模板 |

---

## 音频工具矩阵

| 工具 ID | 能力 | 风险等级 | 水印 | VIP 跳过 | 月配额 |
|---------|------|---------|------|---------|-------|
| audio.synthesize | 语音合成 | safe | required | yes | audio_synthesis |
| audio.stream.push | 音频流推送 | approval | required | yes | audio_synthesis |
| audio.transcribe | 语音转文字 | safe | - | - | transcription_minutes |
| audio.recording.start | 通话录制 | approval | - | - | - |
| audio.translate_stream | 实时翻译 | safe | - | - | ai_translation |

---

## RBAC 权限

| 角色 | 语音合成水印 | 录制 | 翻译 |
|------|-------------|------|------|
| Guest | 必须 | 禁止 | 有限 |
| User | 必须 | 需确认 | 有限 |
| VIP | 可跳过 | 需确认 | 无限 |
| Admin | 可跳过 | 可跳过 | 无限 |
