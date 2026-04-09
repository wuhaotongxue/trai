# Frontend_Next_js_API_设计规范

---

## 1. API 客户端封装

### 1.1 基础封装

**ApiClient 类职责**

| 方法 | 说明 |
|------|------|
| `get<T>(endpoint, options?)` | GET 请求 |
| `post<T>(endpoint, data, options?)` | POST 请求 |
| `put<T>(endpoint, data, options?)` | PUT 请求 |
| `delete<T>(endpoint, options?)` | DELETE 请求 |
| `upload<T>(endpoint, formData, options?)` | 文件上传 |

**请求选项 (ApiOptions)**

| 属性 | 类型 | 说明 |
|------|------|------|
| `params` | `Record<string, string \| number \| boolean>` | URL 查询参数 |
| `headers` | `HeadersInit` | 请求头 |

**错误类型 (ApiError)**

| 属性 | 类型 | 说明 |
|------|------|------|
| `code` | `string` | 错误码 |
| `message` | `string` | 错误信息 |
| `details` | `Record<string, unknown>` | 详细信息 |

**封装要求**

| 要求 | 说明 |
|------|------|
| Token 自动注入 | 自动从 AuthStore 获取并设置 Authorization |
| 日志记录 | 记录请求方法、路径、状态码、耗时 |
| 错误转换 | HTTP 错误转换为 ApiError 抛出 |
| 网络错误 | 捕获并抛出 NETWORK_ERROR |

**实现参考**：`frontend_next/src/lib/api_client.ts`

---

## 2. React Query 集成

### 2.1 查询 Hook

**useApiQuery 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | `string[]` | 是 | 查询缓存键 |
| `endpoint` | `string` | 是 | API 端点 |
| `options.enabled` | `boolean` | 否 | 是否启用查询 |

**useApiMutation 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `endpoint` | `string` | 是 | API 端点 |
| `method` | `"post" \| "put" \| "delete"` | 否 | HTTP 方法，默认 post |

**实现参考**：`frontend_next/src/hooks/use_api.ts`

### 2.2 Hook 命名规范

| 用途 | 命名 | 示例 |
|------|------|------|
| 查询列表 | `useXxxs` | `useUsers`, `useMeetings` |
| 查询详情 | `useXxx` | `useUser`, `useMeeting` |
| 创建 | `useCreateXxx` | `useCreateUser` |
| 更新 | `useUpdateXxx` | `useUpdateUser` |
| 删除 | `useDeleteXxx` | `useDeleteUser` |

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
| POST | /reports/git_analyze | Git 分析 | User+ |
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

| 错误类 | 错误码 | HTTP 状态 | 用途 |
|--------|--------|-----------|------|
| `ApiError` | 自定义 | 5xx | 基础错误类 |
| `ValidationError` | VALIDATION_ERROR | 400 | 参数验证失败 |
| `UnauthorizedError` | UNAUTHORIZED | 401 | 未登录 |
| `ForbiddenError` | FORBIDDEN | 403 | 无权限 |
| `NotFoundError` | NOT_FOUND | 404 | 资源不存在 |

**ApiError 属性**

| 属性 | 类型 | 说明 |
|------|------|------|
| `code` | `string` | 错误码 |
| `status` | `number` | HTTP 状态码 |
| `message` | `string` | 错误信息 |
| `details` | `Record<string, unknown>` | 详细信息 |

**实现参考**：`frontend_next/src/lib/errors.ts`

### 4.2 全局错误处理

**错误处理策略**

| 错误类型 | 处理方式 |
|---------|---------|
| UnauthorizedError | 跳转登录页 |
| ForbiddenError | 显示 toast 提示 |
| ApiError | 显示 toast 提示 |
| 其他 | 显示网络错误 toast |

**实现参考**：`frontend_next/src/components/error_toast.tsx`

---

## 5. 请求取消

**useCancellableQuery 用法**

| 参数 | 类型 | 说明 |
|------|------|------|
| `key` | `string[]` | 查询缓存键 |
| `endpoint` | `string` | API 端点 |

**实现参考**：`frontend_next/src/hooks/use_cancellable_query.ts`

---

## 6. 禁止事项

- 直接使用 fetch 不封装
- API 端点硬编码
- 不处理错误情况
- 不验证响应数据
- 重复请求无缓存
- 大量数据无分页