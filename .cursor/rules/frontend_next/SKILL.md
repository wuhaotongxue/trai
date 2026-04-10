# frontend_next 前端开发规范

## 强制语言规范（CRITICAL）

**TRAI 项目前端所有代码、注释、UI 文案必须使用简体中文。**

### 规则详情

1. **UI 文案**：`所有显示给用户的文字必须是简体中文`
   - 按钮文案：「登录」「注册」「开始使用」「了解更多」
   - 禁止英文按钮如 Login / Get Started / Learn More

2. **代码注释**：`所有注释必须是中文`
   - ✅ `// 发送消息请求`
   - ❌ `// send message request`

3. **变量/组件命名**：保持英文命名（遵循 TypeScript 惯例），但注释和 UI 文案必须是中文

4. **文件头注释**：每个 `.tsx/.ts` 文件必须包含中文文件头：
```typescript
/**
 * 文件名: xxx.tsx
 * 作者: wuhao
 * 日期: YYYY_MM_DD_HHmm
 * 描述: 本文件功能说明
 */
```

5. **中文标点禁令**：**绝对禁止**在代码注释和 UI 文案中使用中文全角标点（`，` `。` `！` `：`）
   - 注释必须使用英文半角标点 (`,` `.` `!` `:`)

## Next.js App Router 规范

- 使用 React Server Components（默认），`"use client"` 仅在需要交互时添加
- 路由组 `(website)` 用于营销页面，`(admin)` 用于管理后台，`(app)` 用于业务页面
- 组件放在 `src/components/` 按功能模块分组
- 状态管理统一使用 Zustand（`src/stores/`）

## 样式规范

- 使用 Tailwind CSS 4，dark mode 通过 `.dark` class 切换
- shadcn/ui 组件位于 `src/components/ui/`，按需导入
- 全局 CSS 变量在 `src/app/globals.css` 中定义

## 文件头规范

每个 `.tsx/.ts` 文件必须包含：

```typescript
/**
 * 文件名: component-name.tsx
 * 作者: wuhao
 * 日期: YYYY_MM_DD_HHmm
 * 描述: 本组件/模块功能说明
 */
```

## ESLint

- 使用 Next.js 16 + TypeScript 5 标准配置
- 中文文案相关规则：禁止 JSX 中出现英文字符串字面量（非变量）

## 导入顺序

1. React / Next.js 内置
2. 第三方库
3. `@/` 路径别名（组件）
4. `@/` 路径别名（stores/hooks）
5. `@/` 路径别名（lib/utils）
6. 相对路径

## 何时使用此规范

- 创建或修改 `frontend_next` 目录下的任何代码文件时立即应用
- 编写前端代码时自动触发此 skill
