# Frontend Next.js - API 调用规范

---

## 1. API 客户端封装

### 1.1 基础封装

```tsx
// lib/api-client.ts
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logging";

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    const token = useAuthStore.getState().token;

    // 构建 URL
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      );
      url += `?${searchParams}`;
    }

    // 构建 Headers
    const headers = new Headers(fetchOptions.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Content-Type", "application/json");

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers,
        ...fetchOptions,
      });

      const elapsed = Date.now() - startTime;
      logger.debug(`API ${method} ${endpoint}`, { status: response.status, elapsed });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new ApiError(error.code, error.message, error.details);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`API Error: ${endpoint}`, {
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      logger.error(`Network Error: ${endpoint}`, { error });
      throw new ApiError("NETWORK_ERROR", "网络请求失败");
    }
  }

  get<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>("GET", endpoint, options);
  }

  post<T>(endpoint: string, data?: unknown, options?: ApiOptions) {
    return this.request<T>("POST", endpoint, {
      ...options,
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: ApiOptions) {
    return this.request<T>("PUT", endpoint, {
      ...options,
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>("DELETE", endpoint, options);
  }

  upload<T>(endpoint: string, formData: FormData, options?: ApiOptions) {
    return this.request<T>("POST", endpoint, {
      ...options,
      body: formData,
      headers: { /* 不设置 Content-Type 让浏览器自动设置 */ },
    });
  }
}

export const api = new ApiClient();
```

---

## 2. React Query 集成

### 2.1 查询 Hook

```tsx
// hooks/use-api.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { logger } from "@/lib/logging";

// 查询
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: { enabled?: boolean }
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      try {
        return await api.get<T>(endpoint);
      } catch (error) {
        logger.error(`Query Error: ${key.join(".")}`, { error });
        throw error;
      }
    },
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}

// 变更
export function useApiMutation<T, V>(
  endpoint: string,
  method: "post" | "put" | "delete" = "post"
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      return await api[method]<T>(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [] });
      logger.info(`Mutation Success: ${endpoint}`);
    },
    onError: (error) => {
      logger.error(`Mutation Error: ${endpoint}`, { error });
    },
  });
}
```

### 2.2 使用示例

```tsx
// 获取用户列表
function useUsers() {
  return useApiQuery<User[]>(["users"], "/users");
}

// 创建用户
function useCreateUser() {
  return useApiMutation<User, CreateUserInput>("/users", "post");
}

// 更新用户
function useUpdateUser() {
  return useApiMutation<User, UpdateUserInput>("/users", "put");
}

// 删除用户
function useDeleteUser() {
  return useApiMutation<void, string>("/users", "delete");
}
```

---

## 3. API 端点规范

### 3.1 用户相关

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | /users | 获取用户列表 | Admin |
| GET | /users/:id | 获取用户详情 | Self/Admin |
| POST | /users | 创建用户 | Admin |
| PUT | /users/:id | 更新用户 | Self/Admin |
| DELETE | /users/:id | 删除用户 | Admin |

### 3.2 AI 相关

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| POST | /ai/image/generate | 生成图片 | User+ |
| POST | /ai/video/generate | 生成视频 | User+ |
| POST | /ai/audio/synthesize | 语音合成 | User+ |
| POST | /ai/transcribe | 语音转写 | User+ |

### 3.3 会议相关

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | /meetings | 获取会议列表 | User+ |
| POST | /meetings | 创建会议 | User+ |
| GET | /meetings/:id | 获取会议详情 | Host+ |
| PUT | /meetings/:id | 更新会议 | Host+ |
| DELETE | /meetings/:id | 删除会议 | Host/Admin |

### 3.4 报告相关

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | /reports | 获取报告列表 | User+ |
| POST | /reports | 创建报告 | User+ |
| POST | /reports/git-analyze | Git 分析 | User+ |
| POST | /reports/export | 导出报告 | User+ |

### 3.5 Admin 相关

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | /admin/stats | 统计数据 | Admin |
| GET | /admin/users | 用户列表 | Admin |
| PUT | /admin/users/:id/role | 修改角色 | Admin |
| PUT | /admin/users/:id/quota | 修改配额 | Admin |
| GET | /admin/models | 模型列表 | Admin |
| PUT | /admin/models/:id | 更新模型 | Admin |

---

## 4. 错误处理

### 4.1 错误类型

```tsx
// lib/errors.ts
export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 500, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "未登录或登录已过期") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "无权限访问") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "资源") {
    super("NOT_FOUND", `${resource}不存在`, 404);
  }
}
```

### 4.2 全局错误处理

```tsx
// components/error-toast.tsx
import { toast } from "@/components/ui/use-toast";
import { ApiError, UnauthorizedError, ForbiddenError } from "@/lib/errors";

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    window.location.href = "/login";
    return;
  }

  if (error instanceof ForbiddenError) {
    toast({ title: "无权限", description: error.message, variant: "destructive" });
    return;
  }

  if (error instanceof ApiError) {
    toast({ title: "操作失败", description: error.message, variant: "destructive" });
    return;
  }

  toast({ title: "网络错误", description: "请检查网络连接", variant: "destructive" });
}
```

---

## 5. 请求取消

```tsx
// hooks/use-cancellable-query.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function useCancellableQuery<T>(key: string[], endpoint: string) {
  const abortRef = useRef<AbortController | null>(null);

  const query = useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      abortRef.current = new AbortController();
      return await api.get<T>(endpoint, {
        signal: abortRef.current.signal,
      });
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return query;
}
```

---

## 6. 禁止事项

- 直接使用 fetch 不封装
- API 端点硬编码
- 不处理错误情况
- 不验证响应数据
- 重复请求无缓存
- 大量数据无分页
