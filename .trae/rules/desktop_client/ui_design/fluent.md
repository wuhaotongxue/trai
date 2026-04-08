# Desktop Client - Win11 Fluent UI 设计规范

> 面向 Windows 11 的原生视觉体验，遵循微软 Fluent Design System 设计语言

---

## 1. 字体规范

| 层级 | 字体 | 字号 | 字重 | 示例预览 |
|------|------|------|------|----------|
| 大标题 | Segoe UI | 24px | Bold (700) | **大标题** |
| 标题 | Segoe UI | 18px | SemiBold (600) | **标题** |
| 正文 | Segoe UI | 14px | Regular (400) | 正文内容 |
| 辅助文字 | Segoe UI | 12px | Regular (400) | 辅助说明 |
| 按钮文字 | Segoe UI | 14px | SemiBold (600) | **按钮** |

> 所有文字统一使用 `Segoe UI`，切勿混用其他字体

---

## 2. 色彩规范

### 主色调

<div>
  <table>
    <tr>
      <td style="width:120px;text-align:center;padding:12px;">
        <div style="width:60px;height:60px;background:#0078D4;border-radius:8px;margin:0 auto;box-shadow:0 2px 8px rgba(0,120,212,0.3);"></div>
        <strong style="display:block;margin-top:8px;">Primary</strong>
        <code style="font-size:11px;">#0078D4</code>
      </td>
      <td style="width:120px;text-align:center;padding:12px;">
        <div style="width:60px;height:60px;background:#106EBE;border-radius:8px;margin:0 auto;box-shadow:0 2px 8px rgba(16,110,190,0.3);"></div>
        <strong style="display:block;margin-top:8px;">Hover</strong>
        <code style="font-size:11px;">#106EBE</code>
      </td>
      <td style="width:120px;text-align:center;padding:12px;">
        <div style="width:60px;height:60px;background:#005A9E;border-radius:8px;margin:0 auto;box-shadow:0 2px 8px rgba(0,90,158,0.3);"></div>
        <strong style="display:block;margin-top:8px;">Pressed</strong>
        <code style="font-size:11px;">#005A9E</code>
      </td>
      <td style="width:120px;text-align:center;padding:12px;">
        <div style="width:60px;height:60px;background:#A0CFFF;border-radius:8px;margin:0 auto;border:1px solid #E1E1E1;"></div>
        <strong style="display:block;margin-top:8px;">Disabled</strong>
        <code style="font-size:11px;">#A0CFFF</code>
      </td>
    </tr>
  </table>
</div>

### 中性色

| 名称 | 色值 | 预览 | 用途 |
|------|------|------|------|
| Background | `#FFFFFF` | <span style="display:inline-block;width:32px;height:20px;background:#FFFFFF;border:1px solid #E1E1E1;border-radius:4px;vertical-align:middle;"></span> | 页面背景 |
| Surface | `#F3F3F3` | <span style="display:inline-block;width:32px;height:20px;background:#F3F3F3;border:1px solid #E1E1E1;border-radius:4px;vertical-align:middle;"></span> | 卡片背景 |
| Border | `#E1E1E1` | <span style="display:inline-block;width:32px;height:20px;background:#E1E1E1;border-radius:4px;vertical-align:middle;"></span> | 边框线 |
| Text Primary | `#1A1A1A` | <span style="display:inline-block;width:32px;height:20px;background:#1A1A1A;border-radius:4px;vertical-align:middle;"></span> | 主要文字 |
| Text Secondary | `#666666` | <span style="display:inline-block;width:32px;height:20px;background:#666666;border-radius:4px;vertical-align:middle;"></span> | 次要文字 |
| Text Disabled | `#A3A3A3` | <span style="display:inline-block;width:32px;height:20px;background:#A3A3A3;border-radius:4px;vertical-align:middle;"></span> | 禁用文字 |

### 禁止的颜色

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 严禁使用</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;">
    <li>紫色系 — <code>purple</code> / <code>indigo</code> / <code>from-purple-*</code></li>
    <li>绿/红强渐变作为主色</li>
    <li>饱和度超过 100% 的颜色</li>
  </ul>
</div>

---

## 3. 圆角规范

