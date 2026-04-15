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

### 1. 全局颜色禁令 (CRITICAL)

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong style="color:#C62828;">&#x274C; 绝对禁止使用紫色及相关色系</strong> — Electron 客户端所有代码、UI 设计、CSS 样式中严禁出现任何紫色或紫色相近颜色
<br/>
<span style="color:#D32F2F;">禁止:</span> <code>purple, violet, indigo, #9333EA, #7C3AED, rgb(147, 51, 234), hsl(270, ...)</code>
<br/>
<span style="color:#2E7D32;">推荐:</span> <code>blue/cyan/teal/emerald/amber</code> 等中性或冷暖对撞色系
<br/>
背景色推荐 <code>#080818</code> 或 <code>#0F172A</code>，渐变使用 <code>blue -> cyan</code> 而非 <code>purple -> pink</code>
</div>

### 2. 全局中文标点符号禁令 (CRITICAL)

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：在代码和注释中出现中文全角标点符号（`，`、`。`、`！`、`：`）
</div>

### 3. TypeScript + Node.js 环境规范

| 配置项 | 值 |
|--------|-----|
| Node.js | 20 LTS |
| 包管理器 | 必须使用 `pnpm` (禁止 `npm` 或 `yarn`) |
| TypeScript | 严格模式 (`strict: true`) |
| 类型 | 必须显式类型注解，禁止 `any` |
| 导入 | `import { foo } from './foo'`，禁止 `import * as foo` |

### 4. 启动与发布前的代码审核 (CRITICAL)

<div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px; margin: 12px 0;">
<strong>强制</strong>：每次启动客户端 (`pnpm dev`) 或打包发布客户端 (`pnpm build`) 之前，必须先审核代码并确保没有 TypeScript 语法/类型报错。
<br/>
请执行 <code>pnpm run type-check</code> (即 <code>tsc --noEmit</code>) 进行类型检查。如果存在报错，必须先修复所有错误再启动/上传。
</div>

### 5. 五层架构强制分层 (Layered Architecture)

Electron 应用所有 TypeScript 代码必须严格遵循五层架构：

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **UI Layer** | `src/renderer/` | React 组件渲染，用户交互 | 禁止写业务逻辑 |
| **Controller Layer** | `src/preload/` | 桥接 Renderer 与 Main，安全上下文 | 禁止写业务逻辑 |
| **Service Layer** | `src/main/services/` | 业务流程编排 | 禁止直接操作数据库 |
| **IPC Layer** | `src/main/ipc/` | IPC 通道注册与处理 | 禁止写 UI 逻辑 |
| **Platform Layer** | `src/main/platform/` | Node.js 原生 API 封装 | 禁止写业务判断逻辑 |

### 6. IPC 通道规范

| 规范 | 说明 |
|------|------|
| 通道命名 | `domain:action` (如 `meeting:create`, `file:upload`) |
| 安全 | preload 暴露的 API 必须白名单化 |
| 通信 | 禁止 `ipcRenderer.send`，必须使用 `ipcRenderer.invoke` |

### 7. 自动更新与 S3 上传

| 规范 | 说明 |
|------|------|
| 版本号 | 严格 Semver (`X.Y.Z`) |
| latest.yml | electron-updater 必需的元数据文件 |
| 发布流程 | `npm run release` 自动打包 + 调用 Backend API 上传 S3 |

### 8. 日志规范

| 进程 | 日志方式 |
|------|----------|
| 主进程 | 使用 `electron-log` |
| 渲染进程 | 使用 `console` (生产环境通过 IPC 上报) |

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：`console.log` 在主进程中，必须使用 `electron-log`
</div>

### 9. 代码格式化

| 配置项 | 值 |
|--------|-----|
| 工具 | ESLint + Prettier |
| 缩进 | 2 个空格 |
| 引号 | 单引号 (`'`) |
| 分号 | 禁止 (`;`) |

### 11. UI 布局与拖拽规范 

| 规范 | 说明 |
|------|------|
| **防溢出 (Overflow)** | 包含侧边栏或可折叠区域时，使用固定宽度必须配合 `boxSizing: 'border-box'`，或者通过 Flexbox 避免内容溢出。 |
| **可拖拽区域** | 自定义顶部导航栏必须添加 `className="drag-region"` 实现窗口拖动 (`-webkit-app-region: drag`)。 |
| **防误触** | 拖拽区域内的任何可点击元素（如按钮、下拉框、输入框）必须显式添加 `className="no-drag-region"` (`-webkit-app-region: no-drag`)，否则无法被点击。 |
| **三段式折叠布局** | 对于具有“左侧(大侧边栏)+中间(列表)+右侧(详情)”三段式布局的页面，中间列表的收起按钮应置于其头部最右侧，展开按钮应置于右侧详情头部最左侧。 |

### 12. 文件头模板

| 字段 | 说明 |
|------|------|
| `文件名` | {文件名} |
| `作者` | wuhao |
| `日期` | {YYYY-MM-DD HH:MM:SS} |
| `描述` | {该文件的用途/功能简述，一句话概括} |
