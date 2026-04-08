# Frontend_Next_Tailwind_CSS_规范

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

## 2. 禁止事项

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>内联样式 <code>style={{...}}</code></li>
      <li>传统 <code>.css</code> 文件写类名覆写</li>
      <li>硬编码颜色值</li>
      <li>魔法数字</li>
    </ul>
  </div>
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 正确做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>Tailwind className (动态高宽除外)</li>
      <li>优先用 Tailwind 变体</li>
      <li>Tailwind 内置色板</li>
      <li>CSS 变量或 Tailwind spacing</li>
    </ul>
  </div>
</div>

---

## 3. 禁止使用的颜色

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁使用紫色系</strong>
  <div style="margin-top:8px;font-size:13px;display:flex;gap:8px;flex-wrap:wrap;">
    <code style="background:#F3F3F3;padding:2px 8px;border-radius:4px;">purple</code>
    <code style="background:#F3F3F3;padding:2px 8px;border-radius:4px;">indigo</code>
    <code style="background:#F3F3F3;padding:2px 8px;border-radius:4px;">from-purple-*</code>
    <code style="background:#F3F3F3;padding:2px 8px;border-radius:4px;">to-indigo-*</code>
    <code style="background:#F3F3F3;padding:2px 8px;border-radius:4px;">via-indigo-*</code>
  </div>
</div>

---

## 4. 允许的色系

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:linear-gradient(135deg,#0078D4,#00BCD4);border-radius:4px;margin:0 auto 8px;"></div>
    <strong style="font-size:13px;">主色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">blue-500~700</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:#4CAF50;border-radius:4px;margin:0 auto 8px;"></div>
    <strong style="font-size:13px;">成功</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">green</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:#FF9800;border-radius:4px;margin:0 auto 8px;"></div>
    <strong style="font-size:13px;">警告</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">orange</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:#F44336;border-radius:4px;margin:0 auto 8px;"></div>
    <strong style="font-size:13px;">危险</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">red</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:#90A4AE;border-radius:4px;margin:0 auto 8px;"></div>
    <strong style="font-size:13px;">中性</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">slate/gray/zinc</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="width:40px;height:24px;background:#1A1A2E;border-radius:4px;margin:0 auto 8px;border:1px solid #333;"></div>
    <strong style="font-size:13px;">深色背景</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">#0a0f1e</div>
  </div>

</div>

---

## 5. UI 标准

### 布局

| 元素 | Tailwind 类 |
|------|------------|
| 侧边栏宽度 | `w-64` |
| 顶栏高度 | `h-14` |
| 页面标题 | `text-2xl font-bold` |
| 副标题 | `text-sm text-muted-foreground` |

### 卡片

**约束**：
- 边框: `border border-border/60`
- 背景: `bg-card`
- 圆角: `rounded-xl`
- 阴影: `shadow-sm`
- Hover: `hover:border-blue-500/40`

### 输入框

| 状态 | Tailwind 类 |
|------|------------|
| 高度 | `h-11` |
| 宽度 | `w-full` |
| 内边距 | `px-4` |
| 圆角 | `rounded-lg` |
| 聚焦 | `focus:ring-2 focus:ring-blue-500/10` |

### 按钮

| 类型 | 高度 | 圆角 | 说明 |
|------|------|------|------|
| Primary | `h-10` | `rounded-lg` | 背景蓝色 |
| Secondary | `h-10` | `rounded-lg` | 边框蓝色，透明背景 |
| 圆角风格 | `h-11` | `rounded-xl` | 更圆润的风格 |

---

## 6. 响应式断点

| 断点 | 类前缀 | 说明 |
|------|--------|------|
| 640px+ | `sm:` | 手机横屏 / 小平板 |
| 768px+ | `md:` | 平板 |
| 1024px+ | `lg:` | 桌面 |
| 1280px+ | `xl:` | 大屏桌面 |

---

## 7. 间距规范

| 用途 | Tailwind 间距 |
|------|---------------|
| 卡片内边距 | `p-5` 或 `p-6` |
| 组件间距 | `gap-4` 或 `gap-6` |
| 页面边距 | `px-4 lg:px-8` |

---

## 8. 动画时长

| 场景 | Tailwind 类 |
|------|------------|
| 微交互 (悬停、点击) | `transition-all duration-200` |
| 过渡动画 (页面切换) | `transition-all duration-300` |
| 展开/收起 | `transition-all duration-300` |
| 入场动画 | `animate-in fade-in slide-in-from-bottom-4` |

---

## 9. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;">阴影</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">shadow-sm / shadow-md</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;">禁止紫色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">purple / indigo</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;">禁止内联</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">style={{...}}</div>
  </div>

</div>