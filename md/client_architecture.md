# 客户端代码架构文档

<div style="background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本文档说明</strong>：本文档定义 TRAI 项目桌面客户端的整体代码架构，包括两个主要客户端（PyQt6 Windows 桌面客户端、Electron 跨平台桌面客户端）的技术选型、目录结构、五层架构、线程安全、软件更新与全局禁令等核心设计。适用于 Windows/macOS/Linux 跨平台桌面应用开发。
</div>

## 1. 客户端概述

| 客户端 | 技术栈 | 目标平台 | 特点 |
|--------|--------|----------|------|
| **PyQt6 客户端** | Python 3.11 + PyQt6 | Windows 为主 | 本地性能强，Win11 Fluent UI，可独立运行无需网络 |
| **Electron 客户端** | TypeScript + React 18 + Electron | 全平台 | 跨平台一致，Web 技术栈，原生系统集成 |

## 2. 技术选型总览

### 2.1 PyQt6 客户端

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Python | 3.11 | 标准环境 |
| Conda 环境 | `pyqt6_3_11_15_whf_20260320` | 预配置环境 |
| GUI 框架 | PyQt6 | 最新稳定版 |
| UI 规范 | Win11 Fluent Design | Windows 原生风格 |
| 类型提示 | `list[int]` `dict[str, ...]` | Python 3.10+ 原生语法 |
| 路径处理 | `pathlib.Path` | 跨平台兼容 |
| 日志 | loguru | 高性能结构化日志 |
| HTTP 客户端 | httpx + aiohttp | 同步/异步双支持 |
| WebSocket | websockets | 实时通信 |
| 自动更新 | 自实现（HTTP + S3） | 检查/下载/安装全链路 |
| 构建工具 | PyInstaller / Nuitka | exe 打包 |

### 2.2 Electron 客户端

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Node.js | 20 LTS | 稳定长期支持版本 |
| Electron | 33.x | 最新稳定版，支持 ESM |
| TypeScript | 5.x | 严格模式，禁止 any |
| React | 18.x | 渲染进程 UI 框架 |
| Vite | 6.x | 渲染进程高速构建 |
| 构建工具 | electron-builder 25.x | 应用打包与分发 |
| 自动更新 | electron-updater 6.x | 增量更新，S3/GitHub 支持 |
| 包管理器 | pnpm | 高性能依赖管理 |
| 日志 | electron-log | 文件日志 |

## 3. PyQt6 桌面客户端

### 3.1 目录结构

```
desktop_client/
├── main.py                       # 入口文件，QApplication 创建
├── requirements.txt              # 依赖清单（pip freeze 格式）
├── pyproject.toml                # 项目元数据
├── build.spec                   # PyInstaller 构建配置
├── src/
│   ├── __init__.py
│   ├── __version__.py          # 版本号 (__version__ = "1.2.3")
│   ├── ui/                     # 表示层 (PyQt6 控件)
│   │   ├── __init__.py
│   │   ├── main_window.py      # 主窗口（QMainWindow）
│   │   ├── chat_page.py       # 聊天页面
│   │   ├── login_page.py      # 登录页面
│   │   ├── settings_page.py   # 设置页面
│   │   ├── update_dialog.py   # 更新提示对话框
│   │   ├── about_dialog.py    # 关于对话框
│   │   └── widgets/           # 自定义控件
│   │       ├── __init__.py
│   │       ├── message_bubble.py    # 消息气泡
│   │       ├── quota_bar.py         # 配额进度条
│   │       ├── token_label.py       # Token 统计标签
│   │       ├── tool_card.py         # 工具调用卡片
│   │       ├── streaming_indicator.py # 流式打字指示器
│   │       └── animated_gradient.py  # 渐变动画背景
│   ├── controller/             # 控制层 (事件监听)
│   │   ├── __init__.py
│   │   ├── main_controller.py  # 主窗口控制器
│   │   ├── chat_controller.py # 聊天控制器（Worker 调度）
│   │   ├── auth_controller.py  # 认证控制器
│   │   ├── settings_controller.py # 设置控制器
│   │   └── update_controller.py # 更新控制器
│   ├── service/                # 服务层 (业务编排)
│   │   ├── __init__.py
│   │   ├── chat_service.py     # 聊天业务（消息组织/历史缓存）
│   │   ├── auth_service.py    # 认证业务（token 管理）
│   │   ├── session_service.py # 会话业务（创建/切换/删除）
│   │   ├── quota_service.py   # 配额业务（查询/展示）
│   │   └── update_service.py   # 更新业务（检查/下载/安装）
│   ├── comm/                   # 通信层 (HTTP/WebSocket)
│   │   ├── __init__.py
│   │   ├── api_client.py      # REST API 客户端（httpx）
│   │   ├── ws_client.py       # WebSocket 客户端（流式响应）
│   │   ├── update_checker.py  # 更新检查器（HTTP 请求）
│   │   └── retry_policy.py    # 重试策略（指数退避）
│   └── infra/                   # 基础设施层
│       ├── __init__.py
│       ├── logger.py           # loguru 日志配置
│       ├── config.py           # 配置管理（.ini/env/注册表）
│       ├── storage.py          # 本地存储（SQLite/JSON）
│       ├── crypto.py           # 加密工具（AES/RSA）
│       ├── hardware_id.py     # 硬件指纹（绑定机器）
│       └── single_instance.py  # 单实例互斥锁
├── resources/                   # 资源文件
│   ├── icons/                  # 应用图标
│   │   ├── app.ico
│   │   └── tray.png
│   ├── styles/                # Qt 样式表 (QSS)
│   │   ├── dark.qss
│   │   └── light.qss
│   └── sounds/                 # 提示音
│       └── notification.wav
├── i18n/                       # 国际化
│   ├── __init__.py
│   ├── zh_cn.py               # 简体中文
│   └── en_us.py               # 英文
└── tests/                       # 测试
    ├── conftest.py
    ├── test_service/
    └── test_comm/
```

