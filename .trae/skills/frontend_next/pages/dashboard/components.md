# Frontend - Dashboard 组件规范

---

## 1. 组件结构

```
components/
├── layout/
│   ├── sidebar.tsx       # 侧边栏导航
│   ├── navbar.tsx        # 顶部导航栏
│   ├── quick-chat.tsx    # 快捷聊天
│   ├── theme-switcher.tsx # 主题切换
│   └── language-switcher.tsx # 语言切换
│
├── ui/                   # shadcn/ui 组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   └── ...
│
├── business/             # 业务组件
│   ├── meeting/
│   │   ├── meeting_detail_card.tsx
│   │   ├── meeting_recorder_dialog.tsx
│   │   └── meeting_analytics_dashboard.tsx
│   └── report/
│       ├── report_dashboard.tsx
│       ├── report_edit_dialog.tsx
│       ├── report_export_dialog.tsx
│       └── git_analyze_dialog.tsx
│
└── feature/
    └── ai-generate/
        ├── image-generator.tsx
        ├── video-generator.tsx
        └── music-generator.tsx
```

---

## 2. 布局组件

### Sidebar

```tsx
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| collapsed | boolean | 是否折叠 |
| onToggle | () => void | 切换回调 |

### Navbar

| 元素 | 说明 |
|------|------|
| 返回按钮 | Link to landing |
| 面包屑 | 页面路径 |
| 主题切换 | ThemeSwitcher |
| 语言切换 | LanguageSwitcher |
| 用户头像 | 退出登录 |

---

## 3. 业务组件

### Meeting 模块

| 组件 | 文件 | 说明 |
|------|------|------|
| 会议详情卡片 | `meeting_detail_card.tsx` | 会议信息展示 |
| 录制对话框 | `meeting_recorder_dialog.tsx` | 录制控制 |
| 分析仪表盘 | `meeting_analytics_dashboard.tsx` | 数据可视化 |

### Report 模块

| 组件 | 文件 | 说明 |
|------|------|------|
| 报告仪表盘 | `report_dashboard.tsx` | 主视图 |
| 编辑对话框 | `report_edit_dialog.tsx` | 编辑报告 |
| 导出对话框 | `report_export_dialog.tsx` | 导出选项 |
| Git 分析对话框 | `git_analyze_dialog.tsx` | Git 统计 |

### AI 生成模块

| 组件 | 文件 | 说明 |
|------|------|------|
| 图片生成器 | `image-generator.tsx` | 文生图 |
| 视频生成器 | `video-generator.tsx` | 文生视频 |
| 音乐生成器 | `music-generator.tsx` | AI 音乐 |

---

## 4. UI 组件规范

### Card

```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>{children}</CardContent>
</Card>
```

### Badge

```tsx
<Badge variant="outline" className="text-xs">
  {label}
</Badge>
```

### Button

```tsx
<Button variant="default" size="sm" onClick={handler}>
  {label}
</Button>
```

---

## 5. 组件命名

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 布局组件 | layout/xxx.tsx | sidebar.tsx |
| UI 组件 | ui/xxx.tsx | card.tsx |
| 业务组件 | business/xxx.tsx | meeting_detail_card.tsx |
| 功能组件 | feature/xxx.tsx | image_generator.tsx |

---

## 6. 禁止事项

- 组件内硬编码样式 (使用 Tailwind 变量)
- 业务逻辑写在 UI 组件中
- 组件超过 200 行未拆分
- 组件无 TypeScript 类型定义
- 直接使用 any 类型