# Frontend_Next_js_页面路由规范

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

### 2.1 动态路由

| 模式 | 说明 | 示例 |
|------|------|------|
| `[locale]/` | 多语言前缀 | `/zh/dashboard` |
| `[id]/` | 动态 ID | `/meetings/123` |
| `[[...slug]]/` | 可选通配 | `/docs/a/b/c` |

### 2.2 布局嵌套

| 布局 | 覆盖范围 |
|------|---------|
| `app/layout.tsx` | 全局布局 |
| `app/[locale]/layout.tsx` | 语言布局 |
| `app/[locale]/dashboard/layout.tsx` | Dashboard 布局 |
| `app/[locale]/admin/layout.tsx` | Admin 布局 |

---

## 3. 导航菜单

### 3.1 Dashboard 菜单结构

| 菜单组 | 菜单项 |
|--------|--------|
| AI 工具 | chat, image, video, music, speech |
| 协作 | meeting, report |
| 效率 | excel, doc, docs, json, subtitle |
| 设置 | users, settings, monitor |

### 3.2 Admin 菜单结构

| 菜单组 | 菜单项 |
|--------|--------|
| 管理 | users, system |

---

## 4. 路由守卫

### 4.1 权限检查

| 路由 | 权限要求 |
|------|---------|
| `/login` | 无需登录 |
| `/dashboard/*` | User+ |
| `/admin/*` | Admin |

### 4.2 重定向规则

| 场景 | 跳转目标 |
|------|---------|
| 已登录访问 login | `/dashboard` |
| 未登录访问 dashboard | `/login` |
| 非 admin 访问 admin | `/dashboard` |

---

## 5. 禁止事项

- 使用硬编码路径（使用路径常量）
- 路由层级过深（超过 4 层）
- 缺少 loading.tsx
- 缺少 error.tsx
- 缺少 not-found.tsx