### 3.2 五层架构

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong>强制分层原则</strong>：每一层只能依赖下层，禁止跨层直接调用。
</div>

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **表示层** | `src/ui/` | PyQt6 控件渲染，用户手势响应 | 禁止写任何业务逻辑，禁止 `requests.get` |
| **控制层** | `src/controller/` | UI 事件监听，命令分发，数据校验，Worker 调度 | 禁止直接操作数据库 |
| **服务层** | `src/service/` | 业务流程编排，领域对象状态管理 | 禁止直接发起 HTTP 请求 |
| **通信层** | `src/comm/` | HTTP/WebSocket 封装，协议编解码 | 禁止写 UI 控件代码 |
| **基础设施层** | `src/infra/` | 日志、SQLite、配置、加密、硬件指纹 | 禁止写业务判断逻辑 |

### 3.3 线程安全规范

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <strong style="color:#C62828;">绝对禁止阻塞主线程</strong>：所有耗时操作严禁在主线程执行，违者直接打回
</div>

**耗时操作清单**（必须 Worker）：
- HTTP 请求（API 调用）
- WebSocket 连接与收发
- 大文件读写（>1MB）
- 密集 CPU 计算（图像处理、音视频编解码）
- `time.sleep()` 阻塞代码
- 数据库查询
- S3 文件上传/下载

**必须使用 QThread / QRunnable + QThreadPool**：

```python
from PyQt6.QtCore import QThread, QRunnable, QThreadPool, pyqtSignal, QObject


class ChatWorkerSignals(QObject):
    """聊天 Worker 信号定义"""
    finished = pyqtSignal(str)         # 完成，返回 AI 回复
    error = pyqtSignal(str)             # 出错，返回错误信息
    progress = pyqtSignal(str)         # 进度（如"正在查询天气..."）
    tool_called = pyqtSignal(dict)     # 工具被调用
    token_count = pyqtSignal(int, int) # token 计数 (prompt, completion)


class ChatWorker(QRunnable):
    """聊天工作线程"""
    signals = ChatWorkerSignals()

    def __init__(
        self,
        session_id: str,
        content: str,
        model: str = "gpt-4o",
    ) -> None:
        super().__init__()
        self.setAutoDelete(True)
        self._session_id = session_id
        self._content = content
        self._model = model
        self._is_aborted = False

    def run(self) -> None:
        """工作线程主逻辑"""
        try:
            self.signals.progress.emit("正在发送消息...")
            service = ChatService()
            result = service.send_message(
                session_id=self._session_id,
                content=self._content,
                model=self._model,
                stream_callback=self._on_token,
            )
            self.signals.finished.emit(result)
        except AbortError:
            self.signals.error.emit("请求已取消")
        except httpx.TimeoutException:
            self.signals.error.emit("请求超时，请检查网络连接")
        except httpx.HTTPStatusError as e:
            self.signals.error.emit(f"API 错误: {e.response.status_code}")
        except Exception as e:
            self.signals.error.emit(f"未知错误: {e}")

    def _on_token(self, token: str) -> None:
        """流式回调（可选）"""
        self.signals.progress.emit(f"正在生成: {token}")

    def abort(self) -> None:
        """中止请求"""
        self._is_aborted = True
```

