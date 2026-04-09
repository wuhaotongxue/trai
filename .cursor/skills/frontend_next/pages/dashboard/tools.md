# Frontend_Dashboard_工具页面规范

---

## 1. AI 对话 (Chat)

```tsx
// /dashboard/chat/page.tsx
export default function ChatPage() {
  // AI 对话主页面
  // - 多轮对话支持
  // - Agent 工具调用
  // - 历史消息检索
}
```

### 工具栏

| 功能 | 说明 |
|------|------|
| 清空对话 | 重置会话 |
| 历史记录 | 加载历史 |
| 导出 | 导出聊天记录 |

---

## 2. AI 图片生成 (Image)

```tsx
// /dashboard/image/page.tsx
// 使用 image-generator.tsx 组件
```

### 生成器配置

| 参数 | 类型 | 说明 |
|------|------|------|
| prompt | string | 提示词 |
| style | string | 风格选择 |
| size | string | 图片尺寸 |
| count | number | 生成数量 |

---

## 3. AI 视频生成 (Video)

```tsx
// /dashboard/video/page.tsx
// 使用 video-generator.tsx 组件
```

### 支持模型

| 模型 | 说明 |
|------|------|
| Wan2.1 | 开源视频生成 |
| 可扩展 | 支持新增模型 |

---

## 4. AI 音乐生成 (Music)

```tsx
// /dashboard/music/page.tsx
// 使用 music-generator.tsx 组件
```

---

## 5. 语音处理 (Speech)

```tsx
// /dashboard/speech/page.tsx
// - TTS 语音合成
// - STT 语音转写
// - 声音克隆
```

### 功能列表

| 功能 | 工具 ID | 说明 |
|------|---------|------|
| 语音合成 | audio.synthesize | TTS |
| 语音转写 | audio.transcribe | STT |
| 声音克隆 | audio.voice.clone | 克隆声音 |

---

## 6. 会议管理 (Meeting)

```tsx
// /dashboard/meeting/page.tsx
// - 会议列表
// - 创建会议
// - 会议录制
```

### 会议功能

| 功能 | 说明 |
|------|------|
| 会议列表 | 展示所有会议 |
| 创建会议 | 新建会议 |
| 加入会议 | 进入会议 |
| 会议录制 | 录制会议 |

---

## 7. 会议分析 (Analytics)

```tsx
// /dashboard/meeting/analytics/page.tsx
// 使用 meeting_analytics_dashboard.tsx 组件
```

### 分析指标

| 指标 | 说明 |
|------|------|
| 会议时长 | 平均/总时长 |
| 参与者 | 人数统计 |
| 转录文本 | 语音转文字 |
| 摘要 | AI 生成摘要 |

---

## 8. 周报/月报 (Report)

```tsx
// /dashboard/report/page.tsx
// 使用 report_dashboard.tsx 组件
```

### 报告流程

```
Excel 导入 / Git 分析 -> 数据解析 -> AI 生成 -> 导出
```

---

## 9. 禁止事项

- 工具页面无加载状态
- 生成结果无错误处理
- 长任务无进度展示
- 移动端不兼容的工具页面