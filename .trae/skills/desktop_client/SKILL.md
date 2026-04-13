---
name: "desktop_client_code_review"
description: "⚠️ 桌面端已统一迁移到 Electron 架构。当用户提及 PyQt6 客户端时调用，用于提示重定向。"
---

# ⚠️ 桌面端架构迁移通知

<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#E65100;">&#x26A0; 架构迁移提醒</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    TRAI 项目的桌面客户端原 <code>desktop_client</code>（基于 PyQt6）已被废弃，现在已全面统一迁移至基于 React + Vite + Electron-Builder 的 <code>client_electron</code> 模块。
    <br><br>
    请立即停止在此目录编写任何代码，并将相关审查规则指向 <code>electron/SKILL.md</code>。
  </div>
</div>

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁后台线程直接调用 UI 控件</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>严禁在 Worker 中调用 <code>self.label.setText(...)</code> 等 UI 方法（段错误崩溃）</li>
    <li>必须在类级别声明信号 (<code>QtCore.pyqtSignal</code>)，禁止在方法内部动态创建</li>
    <li>通过信号 emit，由主线程 slot 接收后操作 UI</li>
  </ul>
</div>

### 7. 资源释放与防僵尸线程 (CRITICAL)

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 窗口关闭时必须按顺序释放所有资源</strong>
</div>

| 步骤 | 代码 | 说明 |
|------|------|------|
| 1 | `timer.stop()` | 停止所有 QTimer |
| 2 | `thread.quit()` | 退出工作线程事件循环 |
| 3 | `thread.wait(3000)` | 等待线程结束，最多 3 秒 |
| 4 | `thread.deleteLater()` | 安全删除线程对象 |

动态创建的 widget 必须 `deleteLater()`。

### 8. 异常处理与错误码

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li><strong>禁止裸 <code>except:</code></strong>，必须指明异常类型</li>
    <li><strong>禁止 <code>pass</code> 静默吞没异常</strong>，捕获后必须 <code>logger.error(...)</code> 记录</li>
    <li><strong>禁止 <code>print()</code></strong>，必须使用 `logger`</li>
    <li>网络/业务异常必须通过 <code>QMessageBox</code> 或状态栏提示用户</li>
  </ul>
</div>

**错误码规范**: 使用 `ERR_0001` ~ `ERR_00BF` 体系。

### 9. 文件头模板 (MANDATORY)

```python
#!/usr/bin/env python
# _*_coding:_utf_8_*_
# 文件名:_{实际相对路径文件名}
# 作者:_{作者姓名}
# 日期:_{YYYY_MM_DD_HH:MM:SS}
# 描述:_{该文件的用途/功能简述，一句话概括}
```

### 10. Docstring 全覆盖 (MANDATORY)

文件中出现的**每一个** `class` 及**每一个** `def`，**都必须**具备中文 docstring，**禁止留空**。包括私有方法、`__init__`、`@pyqtSlot`、`@staticmethod`、`@classmethod` 同等强制。

### 11. 依赖懒加载模式

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止在模块顶层 import 重型依赖</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    <code>import cv2</code> / <code>import torch</code> / <code>import pyaudio</code> 等必须封装在方法内部
  </div>
</div>

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止紫色</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">purple/violet/indigo</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止阻塞主线程</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">网络/文件/密集计算</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止跨线程操作 UI</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须通过 pyqtSignal</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止裸 except</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须指明异常类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 print</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须使用 logger</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">QRunnable + QThreadPool</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">标准 Worker 实现</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">closeEvent 资源释放</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">stop/quit/wait/deleteLater</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Docstring</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每个 def 必须有</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">懒加载重型依赖</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止模块顶层 import</div>
  </div>

</div>

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v2.1 | 2026-04-09 | 新增全局颜色禁令，禁止紫色及相关色系 |
| v2.0 | 2026-04-08 | 简化文档结构，统一使用表格和 HTML 卡片 |
| v1.0 | 2026-04-01 | 初版发布 |
