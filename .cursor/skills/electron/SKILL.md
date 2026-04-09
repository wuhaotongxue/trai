---
name: "electron"
description: "Electron 桌面客户端代码审查主入口。强制执行 TypeScript 规范、五层架构、IPC 通道、窗口管理、自动更新与 S3 上传。"
---

# Electron_Code_Review

作为 TRAI 平台 Electron 桌面客户端开发人员的专属代码审查警察，请严格遵守以下规范进行审查。

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| TypeScript 规范 | `electron/rules/typescript.md` | 必读 |
| 日志规范 | `electron/rules/logging.md` | 必读 |
| 五层架构 | `electron/architecture/layered.md` | 必读 |
| IPC 通道 | `electron/ipc/channels.md` | IPC 开发时 |
| S3 上传 | `electron/update/s3_upload.md` | 发布时 |

## 核心审查规则

### 1. 全局中文标点符号禁令 (CRITICAL)

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：在代码和注释中出现中文全角标点符号（`，`、`。`、`！`、`：`）
</div>

### 2. TypeScript + Node.js 环境规范

| 配置项 | 值 |
|--------|-----|
| Node.js | 20 LTS |
| TypeScript | 严格模式 (`strict: true`) |
| 类型 | 必须显式类型注解，禁止 `any` |
| 导入 | `import { foo } from './foo'`，禁止 `import * as foo` |

### 3. 五层架构强制分层 (Layered Architecture)

Electron 应用所有 TypeScript 代码必须严格遵循五层架构：

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **UI Layer** | `src/renderer/` | React 组件渲染，用户交互 | 禁止写业务逻辑 |
| **Controller Layer** | `src/preload/` | 桥接 Renderer 与 Main，安全上下文 | 禁止写业务逻辑 |
| **Service Layer** | `src/main/services/` | 业务流程编排 | 禁止直接操作数据库 |
| **IPC Layer** | `src/main/ipc/` | IPC 通道注册与处理 | 禁止写 UI 逻辑 |
| **Platform Layer** | `src/main/platform/` | Node.js 原生 API 封装 | 禁止写业务判断逻辑 |

### 4. IPC 通道规范

| 规范 | 说明 |
|------|------|
| 通道命名 | `domain:action` (如 `meeting:create`, `file:upload`) |
| 安全 | preload 暴露的 API 必须白名单化 |
| 通信 | 禁止 `ipcRenderer.send`，必须使用 `ipcRenderer.invoke` |

### 5. 自动更新与 S3 上传

| 规范 | 说明 |
|------|------|
| 版本号 | 严格 Semver (`X.Y.Z`) |
| latest.yml | electron-updater 必需的元数据文件 |
| 发布流程 | `npm run release` 自动打包 + 调用 Backend API 上传 S3 |

### 6. 日志规范

| 进程 | 日志方式 |
|------|----------|
| 主进程 | 使用 `electron-log` |
| 渲染进程 | 使用 `console` (生产环境通过 IPC 上报) |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：`console.log` 在主进程中，必须使用 `electron-log`
</div>

### 7. 代码格式化

| 配置项 | 值 |
|--------|-----|
| 工具 | ESLint + Prettier |
| 缩进 | 2 个空格 |
| 引号 | 单引号 (`'`) |
| 分号 | 禁止 (`;`) |

### 8. 文件头模板

| 字段 | 说明 |
|------|------|
| `文件名` | {文件名} |
| `作者` | wuhao |
| `日期` | {YYYY-MM-DD HH:MM:SS} |
| `描述` | {该文件的用途/功能简述，一句话概括} |