| 元素 | 圆角值 | 视觉预览 |
|------|--------|----------|
| 小控件 (Button, Input) | 4px | <span style="display:inline-block;width:48px;height:28px;background:#0078D4;border-radius:4px;"></span> |
| 卡片 (Card) | 8px | <span style="display:inline-block;width:48px;height:28px;background:#0078D4;border-radius:8px;"></span> |
| 对话框 (Dialog) | 12px | <span style="display:inline-block;width:48px;height:28px;background:#0078D4;border-radius:12px;"></span> |
| 弹窗 (Modal) | 16px | <span style="display:inline-block;width:48px;height:28px;background:#0078D4;border-radius:16px;"></span> |

---

## 4. 按钮规范

### 主按钮

<div style="display:flex;gap:12px;align-items:center;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">
  <div style="background:#0078D4;color:white;border:none;border-radius:4px;padding:10px 24px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Primary</div>
  <div style="background:#106EBE;color:white;border:none;border-radius:4px;padding:10px 24px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Hover</div>
  <div style="background:#005A9E;color:white;border:none;border-radius:4px;padding:10px 24px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Pressed</div>
  <div style="background:#A0CFFF;color:white;border:none;border-radius:4px;padding:10px 24px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:not-allowed;opacity:0.7;">Disabled</div>
</div>

```python
primary_button_style = """
QPushButton {
    background-color: #0078D4;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 24px;
    font-family: 'Segoe UI';
    font-size: 14px;
    font-weight: 600;
}
QPushButton:hover { background-color: #106EBE; }
QPushButton:pressed { background-color: #005A9E; }
QPushButton:disabled { background-color: #A0CFFF; color: white; }
"""
```

### 次要按钮

<div style="display:flex;gap:12px;align-items:center;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">
  <div style="background:transparent;color:#0078D4;border:1px solid #0078D4;border-radius:4px;padding:9px 23px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Secondary</div>
  <div style="background:#F3F3F3;color:#0078D4;border:1px solid #0078D4;border-radius:4px;padding:9px 23px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Hover</div>
  <div style="background:#E1E1E1;color:#0078D4;border:1px solid #0078D4;border-radius:4px;padding:9px 23px;font-family:'Segoe UI';font-size:14px;font-weight:600;cursor:pointer;">Pressed</div>
</div>

```python
secondary_button_style = """
QPushButton {
    background-color: transparent;
    color: #0078D4;
    border: 1px solid #0078D4;
    border-radius: 4px;
    padding: 9px 23px;
    font-family: 'Segoe UI';
    font-size: 14px;
    font-weight: 600;
}
QPushButton:hover { background-color: #F3F3F3; }
QPushButton:pressed { background-color: #E1E1E1; }
"""
```

---

## 5. 输入框规范

<div style="display:flex;flex-direction:column;gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">
  <input style="background:white;border:1px solid #E1E1E1;border-radius:4px;padding:8px 12px;font-family:'Segoe UI';font-size:14px;color:#1A1A1A;width:280px;" value="Normal State" />
  <input style="background:white;border:2px solid #0078D4;border-radius:4px;padding:8px 12px;font-family:'Segoe UI';font-size:14px;color:#1A1A1A;width:280px;outline:none;" value="Focus State" />
  <input style="background:#F3F3F3;border:1px solid #E1E1E1;border-radius:4px;padding:8px 12px;font-family:'Segoe UI';font-size:14px;color:#A3A3A3;width:280px;" value="Disabled State" disabled />
</div>

```python
input_style = """
QLineEdit {
    background-color: white;
    border: 1px solid #E1E1E1;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'Segoe UI';
    font-size: 14px;
    color: #1A1A1A;
}
QLineEdit:hover { border-color: #0078D4; }
QLineEdit:focus { border-color: #0078D4; border-width: 2px; }
QLineEdit:disabled { background-color: #F3F3F3; color: #A3A3A3; }
"""
```

---

## 6. 阴影规范

<div style="display:flex;gap:24px;padding:24px;background:#F9F9F9;border-radius:12px;margin:12px 0;align-items:center;">
  <div style="background:white;border-radius:8px;padding:16px;width:120px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <strong style="font-size:12px;color:#666;">sm</strong><br/>
    <code style="font-size:10px;">blur: 8px</code>
  </div>
  <div style="background:white;border-radius:8px;padding:16px;width:120px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
    <strong style="font-size:12px;color:#666;">md</strong><br/>
    <code style="font-size:10px;">blur: 16px</code>
  </div>
  <div style="background:white;border-radius:8px;padding:16px;width:120px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.16);">
    <strong style="font-size:12px;color:#666;">lg</strong><br/>
    <code style="font-size:10px;">blur: 32px</code>
  </div>