**Worker 调度（Controller 层）**：

```python
class ChatController:
    """聊天控制器"""
    def __init__(self, view: ChatPage) -> None:
        self._view = view
        self._thread_pool = QThreadPool.globalInstance()
        self._active_workers: list[ChatWorker] = []
        self._setup_signals()

    def _setup_signals(self) -> None:
        self._view.send_request.connect(self._on_send_request)

    def _on_send_request(self, session_id: str, content: str) -> None:
        """用户点击发送"""
        worker = ChatWorker(session_id, content)
        worker.signals.finished.connect(self._on_finished)
        worker.signals.error.connect(self._on_error)
        worker.signals.progress.connect(self._on_progress)
        worker.signals.tool_called.connect(self._on_tool_called)
        self._active_workers.append(worker)
        self._thread_pool.start(worker)

    def _on_finished(self, result: str) -> None:
        """Worker 完成后（主线程安全）"""
        self._view.append_assistant_message(result)
        self._view.set_input_enabled(True)

    def _on_error(self, error: str) -> None:
        self._view.show_error(error)
        self._view.set_input_enabled(True)

    def abort_all(self) -> None:
        """中止所有活跃 Worker"""
        for worker in self._active_workers:
            worker.abort()
        self._active_workers.clear()
```

### 3.4 信号槽跨线程通信

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <strong style="color:#C62828;">严禁后台线程直接调用 UI 控件</strong>
</div>

**类级别声明信号（禁止在方法内动态创建）**：

```python
class ChatPage(QWidget):
    """聊天页面"""
    # 类级别声明信号，保证跨线程安全
    send_request = pyqtSignal(str, str)        # session_id, content
    abort_request = pyqtSignal()                # 无参数
    clear_history = pyqtSignal()              # 无参数

    def __init__(self) -> None:
        super().__init__()
        self._init_ui()
        self._init_signals()

    def _init_signals(self) -> None:
        self._send_button.clicked.connect(self._on_send_clicked)

    def _on_send_clicked(self) -> None:
        content = self._input_edit.toPlainText()
        if not content.strip():
            return
        self._input_edit.clear()
        self._append_user_message(content)
        self._set_input_enabled(False)
        self.send_request.emit(self._session_id, content)

    def append_assistant_message(self, content: str) -> None:
        """由 Controller 调用，安全更新 UI（信号在主线程触发）"""
        bubble = MessageBubble("assistant", content)
        self._message_layout.addWidget(bubble)

    def set_input_enabled(self, enabled: bool) -> None:
        """启用/禁用输入框"""
        self._input_edit.setEnabled(enabled)
        self._send_button.setEnabled(enabled)
```

### 3.5 资源释放顺序

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:14px 0;">
  <strong style="color:#F57F17;">窗口关闭时必须按顺序释放所有资源，否则可能产生僵尸线程或内存泄漏</strong>
</div>

| 步骤 | 代码 | 说明 |
|------|------|------|
| 1 | `timer.stop()` | 停止所有 QTimer |
| 2 | `thread_pool.waitForDone(3000)` | 等待所有 Worker 结束，最多 3 秒 |
| 3 | `worker.abort()` | 中止活跃的网络请求 |
| 4 | `self._ws_client.disconnect()` | 断开 WebSocket |
| 5 | `self.deleteLater()` | 安全删除 widget |

```python
class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self._timers: list[QTimer] = []
        self._thread_pool = QThreadPool()
        self._ws_client: WsClient | None = None
        self._setup_cleanup()

    def closeEvent(self, event: QCloseEvent) -> None:
        """窗口关闭，清理所有资源"""
        # Step 1: 停止所有定时器
        for timer in self._timers:
            timer.stop()
        logger.info("[MainWindow] all timers stopped")

        # Step 2: 中止所有 Worker
        self._thread_pool.waitForDone(3000)
        logger.info("[MainWindow] all workers stopped")

        # Step 3: 断开 WebSocket
        if self._ws_client:
            self._ws_client.disconnect()
            self._ws_client = None
        logger.info("[MainWindow] websocket disconnected")

        # Step 4: 保存状态
        self._save_window_geometry()
        self._save_user_preferences()
        logger.info("[MainWindow] state saved")

        # Step 5: 接受关闭事件
        event.accept()
        logger.info("[MainWindow] window closed")
```

