# Frontend Next.js - Feature-Sliced Design (FSD)

---

## 1. FSD 核心理念

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Feature-Sliced Design                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  "将代码按业务功能（Feature）组织，而非按技术类型（components/）"    │
│                                                                     │
│  传统:                                                              │
│  src/                                                               │
│  ├── components/                                                    │
│  │   ├── button.tsx                                                │
│  │   ├── card.tsx                                                  │
│  │   └── dialog.tsx                                                │
│  ├── hooks/                                                         │
│  │   └── use-chat.ts                                               │
│  └── pages/                                                         │
│      └── chat.tsx                                                  │
│                                                                     │
│  FSD:                                                               │
│  src/                                                               │
│  ├── features/                                                      │
│  │   └── chat/                                                     │
│  │       ├── ui/                                                   │
│  │       │   └── chat-container.tsx                                │
│  │       ├── hooks/                                                │
│  │       │   └── use-chat.ts                                       │
│  │       └── api/                                                  │
│  │           └── chat-api.ts                                       │
│  └── pages/                                                         │
│      └── chat.tsx                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. FSD 切片层级

```
src/
│
├── app/                           # App Router 页面
│   └── [locale]/dashboard/
│       └── chat/page.tsx
│
├── pages/                         # Pages Router (如有)
│
├── widgets/                       # Widgets (可组合的 UI 块)
│   ├── header-widget/
│   │   └── header-widget.tsx
│   └── sidebar-widget/
│       └── sidebar-widget.tsx
│
├── features/                      # Features (业务功能)
│   ├── chat/
│   │   ├── ui/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── index.ts
│   │
│   ├── image-generate/
│   ├── video-generate/
│   ├── meeting/
│   └── report/
│
├── entities/                      # Entities (业务实体)
│   ├── user/
│   │   ├── model.ts              # 用户模型
│   │   ├── api/                  # 用户 API
│   │   └── ui/                   # 用户相关 UI
│   │
│   ├── meeting/
│   │   ├── model.ts
│   │   ├── api/
│   │   └── ui/
│   │
│   └── report/
│
├── shared/                        # Shared (跨 Feature 共享)
│   ├── ui/                       # 通用 UI 组件
│   │   ├── button/
│   │   ├── card/
│   │   └── dialog/
│   │
│   ├── api/                      # 通用 API
│   │   ├── api-client.ts
│   │   └── endpoints/
│   │
│   ├── lib/                      # 通用工具
│   │   ├── utils/
│   │   ├── validators/
│   │   └── formatters/
│   │
│   ├── hooks/                    # 通用 Hooks
│   │   ├── use-local-storage.ts
│   │   └── use-media-query.ts
│   │
│   ├── types/                   # 通用类型
│   │   ├── api.ts
│   │   └── common.ts
│   │
│   └── config/                  # 通用配置
│       ├── constants.ts
│       └── i18n/
│
└── processes/                   # Processes (跨 Feature 流程)
    ├── auth/
    │   └── auth-flow.ts
    └── onboarding/
        └── onboarding-flow.ts
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
| `features/image-generate/` | 图片生成功能 |
| `features/video-generate/` | 视频生成功能 |
| `features/meeting/` | 会议功能 |
| `features/report/` | 报告功能 |

### 3.4 Widgets (部件层)

| 目录 | 职责 |
|------|------|
| `widgets/header-widget/` | 顶部导航部件 |
| `widgets/sidebar-widget/` | 侧边栏部件 |

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
    │   ├── chat-container.tsx
    │   ├── chat-message.tsx
    │   ├── chat-input.tsx
    │   ├── chat-sidebar.tsx
    │   └── chat-header.tsx
    │
    ├── api/                       # Feature API
    │   ├── chat.api.ts
    │   └── types.ts
    │
    ├── hooks/                     # Feature Hooks
    │   ├── use-chat-messages.ts
    │   ├── use-chat-session.ts
    │   ├── use-stream-chat.ts
    │   └── index.ts
    │
    ├── lib/                       # Feature 私有逻辑
    │   ├── chat-utils.ts
    │   ├── message-parser.ts
    │   └── prompt-builder.ts
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
    │   ├── user-avatar.tsx
    │   ├── user-card.tsx
    │   ├── user-badge.tsx
    │   └── user-list/
    │       ├── user-list.tsx
    │       └── user-list-item.tsx
    │
    └── index.ts                  # Barrel Export
```

