# Audio_能力总览

---

## 1. 音频工具矩阵

| 工具 ID | 能力 | 风险等级 | 水印 | VIP 跳过 | 月配额 |
|---------|------|---------|------|---------|-------|
| audio.synthesize | 语音合成 | safe | required | yes | audio_synthesis |
| audio.stream.push | 音频流推送 | approval | required | yes | audio_synthesis |
| audio.transcribe | 语音转文字 | safe | - | - | transcription_minutes |
| audio.recording.start | 通话录制 | approval | - | - | - |
| audio.recording.stop | 停止录制 | monitored | - | - | - |
| audio.translate_stream | 实时翻译 | safe | - | - | ai_translation |
| audio.voice.clone | 声音克隆 | approval | required | no | - |

---

## 2. 风险等级说明

| 等级 | 行为 | 示例 |
|------|------|------|
| safe | 自动执行 | 语音合成 |
| monitored | 自动执行，记录日志 | 停止录制 |
| requires_approval | 等待用户确认 | 音频流推送 |

---

## 3. 音频子目录结构

| 文件 | 说明 |
|------|------|
| `synthesis.md` | 语音合成详细规范 |
| `transcribe.md` | 语音转写详细规范 |
| `recording.md` | 录制详细规范 |
| `stream.md` | 音频流详细规范 |
| `rules.md` | 音频操作规则 |
| `context.md` | 音频上下文模板 |