## 4. Electron 桌面客户端

### 4.1 目录结构

```
electron/
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 根配置
├── tsconfig.main.json           # 主进程配置
├── tsconfig.renderer.json       # 渲染进程配置
├── tsconfig.preload.json        # 预加载脚本配置
├── vite.config.ts              # Vite 构建配置
├── electron-builder.yml         # electron-builder 打包配置
├── .env.example                 # 环境变量模板
├── src/
│   ├── main/                   # 主进程 (Node.js)
│   │   ├── index.ts           # 主进程入口
│   │   ├── window-manager.ts  # 窗口管理器
│   │   ├── auto-updater.ts   # 自动更新模块
│   │   ├── menu.ts           # 应用菜单
│   │   ├── ipc/
│   │   │   ├── index.ts
│   │   │   ├── channels.ts    # 通道常量
│   │   │   └── handlers/     # 各通道处理器
│   │   ├── services/          # 业务服务层
│   │   └── platform/         # 平台层
│   ├── preload/              # 预加载脚本
│   │   ├── index.ts
│   │   └── expose/          # API 暴露
│   ├── renderer/             # 渲染进程
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── app/             # 页面
│   │   ├── components/       # 组件
│   │   ├── hooks/           # Hooks
│   │   └── stores/           # Zustand
│   └── shared/
│       ├── types/
│       └── constants.ts
├── resources/
│   ├── icon.ico
│   └── tray.png
└── build/
```

### 4.2 五层架构

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **UI Layer** | `src/renderer/` | React 组件渲染，用户交互 | 禁止写业务逻辑 |
| **Controller Layer** | `src/preload/` | 桥接 Renderer 与 Main | 禁止写业务逻辑 |
| **Service Layer** | `src/main/services/` | 业务流程编排 | 禁止直接操作 DOM |
| **IPC Layer** | `src/main/ipc/` | IPC 通道注册与处理 | 禁止写 UI 逻辑 |
| **Platform Layer** | `src/main/platform/` | Node.js 原生 API 封装 | 禁止写业务判断逻辑 |

## 5. 软件更新架构

### 5.1 更新策略对比

| 特性 | PyQt6 客户端 | Electron 客户端 |
|------|--------------|-----------------|
| 更新方式 | HTTP 请求 + S3 | electron-updater |
| 元数据存储 | S3 `latest.json` | S3 `latest.yml` |
| 下载方式 | HTTP 流式下载 | electron-updater 内置 |
| 安装方式 | PyInstaller installer | 自动安装 + 重启 |
| 增量更新 | 不支持（全量下载） | 支持（差量包） |
| 回滚 | 不支持 | 支持 |
| 检查时机 | 启动时 + 定时 | 启动时 + 手动 |
| 用户体验 | 弹窗确认 | 弹窗确认 |

### 5.2 更新流程时序图

```
┌─────────┐      ┌──────────┐       ┌───────────┐      ┌────────┐
│  PyQt6  │      │  Backend │       │    S3     │      │  User  │
└────┬────┘      └─────┬────┘       └─────┬─────┘       └───┬────┘
     │                   │                    │                 │
     │ 1.启动检查更新    │                    │                 │
     │──────────────────>│                    │                 │
     │                   │ 2.GET latest.json  │                 │
     │                   │───────────────────>│                 │
     │                   │<──────────────────│                 │
     │                   │  latest.json       │                 │
     │ 3.比较版本        │                    │                 │
     │──────────────────>│                    │                 │
     │   [有新版本?]     │                    │                 │
     │                   │                    │                 │
     │ 4.弹窗提示用户    │                    │                 │
     │───────────────────│───────────────────│                 │
     │                   │                    │                 │
     │ 5.用户点击下载    │                    │                 │
     │<─────────────────────────────────────────────────────────│
     │                   │                    │                 │
     │ 6.HTTP流式下载    │                    │                 │
     │────────────────────────────────────────────────────────>│
     │                   │                    │  下载进度       │
     │                   │                    │                 │
     │ 7.校验SHA256       │                    │                 │
     │                   │                    │                 │
     │ 8.弹窗提示安装     │                    │                 │
     │───────────────────│───────────────────│                 │
     │                   │                    │                 │
     │ 9.用户点击安装     │                    │                 │
     │<─────────────────────────────────────────────────────────│
     │                   │                    │                 │
     │ 10.启动安装程序    │                    │                 │
     │ 11.退出当前应用    │                    │                 │
     │                   │                    │                 │
```

