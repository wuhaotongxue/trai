---
name: "frontend-next-code-review"
description: "用于检查和审查 frontend_next 目录下的 Next.js 前端代码。编写前端代码时调用，强制执行全中文规范、App Router 规范与文件头规范。"
---

# Frontend Next 代码审查

作为 TRAI 平台前端代码审查员，请严格遵守以下规范。

## 全局颜色禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止使用紫色及相关色系</strong> — 前端所有代码、UI 设计、组件中严禁出现任何紫色或紫色相近颜色
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">purple, violet, indigo, #9333EA, #7C3AED, rgb(147, 51, 234)</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">推荐: blue/cyan/teal/emerald/amber 等中性或冷暖对撞色系</code>
  </div>
  <div style="margin-top:8px;font-size:13px;">
    背景色推荐使用 <code>#080818</code> 深蓝黑 或 <code>#0F172A</code> 深灰蓝，渐变使用 <code>blue -> cyan</code> 而非 <code>purple -> pink</code>
  </div>
</div>

## 强制语言规范（CRITICAL）

**TRAI 项目前端所有代码、注释、UI 文案必须使用简体中文。**

| 类别 | 强制要求 |
|------|----------|
| UI 文案 | 所有显示给用户的文字必须是简体中文 |
| 代码注释 | 所有注释必须是中文 |
| 文件头注释 | 每个 .tsx/.ts 必须包含中文文件头 |
| 中文标点禁令 | **禁止** `，，！？：` 全角标点，必须用 `, . ! ? :` |

### 中文标点禁令示例

```
❌ // 发送消息请求。
✅ // 发送消息请求.

❌ <Button>登录</Button>
✅ <Button>登录</Button>

❌ "用户名不能为空。"
✅ "用户名不能为空."
```

## 技术栈规范

| 设置项 | 值 |
|--------|-----|
| 环境 | Node.js 18.17.0+ |
| 包管理器 | pnpm 9 |
| 禁止 | npm / yarn |
| React 框架 | Next.js 16 App Router |

## App Router 规范

- **默认** Server Components（更快的首屏、更小 Bundle）
- **必须** `"use client"` 时机：useState / useEffect / onClick / 浏览器 API
- 组件放在 `src/components/` 按功能模块分组
- 状态管理统一使用 Zustand（`src/stores/`）

## TypeScript 严格类型

- 所有数据结构、组件 Props、API 响应必须显式声明类型
- **严禁** `: any` / `as any`

## 样式规范

- 使用 Tailwind CSS 4，通过 `.dark` class 切换 dark mode
- shadcn/ui 组件位于 `src/components/ui/`，按需导入
- **禁止** 内联 `style={{...}}`，使用 Tailwind className
- 响应式设计必须使用 `sm:` / `md:` / `lg:`
- **禁止使用紫色及相关色系** (purple/violet/indigo)

## 文件头模板（强制）

每个 `.tsx/.ts` 文件必须包含：

```typescript
/**
 * 文件名: component_name.tsx
 * 作者: wuhao
 * 日期: YYYY_MM_DD_HHmm
 * 描述: 本组件功能说明
 */
```

## 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件文件 | snake_case | `chat_panel.tsx` |
| 组件名 | PascalCase | `ChatPanel` |
| 变量名 | camelCase | `isLoading` |
| Import | 绝对路径 | `@/components/...` |

## 横杠禁令

- 前端所有命名禁止使用 `-` 作为自定义命名的一部分, 包括文件名, 自定义对象 key, 自定义 query key.
- Next.js 保留文件名不在此限制内: `not-found.tsx`, `error.tsx`, `loading.tsx`, `layout.tsx`, `page.tsx`.

## Import 排版规范

- Import 列表不要一行一个标识符, 优先使用单行或分组换行, 让每行包含多个标识符, 保证可读性.

```ts
import { Activity, AlertCircle, ArrowDown, ArrowUp, Bot, CheckCircle2 } from "lucide-react";
```

## 审查清单

编辑/创建 `frontend_next` 文件时，检查：

1. ✅ UI 文案是否全中文
2. ✅ 注释是否全中文（无全角标点）
3. ✅ 文件头是否包含中文
4. ✅ 是否使用 `"use client"`（仅必要时）
5. ✅ Props 和返回值是否有显式类型
6. ✅ 是否有 `any` 类型
7. ✅ 响应式设计是否完整
8. ✅ **是否使用紫色及相关色系**（严格禁止）
