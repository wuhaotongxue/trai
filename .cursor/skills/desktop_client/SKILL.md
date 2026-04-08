---
name: "desktop-client-code-review"
description: "Desktop Client 代码审查主入口。当修改完桌面客户端代码或用户要求审查桌面客户端代码时调用此技能，强制执行 PyQt6 五层架构、防卡死规范、信号槽规范、Win11 Fluent UI 规范与中文标点禁令。"
---

# Desktop Client 代码审查

作为 TRAI 平台桌面端开发人员的专属代码审查警察，请严格遵守以下 PyQt6 + Win11 Fluent 客户端开发规范进行审查。

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| 五层架构 | `architecture/layered.md` | 必读 |
| 线程安全 | `threading/workers.md` | 使用 Worker 时 |
| PyQt6 规范 | `rules/pyqt6.md` | 必读 |
| UI 设计 | `ui_design/fluent.md` | UI 开发时 |

---

## 核心审查规则

### 1. 中文标点禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、日志、异常文案、UI 界面文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

### 2. Python 3.11 环境

| 设置项 | 值 |
|--------|------|
| 标准环境 | `pyqt6_3_11_15_whf_20260320` (Conda) |
| 类型提示 | `|` 替代 `Union`，`list[int]` 替代 `typing.List` |
| 跨平台路径 | 禁止硬编码 `\`，必须使用 `pathlib.Path` |

### 3. 五层架构强制分层

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 下层不得越权调用上层</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>Infrastructure 禁止调用 Service</li>
      <li>Communication 禁止调用 Controller</li>
      <li>禁止循环依赖</li>
    </ul>
  </div>
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 单向依赖</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>UI → Controller → Service</li>
      <li>Service → Repository (Interface)</li>
      <li>Infrastructure 实现 Repository</li>
    </ul>
  </div>
</div>

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **表示层** | `src/ui/` | PyQt6 控件渲染，用户手势响应 | 禁止写任何业务逻辑，禁止 `requests.get/post` |
| **控制层** | `src/controller/` | UI 事件监听，命令分发，数据校验，Worker 调度 | 禁止直接操作数据库 |
| **服务层** | `src/service/` | 业务流程编排，领域对象状态管理 | 禁止直接发起 HTTP 请求 |
| **通信层** | `src/comm/` | HTTP/WebSocket 封装，协议编解码 | 禁止写 UI 控件代码 |
| **基础设施层** | `src/infra/` | 日志、SQLite、配置、加密、硬件指纹 | 禁止写业务判断逻辑 |

### 4. 绝对禁止阻塞主线程 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 所有耗时操作严禁在主线程执行，违者直接打回</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>网络请求 (HTTP/WebSocket/流媒体传输)</li>
    <li>大文件读写 (>1MB)</li>
    <li>密集 CPU 计算 (图像处理、音视频编解码)</li>
    <li>任何带 <code>time.sleep()</code> 的阻塞代码</li>
  </ul>
</div>

**正确做法**: 必须封装到 `QThread` 子类、`QRunnable` + `QThreadPool`。

### 5. 信号槽跨线程通信 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁后台线程直接调用 UI 控件</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>严禁在 Worker 中调用 <code>self.label.setText(...)</code> 等 UI 方法（段错误崩溃）</li>
    <li>必须在类级别声明信号 (<code>QtCore.pyqtSignal</code>)，禁止在方法内部动态创建</li>
    <li>通过信号 emit，由主线程 slot 接收后操作 UI</li>
  </ul>
</div>

### 6. 资源释放与防僵尸线程 (CRITICAL)

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

### 7. 异常处理与错误码

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

### 8. 文件头模板 (MANDATORY)

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际相对路径文件名}
# 作者: {作者姓名}
# 日期: {YYYY-MM-DD HH:MM:SS}
# 描述: {该文件的用途/功能简述，一句话概括}
```

### 9. Docstring 全覆盖 (MANDATORY)

文件中出现的**每一个** `class` 及**每一个** `def`，**都必须**具备中文 docstring，**禁止留空**。包括私有方法、`__init__`、`@pyqtSlot`、`@staticmethod`、`@classmethod` 同等强制。

### 10. 依赖懒加载模式

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