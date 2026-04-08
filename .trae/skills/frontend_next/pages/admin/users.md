# Frontend - Admin 用户管理规范

---

## 1. 页面结构

```tsx
// /admin/users/page.tsx
export default function UsersPage() {
  // 用户列表
  // 搜索过滤
  // 分页
}
```

---

## 2. 用户列表

| 列 | 说明 |
|------|------|
| 用户名 | 用户昵称 |
| 邮箱 | 登录邮箱 |
| 角色 | guest/user/vip/admin |
| 注册时间 | 创建日期 |
| 最后登录 | 最近登录 |
| 操作 | 编辑/删除 |

---

## 3. 角色管理

| 角色 | 权限 |
|------|------|
| guest | 访客，极低配额 |
| user | 普通用户，基础配额 |
| vip | VIP 用户，无限配额 |
| admin | 管理员，全部权限 |

---

## 4. 配额管理

| 字段 | 说明 |
|------|------|
| image_generation_limit | 图片生成次数/月 |
| audio_synthesis_limit | 语音合成次数/月 |
| transcription_minutes_limit | 转录分钟数/月 |
| meeting_summary_limit | 会议纪要次数/月 |

---

## 5. 搜索过滤

```tsx
const [searchQuery, setSearchQuery] = useState("");
const filteredUsers = users.filter(u =>
  u.name.includes(searchQuery) || u.email.includes(searchQuery)
);
```

---

## 6. 分页

```tsx
interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}
```

---

## 7. 操作对话框

### 编辑用户

```tsx
interface EditUserDialogProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}
```

### 删除确认

```tsx
// 删除前二次确认
if (!confirm(`确定删除用户 ${user.name}？`)) {
  return;
}
```

---

## 8. 禁止事项

- 管理员降级自己
- 删除最后一个 admin
- 批量删除无确认
- 角色变更无审计日志