---

## 6. Shared 模块结构

```
shared/
├── ui/                           # UI 组件库
│   ├── button/
│   │   ├── button.tsx
│   │   ├── button.test.tsx
│   │   └── index.ts
│   │
│   ├── card/
│   │   ├── card.tsx
│   │   ├── card-header.tsx
│   │   ├── card-content.tsx
│   │   └── index.ts
│   │
│   └── ... (其他基础组件)
│
├── api/                          # API 客户端
│   ├── api-client.ts             # 基础封装
│   ├── api-error.ts              # 错误处理
│   ├── endpoints/
│   │   ├── user.endpoints.ts
│   │   └── meeting.endpoints.ts
│   └── index.ts
│
├── lib/                          # 工具库
│   ├── utils/
│   │   ├── cn.ts                 # classnames
│   │   ├── format-date.ts
│   │   └── format-number.ts
│   │
│   ├── validators/
│   │   ├── is-email.ts
│   │   └── is-url.ts
│   │
│   └── index.ts
│
├── hooks/                        # 通用 Hooks
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   ├── use-debounce.ts
│   └── index.ts
│
├── types/                        # 通用类型
│   ├── api.ts                   # API 类型
│   ├── common.ts                # 通用类型
│   └── index.ts
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

## 8. 使用示例

### 8.1 创建新 Feature

```bash
# 创建目录结构
mkdir -p src/features/todo
mkdir -p src/features/todo/ui
mkdir -p src/features/todo/api
mkdir -p src/features/todo/hooks
mkdir -p src/features/todo/types
mkdir -p src/features/todo/lib
```

### 8.2 编写 Feature 代码

```tsx
// features/todo/types/todo.types.ts
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface CreateTodoInput {
  title: string;
}
```

```tsx
// features/todo/api/todo.api.ts
import { api } from "@/shared/api/api-client";
import type { Todo, CreateTodoInput } from "../types/todo.types";

export const todoApi = {
  list: () => api.get<Todo[]>("/todos"),
  create: (data: CreateTodoInput) => api.post<Todo>("/todos", data),
  toggle: (id: string) => api.patch<Todo>(`/todos/${id}`),
  delete: (id: string) => api.delete(`/todos/${id}`),
};
```

```tsx
// features/todo/hooks/use-todos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi } from "../api/todo.api";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: todoApi.list,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
```

```tsx
// features/todo/ui/todo-list.tsx
import { useTodos, useCreateTodo } from "../hooks/use-todos";
import type { CreateTodoInput } from "../types/todo.types";

export function TodoList() {
  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();

  const handleCreate = (input: CreateTodoInput) => {
    createTodo.mutate(input);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {todos?.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
```

### 8.3 Barrel Export

```typescript
// features/todo/index.ts
// UI
export { TodoList } from "./ui/todo-list";
export { TodoItem } from "./ui/todo-item";
export { TodoForm } from "./ui/todo-form";

// Hooks
export { useTodos, useCreateTodo, useDeleteTodo } from "./hooks";

// Types
export type { Todo, CreateTodoInput, UpdateTodoInput } from "./types/todo.types";
```

---

## 9. 禁止事项

- Feature 之间相互依赖
- 在 Shared 中写业务逻辑
- 在 Entities 中写 UI
- 在 App 中写 Feature 逻辑
- 使用相对路径导入跨层模块
