# TRAI 前端

基于 Next.js 16 + React 19 + TypeScript 5 的 TRAI 项目前端，采用 App Router 架构。

## 技术栈

- Next.js 16.2.3（App Router + Turbopack）
- React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Zustand 5（状态管理）
- pnpm 9（包管理器）

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm type-check
```

## 目录结构

```
src/
├── app/               # App Router 页面
│   ├── (website)/     # 营销官网路由组
│   ├── (admin)/      # 管理后台路由组
│   └── (app)/         # 业务功能路由组
├── components/
│   ├── ui/            # shadcn/ui 基础组件
│   └── 功能名/         # 按模块命名的业务组件
├── stores/            # Zustand 状态管理
├── lib/               # 工具函数和 API 客户端
└── types/            # 类型定义
```

## 路由说明

| 路由 | 页面 |
|------|------|
| `/` | TRAI 官网首页 |
| `/features` | 功能介绍 |
| `/pricing` | 定价方案 |
| `/contact` | 联系我们 |
| `/agent` | AI Agent 对话 |
| `/todo` | 任务管理 |
| `/admin` | 管理后台仪表盘 |
| `/admin/users` | 用户管理 |
| `/admin/quotas` | 配额配置 |
| `/admin/monitor` | 系统监控 |

## 规范

所有代码、注释、UI 文案必须使用简体中文，详见 `.trae/skills/frontend_next/SKILL.md`。

## 📝 更新日志 (Changelog)

### 🎨 前端_2026_04_13_2015
- **新增(frontend_next)**: 使用 `kity.svg` 作为默认图标配置

### 🎨 前端_2026_04_13_1955
- **新增(frontend_next)**: 补充 Next.js 前端模块的 README.md 说明文档

### 🎨 前端_2026_04_13_1521
- **修复(frontend)**: 修复前端组件（navbar, pricing, settings）中出现的乱码及中文全角标点问题
