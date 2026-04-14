# 前端开发规范

## 核心规范

TRAI 项目前端强制使用简体中文，详见 `.cursor/rules/frontend_next/SKILL.md`。

## 技术栈

- Next.js 16.2.3（App Router）
- React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Zustand 5（状态管理）
- pnpm 9（包管理器）

## 目录结构

```
src/
├── app/               # App Router 页面
│   ├── (website)/     # 营销官网路由组
│   ├── (admin)/       # 管理后台路由组
│   └── (app)/         # 业务功能路由组
├── components/
│   ├── ui/            # shadcn/ui 基础组件
│   └── 功能名/         # 按模块命名的业务组件
├── stores/            # Zustand 状态管理
├── lib/               # 工具函数和 API 客户端
└── types/             # 类型定义
```

## 强制规则

1. **所有 UI 文案必须是简体中文**
2. **所有注释必须是中文**
3. **禁止中文全角标点**（`，` `。` `！` `：`）
4. 每个文件必须有中文文件头注释
