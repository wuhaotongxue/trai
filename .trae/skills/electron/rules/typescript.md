# Electron_TypeScript_规范

## 1. 编译配置要求

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `target` | `ES2022` | 编译目标 |
| `module` | `ESNext` | 模块系统 |
| `moduleResolution` | `bundler` | 模块解析 |
| `strict` | `true` | 严格模式 |
| `noImplicitAny` | `true` | 禁止隐式 any |
| `strictNullChecks` | `true` | 严格空值检查 |
| `noUnusedLocals` | `true` | 禁止未使用变量 |
| `noUnusedParameters` | `true` | 禁止未使用参数 |
| `noImplicitReturns` | `true` | 禁止隐式返回 |
| `esModuleInterop` | `true` | ES 模块互操作 |
| `jsx` | `react-jsx` | React JSX 支持 |

## 2. 类型定义

### 显式类型注解

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：必须显式类型注解
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：无类型注解的变量
</div>

### 禁止 any

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：`any` 类型
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：`unknown` + 类型守卫或类型断言
</div>

## 3. 导入规范

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：命名导入 `import { foo } from './foo'`
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：类型导入 `import type { Foo }`
</div>

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：默认导入 `import React from 'react'`
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：命名空间导入 `import * as foo`
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：无效路径 `import { foo } from 'foo'` (缺少 ./ 或 @/)
</div>

## 4. 接口 vs 类型别名

| 场景 | 推荐 |
|------|------|
| 对象类型 | `interface` |
| 联合类型 | `type` |
| 函数类型 | `type` |

## 5. 枚举 vs 联合类型

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>推荐</strong>：联合类型（轻量）
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：非必要使用枚举
</div>

## 6. 空值处理

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：可选链 + 空值合并 `meeting?.title ?? 'Untitled'`
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：隐式 falsy `meeting && meeting.title`
</div>

## 7. Async/Await

<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 12px 0;">
<strong>允许</strong>：async/await + try/catch
</div>

<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0;">
<strong>禁止</strong>：.then 链式调用地狱
</div>

## 8. 禁止事项汇总

| 禁止项 | 说明 |
|--------|------|
| `var` | 必须使用 const/let |
| 魔法数字 | 必须使用命名常量 |
| 隐式 any | 必须显式类型 |
| console.log (主进程) | 必须使用 electron-log |
| 箭头函数返回对象 | 必须使用括号包裹 |

## 9. 快速参考卡片

| 场景 | 规范 |
|------|------|
| 变量声明 | const/let（禁止 var） |
| 类型注解 | 必须显式（禁止 any） |
| 导入 | 命名导入/类型导入 |
| 空值处理 | `?.` 和 `??` |
| 异步 | async/await + try/catch |
| 枚举 | 优先使用联合类型 |
