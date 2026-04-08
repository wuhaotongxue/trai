# Frontend_Next_js_现代设计模式规范

---

## 1. 设计模式总览

| 类别 | 模式 | 用途 |
|------|------|------|
| **创建型** | Factory Method | 组件工厂 |
| **创建型** | Abstract Factory | API 工厂 |
| **创建型** | Builder | Query Builder |
| **创建型** | Singleton | Store 实例 |
| **结构型** | Adapter | API 适配器 |
| **结构型** | Decorator | HOC / Wrapped Component |
| **结构型** | Facade | API Client 门面 |
| **结构型** | Proxy | 虚拟代理 (图片懒加载) |
| **行为型** | Observer | React 状态 / EventEmitter |
| **行为型** | Strategy | 验证策略 |
| **行为型** | Command | 操作命令 |
| **行为型** | Chain of Responsibility | 中间件 |

---

## 2. 创建型模式

### 2.1 Factory Method - 组件工厂

| 组件类型 | 说明 |
|---------|------|
| `text` | 文本块 |
| `image` | 图片块 |
| `video` | 视频块 |
| `audio` | 音频块 |

**ComponentConfig 类型**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `"text" \| "image" \| "video" \| "audio"` | 是 | 组件类型 |
| `props` | `Record<string, unknown>` | 是 | 组件属性 |

**实现参考**：`frontend_next/src/factories/component-factory.ts`

### 2.2 Abstract Factory - API 工厂

| 工厂方法 | 返回类型 | 说明 |
|---------|---------|------|
| `createUserApi()` | `UserApi` | 用户 API |
| `createMeetingApi()` | `MeetingApi` | 会议 API |
| `createReportApi()` | `ReportApi` | 报告 API |

**工厂实现**

| 工厂 | 用途 |
|------|------|
| `ProductionApiFactory` | 生产环境 |
| `MockApiFactory` | 测试/开发环境 |

**实现参考**：`frontend_next/src/factories/api-factory.ts`

### 2.3 Builder - Query Builder

**Builder 方法链**

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `param(key, value)` | `string, string \| number` | `this` | 添加查询参数 |
| `header(key, value)` | `string, string` | `this` | 添加请求头 |
| `build()` | - | `QueryConfig` | 构建查询配置 |

**实现参考**：`frontend_next/src/builders/query-builder.ts`

### 2.4 Singleton - Store

| Store | 说明 |
|-------|------|
| `useAuthStore` | 认证状态 |
| `useAppStore` | 应用状态 |

---

## 3. 结构型模式

### 3.1 Adapter - API 适配器

**职责**：将第三方 API 适配为内部接口

| 适配器 | 第三方 | 内部接口 |
|--------|--------|---------|
| `WeChatAdapter` | 企业微信 | `AuthProvider` |
| `OpenAIAdapter` | OpenAI | `AIProvider` |

### 3.2 Decorator - HOC

**高阶组件类型**

```tsx
type HOC<T> = (Component: React.ComponentType<T>) => React.ComponentType<T>;
```

**常用 HOC**

| HOC | 用途 |
|-----|------|
| `withAuth` | 权限验证 |
| `withLoading` | 加载状态 |
| `withError` | 错误边界 |

### 3.3 Facade - API Client

**门面方法**

| 方法 | 说明 |
|------|------|
| `get(endpoint)` | GET 请求 |
| `post(endpoint, data)` | POST 请求 |
| `put(endpoint, data)` | PUT 请求 |
| `delete(endpoint)` | DELETE 请求 |

### 3.4 Proxy - 虚拟代理

| 代理类型 | 用途 |
|---------|------|
| `ImageLazyLoadProxy` | 图片懒加载 |
| `CacheProxy` | 缓存代理 |
| `ValidationProxy` | 验证代理 |

---

## 4. 行为型模式

### 4.1 Observer - 状态观察

**React 状态管理方式**

| 方式 | 模式 |
|------|------|
| React Query | Observer |
| Zustand | Observer |
| Context | Observer |

### 4.2 Strategy - 验证策略

**验证策略类型**

| 策略 | 用途 |
|------|------|
| `EmailValidationStrategy` | 邮箱验证 |
| `PhoneValidationStrategy` | 手机验证 |
| `PasswordValidationStrategy` | 密码强度验证 |

### 4.3 Command - 操作命令

| 命令 | 用途 |
|------|------|
| `CreateCommand` | 创建操作 |
| `UpdateCommand` | 更新操作 |
| `DeleteCommand` | 删除操作 |

### 4.4 Chain of Responsibility - 中间件

**中间件链**

| 中间件 | 用途 |
|--------|------|
| `AuthMiddleware` | 认证检查 |
| `LoggingMiddleware` | 请求日志 |
| `ErrorMiddleware` | 错误处理 |
| `RateLimitMiddleware` | 限流 |

---

## 5. 禁止事项

- 滥用设计模式（简单问题复杂化）
- 模式之间混用导致混乱
- 在错误层级使用模式
- 过度抽象
