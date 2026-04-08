# Desktop_Client_Worker_线程规范

---

## 1. Worker 信号定义

### 1.1 标准信号

| 信号 | 类型 | 说明 |
|------|------|------|
| `sig_success` | `pyqtSignal(dict)` | 成功回调，传递数据 |
| `sig_failed` | `pyqtSignal(str, int)` | 失败回调，消息+错误码 |
| `sig_progress` | `pyqtSignal(str)` | 进度回调，进度消息 |

---

## 2. 标准 Worker 结构

### 2.1 Worker 类定义

```python
class XxxWorker(QRunnable):
    sig_success = pyqtSignal(dict)
    sig_failed = pyqtSignal(str, int)
    sig_progress = pyqtSignal(str)

    def __init__(self, param1: str, param2: str) -> None:
        super().__init__()
        self._param1 = param1
        self._param2 = param2

    @pyqtSlot()
    def run(self) -> None:
        try:
            self.sig_progress.emit("Processing...")
            # 业务逻辑
            self.sig_success.emit({"key": "value"})
        except Exception as e:
            logger.error(f"XxxWorker failed: {e}")
            self.sig_failed.emit(str(e), error_code)
```

### 2.2 Worker 类型

| Worker | 用途 |
|---------|------|
| `LoginWorker` | 登录请求 |
| `HttpWorker` | HTTP 请求封装 |
| `FileWorker` | 文件 IO 操作 |
| `MeetingWorker` | 会议相关操作 |

**实现参考**：`desktop_client/src/controller/workers/`

---

## 3. 标准 Controller 结构

### 3.1 Controller 类定义

```python
class XxxController(QObject):
    sig_xxx_success = pyqtSignal(dict)
    sig_xxx_failed = pyqtSignal(str)

    def __init__(self) -> None:
        super().__init__()
        self._dialog = XxxDialog()
        self._connect_signals()

    def _connect_signals(self) -> None:
        self._dialog.sig_action_clicked.connect(self._on_action)
        self._worker.sig_success.connect(self._on_success)
        self._worker.sig_failed.connect(self._on_failed)

    @pyqtSlot(str, str)
    def _on_action(self, param1: str, param2: str) -> None:
        worker = XxxWorker(param1, param2)
        worker.sig_success.connect(self._on_success)
        worker.sig_failed.connect(self._on_failed)
        QThreadPool.globalInstance().start(worker)
```

### 3.2 Controller 类型

| Controller | 用途 |
|------------|------|
| `LoginController` | 登录控制器 |
| `MeetingController` | 会议控制器 |
| `SettingsController` | 设置控制器 |

**实现参考**：`desktop_client/src/controller/`

---

## 4. HTTP Worker

### 4.1 HTTP 请求配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| method | GET/POST | HTTP 方法 |
| timeout | 30.0 | 超时秒数 |
| retry | 1 | 重试次数 |

### 4.2 HTTP 错误处理

| 错误类型 | 错误码 | 处理 |
|---------|--------|------|
| TimeoutException | 408 | 超时提示 |
| HTTPStatusError | 4xx/5xx | 状态码错误 |
| 其他异常 | 500 | 服务器错误 |

---

## 5. 资源释放

### 5.1 关闭检查

```python
def closeEvent(self, event) -> None:
    # 停止定时器
    self._timer.stop()
    # 停止 Worker 线程
    if self._worker_thread.isRunning():
        self._worker_thread.quit()
        self._worker_thread.wait(3000)
        self._worker_thread.deleteLater()
    event.accept()
```

### 5.2 释放检查清单

| 检查项 | 操作 |
|--------|------|
| 定时器 | stop() |
| Worker 线程 | quit() + wait() |
| 资源对象 | deleteLater() |

---

## 6. 禁止事项

| 禁止 | 正确做法 |
|------|---------|
| 在 slot 中直接写网络请求 | 使用 QRunnable + QThreadPool |
| 跨线程直接操作 UI | 通过 pyqtSignal |
| 模块顶层导入重型依赖 | 懒加载 |
| Worker 不处理异常 | 捕获并发送 sig_failed |
| 不等待 Worker 完成就关闭 | closeEvent 中 wait() |
