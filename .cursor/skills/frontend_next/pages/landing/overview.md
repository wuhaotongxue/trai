# Frontend Next.js - Landing 官网规范

---

## 1. 页面分区

```
src/app/[locale]/page.tsx
├── Navbar          # 顶部导航
├── Hero            # 首屏 Hero
├── StatsBar        # 数据统计条
├── Features        # 功能特性
├── Testimonials    # 用户评价
├── Pricing         # 定价方案
├── CTA             # 行动召唤
├── Footer          # 页脚
├── FullscreenBtn   # 全屏按钮
└── QuickChat       # 快捷聊天
```

---

## 2. Navbar

```tsx
// 固定顶部，滚动后变化
const [scrolled, setScrolled] = useState(false);

<header className={scrolled
  ? "fixed top-0 inset-x-0 z-50 border-b bg-background/90 backdrop-blur-md shadow-sm"
  : "fixed top-0 inset-x-0 z-50 bg-transparent"
}>
```

---

## 3. Hero 区域

### 3.1 标题

```tsx
<h1 className="text-5xl md:text-7xl font-bold tracking-tight">
  {t("hero.title_1")}
  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
    {t("hero.title_2")}
  </span>
</h1>
```

### 3.2 CTA 按钮

```tsx
<Button
  size="lg"
  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-cyan-600
             hover:from-blue-700 hover:to-cyan-700
             shadow-lg shadow-blue-600/25"
>
  {t("hero.cta")}
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
```

### 3.3 背景光效

```tsx
<div className="absolute top-1/4 left-1/2 -translate-x-1/2
                w-[700px] h-[500px] rounded-full
                bg-blue-600/10 blur-[120px] pointer-events-none" />
```

---

## 4. StatsBar

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
  {[
    { val: "10,000+", label: "活跃用户" },
    { val: "50M+", label: "AI 调用次数" },
    { val: "99.9%", label: "服务可用性" },
    { val: "50+", label: "AI 模型支持" },
  ].map((s) => (
    <div key={s.label} className="text-center">
      <div className="text-3xl font-bold">{s.val}</div>
      <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
    </div>
  ))}
</div>
```

---

## 5. Features

```tsx
const FEATURES = [
  { icon: Bot, titleKey: "features.aiTitle", descKey: "features.aiDesc" },
  { icon: Layers, titleKey: "features.workflowTitle", descKey: "features.workflowDesc" },
  { icon: FileText, titleKey: "features.reportTitle", descKey: "features.reportDesc" },
  { icon: Shield, titleKey: "features.securityTitle", descKey: "features.securityDesc" },
  { icon: Globe, titleKey: "features.i18nTitle", descKey: "features.i18nDesc" },
  { icon: Cpu, titleKey: "features.computeTitle", descKey: "features.computeDesc" },
];
```

---

## 6. Testimonials

```tsx
const TESTIMONIALS = [
  { avatar: "👨‍💻", name: "李明", role: "CTO · 创业公司", quote: "很好用" },
  { avatar: "👩‍🎨", name: "王芳", role: "产品经理 · 互联网", quote: "大幅提升效率" },
  { avatar: "🧑‍🔬", name: "张博士", role: "AI 研究员", quote: "功能强大" },
];
```

---

## 7. Pricing

```tsx
const PRICING_TIERS = [
  { key: "free", title: "Free", price: "0", period: "/mo", highlight: false },
  { key: "pro", title: "Pro", price: "99", period: "/mo", highlight: true },
  { key: "enterprise", title: "Enterprise", price: "定制", period: "", highlight: false },
];
```

---

## 8. Footer

```tsx
<footer className="border-t py-16">
  <div className="max-w-7xl mx-auto px-4">
    <div className="grid md:grid-cols-4 gap-8">
      {/* Logo + 描述 */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
          <span className="text-lg font-bold">TRAI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("footer.desc")}
        </p>
      </div>
      {/* 产品链接 */}
      {/* 开发者链接 */}
      {/* 公司链接 */}
    </div>
    <div className="border-t pt-8 flex justify-between">
      <p className="text-sm text-muted-foreground">© 2026 TRAI</p>
      <div className="flex gap-4">
        <a href="#">隐私政策</a>
        <a href="#">服务条款</a>
      </div>
    </div>
  </div>
</footer>
```

---

## 9. 全屏模式

```tsx
const [fullscreen, setFullscreen] = useState(false);

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
};

<button onClick={toggleFullscreen}>
  {fullscreen ? <Minimize2 /> : <Maximize2 />}
</button>
```

---

## 10. 响应式设计

| 断点 | 布局 |
|------|------|
| 移动端 | 单列堆叠 |
| 平板 (md) | 两列网格 |
| 桌面 (lg) | 三列/四列网格 |

---

## 11. 禁止事项

- 首屏加载超过 3 秒
- 移动端布局错乱
- 无暗色模式支持
- 图片无 WebP 格式
- CTA 按钮不明显
- 无预加载关键资源
