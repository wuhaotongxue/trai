# Frontend_Next_js_Feature_Sliced_Design__FSD_

---

## 1. FSD 核心理念

**核心思想**：将代码按业务功能（Feature）组织，而非按技术类型（components/）

| 组织方式 | 说明 |
|---------|------|
| 传统 | 按 components/、hooks/、pages/ 技术分类 |
| FSD | 按 chat/、meeting/、report/ 功能分类 |

---

## 2. FSD 切片层级

```
src/
│
├── app/                           # App Router 页面
│   └── [locale]/dashboard/
│       └── chat/page.tsx
│
├── widgets/                       # Widgets (可组合的 UI 块)
│   ├── header_widget/
│   └── sidebar_widget/
│
├── features/                      # Features (业务功能)
│   ├── chat/
│   ├── image_generate/
│   ├── video_generate/
│   ├── meeting/
│   └── report/
│
├── entities/                      # Entities (业务实体)
│   ├── user/
│   ├── meeting/
│   └── report/
│
├── shared/                        # Shared (跨 Feature 共享)
│   ├── ui/                       # 通用 UI 组件
│   ├── api/                      # 通用 API
│   ├── lib/                      # 通用工具
│   ├── hooks/                    # 通用 Hooks
│   ├── types/                    # 通用类型
│   └── config/                   # 通用配置
│
└── processes/                     # Processes (跨 Feature 流程)
    ├── auth/
    └── onboarding/
```

---

## 3. 各层职责

### 3.1 Shared (共享层)

| 目录 | 职责 |
|------|------|
| `shared/ui/` | 通用 UI 组件库 |
| `shared/api/` | API 客户端封装 |
| `shared/lib/` | 通用工具函数 |
| `shared/hooks/` | 通用 Hooks |
| `shared/types/` | 通用类型定义 |
| `shared/config/` | 通用配置 |

### 3.2 Entities (实体层)

| 目录 | 职责 |
|------|------|
| `entities/user/` | 用户实体及周边 |
| `entities/meeting/` | 会议实体及周边 |
| `entities/report/` | 报告实体及周边 |

### 3.3 Features (功能层)

| 目录 | 职责 |
|------|------|
| `features/chat/` | AI 对话功能 |
| `features/image_generate/` | 图片生成功能 |
| `features/video_generate/` | 视频生成功能 |
| `features/meeting/` | 会议功能 |
| `features/report/` | 报告功能 |

### 3.4 Widgets (部件层)

| 目录 | 职责 |
|------|------|
| `widgets/header_widget/` | 顶部导航部件 |
| `widgets/sidebar_widget/` | 侧边栏部件 |

### 3.5 Processes (流程层)

| 目录 | 职责 |
|------|------|
| `processes/auth/` | 认证流程 |
| `processes/onboarding/` | 引导流程 |

---

## 4. Feature 模块结构

```
features/
└── chat/                           # AI 对话功能
    │
    ├── ui/                        # Feature 私有 UI
    │   ├── chat_container.tsx
    │   ├── chat_message.tsx
    │   ├── chat_input.tsx
    │   ├── chat_sidebar.tsx
    │   └── chat_header.tsx
    │
    ├── api/                       # Feature API
    │   ├── chat.api.ts
    │   └── types.ts
    │
    ├── hooks/                     # Feature Hooks
    │   ├── use_chat_messages.ts
    │   ├── use_chat_session.ts
    │   ├── use_stream_chat.ts
    │   └── index.ts
    │
    ├── lib/                       # Feature 私有逻辑
    │   ├── chat_utils.ts
    │   ├── message_parser.ts
    │   └── prompt_builder.ts
    │
    ├── types/                     # Feature 类型
    │   ├── chat.types.ts
    │   ├── message.types.ts
    │   └── session.types.ts
    │
    ├── constants/                 # Feature 常量
    │   └── chat.constants.ts
    │
    └── index.ts                   # Barrel Export
```

---

## 5. Entity 模块结构

```
entities/
└── user/
    │
    ├── model.ts                   # 用户实体定义
    │   ├── User                   # 用户类
    │   ├── UserRole               # 角色枚举
    │   └── UserQuota             # 用户配额
    │
    ├── api/                      # 用户 API
    │   ├── user.api.ts
    │   └── types.ts
    │
    ├── ui/                       # 用户相关 UI
    │   ├── user_avatar.tsx
    │   ├── user_card.tsx
    │   ├── user_badge.tsx
    │   └── user_list/
    │       ├── user_list.tsx
    │       └── user_list_item.tsx
    │
    └── index.ts                  # Barrel Export
```

---

## 6. Shared 模块结构

```
shared/
├── ui/                           # UI 组件库
│   ├── button/
│   ├── card/
│   └── ... (其他基础组件)
│
├── api/                          # API 客户端
│   ├── api_client.ts             # 基础封装
│   ├── api_error.ts              # 错误处理
│   └── endpoints/
│       ├── user.endpoints.ts
│       └── meeting.endpoints.ts
│
├── lib/                          # 工具库
│   ├── utils/                   # cn.ts, format_date.ts
│   └── validators/               # is_email.ts, is_url.ts
│
├── hooks/                        # 通用 Hooks
│   ├── use_local_storage.ts
│   ├── use_media_query.ts
│   └── use_debounce.ts
│
├── types/                        # 通用类型
│   ├── api.ts                   # API 类型
│   └── common.ts                # 通用类型
│
└── config/                      # 配置文件
    ├── constants.ts
    └── i18n/
        └── index.ts
```

---

## 7. 跨层依赖规则

```
                    ┌─────────────┐
                    │    App      │
                    │  (Pages)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Widgets │ │Features  │ │Processes │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └─────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Entities  │ │Entities  │ │ Entities │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └─────────────┼────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Shared    │
                    └─────────────┘

    Rule: 只允许从上到下依赖，禁止从下到上
```

---

## 8. 创建新 Feature

### 8.1 目录结构

| 目录 | 说明 |
|------|------|
| `features/xxx/ui/` | Feature 私有 UI |
| `features/xxx/api/` | Feature API |
| `features/xxx/hooks/` | Feature Hooks |
| `features/xxx/types/` | Feature 类型 |
| `features/xxx/lib/` | Feature 私有逻辑 |
| `features/xxx/index.ts` | Barrel Export |

### 8.2 Barrel Export 规范

```typescript
// features/xxx/index.ts
// UI
export { XxxList } from "./ui/xxx_list";
export { XxxItem } from "./ui/xxx_item";
export { XxxForm } from "./ui/xxx_form";

// Hooks
export { useXxxs, useCreateXxx, useDeleteXxx } from "./hooks";

// Types
export type { Xxx, CreateXxxInput, UpdateXxxInput } from "./types/xxx.types";
```

**实现参考**：`frontend_next/src/features/`

---

## 9. 禁止事项

- Feature 之间相互依赖
- 在 Shared 中写业务逻辑
- 在 Entities 中写 UI
- 在 App 中写 Feature 逻辑
- 使用相对路径导入跨层模块