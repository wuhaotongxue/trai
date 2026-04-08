# Frontend Next.js - 日志与监控规范

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

### 2.1 日志封装

```tsx
// lib/logging.ts
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  url?: string;
}

class Logger {
  private minLevel: LogLevel;
  private levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

  constructor(minLevel: LogLevel = "info") {
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (this.levels[level] < this.levels[this.minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: getCurrentUserId(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    // 生产环境发送到日志服务
    if (process.env.NODE_ENV === "production") {
      this.sendToServer(entry);
    }

    console.log(JSON.stringify(entry));
  }

  debug = (msg: string, ctx?: Record<string, unknown>) => this.log("debug", msg, ctx);
  info = (msg: string, ctx?: Record<string, unknown>) => this.log("info", msg, ctx);
  warn = (msg: string, ctx?: Record<string, unknown>) => this.log("warn", msg, ctx);
  error = (msg: string, ctx?: Record<string, unknown>) => this.log("error", msg, ctx);
  fatal = (msg: string, ctx?: Record<string, unknown>) => this.log("fatal", msg, ctx);

  private sendToServer(entry: LogEntry) {
    navigator.sendBeacon("/api/logs", JSON.stringify(entry));
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === "development" ? "debug" : "info"
);
```

---

## 3. 用户行为日志

### 3.1 行为埋点

```tsx
// lib/analytics.ts
interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

function trackEvent(event: AnalyticsEvent) {
  logger.info(`[Analytics] ${event.event}`, {
    category: event.category,
    label: event.label,
    value: event.value,
    ...event.metadata,
  });

  // 发送到分析服务
  if (window.gtag) {
    window.gtag("event", event.event, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }
}
```

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

```tsx
// hooks/use-page-view.ts
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function usePageView() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent({
      event: "page_view",
      category: "navigation",
      metadata: { path: pathname },
    });
  }, [pathname]);
}
```

---

## 4. 错误监控

### 4.1 全局错误处理

```tsx
// components/error-boundary.tsx
"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logging";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React Error Boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">出错了</h2>
          <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 4.2 Promise 错误处理

```tsx
// hooks/use-api.ts
export function useApi<T>(url: string, options?: RequestInit) {
  return useQuery<T>({
    queryKey: [url],
    queryFn: async () => {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      } catch (error) {
        logger.error(`API Error: ${url}`, {
          status: (error as Response)?.status,
          message: (error as Error)?.message,
        });
        throw error;
      }
    },
  });
}
```

---

## 5. 性能监控

### 5.1 Core Web Vitals

```tsx
// lib/web-vitals.ts
import { getCLS, getFID, getLCP, getFCP, getTTFB } from "web-vitals";

function sendToAnalytics({ name, delta, id }: Metric) {
  logger.info(`[WebVitals] ${name}`, {
    metric: name,
    value: delta,
    id,
  });
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
  getFCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### 5.2 性能指标

| 指标 | 名称 | 目标 |
|------|------|------|
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累积布局偏移 | < 0.1 |
| FCP | 首次内容绘制 | < 1.8s |
| TTFB | 首字节时间 | < 800ms |

---

## 6. 实时监控

### 6.1 心跳检测

```tsx
// hooks/use-health-check.ts
import { useEffect, useState } from "react";

export function useHealthCheck() {
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        setHealthy(res.ok);
      } catch {
        setHealthy(false);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return healthy;
}
```

### 6.2 WebSocket 监控

```tsx
// hooks/use-websocket.ts
export function useWebSocket(url: string, onMessage: (data: unknown) => void) {
  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => logger.info(`WebSocket connected: ${url}`);
    ws.onclose = () => logger.warn(`WebSocket closed: ${url}`);
    ws.onerror = (e) => logger.error(`WebSocket error: ${url}`, { error: e });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    return () => ws.close();
  }, [url]);
}
```

---

## 7. 禁止事项

- console.log 留在生产代码中
- 敏感信息写入日志 (密码、Token)
- 错误不记录上下文
- 性能问题不监控
- 日志不分类分级
