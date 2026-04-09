# Frontend_Next_js_日志与监控规范

---

## 1. 日志级别

| 级别 | 值 | 使用场景 |
|------|---|---------|
| debug | 0 | 开发调试 |
| info | 1 | 一般信息 |
| warn | 2 | 警告信息 |
| error | 3 | 错误信息 |
| fatal | 4 | 致命错误 |

---

## 2. 日志工具

### 2.1 Logger 类

**日志方法**

| 方法 | 级别 | 用途 |
|------|------|------|
| `logger.debug(msg, ctx?)` | debug | 开发调试 |
| `logger.info(msg, ctx?)` | info | 一般信息 |
| `logger.warn(msg, ctx?)` | warn | 警告信息 |
| `logger.error(msg, ctx?)` | error | 错误信息 |
| `logger.fatal(msg, ctx?)` | fatal | 致命错误 |

**LogEntry 结构**

| 属性 | 类型 | 说明 |
|------|------|------|
| `timestamp` | `string` | ISO 时间戳 |
| `level` | `LogLevel` | 日志级别 |
| `message` | `string` | 日志消息 |
| `context` | `Record<string, unknown>` | 上下文 |
| `userId` | `string` | 用户 ID |
| `url` | `string` | 请求 URL |

**环境配置**

| 环境 | 最低级别 | 说明 |
|------|---------|------|
| development | debug | 显示所有日志 |
| production | info | 仅 info 及以上 |

**实现参考**：`frontend_next/src/lib/logging.ts`

---

## 3. 用户行为日志

### 3.1 行为埋点

**AnalyticsEvent 类型**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event` | `string` | 是 | 事件名称 |
| `category` | `string` | 是 | 事件分类 |
| `label` | `string` | 否 | 事件标签 |
| `value` | `number` | 否 | 数值 |
| `metadata` | `Record<string, unknown>` | 否 | 元数据 |

**trackEvent 函数**：记录用户行为事件

**实现参考**：`frontend_next/src/lib/analytics.ts`

### 3.2 常用埋点

| 事件 | 分类 | 说明 |
|------|------|------|
| page_view | navigation | 页面浏览 |
| button_click | interaction | 按钮点击 |
| form_submit | interaction | 表单提交 |
| ai_generate | feature | AI 生成 |
| login | auth | 登录 |
| logout | auth | 登出 |
| error | error | 错误 |

### 3.3 自动埋点

**自动埋点事件**

| 事件 | 触发时机 |
|------|---------|
| page_view | 页面加载 |
| scroll_depth | 滚动深度变化 |
| time_on_page | 页面停留时间 |

**实现参考**：`frontend_next/src/hooks/use-page-view.ts`

---

## 4. 性能监控

### 4.1 Core Web Vitals

| 指标 | 达标值 | 说明 |
|------|--------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累积布局偏移 |

### 4.2 自定义指标

| 指标 | 说明 |
|------|------|
| API 响应时间 | 后端接口耗时 |
| 组件渲染时间 | React 组件性能 |
| 资源加载时间 | 图片/字体加载 |

---

## 5. 错误监控

### 5.1 错误类型

| 类型 | 捕获方式 |
|------|---------|
| JavaScript Error | window.onerror |
| Promise Rejection | window.onunhandledrejection |
| React 渲染错误 | ErrorBoundary |

### 5.2 错误上报

**上报内容**

| 字段 | 说明 |
|------|------|
| stack | 错误堆栈 |
| message | 错误信息 |
| userId | 用户 ID |
| url | 发生错误的页面 |
| timestamp | 发生时间 |

**实现参考**：`frontend_next/src/lib/error-reporter.ts`

---

## 6. 禁止事项

- 生产环境使用 console.log
- 记录敏感信息（密码、Token）
- 日志级别使用混乱
- 大量日志影响性能
- 错误不上报
