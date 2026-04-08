# Frontend_Landing_组件规范

---

## 1. 布局组件

### Navbar

```tsx
interface NavbarProps {
  scrolled: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
}
```

### Hero

```tsx
interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaSecondary: string;
}
```

### CTA

```tsx
interface CTASectionProps {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}
```

---

## 2. 展示组件

### FeatureCard

```tsx
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}
```

### TestimonialCard

```tsx
interface TestimonialCardProps {
  avatar: string;
  name: string;
  role: string;
  quote: string;
  stars: number;
}
```

### PricingCard

```tsx
interface PricingCardProps {
  tier: PricingTier;
  onCtaClick: () => void;
}

interface PricingTier {
  key: string;
  title: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
}
```

---

## 3. 交互组件

### ThemeSwitcher

```tsx
// 主题切换: light/dark/system
```

### LanguageSwitcher

```tsx
// 语言切换: zh/en
```

### FullscreenButton

```tsx
// 全屏切换按钮
```

---

## 4. 样式规范

### 渐变背景

```css
.bg-gradient-to-br from-blue-600 to-cyan-600
.bg-gradient-to-r from-rose-600 to-orange-600
```

### 阴影

```css
.shadow-lg.shadow-blue-600/25
.shadow-xl.shadow-blue-600/10
```

### 动画

```css
.animate-fade-in
.transition-all.duration-300
.hover:-translate-y-1
```

---

## 5. 响应式断点

| 断点 | 说明 |
|------|------|
| sm | >= 640px |
| md | >= 768px |
| lg | >= 1024px |
| xl | >= 1280px |
| 2xl | >= 1536px |

---

## 6. 禁止事项

- 组件内硬编码颜色值
- 移动端超出可视区域
- 图片未使用 WebP
- 字体未预加载
- 动画导致性能问题