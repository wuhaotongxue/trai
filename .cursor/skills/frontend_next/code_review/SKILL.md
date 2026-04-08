---
name: "frontend-next-code-review"
description: "用于检查和审查 frontend_next 目录下的 Next.js 前端代码。编写前端代码时调用，强制执行 App Router 规范、文件头规范与全局标点禁令。"
---

# Frontend Next 代码审查

作为 TRAI 平台新版前端 (frontend_next) 开发人员的专属代码审查警察，请严格遵守以下 Next.js (App Router) 与 React 开发规范。

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| TypeScript 规范 | `rules/typescript.md` | 必读 |
| Tailwind CSS 规范 | `rules/tailwind.md` | 必读 |
| i18n 翻译规范 | `rules/i18n.md` | 新增文案时 |
| App Router 规范 | `architecture/app_router.md` | 必读 |

---

## 核心审查规则

### 1. 中文标点禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

### 2. 环境与包管理

| 设置项 | 值 |
|--------|------|
| 环境 | Node.js 18.17.0+ |
| 包管理器 | pnpm 8.0+ |
| ❌ 禁止 | npm / yarn |

### 3. App Router (RSC) 规范

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 默认 Server Components</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>更快的首屏加载</li>
      <li>更好的 SEO</li>
      <li>更小的客户端 JS Bundle</li>
    </ul>
  </div>
  <div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px;">
    <strong style="color:#F57F17;">&#x26A0; 必须 use client</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li><code>useState</code> / <code>useEffect</code></li>
      <li><code>onClick</code> / <code>onChange</code></li>
      <li>浏览器 API</li>
    </ul>
  </div>
</div>

### 4. TypeScript 严格类型

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 必须显式声明</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>所有数据结构</li>
      <li>组件 Props</li>
      <li>API 响应</li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 严禁 any</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>禁止 <code>: any</code></li>
      <li>禁止 <code>as any</code></li>
      <li>禁止 <code>const data: any = ...</code></li>
    </ul>
  </div>
</div>

### 5. 样式规范 (Tailwind CSS)

| 规则 | 说明 |
|------|------|
| ✅ 强制 | Tailwind CSS className |
| ❌ 禁止 | 内联 <code>style={{...}}</code> |
| ❌ 禁止 | 传统 <code>.css</code> 文件 |
| ❌ 禁止 | 紫色系 (purple / indigo) |
| ✅ 必须 | 响应式设计 (sm: / md: / lg:) |

### 6. 翻译文件 (i18n) 规范 (CRITICAL)

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 核心铁律</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>所有用户可见文案必须通过 <code>useTranslations</code> 获取</strong></li>
    <li><strong>严禁在 JSX/TSX 文件中直接写中文字符串</strong></li>
    <li><strong>新增翻译 key 时，必须同时在四种语言中添加</strong></li>
  </ul>
</div>

### 7. 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件文件 | snake_case | `meeting_analytics.tsx` |
| 组件名 | PascalCase | `MeetingAnalytics` |
| 变量名 | snake_case | `total_records` |
| Import | 绝对路径 | `@/components/...` |

### 8. 文件头模板 (MANDATORY)

```typescript
/**
 * 文件名: {相对路径}
 * 作者: wuhao
 * 日期: {YYYY-MM-DD HH:MM:SS}
 * 描述: {该文件的功能简述，一句话概括}
 */
```

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 any 类型</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须显式声明类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止内联样式</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">style={{...}}</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#2E7D32;">默认 Server</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">无需"use client"</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#2E7D32;">四种语言同步</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">zh/en/ja/ko</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">绝对路径</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">@/components/...</div>
  </div>

</div>