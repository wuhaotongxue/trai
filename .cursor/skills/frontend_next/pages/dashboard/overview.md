# Frontend_Next_js_Dashboard_用户工作台规范

---

## 1. 路由结构

```
src/app/[locale]/dashboard/
├── page.tsx              # Dashboard 首页
├── layout.tsx            # Dashboard Layout
│
├── chat/                 # AI 对话
├── image/               # AI 图片生成
├── video/               # AI 视频生成
├── music/               # AI 音乐生成
├── speech/              # 语音处理
│
├── meeting/             # 会议管理
│   └── analytics/       # 会议分析
│
├── report/              # 周报/月报
├── excel/               # Excel 导入
├── doc/                 # 文档处理
├── docs/                # 文档中心
├── json/                # JSON 处理
├── subtitle/            # 字幕处理
├── i18n/                # 国际化
│
├── users/               # 用户设置
├── settings/            # 应用设置
└── monitor/             # 数据大屏
```

---

## 2. Dashboard Layout

### 2.1 布局结构

| 区域 | 组件 | 说明 |
|------|------|------|
| 左侧 | Sidebar | 导航菜单 |
| 顶部 | Navbar | 面包屑/主题/用户 |
| 右侧 | QuickChat | 快捷聊天 |
| 中央 | children | 页面内容 |

**实现参考**：`frontend_next/src/app/[locale]/dashboard/layout.tsx`

### 2.2 Sidebar 菜单

| 菜单组 | 菜单项 | 图标 |
|--------|--------|------|
| AI 工具 | chat, image, video, music, speech | Sparkles |
| 协作 | meeting, report | Users |
| 效率 | excel, doc, docs, json, subtitle | Zap |
| 设置 | users, settings, monitor | Settings |

---

## 3. Dashboard 首页

### 3.1 快捷入口

| 区块 | 内容 |
|------|------|
| AI 工具快捷入口 | 6 个工具卡片 |
| 最近任务 | 最近 5 条 AI 任务 |
| 系统公告 | 最新公告列表 |

### 3.2 数据展示

| 数据 | 来源 |
|------|------|
| 用户信息 | AuthStore |
| 任务统计 | API |
| 公告列表 | API |

---

## 4. 功能页面结构

### 4.1 通用结构

| 区域 | 说明 |
|------|------|
| 页面标题 | 功能名称 |
| 操作区 | 主操作按钮 |
| 内容区 | 功能展示 |
| 辅助区 | 侧边栏/设置 |

### 4.2 页面状态

| 状态 | 处理 |
|------|------|
| Loading | 骨架屏 |
| Empty | 空状态提示 |
| Error | 错误提示 + 重试 |
| Success | 正常展示 |

---

## 5. 禁止事项

- 页面加载无 loading 状态
- 空数据无提示
- 错误无处理
- 表格无分页
- 移动端未适配
