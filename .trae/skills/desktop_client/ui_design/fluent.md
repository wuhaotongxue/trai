# Desktop Client - Win11 Fluent UI 设计规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 字体规范

| 层级 | 字体 | 字号 | 字重 |
|------|------|------|------|
| 大标题 | Segoe UI | 24px | Bold (700) |
| 标题 | Segoe UI | 18px | SemiBold (600) |
| 正文 | Segoe UI | 14px | Regular (400) |
| 辅助文字 | Segoe UI | 12px | Regular (400) |
| 按钮文字 | Segoe UI | 14px | SemiBold (600) |

---

## 3. 色彩规范

### 主色调

| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#0078D4` | 主按钮、链接 |
| Primary Hover | `#106EBE` | 悬停状�� |
| Primary Pressed | `#005A9E` | 按下状态 |
| Primary Disabled | `#A0CFFF` | 禁用状态 |

### 中性色

| 名称 | 色值 | 用途 |
|------|------|------|
| Background | `#FFFFFF` | 页面背景 |
| Surface | `#F3F3F3` | 卡片背景 |
| Border | `#E1E1E1` | 边框线 |
| Text Primary | `#1A1A1A` | 主要文字 |
| Text Secondary | `#666666` | 次要文字 |
| Text Disabled | `#A3A3A3` | 禁用文字 |

### 禁止使用的颜色

- 紫色系 (`purple`/`indigo`) 作为主色
- 绿色/红色渐变作为主色
- 过于饱和的颜色（饱和度 > 100%）

---

## 4. 圆角规范

| 元素 | 圆角 |
|------|------|
| 小控件 (Button, Input) | 4px |
| 卡片 (Card) | 8px |
| 对话框 (Dialog) | 12px |
| 弹窗 (Modal) | 16px |

```python
# QSS 示例
button_style = """
QPushButton {
    background-color: #0078D4;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-family: 'Segoe UI';
    font-size: 14px;
}

QPushButton:hover {
    background-color: #106EBE;
}

QPushButton:pressed {
    background-color: #005A9E;
}

QPushButton:disabled {
    background-color: #A0CFFF;
    color: white;
}
"""
```

---

## 5. 阴影规范

```python
# 使用 QGraphicsDropShadowEffect
from PyQt6.QtWidgets import QGraphicsDropShadowEffect
from PyQt6.QtGui import QColor
from PyQt6.QtCore import QPointF

shadow = QGraphicsDropShadowEffect()
shadow.setBlurRadius(16)      # 模糊半径
shadow.setOffset(QPointF(0, 4))  # 偏移 (0, 4)
shadow.setColor(QColor(0, 0, 0, 40))  # 40% 透明度黑色
```

---

## 6. 动效规范

```python
# 过渡动画使用 QPropertyAnimation
from PyQt6.QtCore import QPropertyAnimation, QEasingCurve, QRect

# 按钮悬停动画
self._hover_anim = QPropertyAnimation(self._button, b"geometry")
self._hover_anim.setDuration(200)
self._hover_anim.setEasingCurve(QEasingCurve.Type.InOutQuad)
self._hover_anim.setStartValue(QRect(10, 10, 100, 30))
self._hover_anim.setEndValue(QRect(10, 10, 120, 30))
self._hover_anim.start()
```

**动画时长**:

| 场景 | 时长 |
|------|------|
| 微交互 (悬停、点击) | 100~200ms |
| 过渡动画 (页面切换) | 200~300ms |
| 展开/收起 | 300~400ms |
| 对话框弹出 | 200ms |

**缓动曲线**: `QEasingCurve.InOutQuad`

---

## 7. 间距规范

| 元素 | 间距 |
|------|------|
| 页面边距 | 24px |
| 区块间距 | 16px |
| 组件间距 | 8px |
| 内边距 | 12px |

---

## 8. 按钮规范

### 主按钮

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

## 9. 输入框规范

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

## 10. 卡片��范

```python
card_style = """
QFrame#card {
    background-color: white;
    border-radius: 8px;
    border: 1px solid #E1E1E1;
    padding: 16px;
}
"""
```

---

## 11. 状态栏规范

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

## 12. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">主色调</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">#0078D4</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">圆角</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">4px / 8px / 12px / 16px</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">字体</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Segoe UI</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">动效时长</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">100-400ms</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">阴影</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">模糊16px, 偏移(0,4)</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">页面边距</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">24px</div>
  </div>

</div>