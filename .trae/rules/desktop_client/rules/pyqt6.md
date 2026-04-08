# Desktop_Client_PyQt6_规范

## 1. 信号槽规范

### 声明位置
- 信号必须在**类级别**声明（`QtCore.pyqtSignal`）
- 禁止在方法内部动态创建信号

```python
# ✅_正确
class LoginWorker(QRunnable):
    sig_success = pyqtSignal(dict)
    sig_failed = pyqtSignal(str, int)

# ❌_禁止
class LoginWorker(QRunnable):
    def run(self):
        sig = pyqtSignal(dict)  # ❌ 动态创建
```

### 连接方式
```python
# ✅_正确
worker.sig_success.connect(lambda data: self._on_success(data))
worker.sig_failed.connect(self._on_failed)

# ❌_禁止
worker.sig_success.connect(lambda: self._on_success(data))  # ❌ 闭包陷阱
```

## 2. QThreadPool 使用规范

```python
# ✅_正确:_使用全局线程池
from PyQt6.QtCore import QThreadPool

pool = QThreadPool.globalInstance()
pool.setMaxThreadCount(4)

worker = LoginWorker(username, password)
pool.start(worker)

# ✅_正确:_等待完成
pool.waitForDone(5000)  # 5秒超时
```

## 3. QTimer 使用规范

```python
# ✅_正确:_创建和销毁
class MyWidget:
    def __init__(self):
        self._timer = QTimer()
        self._timer.timeout.connect(self._on_timeout)
        self._timer.start(30000)  # 30秒

    def closeEvent(self, event):
        self._timer.stop()  # 必须停止
        event.accept()

# ❌_禁止:_不停止定时器
def closeEvent(self, event):
    event.accept()  # ❌ 定时器仍在运行
```

## 4. 禁止事项汇总

| 禁止 | 正确做法 |
|------|----------|
| 在 slot 中写网络请求 | 使用 QRunnable + QThreadPool |
| 跨线程操作 UI | 使用 pyqtSignal |
| 动态创建信号 | 类级别声明 pyqtSignal |
| 模块顶层 import 重型依赖 | 懒加载 |
| 硬编码路径 | pathlib.Path |
| print 日志 | loguru/logger |
| 裸 except | 指明异常类型 + logger.error |
| 不停止 QTimer | closeEvent 中 timer.stop() |
| 不等待线程退出 | thread.wait(timeout) |

## 5. 异常规范

```python
# ❌_禁止:_裸_except
except:
    pass

# ✅_正确:_指明异常_+_记录日志
except ValueError as e:
    logger.warning(f"Invalid input: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
```

## 6. 路径规范

```python
# ❌_禁止:_硬编码路径
path = "C:\\Users\\test\\file.txt"

# ✅_正确:_使用_pathlib
from pathlib import Path
base_dir = Path(__file__).parent
config_path = base_dir / "config.json"
```

## 7. Worker 标准写法

```python
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
            # ... 网络请求 ...
            self.sig_success.emit({"token": "mock_token", "user_id": "123"})
        except Exception as e:
            logger.error(f"Login failed: {e}")
            self.sig_failed.emit(str(e), 401)
```