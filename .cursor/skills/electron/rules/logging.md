# Electron_日志与格式化规范

## 1. 日志规范

### 主进程日志

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：主进程中使用 console.log/console.error
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：主进程必须使用 electron-log
</div>

### 日志级别

| 级别 | 用途 |
|------|------|
| `trace` | 追踪详细信息 |
| `debug` | 调试信息 |
| `info` | 一般信息 |
| `warn` | 警告信息 |
| `error` | 错误信息 |
| `fatal` | 致命错误 |

### 渲染进程日志

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：渲染进程使用 console.log/console.warn/console.error
</div>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0;">
<strong>建议</strong>：生产环境通过 IPC 上报日志到主进程
</div>

## 2. 代码格式化

### ESLint 配置要求

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `strict` | `true` | 启用所有严格类型检查 |
| `no-console` | `error` (仅允许 warn/error) | 禁止 console.log |
| `no-unused-vars` | `error` | 禁止未使用变量 |
| `no-explicit-any` | `error` | 禁止隐式 any |

### Prettier 配置要求

| 配置项 | 值 |
|--------|-----|
| `semi` | `false` |
| `singleQuote` | `true` |
| `tabWidth` | `2` |
| `trailingComma` | `es5` |
| `printWidth` | `100` |

## 3. Import 排序规则

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>正确顺序</strong>：1. React → 2. 第三方库 → 3. 内部模块(绝对路径) → 4. 内部模块(相对路径)
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：空行分隔不明显，import 顺序混乱
</div>

## 4. 快速参考卡片

| 场景 | 规范 |
|------|------|
| 主进程日志 | 使用 electron-log |
| 渲染进程日志 | 使用 console |
| 代码格式化 | ESLint + Prettier |
| 缩进 | 2 个空格 |
| 引号 | 单引号 `'` |
| 分号 | 禁止 `;` |
