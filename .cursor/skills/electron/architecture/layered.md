# Electron - 五层架构规范

## 1. 目录结构

```
electron/
├── src/
│   ├── main/                       # 主进程 (Main Process)
│   │   ├── index.ts               # 主进程入口
│   │   ├── platform/              # Platform Layer (Node.js API 封装)
│   │   │   ├── window_manager.ts  # 窗口管理
│   │   │   ├── app_lifecycle.ts   # 应用生命周期
│   │   │   └── tray_manager.ts   # 系统托盘
│   │   │
│   │   ├── ipc/                  # IPC Layer (IPC 通道)
│   │   │   ├── registry.ts       # IPC 通道注册
│   │   │   ├── handlers/         # 通道处理器
│   │   │   │   ├── meeting.ts
│   │   │   │   ├── file.ts
│   │   │   │   └── system.ts
│   │   │   └── channels.ts       # 通道常量定义
│   │   │
│   │   └── services/             # Service Layer (业务逻辑)
│   │       ├── meeting_service.ts
│   │       ├── file_service.ts
│   │       └── update_service.ts
│   │
│   ├── preload/                   # Controller Layer (预加载脚本)
│   │   ├── index.ts              # preload 入口
│   │   └── api/                  # 暴露给渲染进程的 API
│   │       ├── meeting_api.ts
│   │       ├── file_api.ts
│   │       └── system_api.ts
│   │
│   └── renderer/                 # UI Layer (渲染进程)
│       ├── main.tsx              # React 入口
│       ├── App.tsx               # 根组件
│       ├── components/            # 通用组件
│       ├── pages/                # 页面组件
│       ├── hooks/                # React Hooks
│       ├── services/             # Renderer 业务逻辑
│       └── types/                # 类型定义
│
├── resources/                    # 静态资源
│   └── icon.ico
│
├── electron-builder.yml          # 打包配置
├── tsconfig.json
├── vite.config.ts               # Vite 配置
└── package.json
```

## 2. 各层职责详解

### Platform Layer - `src/main/platform/`

| 属性 | 说明 |
|------|------|
| 职责 | Node.js 原生 API 封装，系统级操作 |
| 包含 | 窗口管理、应用生命周期、系统托盘、通知 |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：写业务判断逻辑
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：直接接收 IPC 请求（必须通过 IPC Layer 中转）
</div>

### IPC Layer - `src/main/ipc/`

| 属性 | 说明 |
|------|------|
| 职责 | IPC 通道注册与处理，协议定义 |
| 包含 | 通道常量、处理器注册、输入验证 |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：写 UI 渲染逻辑
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：直接操作数据库（必须委托给 Service Layer）
</div>

### Service Layer - `src/main/services/`

| 属性 | 说明 |
|------|------|
| 职责 | 业务流程编排，状态管理 |
| 包含 | 业务逻辑、第三方 API 调用、数据转换 |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：直接使用 Electron API（如 BrowserWindow）
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：写文件系统操作（必须委托给 Platform Layer）
</div>

### Controller Layer - `src/preload/`

| 属性 | 说明 |
|------|------|
| 职责 | 桥接 Renderer 与 Main，安全上下文隔离 |
| 包含 | preload 脚本、API 暴露 |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：写业务逻辑
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：暴露过多 API（必须白名单化）
</div>

### UI Layer - `src/renderer/`

| 属性 | 说明 |
|------|------|
| 职责 | React 组件渲染，用户交互 |
| 包含 | 页面组件、通用组件、Hooks |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：直接调用 Node.js API
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：写主进程代码
</div>

## 3. 层级调用规则

```
UI Layer (React 组件)
    ↓ 调用
Controller Layer (preload API)
    ↓ 调用 (ipcRenderer.invoke)
IPC Layer (通道处理器)
    ↓ 调用
Service Layer (业务逻辑)
    ↓ 调用
Platform Layer (Node.js API)
```

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>反向禁止</strong>：任何下层不得调用上层
</div>

## 4. 五层架构总览表

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **UI Layer** | `src/renderer/` | React 组件渲染，用户交互 | 禁止写业务逻辑 |
| **Controller Layer** | `src/preload/` | 桥接 Renderer 与 Main，安全上下文 | 禁止写业务逻辑 |
| **Service Layer** | `src/main/services/` | 业务流程编排 | 禁止直接操作数据库 |
| **IPC Layer** | `src/main/ipc/` | IPC 通道注册与处理 | 禁止写 UI 逻辑 |
| **Platform Layer** | `src/main/platform/` | Node.js 原生 API 封装 | 禁止写业务判断逻辑 |

## 5. 文件头模板

| 字段 | 说明 |
|------|------|
| `文件名` | {文件名} |
| `作者` | wuhao |
| `日期` | {YYYY-MM-DD HH:MM:SS} |
| `描述` | {该文件的用途/功能简述，一句话概括} |