### 5.3 PyQt6 更新服务详解

```python
# src/service/update_service.py
from dataclasses import dataclass
from pathlib import Path
import httpx
import hashlib
import aiohttp
import asyncio
import subprocess
import shutil

@dataclass
class UpdateInfo:
    """更新信息"""
    version: str
    download_url: str
    sha256: str
    release_date: str
    changelog: list[str]
    size_bytes: int
    min_compatible: str


class UpdateService:
    """更新服务，管理检查/下载/安装全流程"""
    API_BASE = "https://{bucket}.s3.{region}.amazonaws.com"
    CHECK_INTERVAL = 4 * 3600  # 每 4 小时检查一次

    def __init__(self, current_version: str) -> None:
        self._current_version = current_version
        self._update_dir = Path.home() / ".trai" / "updates"
        self._update_dir.mkdir(parents=True, exist_ok=True)
        self._checker = UpdateChecker()
        self._notifier: UpdateNotifier | None = None
        self._active_download_task: asyncio.Task | None = None

    def check_for_update(self) -> UpdateInfo | None:
        """同步检查更新（启动时调用）"""
        try:
            return self._checker.check(self._current_version)
        except Exception as e:
            logger.error(f"[UpdateService] check failed: {e}")
            return None

    async def check_for_update_async(self) -> UpdateInfo | None:
        """异步检查更新"""
        return await asyncio.to_thread(self.check_for_update)

    async def download_update(
        self,
        info: UpdateInfo,
        progress_callback: Callable[[float], None],
    ) -> Path:
        """下载更新包，返回下载路径"""
        dest = self._update_dir / f"trai-{info.version}.exe"

        # 已下载则跳过
        if dest.exists() and self._verify_checksum(dest, info.sha256):
            logger.info(f"[UpdateService] already downloaded: {dest}")
            return dest

        async with aiohttp.ClientSession() as session:
            async with session.get(info.download_url) as resp:
                resp.raise_for_status()
                total = int(resp.headers.get("Content-Length", 0))
                downloaded = 0

                with open(dest, "wb") as f:
                    async for chunk in resp.content.iter_chunked(65536):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total > 0:
                            pct = downloaded / total
                            progress_callback(pct)
                            logger.debug(f"[UpdateService] download: {pct*100:.1f}%")

        # 校验完整性
        if not self._verify_checksum(dest, info.sha256):
            dest.unlink()
            raise ValueError("Checksum verification failed")

        logger.info(f"[UpdateService] download complete: {dest}")
        return dest

    def install_update(self, installer_path: Path) -> None:
        """启动安装程序并退出"""
        logger.info(f"[UpdateService] launching installer: {installer_path}")
        try:
            subprocess.Popen(
                [
                    str(installer_path),
                    "/SILENT",
                    "/CLOSEAPPLICATIONS",
                    "/RESTARTAPPLICATIONS",
                ],
                creationflags=subprocess.DETACHED_PROCESS,
            )
        except Exception as e:
            logger.error(f"[UpdateService] launch installer failed: {e}")
            raise

        # 退出当前应用
        QApplication.quit()

    @staticmethod
    def _verify_checksum(path: Path, expected_sha256: str) -> bool:
        """校验 SHA256"""
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        return actual == expected_sha256.lower()
```

### 5.4 PyQt6 更新检查器

