# Agent - 媒体处理规范索引

---

## 快速索引

| 媒体类型 | 目录 | 文件数 | 说明 |
|---------|------|--------|------|
| 音频 | `media/audio/` | 8 个文件 | 语音合成/转写/录制/流 |
| 视频 | `media/video/` | 8 个文件 | 视频生成/推送/录制/截图 |
| 图片 | `media/image.md` | 1 个文件 | 图片生成/OCR/审核/水印 |
| 对话 | `media/chat/` | 10 个文件 | 消息/翻译/摘要/群组 |

---

## 目录结构

```
media/
├── audio/
│   ├── index.md      # 索引
│   ├── overview.md    # 能力总览
│   ├── synthesis.md   # 语音合成
│   ├── transcribe.md  # 语音转写
│   ├── recording.md   # 音频录制
│   ├── stream.md      # 音频流
│   ├── rules.md      # 音频规则
│   └── context.md     # 上下文模板
│
├── video/
│   ├── index.md      # 索引
│   ├── overview.md    # 能力总览
│   ├── generate.md    # AI 视频生成
│   ├── stream.md      # 视频流推送
│   ├── recording.md   # 视频录制
│   ├── screenshot.md  # 视频截图
│   ├── rules.md      # 视频规则
│   └── context.md     # 上下文模板
│
├── image.md          # 图片规范
│
└── chat/
    ├── index.md      # 索引
    ├── overview.md    # 能力总览
    ├── message.md     # 消息发送
    ├── translate.md   # AI 翻译
    ├── summarize.md   # AI 摘要
    ├── reply.md       # 回复建议
    ├── group.md       # 群组管理
    ├── moderate.md    # 消息审核
    ├── rules.md      # 对话规则
    └── context.md     # 上下文模板
```

---

## 通用规则

| 规则 | 说明 |
|------|------|
| AI 内容必须水印 | 非 VIP 用户生成内容必须添加水印 |
| VIP 可跳过水印 | VIP 用户可去除 AI 生成内容的水印 |
| 审核不可跳过 | AI 生成内容必须审核 (包括 VIP) |
| 配额限制 | 非 VIP 用户有月度配额限制 |
| AI 标注 | AI 翻译/摘要/建议必须标注 |
