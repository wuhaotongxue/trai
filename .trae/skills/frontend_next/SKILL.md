---
name: "frontend_next_code_review"
description: "用于检查和审查 frontend_next 目录下的 Next.js 前端代码。编写前端代码时调用，强制执行 App Router 规范、文件头规范与全局标点禁令。"
---

# Frontend_Next_js_代码审查

作为 TRAI 平台前端开发人员的专属代码审查警察，请严格遵守以下 Next.js + App Router 前端开发规范进行审查。

## 快速索引

||| 子规范 | 路径 | 触发场景 |
||--------|------|----------|
|| **基础规范** | | |
|| TypeScript 规范 | `rules/typescript.md` | 必读 |
|| Tailwind CSS 规范 | `rules/tailwind.md` | UI 开发时 |
|| i18n 翻译规范 | `rules/i18n.md` | 翻译文本时 |
|| **架构规范** | | |
|| App Router 规范 | `architecture/app_router.md` | 新增页面时 |
|| 五层架构 | `design/layered.md` | 必读 |
|| **页面规范** | | |
|| 组件规范 | `components/overview.md` | 开发组件时 |
|| 认证规范 | `auth/overview.md` | 权限/登录相关 |
|| 监控页面 | `pages/monitor/overview.md` | 监控页面开发 |
|| **其他规范** | | |
|| 目录结构 | `structure/tree.md` | 项目结构参考 |
|| Monorepo 配置 | `structure/monorepo.md` | 依赖管理 |

---

## 核心审查规则

### 1. 全局颜色禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止使用紫色及相关色系</strong> — 前端所有代码、UI 设计、组件中严禁出现任何紫色或紫色相近颜色
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">purple, violet, indigo, #9333EA, #7C3AED, rgb(147, 51, 234)</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">推荐: blue/cyan/teal/emerald/amber 等中性或冷暖对撞色系</code>
  </div>
  <div style="margin-top:8px;font-size:13px;">
    背景色推荐使用 <code>#080818</code> 深蓝黑 或 <code>#0F172A</code> 深灰蓝，渐变使用 <code>blue → cyan</code> 而非 <code>purple → pink</code>
  </div>
</div>

### 2. 全局中文标点符号禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，，！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

### 3. TypeScript 5.x + Next.js 15 环境

||| 设置项 | 值 |
||--------|------|
|| TypeScript | 严格模式 (`strict: true`) |
|| 类型 | 必须显式类型注解，禁止 `any` |
|| Next.js | App Router 模式 |
|| 组件 | Server Components 为默认，Client Components 需标注 |

### 4. 目录结构规范

```
frontend_next/src/
├── app/                        # App Router 页面
│   └── [locale]/               # 国际化路由
│       ├── layout.tsx         # 根布局
│       ├── page.tsx           # 首页
│       ├── login/page.tsx     # 登录页
│       └── dashboard/page.tsx # 仪表盘
├── components/                 # 组件
│   ├── ui/                    # shadcn/ui 基础组件
│   ├── layout/                # 布局组件
│   ├── business/              # 业务组件
│   └── feature/               # 功能组件
├── lib/                        # 工具库
│   ├── api-client.ts          # API 客户端
│   └── utils.ts               # 工具函数
├── stores/                     # 状态管理
│   └── auth-store.ts          # 认证状态
└── hooks/                      # 自定义 Hooks
    └── use-permission.ts      # 权限检查
```

### 5. 组件开发规范

||| 规则 | 说明 |
||------|------|
|| 组件名 | PascalCase (`MeetingCard`) |
|| Props 接口 | PascalCase + Props (`MeetingCardProps`) |
|| 文件名 | kebab-case (`meeting-card.tsx`) |
|| 组件行数 | 建议 <= 200 行，超限拆分 |

### 6. API 客户端规范

||| 规则 | 说明 |
||------|------|
|| 请求拦截器 | 自动添加 Authorization Header |
|| 401 处理 | 自动跳转登录页 |
|| 响应格式 | `{ code, data, msg }` |

### 7. 状态管理规范

||| 工具 | 用途 |
||------|------|
|| Zustand + persist | 全局状态 (auth, settings) |
|| URL SearchParams | 页面级筛选状态 |
|| React state | 组件级状态 |

### 8. 文件头模板 (MANDATORY)

```typescript
/**
 * 文件名: {文件名}
 * 作者: wuhao
 * 日期: {YYYY-MM-DD HH:MM:SS}
 * 描述: {该文件的用途/功能简述，一句话概括}
 */
```

### 9. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>组件内硬编码样式 (必须使用 Tailwind 变量)</li>
    <li>业务逻辑写在 UI 组件中</li>
    <li>组件超过 200 行未拆分</li>
    <li>直接使用 any 类型</li>
    <li>不使用 shadcn/ui 直接写 HTML</li>
    <li>Token 存储在 localStorage</li>
    <li><strong>使用紫色及相关色系 (purple/violet/indigo)</strong></li>
  </ul>
</div>

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止紫色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">purple/violet/indigo</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 any 类型</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须显式类型注解</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Server Components</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">默认模式</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">shadcn/ui</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">基础组件库</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Zustand</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全局状态管理</div>
  </div>

</div>

---

## 版本历史

||| 版本 | 日期 | 更新内容 |
||------|------|---------|
|| v2.1 | 2026-04-09 | 新增全局颜色禁令，禁止紫色及相关色系 |
|| v2.0 | 2026-04-08 | 简化文档结构，统一使用表格和 HTML 卡片 |
|| v1.0 | 2026-04-01 | 初版发布 |
