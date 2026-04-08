# Frontend Next.js - 现代设计模式规范

---

## 1. 设计模式总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend Design Patterns                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  创建型模式                                                         │
│  ├── Factory Method     # 组件工厂                                 │
│  ├── Abstract Factory   # API 工厂                                 │
│  ├── Builder            # Query Builder                             │
│  └── Singleton          # Store 实例                                │
│                                                                     │
│  结构型模式                                                         │
│  ├── Adapter            # API 适配器                               │
│  ├── Decorator          # HOC / Wrapped Component                  │
│  ├── Facade             # API Client 门面                          │
│  └── Proxy              # 虚拟代理 (图片懒加载)                    │
│                                                                     │
│  行为型模式                                                         │
│  ├── Observer           # React 状态 / EventEmitter                 │
│  ├── Strategy           # 验证策略                                 │
│  ├── Command            # 操作命令                                 │
│  └── Chain of Responsibility # 中间件                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 创建型模式

### 2.1 Factory Method - 组件工厂

```tsx
// factories/component-factory.ts
interface ComponentConfig {
  type: "text" | "image" | "video" | "audio";
  props: Record<string, unknown>;
}

function createBlockComponent(config: ComponentConfig) {
  switch (config.type) {
    case "text":
      return <TextBlock {...config.props} />;
    case "image":
      return <ImageBlock {...config.props} />;
    case "video":
      return <VideoBlock {...config.props} />;
    case "audio":
      return <AudioBlock {...config.props} />;
    default:
      throw new Error(`Unknown block type: ${config.type}`);
  }
}
```

### 2.2 Abstract Factory - API 工厂

```tsx
// factories/api-factory.ts
interface ApiFactory {
  createUserApi(): UserApi;
  createMeetingApi(): MeetingApi;
  createReportApi(): ReportApi;
}

class ProductionApiFactory implements ApiFactory {
  createUserApi() {
    return new ProductionUserApi();
  }
  createMeetingApi() {
    return new ProductionMeetingApi();
  }
  createReportApi() {
    return new ProductionReportApi();
  }
}

class MockApiFactory implements ApiFactory {
  createUserApi() {
    return new MockUserApi();
  }
  // ...
}
```

### 2.3 Builder - Query Builder

```tsx
// builders/query-builder.ts
class ApiQueryBuilder {
  private endpoint: string;
  private params: Record<string, string> = {};
  private headers: Record<string, string> = {};

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  param(key: string, value: string | number) {
    this.params[key] = String(value);
    return this;
  }

  headers(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  build() {
    return { endpoint: this.endpoint, params: this.params, headers: this.headers };
  }
}

// 使用
const query = new ApiQueryBuilder("/users")
  .param("page", 1)
  .param("limit", 20)
  .param("role", "user")
  .headers({ Authorization: "Bearer xxx" })
  .build();
```

### 2.4 Singleton - Store

```tsx
// stores/auth-store.ts
// Zustand 默认就是 Singleton
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      // ...
    }),
    { name: "auth-storage" }
  )
);

// 使用 (每次调用获取同一个实例)
const store1 = useAuthStore();
const store2 = useAuthStore();
console.log(store1 === store2); // true (在 React 环境下)
```

---

## 3. 结构型模式

### 3.1 Adapter - API 适配器

```tsx
// adapters/api-adapter.ts
interface ExternalApiResponse {
  USER_ID: string;
  USER_NAME: string;
  user_email: string;
  joined_date: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

class UserApiAdapter {
  static toDomain(external: ExternalApiResponse): User {
    return {
      id: external.USER_ID,
      name: external.USER_NAME,
      email: external.user_email,
      createdAt: new Date(external.joined_date),
    };
  }

  static toExternal(user: User): ExternalApiResponse {
    return {
      USER_ID: user.id,
      USER_NAME: user.name,
      user_email: user.email,
      joined_date: user.createdAt.toISOString(),
    };
  }
}
```

### 3.2 Decorator - HOC

```tsx
// decorators/with-loading.tsx
function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & { isLoading?: boolean }) {
    if (props.isLoading) {
      return <Skeleton />;
    }
    return <WrappedComponent {...props} />;
  };
}

// 使用
const UserCardWithLoading = withLoading(UserCard);
<UserCardWithLoading isLoading={isLoading} user={user} />;
```

### 3.3 Facade - API Client 门面

```tsx
// lib/api-client.ts
class ApiFacade {
  private userApi = new UserApi();
  private meetingApi = new MeetingApi();
  private reportApi = new ReportApi();

  // 对外提供简单接口
  async getCurrentUser() {
    return this.userApi.getMe();
  }

  async createMeeting(data: CreateMeetingInput) {
    const meeting = await this.meetingApi.create(data);
    await this.notificationApi.send(`Meeting created: ${meeting.title}`);
    await this.calendarApi.addEvent(meeting);
    return meeting;
  }
}
```

### 3.4 Proxy - 图片懒加载

```tsx
// components/lazy-image.tsx
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={isLoaded ? "opacity-100" : "opacity-0"}
        />
      ) : (
        <Skeleton />
      )}
    </div>
  );
}
```

---

## 4. 行为型模式

### 4.1 Observer - 事件系统

