# Desktop_Client_Worker_线程规范

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

## 2. 标准 Worker 写法

```python
from PyQt6.QtCore import QRunnable, pyqtSignal, pyqtSlot
from src.infra.logging import get_logger

logger = get_logger()


class LoginWorker(QRunnable):
    """
    登录业务 Worker，封装登录请求的异步执行.

    参数:
        无.

    异常:
        无可预期业务异常.
    """

    sig_success = pyqtSignal(dict)
    sig_failed = pyqtSignal(str, int)
    sig_progress = pyqtSignal(str)

    def __init__(self, username: str, password: str) -> None:
        super().__init__()
        self._username = username
        self._password = password

    @pyqtSlot()
    def run(self) -> None:
        try:
            self.sig_progress.emit("Connecting to server...")
            self.sig_success.emit({"token": "mock_token", "user_id": "123"})
        except Exception as e:
            logger.error(f"Login failed: {e}")
            self.sig_failed.emit(str(e), 401)
```

---

## 3. 标准 Controller 写法

```python
from PyQt6.QtCore import QObject, pyqtSlot
from src.controller.workers.login_worker import LoginWorker

class LoginController(QObject):
    sig_login_success = pyqtSignal(dict)
    sig_login_failed = pyqtSignal(str)

    def __init__(self) -> None:
        super().__init__()
        self._dialog = LoginDialog()
        self._connect_signals()

    def _connect_signals(self) -> None:
        self._dialog.sig_login_clicked.connect(self._on_login_clicked)

    @pyqtSlot(str, str)
    def _on_login_clicked(self, username: str, password: str) -> None:
        worker = LoginWorker(username, password)
        worker.sig_success.connect(self._on_login_success)
        worker.sig_failed.connect(self._on_login_failed)
        from PyQt6.QtCore import QThreadPool
        QThreadPool.globalInstance().start(worker)

    @pyqtSlot(dict)
    def _on_login_success(self, data: dict) -> None:
        self._dialog.close()
        self.sig_login_success.emit(data)

    @pyqtSlot(str, int)
    def _on_login_failed(self, message: str, code: int) -> None:
        self._dialog.show_error(f"Login failed: {message}")
```

---

## 4. HTTP Worker 标准写法

```python
class HttpWorker(QRunnable):
    """
    HTTP 请求 Worker，封装异步 HTTP 请求执行.

    参数:
        method: HTTP 方法 (GET/POST).
        url: 请求 URL.
        data: 请求数据 (POST 时使用).

    异常:
        无可预期业务异常.
    """

    sig_success = pyqtSignal(dict)
    sig_failed = pyqtSignal(str, int)
    sig_progress = pyqtSignal(str)

    def __init__(self, method: str, url: str, data: dict | None = None) -> None:
        super().__init__()
        self._method = method.upper()
        self._url = url
        self._data = data

    @pyqtSlot()
    def run(self) -> None:
        try:
            self.sig_progress.emit("Sending request...")
            import httpx
            with httpx.Client(timeout=30.0) as client:
                if self._method == "GET":
                    response = client.get(self._url)
                else:
                    response = client.post(self._url, json=self._data)
                response.raise_for_status()
                self.sig_success.emit(response.json())
        except httpx.TimeoutException:
            logger.error(f"Request timeout: {self._url}")
            self.sig_failed.emit("Request timeout", 408)
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code}")
            self.sig_failed.emit(str(e), e.response.status_code)
        except Exception as e:
            logger.error(f"Request failed: {e}")
            self.sig_failed.emit(str(e), 500)
```

---

## 5. 资源释放检查清单

```python
def closeEvent(self, event) -> None:
    self._heartbeat_timer.stop()
    if self._worker_thread.isRunning():
        self._worker_thread.quit()
        self._worker_thread.wait(3000)
        self._worker_thread.deleteLater()
    event.accept()
```

---

## 6. 禁止事项汇总

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
</div>

| 禁止 | 正确做法 |
|------|----------|
| 在 slot 中写网络请求 | 使用 QRunnable + QThreadPool |
| 跨线程直接操作 UI | 通过 pyqtSignal |
| 模块顶层 import 重型依赖 | 懒加载 |

---

## 7. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止主线程网络</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">QRunnable + QThreadPool</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止跨线程 UI</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须用 pyqtSignal</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">懒加载重型库</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止模块顶层 import</div>
  </div>

</div>