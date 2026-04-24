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

所有类名使用 **snake_case** 命名。

### 基础块

| 类名 | 用途 | 颜色 |
|------|------|------|
| `.doc_lead` | 开篇高亮 | 蓝色渐变 |
| `.doc_tip` | 提示块 | 蓝色 |
| `.doc_info` | 信息块 | 青色 |
| `.doc_warn` | 警告块 | 红色 |
| `.doc_ok` | 成功块 | 绿色 |

### 组件

| 类名 | 用途 |
|------|------|
| `.doc_cards` / `.doc_card` | 卡片栅格 |
| `.doc_table_wrap` | 表格包装 |
| `.doc_tag` | 小节标签 |
| `.doc_badge_*` | 徽章（red/blue/green/yellow/purple） |
| `.doc_progress` | 进度条 |
| `.doc_steps` / `.doc_step` | 步骤指示器 |
| `.doc_details` | 折叠块 |
| `.doc_toc` | 目录导航 |
| `.doc_stats` / `.doc_stat` | 统计数据 |
| `.doc_quote` | 引用块 |

### 文字样式

| 类名 | 用途 |
|------|------|
| `.doc_highlight` | 高亮文字 |
| `.doc_del` | 删除线 |

## 使用示例

```html
<div class="doc_tip">
  <strong>提示：</strong>这是一个提示信息
</div>

<div class="doc_ok">
  操作成功！
</div>

<div class="doc_cards">
  <div class="doc_card">
    <div class="doc_card_title">功能一</div>
    <p>描述内容</p>
  </div>
</div>

<div class="doc_stats">
  <div class="doc_stat">
    <div class="doc_stat_value">42</div>
    <div class="doc_stat_label">完成数</div>
  </div>
</div>

<div class="doc_steps">
  <div class="doc_step">
    <div class="doc_step_title">第一步</div>
    <div class="doc_step_content">执行操作</div>
  </div>
</div>

<div class="doc_badge doc_badge_green">已完成</div>
```

## 注意事项

1. 使用 class 时，`<div class="...">` 与内部内容之间**不要插入空行**
2. GitHub 网页不加载此 CSS 文件
3. 推荐使用内联 `style` 属性以确保兼容性
