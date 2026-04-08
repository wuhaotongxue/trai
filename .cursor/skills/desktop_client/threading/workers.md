# Desktop Client - Worker 线程规范

---

## 1. 全局中文标点符号禁令 (CRITICAL)

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
# src/controller/workers/login_worker.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: desktop_client/src/controller/workers/login_worker.py
# 作者: wuhao
# 日期: 2026-04-07 10:00:00
# 描述: 登录业务 Worker 线程封装

from __future__ import annotations

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

    # 类级别信号声明（必须在类外部声明，禁止在方法内部动态创建）
    sig_success = pyqtSignal(dict)
    sig_failed = pyqtSignal(str, int)
    sig_progress = pyqtSignal(str)

    def __init__(self, username: str, password: str) -> None:
        """
        初始化登录 Worker.

        参数:
            username: 用户名.
            password: 密码（已加密）.
        """
        super().__init__()
        self._username = username
        self._password = password

    @pyqtSlot()
    def run(self) -> None:
        """
        在后台线程执行登录请求.

        参数:
            无.

        返回:
            无.

        异常:
            Exception: 网络请求失败时记录日志并发送失败信号.
        """
        try:
            self.sig_progress.emit("Connecting to server...")
            # 模拟登录请求
            # from src.comm.http_client import HttpClient
            # client = HttpClient()
            # result = client.post("/auth/login", {"username": self._username, "password": self._password})
            self.sig_success.emit({"token": "mock_token", "user_id": "123"})
        except Exception as e:
            logger.error(f"Login failed: {e}")
            self.sig_failed.emit(str(e), 401)
```

## 2. 标准 Controller 写法

```python
# src/controller/login_controller.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: desktop_client/src/controller/login_controller.py
# 作者: wuhao
# 日期: 2026-04-07 10:00:00
# 描述: 登录控制器，处理用户登录 UI 交互

from __future__ import annotations

from typing import Any

from PyQt6.QtCore import QObject, pyqtSlot

from src.infra.logging import get_logger
from src.ui.dialogs.login_dialog import LoginDialog
from src.controller.workers.login_worker import LoginWorker

logger = get_logger()


class LoginController(QObject):
    """
    登录控制器，协调 LoginDialog 和 LoginWorker.

    参数:
        无.

    异常:
        无可预期业务异常.
    """

    sig_login_success = pyqtSignal(dict)
    sig_login_failed = pyqtSignal(str)

    def __init__(self) -> None:
        """
        初始化登录控制器.

        参数:
            无.
        """
        super().__init__()
        self._dialog = LoginDialog()
        self._connect_signals()

    def _connect_signals(self) -> None:
        """
        连接信号槽.

        参数:
            无.

        返回:
            无.

        异常:
            无.
        """
        self._dialog.sig_login_clicked.connect(self._on_login_clicked)

    @pyqtSlot(str, str)
    def _on_login_clicked(self, username: str, password: str) -> None:
        """
        处理登录按钮点击.

        参数:
            username: 用户名.
            password: 密码.

        返回:
            无.

        异常:
            无.
        """
        worker = LoginWorker(username, password)
        worker.sig_success.connect(self._on_login_success)
        worker.sig_failed.connect(self._on_login_failed)
        worker.sig_progress.connect(self._dialog.set_status)
        self._dialog.set_status("Logging in...")
        from PyQt6.QtCore import QThreadPool
        QThreadPool.globalInstance().start(worker)

    @pyqtSlot(dict)
    def _on_login_success(self, data: dict[str, Any]) -> None:
        """
        登录成功处理.

        参数:
            data: 登录响应数据.

        返回:
            无.

        异常:
            无.
        """
        logger.info(f"Login success: user_id={data.get('user_id')}")
        self._dialog.close()
        self.sig_login_success.emit(data)

    @pyqtSlot(str, int)
    def _on_login_failed(self, message: str, code: int) -> None:
        """
        登录失败处理.

        参数:
            message: 错误信息.
            code: 错误码.

        返回:
            无.

        异常:
            无.
        """
        logger.warning(f"Login failed: code={code}, message={message}")
        self._dialog.show_error(f"Login failed: {message}")
        self.sig_login_failed.emit(message)

    def show(self) -> None:
        """显示登录对话框."""
        self._dialog.show()
```

## 3. HTTP Worker 标准写法

```python
# src/controller/workers/http_worker.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: desktop_client/src/controller/workers/http_worker.py
# 作者: wuhao
# 日期: 2026-04-07 10:00:00
# 描述: HTTP 请求 Worker 线程封装

from __future__ import annotations

from typing import Any

from PyQt6.QtCore import QRunnable, pyqtSignal, pyqtSlot

from src.infra.logging import get_logger

logger = get_logger()


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

    def __init__(
        self,
        method: str,
        url: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        """
        初始化 HTTP Worker.

        参数:
            method: HTTP 方法 (GET/POST).
            url: 请求 URL.
            data: 请求数据 (POST 时使用).
        """
        super().__init__()
        self._method = method.upper()
        self._url = url
        self._data = data

    @pyqtSlot()
    def run(self) -> None:
        """
        在后台线程执行 HTTP 请求.

        参数:
            无.

        返回:
            无.

        异常:
            Exception: 网络请求失败时记录日志并发送失败信号.
        """
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

## 4. 资源释放检查清单

```python
# closeEvent 正确写法
def closeEvent(self, event) -> None:
    """
    窗口关闭事件，释放所有资源.

    参数:
        event: 关闭事件.

    返回:
        无.

    异常:
        无.
    """
    # 停止定时器
    self._heartbeat_timer.stop()

    # 退出工作线程
    if self._worker_thread.isRunning():
        self._worker_thread.quit()
        self._worker_thread.wait(3000)  # 3秒超时
        self._worker_thread.deleteLater()

    # 关闭窗口
    event.accept()
```

## 5. 禁止事项汇总

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 以下行为违者直接打回</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>在 slot 中直接写网络请求</li>
    <li>跨线程直接操作 UI</li>
    <li>模块顶层 import 重型依赖</li>
  </ul>
</div>

```python
# ❌ 禁止: 在 slot 中直接写网络请求
def on_login_clicked(self):
    resp = requests.post(...)  # 直接打回!
    self.label.setText(resp.text)  # 直接打回!

# ❌ 禁止: 跨线程直接操作 UI
def run(self) -> None:
    self.label.setText("Done")  # ❌ 跨线程！

# ✅ 正确: 通过信号
self.sig_finished.emit("Done")

# ❌ 禁止: 模块顶层导入重型依赖
import torch  # ❌
import cv2    # ❌

# ✅ 正确: 懒加载
def process_image(self, path: Path) -> bytes | None:
    try:
        import cv2  # 懒加载
        return cv2.imread(str(path))
    except ImportError:
        logger.warning("OpenCV not installed")
        return None
```

---

## 6. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止跨线程操作 UI</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须通过 pyqtSignal</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 slot 网络请求</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">使用 QRunnable</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">closeEvent</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">stop/quit/wait/deleteLater</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">懒加载</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止模块顶层 import</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">waitForDone</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">QThreadPool 超时等待</div>
  </div>

</div>
