# Frontend Next.js - Dashboard 用户工作台规范

---

## 1. 路由结构

```
src/app/[locale]/dashboard/
├── page.tsx              # Dashboard 首页
├── layout.tsx            # Dashboard Layout
│
├── chat/                 # AI 对话
│   └── page.tsx
│
├── image/               # AI 图片生成
│   └── page.tsx
│
├── video/               # AI 视频生成
│   └── page.tsx
│
├── music/               # AI 音乐生成
│   └── page.tsx
│
├── speech/              # 语音处理
│   └── page.tsx
│
├── meeting/             # 会议管理
│   ├── page.tsx         # 会议列表
│   └── analytics/       # 会议分析
│       └── page.tsx
│
├── report/              # 周报/月报
│   └── page.tsx
│
├── excel/               # Excel 导入
│   └── page.tsx
│
├── doc/                 # 文档处理
│   └── page.tsx
│
├── docs/                # 文档中心
│   └── page.tsx
│
├── json/                # JSON 处理
│   └── page.tsx
│
├── subtitle/            # 字幕处理
│   └── page.tsx
│
├── i18n/                # 国际化
│   └── page.tsx
│
├── users/               # 用户设置
│   └── page.tsx
│
├── settings/            # 应用设置
│   └── page.tsx
│
└── monitor/             # 数据大屏
    └── page.tsx
```

---

## 2. 布局规范

```tsx
// dashboard/layout.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { QuickChat } from "@/components/layout/quick-chat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <QuickChat locale={locale} />
    </div>
  );
}
```

---

## 3. Dashboard 首页

### 3.1 欢迎头

```tsx
<h1 className="text-2xl font-bold">
  {t("dashboard.welcome")}{user?.name ? `，${user.name}` : ""}
</h1>
<p className="text-muted-foreground text-sm mt-1">
  {new Date().toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
</p>
```

### 3.2 统计卡片

```tsx
const statCards = [
  { label: "本周任务", val: "12", delta: "+3", icon: Layers, color: "text-blue-600" },
  { label: "Token 消耗", val: "45.2K", delta: "-12%", icon: Cpu, color: "text-orange-600" },
  { label: "活跃天数", val: "7", delta: "+1", icon: TrendingUp, color: "text-green-600" },
  { label: "总报告", val: "28", delta: "+4", icon: FileText, color: "text-purple-600" },
];
```

### 3.3 工具卡片

```tsx
const TOOL_CARDS = [
  { icon: Bot, label: "nav.chat", href: "/dashboard/chat", color: "from-blue-600 to-cyan-600" },
  { icon: Image, label: "nav.image", href: "/dashboard/image", color: "from-purple-600 to-pink-600" },
  { icon: Video, label: "nav.video", href: "/dashboard/video", color: "from-red-600 to-orange-600" },
  { icon: Music, label: "nav.music", href: "/dashboard/music", color: "from-green-600 to-emerald-600" },
  { icon: Mic, label: "nav.speech", href: "/dashboard/speech", color: "from-yellow-600 to-amber-600" },
  { icon: FileText, label: "nav.meeting", href: "/dashboard/meeting", color: "from-teal-600 to-cyan-600" },
  { icon: BarChart3, label: "nav.analytics", href: "/dashboard/meeting/analytics", color: "from-indigo-600 to-blue-600" },
  { icon: ClipboardList, label: "nav.report", href: "/dashboard/report", color: "from-rose-600 to-pink-600" },
];
```

---

## 4. 侧边栏导航

```tsx
// dashboard/sidebar.tsx
const DASHBOARD_NAV = [
  {
    key: "tools",
    label: "AI 工具",
    items: [
      { label: "AI 对话", href: "/dashboard/chat", icon: Bot },
      { label: "图片生成", href: "/dashboard/image", icon: Image },
      { label: "视频生成", href: "/dashboard/video", icon: Video },
      { label: "音乐生成", href: "/dashboard/music", icon: Music },
      { label: "语音处理", href: "/dashboard/speech", icon: Mic },
    ],
  },
  {
    key: "workspace",
    label: "工作空间",
    items: [
      { label: "会议管理", href: "/dashboard/meeting", icon: FileText },
      { label: "会议分析", href: "/dashboard/meeting/analytics", icon: BarChart3 },
      { label: "周报/月报", href: "/dashboard/report", icon: ClipboardList },
      { label: "Excel 导入", href: "/dashboard/excel", icon: Table },
      { label: "文档处理", href: "/dashboard/doc", icon: FileText },
    ],
  },
  {
    key: "tools-2",
    label: "效率工具",
    items: [
      { label: "JSON 处理", href: "/dashboard/json", icon: Braces },
      { label: "字幕处理", href: "/dashboard/subtitle", icon: Subtitles },
      { label: "国际化", href: "/dashboard/i18n", icon: Globe },
    ],
  },
  {
    key: "settings",
    label: "设置",
    items: [
      { label: "个人设置", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
```

---

## 5. 页面分类

### 5.1 AI 生成类

| 页面 | 组件 | 说明 |
|------|------|------|
| AI 对话 | `chat/page.tsx` | 多轮对话、Agent |
| 图片生成 | `image/page.tsx` + `image-generator.tsx` | 文生图 |
| 视频生成 | `video/page.tsx` + `video-generator.tsx` | 文生视频 |
| 音乐生成 | `music/page.tsx` + `music-generator.tsx` | AI 音乐 |
| 语音处理 | `speech/page.tsx` | TTS/STT/克隆 |

### 5.2 效率工具类

| 页面 | 说明 |
|------|------|
| 周报/月报 | Git 分析 + Excel 导入 + AI 生成 |
| Excel 导入 | 数据导入处理 |
| 文档处理 | PDF/Word 解析 |
| JSON 处理 | JSON 格式化/校验 |
| 字幕处理 | SRT/ASS 编辑 |
| 国际化 | 翻译管理 |

### 5.3 协作类

| 页面 | 组件 | 说明 |
|------|------|------|
| 会议管理 | `meeting/page.tsx` | 会议列表/创建/录制 |
| 会议分析 | `meeting/analytics/page.tsx` | 数据可视化 |

---

## 6. 状态管理

### 6.1 Chat Store

```tsx
// stores/chat-store.ts
import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}));
```

---

## 7. 快捷聊天

```tsx
// components/layout/quick-chat.tsx
// 固定在右下角
// 支持快速提问
// 不打断主流程
```

---

## 8. 禁止事项

- 布局硬编码宽度
- 页面超过 300 行未拆分
- 大量数据无分页
- 移动端不兼容
- 状态不持久化
