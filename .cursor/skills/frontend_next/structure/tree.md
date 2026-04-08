# Frontend Next.js - 树形目录结构规范

---

## 1. 完整目录树

```
frontend_next/
│
├── src/
│   ├── app/                              # App Router (Next.js 13+)
│   │   ├── [locale]/                    # 国际化路由
│   │   │   ├── page.tsx                # Landing 官网首页
│   │   │   │
│   │   │   ├── login/                  # 登录模块
│   │   │   │   ├── page.tsx            # 登录页
│   │   │   │   └── wecom/
│   │   │   │       └── callback/
│   │   │   │           └── page.tsx    # 企业微信回调
│   │   │   │
│   │   │   ├── dashboard/              # 用户工作台
│   │   │   │   ├── page.tsx            # Dashboard 首页
│   │   │   │   ├── layout.tsx          # Dashboard 布局
│   │   │   │   │
│   │   │   │   ├── chat/               # AI 对话
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── image/              # 图片生成
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── video/              # 视频生成
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── music/               # 音乐生成
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── speech/              # 语音处理
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── meeting/             # 会议管理
│   │   │   │   │   ├── page.tsx         # 会议列表
│   │   │   │   │   └── analytics/
│   │   │   │   │       └── page.tsx     # 会议分析
│   │   │   │   │
│   │   │   │   ├── report/              # 周报/月报
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── excel/               # Excel 导入
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── doc/                 # 文档处理
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── docs/                # 文档中心
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── json/                # JSON 处理
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── subtitle/             # 字幕处理
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── i18n/                 # 国际化
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── users/               # 用户设置
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── settings/             # 应用设置
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── monitor/             # 数据大屏
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── admin/                   # 后台管理
│   │   │       ├── page.tsx             # Admin Dashboard
│   │   │       ├── layout.tsx           # Admin 布局
│   │   │       ├── users/               # 用户管理
│   │   │       │   └── page.tsx
│   │   │       └── system/              # 系统设置
│   │   │           └── page.tsx
│   │   │
│   │   ├── layout.tsx                   # 根布局
│   │   └── globals.css                  # 全局样式
│   │
│   ├── components/                      # 组件目录
│   │   │
│   │   ├── layout/                      # 布局组件
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── sidebar-nav.tsx
│   │   │   │   └── sidebar-item.tsx
│   │   │   ├── navbar/
│   │   │   │   ├── navbar.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   └── user-menu.tsx
│   │   │   ├── quick-chat/
│   │   │   │   └── quick-chat.tsx
│   │   │   ├── theme-switcher/
│   │   │   │   └── theme-switcher.tsx
│   │   │   └── language-switcher/
│   │   │       └── language-switcher.tsx
│   │   │
│   │   ├── ui/                          # shadcn/ui 基础组件
│   │   │   ├── button/
│   │   │   │   └── button.tsx
│   │   │   ├── card/
│   │   │   │   ├── card.tsx
│   │   │   │   ├── card-header.tsx
│   │   │   │   ├── card-content.tsx
│   │   │   │   └── card-footer.tsx
│   │   │   ├── dialog/
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dialog-content.tsx
│   │   │   │   └── dialog-header.tsx
│   │   │   ├── input/
│   │   │   │   └── input.tsx
│   │   │   ├── badge/
│   │   │   │   └── badge.tsx
│   │   │   ├── select/
│   │   │   │   └── select.tsx
│   │   │   ├── table/
│   │   │   │   ├── table.tsx
│   │   │   │   ├── table-header.tsx
│   │   │   │   ├── table-row.tsx
│   │   │   │   └── table-cell.tsx
│   │   │   ├── tabs/
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── tabs-list.tsx
│   │   │   │   └── tabs-content.tsx
│   │   │   ├── toast/
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   └── use-toast.ts
│   │   │   ├── avatar/
│   │   │   │   └── avatar.tsx
│   │   │   ├── progress/
│   │   │   │   └── progress.tsx
│   │   │   ├── separator/
│   │   │   │   └── separator.tsx
│   │   │   ├── dropdown-menu/
│   │   │   │   └── dropdown-menu.tsx
│   │   │   ├── switch/
│   │   │   │   └── switch.tsx
│   │   │   ├── label/
│   │   │   │   └── label.tsx
│   │   │   ├── textarea/
│   │   │   │   └── textarea.tsx
│   │   │   └── file-upload/
│   │   │       └── file-upload.tsx
│   │   │
│   │   ├── business/                     # 业务组件
│   │   │   ├── meeting/
│   │   │   │   ├── meeting-list.tsx
│   │   │   │   ├── meeting-card.tsx
│   │   │   │   ├── meeting-detail-card.tsx
│   │   │   │   ├── meeting-recorder-dialog.tsx
│   │   │   │   └── meeting-analytics-dashboard.tsx
│   │   │   │
│   │   │   └── report/
│   │   │       ├── report-list.tsx
│   │   │       ├── report-card.tsx
│   │   │       ├── report-dashboard.tsx
│   │   │       ├── report-edit-dialog.tsx
│   │   │       ├── report-export-dialog.tsx
│   │   │       └── git-analyze-dialog.tsx
│   │   │
│   │   └── feature/                     # 功能组件
│   │       ├── ai-generate/
│   │       │   ├── image-generator.tsx
│   │       │   ├── video-generator.tsx
│   │       │   ├── music-generator.tsx
│   │       │   ├── speech-synthesizer.tsx
│   │       │   └── transcript-editor.tsx
│   │       │
│   │       └── chat/
│   │           ├── chat-container.tsx
│   │           ├── chat-message.tsx
│   │           ├── chat-input.tsx
│   │           └── chat-header.tsx
│   │
│   ├── lib/                             # 工具库
│   │   ├── api-client.ts                # API 客户端
│   │   ├── auth.ts                      # 认证工具
│   │   ├── utils.ts                     # 通用工具
│   │   ├── utils.test.ts               # 工具测试
│   │   ├── logging.ts                   # 日志工具
│   │   ├── errors.ts                    # 错误类型
│   │   │
│   │   ├── repositories/                # 数据仓库
│   │   │   ├── user.repository.ts
│   │   │   ├── meeting.repository.ts
│   │   │   └── report.repository.ts
│   │   │
│   │   ├── constants/                   # 常量
│   │   │   ├── api.ts                   # API 端点常量
│   │   │   ├── routes.ts               # 路由常量
│   │   │   └── config.ts               # 配置常量
│   │   │
│   │   └── validators/                  # 验证器
│   │       ├── user.validator.ts
│   │       └── meeting.validator.ts
│   │
│   ├── hooks/                           # 自定义 Hooks
│   │   ├── use-auth.ts                  # 认证 Hook
│   │   ├── use-permission.ts            # 权限 Hook
│   │   ├── use-api.ts                   # API Hook
│   │   ├── use-page-view.ts             # 页面浏览 Hook
│   │   ├── use-health-check.ts          # 健康检查 Hook
│   │   ├── use-websocket.ts             # WebSocket Hook
│   │   │
│   │   └── feature/                     # Feature Hooks
│   │       ├── use-chat.ts
│   │       ├── use-meeting.ts
│   │       └── use-report.ts
│   │
│   ├── stores/                          # Zustand 状态
│   │   ├── auth-store.ts                # 认证状态
│   │   ├── app-store.ts                 # 应用状态
│   │   ├── chat-store.ts                # 聊天状态
│   │   └── ui-store.ts                  # UI 状态
│   │
│   ├── domains/                         # 领域层
│   │   ├── user/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   └── email.vo.ts
│   │   │   ├── interfaces/
│   │   │   │   └── i-user.repository.ts
│   │   │   └── types/
│   │   │       └── user.types.ts
│   │   │
│   │   ├── meeting/
│   │   │   ├── entities/
│   │   │   │   └── meeting.entity.ts
│   │   │   └── types/
│   │   │       └── meeting.types.ts
│   │   │
│   │   └── report/
│   │       ├── entities/
│   │       │   └── report.entity.ts
│   │       └── types/
│   │           └── report.types.ts
│   │
│   ├── features/                        # 功能模块 (Feature-Sliced)
│   │   ├── chat/
│   │   │   ├── ui/
│   │   │   │   ├── chat-container.tsx
│   │   │   │   ├── chat-message.tsx
│   │   │   │   └── chat-input.tsx
│   │   │   ├── api/
│   │   │   │   └── chat-api.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-chat-messages.ts
│   │   │   │   └── use-chat-session.ts
│   │   │   ├── types/
│   │   │   │   └── chat-types.ts
│   │   │   ├── lib/
│   │   │   │   └── chat-utils.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── meeting/
│   │   │   ├── ui/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   │
│   │   └── report/
│   │       ├── ui/
│   │       ├── api/
│   │       ├── hooks/
│   │       ├── types/
│   │       ├── lib/
│   │       └── index.ts
│   │
│   ├── contexts/                         # React Context
│   │   ├── api-context.tsx              # API Context
│   │   ├── auth-context.tsx             # 认证 Context
│   │   └── theme-context.tsx            # 主题 Context
│   │
│   ├── i18n/                           # 国际化
│   │   ├── request.ts                   # 服务端配置
│   │   ├── routing.ts                   # 路由配置
│   │   └── messages/
│   │       ├── zh.json
│   │       ├── en.json
│   │       └── zh-TW.json
│   │
│   ├── config/                          # 配置
│   │   ├── site.ts                     # 站点配置
│   │   ├── navigation.ts               # 导航配置
│   │   └── constants.ts                # 常量配置
│   │
│   ├── types/                           # 全局类型
│   │   ├── global.d.ts                 # 全局声明
│   │   ├── next.d.ts                   # Next.js 类型
│   │   └── react.d.ts                  # React 类型
│   │
│   └── middleware.ts                    # 中间件
│
├── public/                              # 静态资源
│   ├── images/
│   │   ├── og-image.png               # Open Graph 图片
│   │   └── logos/
│   ├── fonts/
│   └── icons/
│
├── tests/                              # 测试
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                         # 本地环境变量
├── .env.production                     # 生产环境变量
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. 命名规范

### 2.1 目录命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面目录 | kebab-case | `chat/`, `meeting/` |
| 组件目录 | kebab-case | `meeting-card/` |
| 工具目录 | kebab-case | `api-client/` |
| 模块目录 | kebab-case | `chat/` |

### 2.2 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 页面文件 | kebab-case + page.tsx | `chat-page.tsx` |
| 组件文件 | kebab-case + .tsx | `meeting-card.tsx` |
| Hook 文件 | use-xxx.ts | `use-chat.ts` |
| 类型文件 | xxx.types.ts | `chat.types.ts` |
| API 文件 | xxx-api.ts | `chat-api.ts` |
| Store 文件 | xxx-store.ts | `chat-store.ts` |

### 2.3 组件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `MeetingCard` |
| Props 接口 | XxxProps | `MeetingCardProps` |
| 样式文件 | xxx.module.css | xxx.module.css |

---

## 3. 导出规范

### 3.1 Barrel Export (index.ts)

```typescript
// features/chat/index.ts
// 公开接口
export { ChatContainer } from "./ui/chat-container";
export { ChatInput } from "./ui/chat-input";
export { useChatMessages } from "./hooks/use-chat-messages";
export type { ChatMessage, ChatSession } from "./types/chat-types";
```

### 3.2 路径别名

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/domains/*": ["./src/domains/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

---

## 4. 禁止事项

- 使用 PascalCase 命名目录
- 在 components 直接写页面组件
- 混用中文和英文命名
- 目录嵌套超过 4 层
- 循环引用目录