```python
# src/comm/update_checker.py
@dataclass
class UpdateInfo:
    version: str
    download_url: str
    sha256: str
    release_date: str
    changelog: list[str]
    size_bytes: int
    min_compatible: str


class UpdateChecker:
    """通过 HTTP 请求检查 S3 上的最新版本"""
    S3_LATEST_URL = (
        "https://{bucket}.s3.{region}.amazonaws.com"
        "/client/latest.json"
    )

    def __init__(self) -> None:
        self._http_client: httpx.Client | None = None
        self._timeout = httpx.Timeout(10.0, connect=5.0)

    def check(self, current_version: str) -> UpdateInfo | None:
        """检查是否有新版本"""
        try:
            client = httpx.Client(timeout=self._timeout)
            url = self.S3_LATEST_URL.format(
                bucket=os.getenv("S3_BUCKET", "trai-releases"),
                region=os.getenv("AWS_REGION", "us-east-1"),
            )
            response = client.get(url)
            response.raise_for_status()
            data = response.json()
            client.close()

            latest = data.get("version", "0.0.0")
            if self._compare_versions(latest, current_version) > 0:
                return UpdateInfo(
                    version=latest,
                    download_url=data["url"],
                    sha256=data["sha256"],
                    release_date=data.get("date", ""),
                    changelog=data.get("changelog", []),
                    size_bytes=data.get("size", 0),
                    min_compatible=data.get("min_compatible", "0.0.0"),
                )
            return None
        except httpx.HTTPError as e:
            logger.error(f"[UpdateChecker] HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"[UpdateChecker] unexpected error: {e}")
            return None

    @staticmethod
    def _compare_versions(v1: str, v2: str) -> int:
        """比较版本号: 1=v1更新, 0=相同, -1=v2更新"""
        def parse(v: str) -> tuple[int, ...]:
            return tuple(int(x) for x in v.lstrip("v").split("."))

        try:
            pv1, pv2 = parse(v1), parse(v2)
            if pv1 > pv2:
                return 1
            elif pv1 < pv2:
                return -1
            return 0
        except Exception:
            return 0
```

### 5.5 PyQt6 更新控制器

```python
# src/controller/update_controller.py
class UpdateController:
    """更新控制器"""
    def __init__(
        self,
        view: UpdateDialog,
        service: UpdateService,
    ) -> None:
        self._view = view
        self._service = service
        self._thread_pool = QThreadPool.globalInstance()
        self._setup_signals()

    def _setup_signals(self) -> None:
        self._view.download_clicked.connect(self._on_download_clicked)
        self._view.install_clicked.connect(self._on_install_clicked)
        self._view.later_clicked.connect(self._on_later_clicked)

    def check_update(self) -> None:
        """启动时检查更新（异步）"""
        self._view.show_checking()

        def do_check() -> UpdateInfo | None:
            return self._service.check_for_update()

        def on_result(info: UpdateInfo | None) -> None:
            if info is None:
                self._view.hide()
            else:
                self._view.show_update_available(info)

        worker = Worker(do_check)
        worker.signals.result.connect(on_result)
        worker.signals.error.connect(self._on_error)
        self._thread_pool.start(worker)

    def _on_download_clicked(self, info: UpdateInfo) -> None:
        """用户点击下载"""
        self._view.show_downloading(0)

        async def do_download() -> None:
            await self._service.download_update(
                info,
                progress_callback=lambda pct: self._view.update_progress(pct),
            )
            self._view.show_ready(info)

        asyncio.ensure_future(do_download())

    def _on_install_clicked(self, info: UpdateInfo) -> None:
        """用户点击安装"""
        installer = self._update_dir / f"trai-{info.version}.exe"
        self._service.install_update(installer)

    def _on_error(self, msg: str) -> None:
        self._view.show_error(msg)
```

### 5.6 更新配置文件格式

```json
// S3: client/latest.json (PyQt6)
{
  "version": "1.2.3",
  "url": "https://trai-releases.s3.us-east-1.amazonaws.com/client/trai-1.2.3.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "date": "2026-04-13",
  "size": 142857600,
  "changelog": [
    "修复聊天消息偶发丢失问题",
    "优化首次启动速度 30%",
    "新增多会话管理功能",
    "修复配额显示不准确"
  ],
  "min_compatible": "1.0.0",
  "os": "windows",
  "arch": "x64"
}
```

```yaml
# S3: electron/latest.yml (Electron)
version: 1.2.3
files:
  - url: trai-1.2.3.exe
    sha512: <sha512-hash>
    size: 142857600
    blockMapSize: 124880
  - url: trai-1.2.3.zip
    sha512: <sha512-hash>
    size: 145678900
path: trai-1.2.3.exe
sha512: <sha512-hash>
releaseDate: '2026-04-13T08:30:00.000Z'
```

### 5.7 Electron 自动更新服务

