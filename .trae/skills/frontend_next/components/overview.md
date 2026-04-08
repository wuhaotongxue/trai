# Frontend_Next_js_UI_组件规范

---

## 1. 组件分类

| 分类 | 目录 | 说明 |
|------|------|------|
| 布局组件 | `components/layout/` | Sidebar、Navbar、Footer |
| UI 基础组件 | `components/ui/` | shadcn/ui 组件 |
| 业务组件 | `components/business/` | 业务逻辑组件 |
| 功能组件 | `components/feature/` | AI 生成等功能组件 |

---

## 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 目录 | kebab-case | `meeting-card/` |
| 组件文件 | kebab-case | `meeting-detail-card.tsx` |
| 组件名 | PascalCase | `MeetingDetailCard` |
| Props 接口 | PascalCase + Props | `MeetingCardProps` |
| CSS 类 | Tailwind | `className="p-4"` |

---

## 3. UI 基础组件

### 3.1 Button

```tsx
import { Button } from "@/components/ui/button";

// 变体
<Button variant="default" />   // 默认
<Button variant="destructive" /> // 危险
<Button variant="outline" />   // 轮廓
<Button variant="ghost" />     // 透明
<Button variant="link" />      // 链接

// 尺寸
<Button size="sm" />          // 小
<Button size="default" />      // 默认
<Button size="lg" />           // 大
<Button size="icon" />        // 图标
```

### 3.2 Card

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>
```

### 3.3 Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    {children}
  </DialogContent>
</Dialog>
```

### 3.4 Input

```tsx
import { Input } from "@/components/ui/input";

<Input
  type="text"
  placeholder="请输入..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 3.5 Badge

```tsx
import { Badge } from "@/components/ui/badge";

// 状态徽章
<Badge variant="default">默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>
<Badge variant="outline">轮廓</Badge>
```

---

## 4. 业务组件

### 4.1 Meeting 模块

```
components/business/meeting/
├── meeting-list.tsx        # 会议列表
├── meeting-card.tsx        # 会议卡片
├── meeting-detail-card.tsx # 会议详情卡片
├── meeting-recorder-dialog.tsx # 录制对话框
└── meeting-analytics-dashboard.tsx # 分析仪表盘
```

### 4.2 Report 模块

```
components/business/report/
├── report-list.tsx        # 报告列表
├── report-card.tsx        # 报告卡片
├── report-dashboard.tsx   # 报告仪表盘
├── report-edit-dialog.tsx # 编辑对话框
├── report-export-dialog.tsx # 导出对话框
└── git-analyze-dialog.tsx  # Git 分析对话框
```

---

## 5. 功能组件

### 5.1 AI 生成组件

```
components/feature/ai-generate/
├── image-generator.tsx    # 图片生成器
├── video-generator.tsx    # 视频生成器
├── music-generator.tsx    # 音乐生成器
├── speech-synthesizer.tsx # 语音合成器
└── transcript-editor.tsx   # 转录编辑器
```

### 5.2 组件模板

**文件路径**：`components/business/xxx-card.tsx`

**Props 定义**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `data` | `XxxData` | 是 | 数据源 |
| `onEdit` | `(id: string) => void` | 否 | 编辑回调 |
| `onDelete` | `(id: string) => void` | 否 | 删除回调 |

**XxxData 类型**

```tsx
interface XxxData {
  id: string;
  title: string;
  description: string;
  status: "active" | "inactive";
}
```

**组件结构**

```
Card
├── CardHeader (pb-3)
│   └── flex (items-center, justify-between)
│       ├── CardTitle (text-base)
│       └── Badge (variant: status 决定)
└── CardContent
    ├── p (text-sm, text-muted-foreground, mb-4)
    └── div (flex, gap-2)
        ├── Button (编辑, variant=outline, size=sm)
        └── Button (删除, variant=destructive, size=sm)
```

**实现参考**：`frontend_next/src/components/business/`

---

## 6. 布局组件

### 6.1 Sidebar

```tsx
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// 状态
<Sidebar collapsed={false} />  // 展开 240px
<Sidebar collapsed={true} />   // 折叠 64px
```

### 6.2 Navbar

```tsx
// 组件层级
<Navbar>
  <Breadcrumb />         // 面包屑
  <ThemeSwitcher />       // 主题切换
  <LanguageSwitcher />   // 语言切换
  <UserMenu />           // 用户菜单
</Navbar>
```

### 6.3 QuickChat

```tsx
// 右下角快捷聊天
<QuickChat locale={locale} />
```

---

## 7. 响应式断点

| 断点 | Tailwind | 典型设备 |
|------|----------|----------|
| sm |640px | 手机横屏 |
| md | 768px | 平板 |
| lg | 1024px | 笔记本 |
| xl | 1280px | 桌面 |
| 2xl | 1536px | 大屏 |

---

## 8. 组件规范

### 8.1 Props 类型定义

```tsx
// ✅ 正确
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
  size?: "sm" | "default" | "lg";
}

// ❌ 错误
interface ButtonProps {
  className?: string;
  onClick?: () => void;
}
```

### 8.2 默认值处理

```tsx
// ✅ 正确
function Button({ variant = "default", size = "default", ...props }: ButtonProps) {
  return <button className={cn(defaultStyles, variantStyles[variant], sizeStyles[size])} {...props} />;
}

// ❌ 错误
function Button(props: ButtonProps) {
  const variant = props.variant || "default";
  // ...
}
```

### 8.3 组合组件

```tsx
// ✅ 正确
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>内容</CardContent>
</Card>

// ❌ 错误
<div className="card">
  <div className="card-header">
    <h3>标题</h3>
  </div>
  <div className="card-content">内容</div>
</div>
```

---

## 9. 禁止事项

- 组件内硬编码样式 (使用 Tailwind 变量)
- 业务逻辑写在 UI 组件中
- 组件超过 200 行未拆分
- 组件无 TypeScript 类型
- 直接使用 any 类型
- 不使用 shadcn/ui 直接写 HTML