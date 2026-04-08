# Frontend Next - App Router 规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 目录结构

```
src/app/
├── [locale]/                       # 国际化路由
│   ├── layout.tsx                  # 根布局 (Server Component)
│   ├── page.tsx                    # 首页 (Server Component)
│   ├── login/
│   │   └── page.tsx                # 登录页
│   ├── dashboard/
│   │   ├── page.tsx                # 仪表盘
│   │   ├── loading.tsx             # 加载态
│   │   └── error.tsx               # 错误边界
│   └── (auth)/
│       └── layout.tsx              # 认证布局
│
├── api/                           # API 路由 (Route Handlers)
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts
│
└── globals.css
```

---

## 3. Server Components vs Client Components

### 默认规则

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; 所有组件默认是 Server Components</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    更快的首屏加载 &bull; 更好的 SEO &bull; 更小的客户端 JS Bundle
  </div>
</div>

### 何时使用 "use client"

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px;">
    <strong style="color:#F57F17;">&#x26A0; 必须 use client</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li><code>useState</code> / <code>useEffect</code> / <code>useRef</code></li>
      <li><code>onClick</code> / <code>onChange</code> 等事件</li>
      <li>浏览器 API (<code>window</code>, <code>localStorage</code>)</li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 严禁 use client</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>父布局 <code>layout.tsx</code></li>
      <li>根节点页面 <code>page.tsx</code></li>
      <li>仅为图省事的随意声明</li>
    </ul>
  </div>
</div>

---

## 4. 数据获取

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; Server Components 中获取</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>直接在 Server Component 中获取数据</li>
      <li>使用 <code>cache()</code> 缓存数据</li>
      <li>适合数据预取</li>
    </ul>
  </div>
  <div style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:12px;">
    <strong style="color:#1565C0;">&#x1F4CB; Client Components 中获取</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>通过 Props 接收 Server 数据</li>
      <li>适合客户端行为 (轮询、WebSocket)</li>
      <li>配合 <code>useState</code> / <code>useEffect</code></li>
    </ul>
  </div>
</div>

---

## 5. 路由与导航

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 使用 Next.js Link</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      <code>import Link from "next/link"</code>
    </div>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 禁止原生 a 标签</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      除非是外部链接
    </div>
  </div>
</div>

---

## 6. 错误边界

**约束**：
- 每个页面目录必须有 `error.tsx` (Client Component)
- 必须声明 `reset` 函数用于重试

---

## 7. 加载状态

**约束**：
- 每个页面目录必须有 `loading.tsx`
- 使用旋转动画表示加载中

---

## 8. 中间件

**约束**：
- 路径: `middleware.ts` (根目录)
- 必须校验 Token 并重定向未登录用户
- 必须配置 `matcher` 排除静态资源

---

## 9. 文件头模板

```typescript
/**
 * 文件名: {相对路径}
 * 作者: wuhao
 * 日期: {YYYY-MM-DD HH:MM:SS}
 * 描述: {该文件的功能简述，一句话概括}
 */
```

---

## 10. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#2E7D32;">默认 Server</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">无需声明"use client"</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 layout client</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">导致整树退化客户端</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Link 导航</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">用 next/link</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">useEffect deps</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须定义依赖数组</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">cleanup</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">timer/ws 必须清除</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">error.tsx</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每个页面都要有</div>
  </div>

</div>