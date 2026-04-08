# Frontend Next - 技术架构总览

---

## 1. 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 14+ | App Router |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.x | 样式方案 |
| shadcn/ui | latest | UI 组件库 |
| next-intl | 3.x | 国际化 |
| React Query | 5.x | 数据获取 |
| Zustand | 4.x | 状态管理 |
| Recharts | 2.x | 图表库 |
| Lucide React | latest | 图标库 |

---

## 2. 目录结构

```
frontend_next/
├── src/
│   ├── app/                          # App Router
│   │   ├── [locale]/                  # 国际化路由
│   │   │   ├── page.tsx              # 官网首页
│   │   │   ├── login/                 # 登录
│   │   │   ├── dashboard/             # 用户工作台
│   │   │   │   ├── chat/
│   │   │   │   ├── image/
│   │   │   │   ├── video/
│   │   │   │   ├── music/
│   │   │   │   ├── speech/
│   │   │   │   ├── meeting/
│   │   │   │   ├── report/
│   │   │   │   ├── monitor/           # 大屏展示
│   │   │   │   └── settings/
│   │   │   └── admin/                 # 后台管理
│   │   │       ├── users/
│   │   │       └── system/
│   │   ├── layout.tsx                 # 根布局
│   │   └── globals.css                # 全局样式
│   │
│   ├── components/
│   │   ├── layout/                    # 布局组件
│   │   ├── ui/                        # shadcn/ui 基础组件
│   │   ├── business/                  # 业务组件
│   │   └── feature/                   # 功能组件
│   │
│   ├── lib/                           # 工具库
│   ├── hooks/                         # 自定义 Hooks
│   ├── stores/                        # Zustand 状态
│   ├── i18n/                          # 国际化
│   └── middleware.ts                  # 中间件
│
├── public/                            # 静态资源
├── next.config.js
└── package.json
```

---

## 3. 核心原则

### 3.1 App Router 规范

| 规范 | 说明 |
|------|------|
| 默认 Server Component | 提升首屏加载速度和 SEO |
| 显式 "use client" | 仅在需要交互、Hooks、浏览器 API 时使用 |
| 禁止父布局滥用 | 严禁在 Layout 或根节点盲目使用 "use client" |

### 3.2 布局层级

| 层级 | 文件 | 说明 |
|------|------|------|
| L0 | `app/layout.tsx` | 根布局 |
| L1 | `app/[locale]/layout.tsx` | 国际化布局 |
| L2 | `app/[locale]/dashboard/layout.tsx` | Dashboard 布局 |
| L3 | `app/[locale]/admin/layout.tsx` | Admin 布局 |

### 3.3 Server vs Client Components

| 场景 | 组件类型 | 说明 |
|------|---------|------|
| 数据获取、SEO 优先 | Server Component | 默认 |
| 用户交互、Hooks、浏览器 API | Client Component | 需要 "use client" |

---

## 4. 状态管理

### 4.1 状态分类

| 状态类型 | 存储方案 | 说明 |
|---------|---------|------|
| 用户认证 | Zustand + persist | token、用户信息 |
| UI 状态 | Zustand | 侧边栏折叠等 |
| 服务器状态 | React Query | API 数据 |
| 表单状态 | React Hook Form | 表单验证 |

---

## 5. 样式方案

### 5.1 Tailwind CSS

| 规范 | 说明 |
|------|------|
| 禁止内联样式 | 动态高宽除外 |
| 禁止传统 .css | 复杂全局动画或强行覆写第三方组件库除外 |
| 硬编码颜色 | 必须使用 CSS 变量 |
| 响应式设计 | 必须考虑 sm:、md:、lg: 断点 |

### 5.2 禁止颜色

| 禁止 | 说明 |
|------|------|
| purple | 严禁使用紫色系 |
| indigo | 严禁使用靛蓝色系 |
| from-purple-* | 渐变中禁止紫色 |
| to-indigo-* | 渐变中禁止靛蓝 |

### 5.3 允许的色系

| 用途 | 颜色 |
|------|------|
| 主色 | blue-500 ~ blue-700，渐变 from-blue-600 to-cyan-600 |
| 成功 | green |
| 警告 | orange |
| 危险 | red |
| 中性 | slate、gray、zinc |
| 深色背景 | #0a0f1e、slate-900 |

---

## 6. 禁止事项

- 混用 Pages Router 和 App Router
- Server Component 使用 useState/useEffect
- 直接操作 DOM
- 硬编码颜色值 (必须使用 CSS 变量)
- 大量组件写在 page.tsx 中 (必须拆分)
- 代码和注释中出现中文全角标点 (，。！？：)
