# Frontend Next.js - Admin 后台管理规范

---

## 1. 路由结构

```
src/app/[locale]/admin/
├── page.tsx              # Admin Dashboard
├── layout.tsx            # Admin Layout
├── users/                # 用户管理
│   └── page.tsx
└── system/               # 系统设置
    └── page.tsx
```

---

## 2. 布局规范

### 2.1 Admin Layout

```tsx
// admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 3. Admin 导航

```tsx
const ADMIN_NAV = [
  {
    key: "overview",
    label: "总览",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    key: "management",
    label: "管理",
    items: [
      { label: "用户管理", href: "/admin/users", icon: Users },
      { label: "系统设置", href: "/admin/system", icon: Activity },
    ],
  },
  {
    key: "settings",
    label: "设置",
    items: [
      { label: "应用设置", href: "/admin/settings", icon: Settings },
    ],
  },
];
```

---

## 4. Admin Dashboard

### 4.1 统计卡片

```tsx
const statCards = [
  { label: "总用户", val: stats.total_users, delta: "+12", icon: Users, color: "text-blue-600" },
  { label: "活跃用户", val: stats.active_users, delta: "+5", icon: Activity, color: "text-green-600" },
  { label: "总任务", val: stats.total_tasks, delta: "+28", icon: Zap, color: "text-purple-600" },
  { label: "排队中", val: stats.pending_tasks, delta: "-3", icon: Clock, color: "text-orange-600" },
];
```

### 4.2 系统资源

```tsx
const resourceCards = [
  { label: "CPU 使用率", val: stats.cpu_usage, icon: Cpu },
  { label: "内存使用率", val: stats.memory_usage, icon: HardDrive },
  { label: "磁盘使用率", val: stats.disk_usage, icon: FileText },
];

// 颜色阈值
const usageColor = (val: number) => {
  if (val > 85) return "bg-red-500";
  if (val > 60) return "bg-yellow-500";
  return "bg-green-500";
};
```

---

## 5. 用户管理

### 5.1 用户列表

| 列 | 说明 |
|------|------|
| 用户名 | 昵称 |
| 邮箱 | 登录邮箱 |
| 角色 | guest/user/vip/admin |
| 注册时间 | 创建日期 |
| 最后登录 | 最近活跃 |
| 操作 | 编辑/删除 |

### 5.2 角色管理

| 角色 | 权限 | 说明 |
|------|------|------|
| guest | 基础 | 访客，极低配额 |
| user | 标准 | 普通用户，基础配额 |
| vip | 高级 | VIP，无限配额，可跳过水印 |
| admin | 完全 | 管理员，全部权限 |

### 5.3 配额管理

```tsx
interface QuotaConfig {
  image_generation_limit: number;   // 图片生成次数/月
  audio_synthesis_limit: number;    // 语音合成次数/月
  transcription_minutes_limit: number; // 转录分钟数/月
  meeting_summary_limit: number;    // 会议纪要次数/月
}
```

---

## 6. 系统设置

### 6.1 模型配置

```tsx
interface ModelConfig {
  id: string;
  name: string;        // 模型名称
  provider: string;    // 提供商
  status: "active" | "inactive" | "maintenance";
  rate_limit: number;  // 每分钟调用次数
  cost_per_call: number; // 每次调用成本
}
```

### 6.2 限流规则

```tsx
interface RateLimitConfig {
  key: string;
  limit_type: "global" | "user" | "endpoint";
  max_requests: number;
  window_seconds: number;
}
```

### 6.3 日志查看

| 级别 | 颜色 | 说明 |
|------|------|------|
| info | 蓝色 | 正常操作 |
| warning | 黄色 | 警告信息 |
| error | 红色 | 错误信息 |

---

## 7. 敏感操作

### 7.1 二次确认

```tsx
async function handleDelete(userId: string) {
  const confirmed = window.confirm("确定要删除此用户吗？此操作不可撤销。");
  if (!confirmed) return;
  // 删除逻辑
}
```

### 7.2 审计日志

```tsx
// 所有管理操作记录审计日志
await api.post("/admin/audit", {
  action: "delete_user",
  target_user_id: userId,
  operator_id: currentUser.id,
  timestamp: new Date().toISOString(),
});
```

---

## 8. 禁止事项

- 非管理员访问 admin 路由
- 管理员降级自己
- 删除最后一个 admin
- 敏感操作无二次确认
- 批量操作无确认
- 配置变更无备份
- 操作无审计日志