```tsx
// lib/event-bus.ts
type EventMap = {
  "user:login": { userId: string; timestamp: Date };
  "user:logout": { userId: string };
  "chat:message": { messageId: string; content: string };
};

class EventBus {
  private listeners: Map<keyof EventMap, Set<Function>> = new Map();

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Function) {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }
}

export const eventBus = new EventBus();

// 使用
eventBus.on("user:login", ({ userId }) => {
  logger.info("User logged in", { userId });
});

// 组件中
useEffect(() => {
  return eventBus.on("chat:message", handleNewMessage);
}, []);
```

### 4.2 Strategy - 验证策略

```tsx
// strategies/validation-strategy.ts
interface ValidationStrategy<T> {
  validate(value: T): boolean;
  errorMessage: string;
}

class EmailValidation implements ValidationStrategy<string> {
  validate(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  errorMessage = "请输入有效的邮箱地址";
}

class PasswordValidation implements ValidationStrategy<string> {
  validate(value: string) {
    return value.length >= 8;
  }
  errorMessage = "密码至少 8 个字符";
}

class FormValidator<T> {
  private strategies: ValidationStrategy<T>[] = [];

  addStrategy(strategy: ValidationStrategy<T>) {
    this.strategies.push(strategy);
    return this;
  }

  validate(value: T): { valid: boolean; errors: string[] } {
    const errors = this.strategies
      .filter((s) => !s.validate(value))
      .map((s) => s.errorMessage);

    return { valid: errors.length === 0, errors };
  }
}

// 使用
const validator = new FormValidator<string>()
  .addStrategy(new EmailValidation())
  .addStrategy(new PasswordValidation());

const result = validator.validate("test@example.com");
```

### 4.3 Command - 操作命令

```tsx
// commands/command.ts
interface Command<T = void> {
  execute(): Promise<T>;
  undo?(): Promise<void>;
}

class CreateMeetingCommand implements Command<Meeting> {
  constructor(
    private meetingApi: MeetingApi,
    private data: CreateMeetingInput
  ) {}

  async execute() {
    return await this.meetingApi.create(this.data);
  }

  async undo() {
    // 实现撤销逻辑
  }
}

class CommandManager {
  private history: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command) {
    const result = command.execute();
    this.history.push(command);
    this.redoStack = [];
    return result;
  }

  undo() {
    const command = this.history.pop();
    if (command?.undo) {
      await command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      await command.execute();
      this.history.push(command);
    }
  }
}
```

### 4.4 Chain of Responsibility - 中间件

```tsx
// middleware/api-middleware.ts
interface Middleware {
  process(request: Request, next: () => Promise<Response>): Promise<Response>;
}

class AuthMiddleware implements Middleware {
  process(request: Request, next: () => Promise<Response>) {
    const token = getToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return next();
  }
}

class LoggingMiddleware implements Middleware {
  process(request: Request, next: () => Promise<Response>) {
    logger.info(`API: ${request.method} ${request.url}`);
    return next().then((response) => {
      logger.info(`Response: ${response.status}`);
      return response;
    });
  }
}

class ApiPipeline {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  async handle(request: Request): Promise<Response> {
    const chain = this.middlewares.reduceRight(
      (next, mw) => () => mw.process(request, next),
      () => fetch(request)
    );
    return chain();
  }
}
```

---

## 5. 组合模式

### 5.1 Compound Components - 复合组件

```tsx
// components/tabs/tabs.tsx
import { createContext, useContext, useState } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab || "");

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="tabs-list">{children}</div>;
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  const isActive = activeTab === id;

  return (
    <button
      className={`tab ${isActive ? "active" : ""}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useContext(TabsContext)!;
  return activeTab === id ? <div className="tab-panel">{children}</div> : null;
}

// 使用
<Tabs defaultTab="tab1">
  <TabsList>
    <Tab id="tab1">标签1</Tab>
    <Tab id="tab2">标签2</Tab>
  </TabsList>
  <TabPanel id="tab1">内容1</TabPanel>
  <TabPanel id="tab2">内容2</TabPanel>
</Tabs>
```

### 5.2 Render Props - 渲染属性

```tsx
// hooks/use-fetch.ts
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // fetch logic...

  return { data, loading, error };
}

// 使用
function UserList() {
  const { data: users, loading, error } = useFetch<User[]>("/api/users");

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 5.3 Provider Pattern - 提供者模式

```tsx
// contexts/theme-context.tsx
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: "#3b82f6",
    secondary: "#64748b",
    background: "#ffffff",
  },
};

const darkTheme: Theme = {
  colors: {
    primary: "#60a5fa",
    secondary: "#94a3b8",
    background: "#0f172a",
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## 6. 状态管理模式

### 6.1 Zustand 最佳实践

```tsx
// stores/create-store.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

export const createStore = <T,>(
  initializer: (set: SetState<T>, get: GetState<T>) => T
) => {
  return create<T>()(
    persist(
      immer(initializer),
      { name: "app-storage" }
    )
  );
};
```

### 6.2 React Query vs Zustand

| 场景 | 推荐方案 |
|------|---------|
| 服务端状态 | React Query |
| 用户认证状态 | Zustand |
| UI 状态 | useState/useReducer |
| 全局配置 | Zustand |
| 表单状态 | React Hook Form |

---

## 7. 禁止事项

- 过度使用设计模式 (简单方案优先)
- 在 UI 层写业务逻辑
- 状态管理混乱 (混用太多方案)
- 循环依赖
- 硬编码配置值
