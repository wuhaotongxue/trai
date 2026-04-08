# Electron_IPC_通道规范

## 1. 通道命名规范

**格式**: `domain:action`

| 类型 | 示例 |
|------|------|
| 正确格式 | `meeting:create`, `file:upload`, `system:getInfo` |
| 禁止格式 | `createMeeting` (无命名空间) |
| 禁止格式 | `Meeting.Create` (PascalCase) |
| 禁止格式 | `meetingCreate` (camelCase) |

## 2. 安全原则

### Preload 白名单化

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：在 preload 中暴露 ipcRenderer 全部 API
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：显式暴露需要的 API（白名单化）
</div>

### 通信方式

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：使用 `ipcRenderer.send`（oneway，无法获取返回值）
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：使用 `ipcRenderer.invoke`（双向通信，可获取返回值）
</div>

### 验证渲染进程来源

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0;">
<strong>建议</strong>：验证 `event.senderFrame.url` 防止恶意调用
</div>

## 3. 通道处理器注册

| 要求 | 说明 |
|------|------|
| 注册时机 | 必须在窗口创建之后 |
| 统一入口 | 使用 registry.ts 统一注册所有处理器 |
| 类型安全 | 使用泛型定义请求/响应类型 |

## 4. 类型安全的 IPC

| 类型 | 说明 |
|------|------|
| `IpcRequest<T>` | 包含 data, requestId, timestamp |
| `IpcResponse<T>` | 包含 success, data?, error?, requestId |

## 5. 禁止事项汇总

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：preload 中暴露 ipcRenderer.invoke/on
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：直接在渲染进程使用 Node.js API (require('fs'))
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：裸 `ipcRenderer.on`（无移除逻辑，会导致内存泄漏）
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：使用 `ipcRenderer.once` 或显式 `removeListener`
</div>

## 6. 快速参考卡片

| 场景 | 规范 |
|------|------|
| 通道命名 | `domain:action` 格式 |
| 通信方式 | 必须使用 invoke |
| preload | 白名单化 API |
| 事件监听 | 使用 once 或显式移除 |
| 来源验证 | 检查 senderFrame.url |
