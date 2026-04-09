# Frontend_Next_js_权限与认证规范

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

**Store 结构**

| 属性 | 类型 | 说明 |
|------|------|------|
| `user` | `User \| null` | 当前用户信息 |
| `token` | `string \| null` | 认证 Token |
| `setAuth(user, token)` | `() => void` | 设置认证信息 |
| `logout()` | `() => void` | 清除认证信息 |

**User 类型**

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: "guest" | "user" | "vip" | "admin";
  avatar?: string;
}
```

**存储方案**：使用 Zustand + persist，中间件名称为 `auth-storage`

**实现参考**：`frontend_next/src/stores/auth-store.ts`

---

## 3. 权限守卫

### 3.1 角色检查 Hook

**角色层级**

| 层级 | 角色 | 数值 |
|------|------|------|
| 0 | guest | 访客 |
| 1 | user | 普通用户 |
| 2 | vip | VIP 用户 |
| 3 | admin | 管理员 |

**检查逻辑**：用户角色数值 >= 要求角色数值

**实现参考**：`frontend_next/src/hooks/use-permission.ts`

### 3.2 权限组件

**PermissionGuard Props**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `requiredRole` | `User["role"]` | 是 | 最低要求角色 |
| `children` | `ReactNode` | 是 | 有权限时显示 |
| `fallback` | `ReactNode` | 否 | 无权限时显示，默认 null |

**实现参考**：`frontend_next/src/components/permission-guard.tsx`

---

## 4. API 权限

### 4.1 请求拦截器

**拦截器职责**

| 职责 | 说明 |
|------|------|
| Token 注入 | 自动在请求头添加 `Authorization: Bearer {token}` |
| 401 处理 | 收到 401 时自动登出并跳转登录页 |
| 响应解析 | 返回 JSON 格式数据 |

**实现参考**：`frontend_next/src/lib/api-client.ts`

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

**过滤逻辑**

| 条件 | 处理方式 |
|------|---------|
| admin 组 | 仅 admin 角色可见 |
| 其他组 | 根据 `item.roles` 过滤 |

**实现参考**：`frontend_next/src/components/layout/sidebar.tsx`

### 5.2 按钮级权限

```tsx
// 使用示例
<PermissionGuard requiredRole="admin">
  <Button>删除用户</Button>
</PermissionGuard>
```

---

## 6. 敏感操作二次确认

**规范要求**

| 要求 | 说明 |
|------|------|
| 确认对话框 | 删除、批量操作等必须弹窗确认 |
| 不可逆提示 | 必须明确告知操作不可撤销 |
| 错误处理 | 失败时必须显示 toast 提示 |

**实现参考**：`frontend_next/src/hooks/use-confirm-dialog.ts`

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