</div>

```python
from PyQt6.QtWidgets import QGraphicsDropShadowEffect
from PyQt6.QtGui import QColor
from PyQt6.QtCore import QPointF

# 中等阴影 (推荐)
shadow = QGraphicsDropShadowEffect()
shadow.setBlurRadius(16)
shadow.setOffset(QPointF(0, 4))
shadow.setColor(QColor(0, 0, 0, 40))  # 40% 透明度
```

---

## 7. 动效规范

<div style="display:flex;gap:16px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;align-items:center;">
  <div style="text-align:center;">
    <div style="width:60px;height:36px;background:#0078D4;border-radius:4px;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">hover</div>
    <code style="font-size:11px;color:#666;margin-top:4px;display:block;">100~200ms</code>
  </div>
  <div style="text-align:center;">
    <div style="width:60px;height:36px;background:#0078D4;border-radius:4px;transition:all 0.25s ease;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">fade</div>
    <code style="font-size:11px;color:#666;margin-top:4px;display:block;">200~300ms</code>
  </div>
  <div style="text-align:center;">
    <div style="width:60px;height:36px;background:#0078D4;border-radius:4px;transition:all 0.35s ease;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">slide</div>
    <code style="font-size:11px;color:#666;margin-top:4px;display:block;">300~400ms</code>
  </div>
</div>

```python
from PyQt6.QtCore import QPropertyAnimation, QEasingCurve, QRect

# 过渡动画
anim = QPropertyAnimation(self._widget, b"windowOpacity")
anim.setDuration(250)
anim.setEasingCurve(QEasingCurve.Type.InOutCubic)
anim.setStartValue(0.0)
anim.setEndValue(1.0)
anim.start()
```

### 动效时长标准

| 场景 | 推荐时长 | 缓动曲线 |
|------|----------|----------|
| 微交互 (悬停、点击) | 100~200ms | `InOutQuad` |
| 过渡动画 (页面切换) | 200~300ms | `InOutCubic` |
| 展开/收起 | 300~400ms | `InOutQuart` |
| 对话框弹出 | 200ms | `OutCubic` |

> **缓动曲线优先使用**: `QEasingCurve.InOutQuad`，避免线性动画导致生硬感

---

## 8. 卡片规范

<div style="display:flex;gap:16px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">
  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:16px;flex:1;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="width:40px;height:40px;background:#E8F4FD;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F4CA;</div>
    <strong>卡片标题</strong>
    <p style="color:#666;font-size:13px;margin:8px 0 0 0;">卡片内容区域，可以包含列表、图表或任何信息</p>
  </div>
  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:16px;flex:1;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:all 0.2s;">
    <div style="width:40px;height:40px;background:#E8F4FD;border-radius:8px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">&#x1F4C8;</div>
    <strong>Hover 效果</strong>
    <p style="color:#666;font-size:13px;margin:8px 0 0 0;">鼠标悬停时边框变为蓝色</p>
  </div>
</div>

```python
card_style = """
QFrame#card {
    background-color: white;
    border: 1px solid #E1E1E1;
    border-radius: 8px;
    padding: 16px;
}
QFrame#card:hover {
    border: 1px solid #0078D4;
}
"""

# 推荐阴影
shadow = QGraphicsDropShadowEffect()
shadow.setBlurRadius(8)
shadow.setOffset(QPointF(0, 2))
shadow.setColor(QColor(0, 0, 0, 20))
```

---

## 9. 状态栏规范

```python
statusbar_style = """
QStatusBar {
    background-color: #F3F3F3;
    color: #666666;
    font-family: 'Segoe UI';
    font-size: 12px;
    padding: 4px 12px;
    border-top: 1px solid #E1E1E1;
}
"""
```

---

## 10. 快速参考卡

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x1F4D0;</div>
    <strong style="font-size:13px;">主色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">#0078D4</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x1F516;</div>
    <strong style="font-size:13px;">圆角</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">4px / 8px / 12px</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x23F1;</div>
    <strong style="font-size:13px;">动画时长</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">100~400ms</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x1F4DD;</div>
    <strong style="font-size:13px;">字体</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Segoe UI</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x2B1B;</div>
    <strong style="font-size:13px;">禁止色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">purple/indigo</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">&#x1F4AC;</div>
    <strong style="font-size:13px;">间距基准</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">4px 倍数</div>
  </div>

</div>