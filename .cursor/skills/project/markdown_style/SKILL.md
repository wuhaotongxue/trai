---
name: "markdown_style"
description: "TRAI Markdown 文档增强样式规范，提供丰富的 CSS 类用于美化文档。"
---

# Markdown 样式规范

## 概述

项目提供统一的 Markdown 增强样式，位于 `styles/markdown.css`。

## 使用方式

在 Cursor / VS Code 中设置 `markdown.styles` 添加：

```
styles/markdown.css
```

## 可用样式类

### 基础块

| 类名 | 用途 | 颜色 |
|------|------|------|
| `.doc-lead` | 开篇高亮 | 蓝色渐变 |
| `.doc-tip` | 提示块 | 蓝色 |
| `.doc-info` | 信息块 | 青色 |
| `.doc-warn` | 警告块 | 红色 |
| `.doc-ok` | 成功块 | 绿色 |

### 组件

| 类名 | 用途 |
|------|------|
| `.doc-cards` / `.doc-card` | 卡片栅格 |
| `.doc-table-wrap` | 表格包装 |
| `.doc-tag` | 小节标签 |
| `.doc-badge--*` | 徽章（red/blue/green/yellow/purple） |
| `.doc-progress` | 进度条 |
| `.doc-steps` / `.doc-step` | 步骤指示器 |
| `.doc-details` | 折叠块 |
| `.doc-toc` | 目录导航 |
| `.doc-stats` / `.doc-stat` | 统计数据 |
| `.doc-quote` | 引用块 |

### 文字样式

| 类名 | 用途 |
|------|------|
| `.doc-highlight` | 高亮文字 |
| `.doc-del` | 删除线 |

## 使用示例

```html
<div class="doc-tip">
  <strong>提示：</strong>这是一个提示信息
</div>

<div class="doc-ok">
  操作成功！
</div>

<div class="doc-cards">
  <div class="doc-card">
    <div class="doc-card-title">功能一</div>
    <p>描述内容</p>
  </div>
</div>

<div class="doc-stats">
  <div class="doc-stat">
    <div class="doc-stat-value">42</div>
    <div class="doc-stat-label">完成数</div>
  </div>
</div>

<div class="doc-steps">
  <div class="doc-step">
    <div class="doc-step-title">第一步</div>
    <div class="doc-step-content">执行操作</div>
  </div>
</div>

<div class="doc-badge doc-badge--green">已完成</div>
```

## 注意事项

1. 使用 class 时，`<div class="...">` 与内部内容之间**不要插入空行**
2. GitHub 网页不加载此 CSS 文件
3. 推荐使用内联 `style` 属性以确保兼容性
