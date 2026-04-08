# Frontend Next.js - 页面路由规范

---

## 1. 路由结构

```
src/app/[locale]/
├── page.tsx                    # 官网首页 (Landing)
├── login/
│   ├── page.tsx                # 登录页
│   └── wecom/callback/         # 企业微信回调
│
├── dashboard/                   # 用户工作台
│   ├── page.tsx                # Dashboard 首页
│   ├── layout.tsx              # Dashboard 布局
│   │
│   ├── chat/                   # AI 对话
│   ├── image/                  # AI 图片
│   ├── video/                  # AI 视频
│   ├── music/                  # AI 音乐
│   ├── speech/                 # 语音处理
│   │
│   ├── meeting/                # 会议管理
│   │   ├── page.tsx            # 会议列表
│   │   └── analytics/          # 会议分析
│   │
│   ├── report/                 # 周报/月报
│   ├── excel/                  # Excel 导入
│   ├── doc/                    # 文档处理
│   ├── docs/                   # 文档中心
│   ├── json/                   # JSON 处理
│   ├── subtitle/               # 字幕处理
│   ├── i18n/                   # 国际化
│   │
│   ├── users/                  # 用户设置
│   ├── settings/               # 应用设置
│   └── monitor/                # 数据大屏
│
└── admin/                      # 后台管理
    ├── page.tsx                # Admin Dashboard
    ├── layout.tsx              # Admin 布局
    ├── users/                  # 用户管理
    └── system/                 # 系统设置
```

---

## 2. 路由分组

### 2.1 公开路由 (无需登录)

| 路由 | 说明 |
|------|------|
| `/` | 官网首页 |
| `/login` | 登录页 |
| `/login/wecom/callback` | 企业微信回调 |

### 2.2 受保护路由 (需要登录)

| 路由 | 说明 | 所需角色 |
|------|------|---------|
| `/dashboard/*` | 用户工作台 | user+ |
| `/admin/*` | 后台管理 | admin |

---

## 3. 路由守卫

### 3.1 Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/zh/login", "/en/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // 公开路径直接放行
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 需要登录的路径
  if (!token) {
    const locale = pathname.split("/")[1] || "zh";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 3.2 布局内权限检查

```tsx
// admin/layout.tsx
useEffect(() => {
  const user = getUser();
  if (!user) {
    router.push(`/${locale}/login`);
    return;
  }
  if (user.role !== "admin") {
    toast({ title: "无权限访问", variant: "destructive" });
    router.push(`/${locale}/dashboard`);
    return;
  }
}, [router, locale]);
```

---

## 4. 路由元数据

### 4.1 页面元数据

```tsx
// dashboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - TRAI",
  description: "用户工作台",
};
```

### 4.2 布局元数据

```tsx
// [locale]/layout.tsx
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return {
    title: {
      default: "TRAI - AI 工作台",
      template: "%s | TRAI",
    },
    description: "智能 AI 工作台",
  };
}
```

---

## 5. 导航结构

### 5.1 Dashboard 侧边栏

```tsx
const DASHBOARD_NAV = [
  { key: "tools", items: [
    { label: "AI 对话", href: "/dashboard/chat", icon: Bot },
    { label: "图片生成", href: "/dashboard/image", icon: Image },
    { label: "视频生成", href: "/dashboard/video", icon: Video },
    { label: "音乐生成", href: "/dashboard/music", icon: Music },
    { label: "语音处理", href: "/dashboard/speech", icon: Mic },
  ]},
  { key: "workspace", items: [
    { label: "会议管理", href: "/dashboard/meeting", icon: FileText },
    { label: "周报/月报", href: "/dashboard/report", icon: BarChart3 },
  ]},
  { key: "settings", items: [
    { label: "设置", href: "/dashboard/settings", icon: Settings },
  ]},
];
```

### 5.2 Admin 侧边栏

```tsx
const ADMIN_NAV = [
  { key: "overview", items: [
    { label: "总览", href: "/admin", icon: LayoutDashboard },
  ]},
  { key: "management", items: [
    { label: "用户管理", href: "/admin/users", icon: Users },
    { label: "系统设置", href: "/admin/system", icon: Activity },
  ]},
];
```

---

## 6. 面包屑导航

```tsx
// components/breadcrumb.tsx
const breadcrumbItems = [
  { label: "首页", href: "/" },
  { label: "工作台", href: "/dashboard" },
  { label: "AI 对话", href: "/dashboard/chat" },
];
```

---

## 7. 禁止事项

- 路由硬编码不带 locale
- 嵌套路由超过 3 层
- 动态路由无参数校验
- 页面组件超过 300 行
- 路由跳转无 loading 状态