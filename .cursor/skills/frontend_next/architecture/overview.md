# Frontend Next.js - 技术架构总览

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
│   │   │   ├── sidebar.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── quick-chat.tsx
│   │   │   ├── theme-switcher.tsx
│   │   │   └── language-switcher.tsx
│   │   ├── ui/                        # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── business/                  # 业务组件
│   │   │   ├── meeting/
│   │   │   └── report/
│   │   └── feature/                   # 功能组件
│   │       └── ai-generate/
│   │
│   ├── lib/                           # 工具库
│   │   ├── api-client.ts              # API 调用封装
│   │   ├── auth.ts                    # 认证工具
│   │   ├── utils.ts                   # 通用工具
│   │   └── logging.ts                 # 日志工具
│   │
│   ├── hooks/                         # 自定义 Hooks
│   │   ├── use-auth.ts
│   │   ├── use-api.ts
│   │   └── use-logging.ts
│   │
│   ├── stores/                        # Zustand 状态
│   │   ├── auth-store.ts
│   │   ├── app-store.ts
│   │   └── chat-store.ts
│   │
│   ├── i18n/                          # 国际化
│   │   ├── messages/
│   │   │   ├── zh.json
│   │   │   └── en.json
│   │   └── request.ts
│   │
│   └── middleware.ts                  # 中间件
│
├── public/                            # 静态资源
├── next.config.js
└── package.json
```

---

## 3. 核心原则

### 3.1 App Router 规范

```tsx
// ✅ 正确: 使用 App Router
export default function Page() {
  return <div>Page Content</div>;
}

// ❌ 错误: 使用 Pages Router
export default function Page() {
  return <div>Deprecated</div>;
}
```

### 3.2 布局层级

| 层级 | 文件 | 说明 |
|------|------|------|
| L0 | `app/layout.tsx` | 根布局 |
| L1 | `app/[locale]/layout.tsx` | 国际化布局 |
| L2 | `app/[locale]/dashboard/layout.tsx` | Dashboard 布局 |
| L3 | `app/[locale]/admin/layout.tsx` | Admin 布局 |

### 3.3 Server vs Client Components

```tsx
// ✅ Server Component (默认)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Client Component (需要交互)
"use client";
export default function ClientPage() {
  const [state, setState] = useState();
  return <div>{state}</div>;
}
```

---

## 4. 状态管理

### 4.1 Zustand Store

```tsx
// stores/auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "auth-storage" }
  )
);
```

### 4.2 状态分类

| 状态类型 | 存储方案 | 说明 |
|---------|---------|------|
| 用户认证 | Zustand + persist | token、用户信息 |
| UI 状态 | Zustand | 侧边栏折叠等 |
| 服务器状态 | React Query | API 数据 |
| 表单状态 | React Hook Form | 表单验证 |

---

## 5. 样式方案

### 5.1 Tailwind CSS 变量

```tsx
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
    },
  },
};
```

### 5.2 暗色模式

```tsx
// components/theme-provider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
```

---

## 6. 禁止事项

- 混用 Pages Router 和 App Router
- Server Component 使用 useState/useEffect
- 直接操作 DOM
- 硬编码颜色值 (必须使用 CSS 变量)
- 大量组件写在 page.tsx 中 (必须拆分)
