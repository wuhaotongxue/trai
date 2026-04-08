# Frontend - Dashboard 组件规范

---

## 1. 组件结构

```
components/
├── layout/
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   ├── quick-chat.tsx
│   ├── theme-switcher.tsx
│   └── language-switcher.tsx
├── ui/
│   ├── button.tsx, card.tsx, badge.tsx, input.tsx
│   └── ...
├── business/
│   ├── meeting/
│   │   ├── meeting_detail_card.tsx
│   │   ├── meeting_recorder_dialog.tsx
│   │   └── meeting_analytics_dashboard.tsx
│   └── report/
│       ├── report_dashboard.tsx
│       ├── report_edit_dialog.tsx
│       ├── report_export_dialog.tsx
│       └── git_analyze_dialog.tsx
└── feature/
    └── ai-generate/
        ├── image-generator.tsx
        ├── video-generator.tsx
        └── music-generator.tsx
```

---

## 2. 业务组件

### Meeting 模块

| 组件 | 说明 |
|------|------|
| meeting_detail_card | 会议信息展示 |
| meeting_recorder_dialog | 录制控制 |
| meeting_analytics_dashboard | 数据可视化 |

### Report 模块

| 组件 | 说明 |
|------|------|
| report_dashboard | 主视图 |
| report_edit_dialog | 编辑报告 |
| report_export_dialog | 导出选项 |
| git_analyze_dialog | Git 统计 |

---

## 3. 禁止事项

- 组件内硬编码样式
- 业务逻辑写在 UI 组件中
- 组件超过 200 行未拆分
- 无 TypeScript 类型定义
- 直接使用 any 类型