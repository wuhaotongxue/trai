---
name: "desktop-client-rules"
description: "TRAI PyQt6 桌面客户端开发规范。强制执行五层架构、防卡死规范、信号槽规范、Win11 Fluent UI 规范与中文标点禁令。"
---

# Desktop Client 开发规范

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| 五层架构 | `architecture/layered.md` | 必读 |
| 线程安全 | `threading/workers.md` | 使用 Worker 时 |
| PyQt6 规范 | `rules/pyqt6.md` | 必读 |
| Win11 Fluent UI | `ui_design/fluent.md` | UI 开发时 |

## 核心规则

### 1. 中文标点禁令 (CRITICAL)
- **绝对禁止**在任何地方出现中文全角标点 (`，`、`。`、`！`、`：`)
- 必须使用英文半角标点 (`,`, `.`, `!`, `:`)

### 2. Python 3.11 环境
- 标准环境：`pyqt6_3_11_15_whf_20260320` (Conda)
- 缩进 4 个空格

### 3. 五层架构强制分层
- **表示层** (`src/ui/`): 控件渲染，禁止业务逻辑
- **控制层** (`src/controller/`): 事件监听，禁止数据库操作
- **服务层** (`src/service/`): 业务流程，禁止 HTTP 请求
- **通信层** (`src/comm/`): HTTP/WebSocket 封装，禁止 UI 代码
- **基础设施层** (`src/infra/`): 日志/存储/配置，禁止业务逻辑

### 4. 禁止阻塞主线程 (CRITICAL)
- 网络请求、文件读写、密集计算**必须**在 `QThread`/`QRunnable` 中执行
- 违者直接打回

### 5. 信号槽跨线程通信
- 严禁后台线程直接调用 UI 控件
- 必须通过 `pyqtSignal` 从 Worker emit 信号

### 6. 资源释放
- `closeEvent` 必须：`timer.stop()` + `thread.quit()` + `thread.wait(timeout)` + `thread.deleteLater()`

### 7. 文件头模板 (MANDATORY)
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际相对路径文件名}
# 作者: {作者姓名}
# 日期: {YYYY-MM-DD HH:MM:SS}
# 描述: {该文件的用途/功能简述，一句话概括}
```

### 8. Docstring 全覆盖
- 每个 `class`、每个 `def` 必须有中文 docstring
- 私有方法、`__init__`、`@pyqtSlot` 同等强制