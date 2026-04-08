# Frontend Next.js - 现代化分层架构设计

---

## 1. 架构演进

```
┌─────────────────────────────────────────────────────────────────────┐
│                        架构演进历程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MVC (2005)                                                         │
│  ┌─────────┐                                                        │
│  │  View   │◄──── Controller ────► Model                           │
│  └─────────┘                                                        │
│                                                                     │
│  MVP/MVVM (2010)                                                    │
│  ┌─────────┐     ┌─────────┐                                        │
│  │  View   │◄───►│ViewModel│◄───► Model                            │
│  └─────────┘     └─────────┘                                        │
│                                                                     │
│  Redux/Flow (2015)                                                  │
│  ┌──────────────────────────────────────────────────────┐           │
│  │                     UI Layer                          │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                   Business Logic                       │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │                    Data Layer                          │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
│  Feature-Sliced Design (2020+)  ◄──── 现代主流                     │
│  ┌──────────────────────────────────────────────────────┐           │
│  │                      App                             │           │
│  ├──────────┬──────────┬──────────┬──────────┬─────────┤           │
│  │  Shared  │ Features │ Entities │  Widgets │ Pages   │           │
│  └──────────┴──────────┴──────────┴──────────┴─────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. TRAI 五层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRAI Frontend Layers                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  L1: Presentation Layer (展示层)                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Pages / Layouts / UI Components                             │   │
│  │  ├── app/[locale]/dashboard/page.tsx                       │   │
│  │  ├── components/ui/button.tsx                               │   │
│  │  └── components/layout/sidebar.tsx                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                       │
│                              │                                       │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                       │
│  L2: Feature Layer (功能层)                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Business Features / Use Cases                              │   │
│  │  ├── features/chat/           # AI 对话功能                 │   │
│  │  ├── features/image-generate/ # 图片生成功能                │   │
│  │  ├── features/meeting/       # 会议管理功能                │   │
│  │  └── features/report/         # 报告生成功能                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                       │
│                              │                                       │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                       │
│  L3: Domain Layer (领域层)                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Entities / Business Models / Types                         │   │
│  │  ├── domains/user/           # 用户领域                     │   │
│  │  ├── domains/meeting/       # 会议领域                     │   │
│  │  ├── domains/report/         # 报告领域                     │   │
│  │  └── domains/ai/             # AI 领域                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                       │
│                              │                                       │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                       │
│  L4: Data Access Layer (数据层)                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  API Clients / Repositories / State Management              │   │
│  │  ├── lib/api-client.ts      # API 客户端                    │   │
│  │  ├── lib/repositories/      # 数据仓库                      │   │
│  │  ├── stores/                # Zustand Store                │   │
│  │  └── hooks/                 # React Query Hooks            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                       │
│                              │                                       │
├──────────────────────────────┼──────────────────────────────────────┤
│                              ▼                                       │
│  L5: Infrastructure Layer (基础设施层)                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Utils / Config / External Services                         │   │
│  │  ├── lib/utils.ts          # 工具函数                      │   │
│  │  ├── lib/logging.ts        # 日志                          │   │
│  │  ├── lib/i18n.ts           # 国际化                        │   │
│  │  └── config/               # 配置文件                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 每层职责

### L1: Presentation Layer (展示层)

| 职责 | 说明 |
|------|------|
| UI 渲染 | React 组件渲染 |
| 用户交互 | 点击、输入等事件 |
| 布局编排 | 组合子组件 |
| 样式管理 | Tailwind CSS 类 |

### L2: Feature Layer (功能层)

| 职责 | 说明 |
|------|------|
| 业务逻辑 | 功能特定的逻辑 |
| Use Case | 用例编排 |
| 副作用处理 | API 调用、状态更新 |
| Feature 独立 | 每个 Feature 自包含 |

### L3: Domain Layer (领域层)

| 职责 | 说明 |
|------|------|
| 实体定义 | 核心业务实体 |
| 业务规则 | 领域规则验证 |
| 类型定义 | TypeScript 类型 |
| 接口定义 | Entity 接口 |

### L4: Data Access Layer (数据层)

| 职责 | 说明 |
|------|------|
| API 调用 | HTTP 请求 |
| 数据转换 | API → Domain |
| 缓存策略 | React Query 缓存 |
| 状态管理 | Zustand 全局状态 |

### L5: Infrastructure Layer (基础设施层)

| 职责 | 说明 |
|------|------|
| 工具函数 | 通用函数 |
| 日志记录 | 错误追踪 |
| 国际化 | 多语言支持 |
| 配置管理 | 环境变量 |

---

## 4. 层间依赖规则

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Dependency Rule                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   L1 (Presentation) ──────────► L2 (Feature)                       │
│         │                           │                               │
│         │                           ▼                               │
│         │                    L3 (Domain)                            │
│         │                           │                               │
│         │                           ▼                               │
│         │               L4 (Data Access)                           │
│         │                           │                               │
│         │                           ▼                               │
│         └──────────────────► L5 (Infrastructure)                   │
│                                                                     │
│   Rule: 每层只能依赖其下层，禁止反向依赖                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 依赖方向

```typescript
// ✅ 正确: 依赖下层
// L1 → L2 → L3 → L4 → L5
// Presentation → Feature → Domain → Data → Infrastructure

// ❌ 错误: 依赖上层
// Feature 不应直接导入 Page
// Domain 不应直接导入 UI 组件
```

---

## 5. 模块边界

### 5.1 Feature 模块边界

```
features/
└── chat/                    # AI 对话 Feature
    ├── ui/                  # Feature 私有 UI (仅本 Feature 使用)
    │   ├── chat-input.tsx
    │   ├── chat-message.tsx
    │   └── chat-sidebar.tsx
    ├── api/                 # Feature API
    │   └── chat-api.ts
    ├── hooks/               # Feature Hooks
    │   ├── use-chat-messages.ts
    │   └── use-chat-session.ts
    ├── types/               # Feature Types
    │   └── chat-types.ts
    ├── lib/                 # Feature 私有逻辑
    │   └── chat-utils.ts
    └── index.ts            # 公开接口
```

### 5.2 Domain 模块边界

```
domains/
└── user/
    ├── entities/           # 实体
    │   └── user.entity.ts
    ├── value-objects/     # 值对象
    │   └── email.vo.ts
    ├── interfaces/        # 接口
    │   └── i-user.repository.ts
    └── types/             # 领域类型
        └── user.types.ts
```

---

## 6. 依赖注入

### 6.1 Context 注入

```tsx
// contexts/api-context.tsx
interface ApiContextValue {
  userRepository: IUserRepository;
  meetingRepository: IMeetingRepository;
}

const ApiContext = createContext<ApiContextValue | null>(null);

// 使用
const { userRepository } = useContext(ApiContext);
```

### 6.2 Hook 注入

```tsx
// hooks/use-repositories.ts
export function useUserRepository(): IUserRepository {
  const context = useContext(ApiContext);
  if (!context) throw new Error("Context not found");
  return context.userRepository;
}
```

---

## 7. 禁止事项

- 上层依赖上层 (如 Feature 依赖 Page)
- 循环依赖
- 在 Domain 层使用 UI 组件
- 在 Presentation 层写业务逻辑
- 绕过中间层直接调用 API