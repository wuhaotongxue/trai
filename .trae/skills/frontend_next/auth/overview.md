# Frontend Next.js - 权限与认证规范

---

## 1. 用户角色

| 角色 | 值 | 说明 | 权限 |
|------|---|------|------|
| Guest | `guest` | 访客用户 | 极低配额，无法访问管理后台 |
| User | `user` | 普通用户 | 基础配额，可使用 AI 工具 |
| VIP | `vip` | VIP 用户 | 无限配额，可跳过水印 |
| Admin | `admin` | 管理员 | 全部权限，访问管理后台 |

---

## 2. 认证流程

### 2.1 登录流程

```
用户输入 -> 企业微信扫码 -> 回调验证 -> 获取 Token -> 存储 Token -> 跳转首页
```

### 2.2 Token 存储

```tsx
// lib/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "guest" | "user" | "vip" | "admin";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "auth-storage" }
  )
);
```

---

## 3. 权限守卫

### 3.1 角色检查 Hook

```tsx
// hooks/use-permission.ts
import { useAuthStore } from "@/stores/auth-store";

export function usePermission(requiredRole: User["role"]) {
  const user = useAuthStore((state) => state.user);

  const roleHierarchy = { guest: 0, user: 1, vip: 2, admin: 3 };
  const userLevel = roleHierarchy[user?.role || "guest"];
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}
```

### 3.2 权限组件

```tsx
// components/permission-guard.tsx
"use client";

import { usePermission } from "@/hooks/use-permission";
import { ReactNode } from "react";

interface PermissionGuardProps {
  requiredRole: User["role"];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ requiredRole, children, fallback = null }) {
  const hasPermission = usePermission(requiredRole);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
```

---

## 4. API 权限

### 4.1 请求拦截器

```tsx
// lib/api-client.ts
import { useAuthStore } from "@/stores/auth-store";

async function apiRequest(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/login";
  }

  return response.json();
}
```

### 4.2 API 权限矩阵

| API | Guest | User | VIP | Admin |
|-----|-------|------|-----|-------|
| GET /users | - | - | - | Yes |
| PUT /users/:id | - | Self | Self | Yes |
| POST /ai/generate | Limited | Yes | Yes | Yes |
| GET /admin/stats | - | - | - | Yes |

---

## 5. 页面权限

### 5.1 导航项权限过滤

```tsx
// components/layout/sidebar.tsx
const user = useAuthStore((state) => state.user);

const filteredNav = DASHBOARD_NAV.filter((group) => {
  if (group.key === "admin") {
    return user?.role === "admin";
  }
  return true;
}).map((group) => ({
  ...group,
  items: group.items.filter((item) => {
    // 根据 item.roles 过滤
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "guest");
  }),
}));
```

### 5.2 按钮级权限

```tsx
// 使用示例
<PermissionGuard requiredRole="admin">
  <Button>删除用户</Button>
</PermissionGuard>
```

---

## 6. 敏感操作二次确认

```tsx
// 危险操作确认对话框
async function handleDelete(userId: string) {
  const confirmed = window.confirm("确定要删除此用户吗？此操作不可撤销。");
  if (!confirmed) return;

  try {
    await apiDelete(`/users/${userId}`);
    toast({ title: "删除成功" });
  } catch (error) {
    toast({ title: "删除失败", variant: "destructive" });
  }
}
```

---

## 7. 审计日志

| 操作类型 | 记录内容 |
|---------|---------|
| 登录/登出 | 用户、时间、IP |
| 权限变更 | 操作人、被操作人、旧/新角色 |
| 敏感数据访问 | 用户、资源、时间 |
| 管理操作 | 管理员、操作内容、结果 |

---

## 8. 禁止事项

- Token 存储在 localStorage (必须用 httpOnly cookie 或加密存储)
- 前端仅靠隐藏元素做权限控制
- 权限变更无审计日志
- 管理员操作无二次确认
- API 请求不带 Token