```typescript
// src/main/services/update.service.ts
import { AutoUpdater } from 'electron-updater';

export class UpdateService {
  private _updater: AutoUpdater;
  private _isDownloading: boolean = false;

  constructor() {
    this._updater = new AutoUpdater({
      provider: 's3',
      bucket: process.env.S3_BUCKET!,
      region: process.env.AWS_REGION!,
      path: 'electron',
    });

    this._updater.autoDownload = false;
    this._updater.autoInstallOnAppQuit = true;
  }

  async check(): Promise<void> {
    await this._updater.checkForUpdates();
  }

  async download(): Promise<void> {
    if (this._isDownloading) return;
    this._isDownloading = true;
    await this._updater.downloadUpdate();
    this._isDownloading = false;
  }

  quitAndInstall(): void {
    this._updater.quitAndInstall(false, true);
  }
}
```

## 6. 客户端通信架构

```
┌─────────────────────────────────────────────────────────────┐
│                    PyQt6 桌面客户端                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   UI Layer  │ -> │Controller   │ -> │  Service    │     │
│  │  (PyQt6)   │    │  Layer      │    │  Layer      │     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                               │             │
│                    ┌─────────────┐    ┌──────┴──────┐     │
│                    │    Comm     │ <- │   Infra     │     │
│                    │  Layer      │    │   Layer     │     │
│                    └──────┬──────┘    └─────────────┘     │
│                           │                               │
│                    ┌──────┴──────┐                        │
│                    │  Backend API │                        │
│                    │   (REST)    │                        │
│                    └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Electron 桌面客户端                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  UI Layer   │ -> │Controller   │ -> │  Service    │     │
│  │  (React)   │    │  (Preload)  │    │  Layer      │     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                               │             │
│                    ┌─────────────┐    ┌──────┴──────┐     │
│                    │  IPC Layer  │    │  Platform   │     │
│                    │             │    │   Layer     │     │
│                    └──────┬──────┘    └─────────────┘     │
│                           │                               │
│                    ┌──────┴──────┐                        │
│                    │  Backend API │                        │
│                    │   (REST)    │                        │
│                    └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 7. 共享规范

### 7.1 颜色禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:14px 0;">
  <strong style="color:#C62828;">绝对禁止使用紫色及相关色系</strong>
  <div style="margin-top:8px;">
    <span style="color:#C62828;">禁止:</span>
    <code>purple, violet, indigo, #9333EA, #7C3AED, rgb(147, 51, 234)</code>
  </div>
  <div style="margin-top:8px;">
    <span style="color:#2E7D32;">推荐:</span>
    <code>blue, cyan, teal, emerald, amber</code>
  </div>
</div>

### 7.2 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:14px 0;">
  <strong style="color:#C62828;">绝对禁止</strong>：代码、注释、日志、异常文案、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;">
    <span style="color:#C62828;">禁止:</span> <code>，，！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">正确:</span> <code>, . ! ? :</code>
  </div>
</div>

### 7.3 异常处理规范

| 规则 | PyQt6 客户端 | Electron 客户端 |
|------|--------------|-----------------|
| 日志工具 | `loguru.logger` | `electron-log` |
| 禁止裸 except | 必须指明异常类型 | 必须 try-catch |
| 静默吞没 | 禁止 `pass`，必须 `logger.error()` | 禁止空 catch |
| 网络异常 | `QMessageBox` 或状态栏 | 通知提示 |
| 错误码规范 | `ERR_0001` ~ `ERR_00BF` | 统一错误码体系 |

## 8. 文件头模板

### 8.1 Python 文件

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: src/service/update_service.py
# 作者: wuhao
# 日期: 2026_04_13_14:30:00
# 描述: 更新服务，管理检查/下载/安装全流程
```

### 8.2 TypeScript 文件

```typescript
/**
 * 文件名: update.service.ts
 * 作者: wuhao
 * 日期: 2026-04-13 14:30:00
 * 描述: 更新服务，封装检查/下载/安装全链路
 */
```

## 9. 快速开始

### 9.1 PyQt6 客户端

```bash
# 激活 Conda 环境
conda activate pyqt6_3_11_15_whf_20260320

# 安装依赖
pip install -r requirements.txt

# 运行
python main.py

# 构建 exe (PyInstaller)
pyinstaller build.spec

# 构建 exe (Nuitka)
python -m nuitka --standalone --onefile main.py
```

### 9.2 Electron 客户端

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 打包应用
pnpm package

# 发布 (上传 S3)
pnpm release
```

---

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <em>编写说明：本架构文档基于 `.cursor/skills/desktop_client/SKILL.md` 和 `.cursor/skills/electron/SKILL.md` 规范制定，强制执行五层架构、线程安全、软件更新架构与全局禁令。</em>
</div>