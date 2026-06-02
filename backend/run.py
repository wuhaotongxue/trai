#!/usr/bin/env python
# 文件名: run.py
# 作者: wuhao
# 日期: 2026_04_25_18:42:00
# 描述: TRAI 后端服务入口文件，支持端口检测、进程清理与日志记录

from __future__ import annotations

import io
import os
import signal
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn

# 添加 src 目录到 sys.path 以解决模块导入问题
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

from api.main import create_app
from core.logger import init_logger


class EnvFileLoader:
    """
    本地开发环境变量加载器.

    Args:
        无.

    Returns:
        无.

    Raises:
        无.
    """

    @staticmethod
    def should_override(key: str, value: str) -> bool:
        """
        判断当前 env 值是否允许覆盖已有环境变量.

        Args:
            key: 环境变量键名.
            value: 待写入的环境变量值.

        Returns:
            bool: True 表示允许覆盖, False 表示应保留已有真实值.

        Raises:
            无.
        """
        current_value = os.environ.get(key, "")
        normalized_value = value.strip()
        if not current_value:
            return True
        if normalized_value and set(normalized_value) != {"x"}:
            return True
        return False

    @staticmethod
    def load_if_exists(file_path: Path) -> None:
        """
        加载指定路径的 env 文件,仅在变量未设置时写入 os.environ.

        Args:
            file_path: env 文件路径.

        Returns:
            无.

        Raises:
            无.
        """
        if not file_path.exists() or not file_path.is_file():
            return

        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception:
            return

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if not key:
                continue
            if not EnvFileLoader.should_override(key=key, value=value):
                continue
            os.environ[key] = value  # 直接覆盖，确保模块配置生效

    @staticmethod
    def load_local_envs() -> None:
        """
        加载 backend 目录下的本地 env 文件.

        加载顺序:
        1. backend/env/*.env (所有 .env 文件，按字母顺序)
        2. backend/.env
        3. backend/.env.local

        Args:
            无.

        Returns:
            无.

        Raises:
            无.
        """
        base_dir = Path(__file__).resolve().parent
        # 先加载公共模块配置, 再由本地覆盖配置兜底.
        env_dir = base_dir / "env"
        if env_dir.exists() and env_dir.is_dir():
            env_files = sorted(env_dir.glob("*.env"))
            for env_file in env_files:
                EnvFileLoader.load_if_exists(env_file)

        EnvFileLoader.load_if_exists(base_dir / ".env")
        EnvFileLoader.load_if_exists(base_dir / ".env.local")


class PortCleaner:
    """端口清理工具,自动清理占用端口的僵尸进程."""

    @staticmethod
    def find_processes_on_port(port: int) -> list[dict[str, Any]]:
        """查找占用指定端口的进程"""
        processes: list[dict[str, Any]] = []

        try:
            import psutil

            for conn in psutil.net_connections():
                if getattr(conn, "status", None) not in (psutil.CONN_LISTEN, "LISTEN"):
                    continue
                if conn.laddr and conn.laddr.port == port:
                    try:
                        proc = psutil.Process(conn.pid)
                        processes.append(
                            {"pid": conn.pid, "name": proc.name(), "port": port}
                        )
                    except psutil.NoSuchProcess:
                        pass
        except ImportError:
            pass

        seen: set[int] = set()
        unique: list[dict[str, Any]] = []
        for p in processes:
            if p["pid"] not in seen:
                seen.add(p["pid"])
                unique.append(p)
        return unique

    @staticmethod
    def kill_process(pid: int, name: str) -> bool:
        """杀掉指定进程"""
        try:
            import psutil

            proc = psutil.Process(pid)
            for child in proc.children(recursive=True):
                try:
                    child.kill()
                except psutil.NoSuchProcess:
                    continue
            proc.kill()
            proc.wait(timeout=3)
            print(f"  [OK] 已终止: {name} (PID: {pid})")
            return True
        except psutil.NoSuchProcess:
            print(f"  [~] 进程不存在: {pid}")
            return True
        except psutil.AccessDenied:
            print(f"  [!] 权限不足,等待内核自动释放: {name} (PID: {pid})")
            time.sleep(3)
            return True
        except Exception:
            pass

        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["taskkill", "/F", "/PID", str(pid)],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                )
                success = result.returncode == 0
                if success:
                    print(f"  [OK] 已终止(taskkill): {name} (PID: {pid})")
                else:
                    print(f"  [!] 终止失败: {result.stderr.strip()}")
                return success
            else:
                os.kill(pid, signal.SIGTERM)
                print(f"  [OK] 已终止: {name} (PID: {pid})")
                return True
        except ProcessLookupError:
            print(f"  [~] 进程不存在: {pid}")
            return True
        except PermissionError:
            print(f"  [!] 权限不足: {name} (PID: {pid})")
            return False
        except Exception:
            return False

    @classmethod
    def cleanup(cls, port: int) -> bool:
        """清理占用指定端口的进程,返回端口是否已释放"""
        print(f"\n{'=' * 60}")
        print(f"端口 {port} 检测")
        print(f"{'=' * 60}")

        max_retries = 3
        for attempt in range(max_retries):
            processes = cls.find_processes_on_port(port)

            if not processes:
                if attempt == 0:
                    print(f"  [OK] 端口 {port} 空闲")
                else:
                    print(f"  [OK] 端口 {port} 已释放")
                return True

            if attempt == 0:
                print(f"  [!] 发现 {len(processes)} 个进程占用端口 {port}:")
            else:
                print(f"  [!] 第 {attempt + 1} 次重试: 仍有 {len(processes)} 个进程占用端口 {port}:")

            killed_any = False
            for proc in processes:
                if proc["pid"] == os.getpid():
                    print(f"  [~] 跳过自身: {proc['name']} (PID: {proc['pid']})")
                    continue

                if cls.kill_process(proc["pid"], proc["name"]):
                    killed_any = True
                    time.sleep(0.5)

            if killed_any:
                time.sleep(1)
            else:
                # 没有任何进程被杀掉(可能是自身或无法终止), 跳出循环
                break

        remaining = cls.find_processes_on_port(port)
        if remaining:
            print(f"  [!] 警告: 仍有 {len(remaining)} 个进程占用端口")
            for p in remaining:
                print(f"      - {p['name']} (PID: {p['pid']})")
            return False
        else:
            if max_retries > 1:
                print(f"  [OK] 端口 {port} 已彻底释放")
            return True


def get_config() -> dict[str, Any]:
    """从环境变量获取配置

    Returns:
        dict: 配置字典
    """
    return {
        "host": os.getenv("APP_HOST", "0.0.0.0"),
        "port": int(os.getenv("APP_PORT", "5666")),
        "reload": os.getenv("APP_DEBUG", "false").lower() == "true",
        "log_level": "debug" if os.getenv("APP_DEBUG", "false").lower() == "true" else "info",
    }


def main() -> None:
    """主入口函数"""
    EnvFileLoader.load_local_envs()
    init_logger(level="INFO")
    config = get_config()

    print(f"\n{'=' * 60}")
    print("TRAI 后端服务")
    print(f"{'=' * 60}")
    print(f"工作目录: {Path(__file__).resolve().parent}")
    print(f"目标端口: {config['port']}")
    print(f"调试模式: {config['reload']}")
    print(f"Python: {sys.version.split()[0]}")
    print(f"路径: {sys.executable}")
    print(f"{'=' * 60}\n")

    # 清理占用端口的进程
    if not PortCleaner.cleanup(config["port"]):
        print("\n[!] 端口清理未完成,继续启动可能失败")

    print(f"{'=' * 60}")
    print("[启动] 后端服务...")
    print(f"{'=' * 60}")

    import socket as _socket

    def _wait_port_free(port: int, max_wait: int = 30) -> bool:
        for i in range(max_wait):
            s = _socket.socket(_socket.AF_INET, _socket.SOCK_STREAM)
            s.settimeout(1)
            r = s.connect_ex(("127.0.0.1", port))
            s.close()
            if r != 0:
                return True
            print(f"  [!] 端口 {port} 仍被占用, {i + 1}s ...")
            time.sleep(1)
        return False

    if not _wait_port_free(config["port"]):
        print(f"\n  [!!] 端口 {config['port']} 等待 {30}s 后仍被占用,强制继续...")

    # 创建日志目录和日志文件
    log_dir = Path(__file__).resolve().parent / "logs"
    log_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"backend_{timestamp}.log"

    print(f"{'=' * 60}")
    print("[启动] 后端服务...")
    print(f"{'=' * 60}")

    # 启动日志写入器
    class LogWriter:
        """日志写入器，将控制台输出同步写入文件"""

        def __init__(self, file_path: Path) -> None:
            self.file_handle: io.TextIOWrapper | None = None
            self.file_path = file_path
            self._start()

        def _start(self) -> None:
            """启动日志文件写入"""
            self.file_handle = open(self.file_path, "w", encoding="utf-8")
            self._write("TRAI Backend Service Log\n")
            self._write(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            self._write(f"Port: {config['port']}\n")
            self._write(f"Debug: {config['reload']}\n")
            self._write(f"{'=' * 60}\n\n")

        def _write(self, message: str) -> None:
            """写入消息到日志文件"""
            if self.file_handle:
                self.file_handle.write(message)
                self.file_handle.flush()

        def write(self, message: str) -> None:
            """写入消息（供 sys.stdout 替换使用）"""
            self._write(message)

        def flush(self) -> None:
            """刷新缓冲区"""
            if self.file_handle:
                self.file_handle.flush()

        def close(self) -> None:
            """关闭日志文件"""
            if self.file_handle:
                self._write(f"\n{'=' * 60}\n")
                self._write(f"Stop Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                self._write(f"{'=' * 60}\n")
                self.file_handle.close()
                self.file_handle = None

        def __enter__(self) -> LogWriter:
            return self

        def __exit__(self, exc_type, exc_val, exc_tb) -> None:
            self.close()

    log_writer = LogWriter(log_file)

    # 保存原始 stdout
    original_stdout = sys.stdout
    sys.stdout = log_writer  # type: ignore

    # 启动 uvicorn 服务器(线程方式,避免子进程导致请求超时)
    import asyncio
    import threading

    def _handle_exception(loop, context):
        exc = context.get("exception")
        if isinstance(exc, ConnectionResetError):
            return
        if exc is None and "ConnectionResetError" in context.get("message", ""):
            return
        loop.default_exception_handler(context)

    async def run_uvicorn() -> None:
        loop = asyncio.get_running_loop()
        loop.set_exception_handler(_handle_exception)
        app = create_app()
        for attempt in range(3):
            try:
                server_config = uvicorn.Config(
                    app=app,
                    host=config["host"],
                    port=config["port"],
                    reload=config["reload"],
                    log_level=config["log_level"],
                    timeout_keep_alive=300,
                    limit_concurrency=50,
                    limit_max_requests=1000,
                )
                server = uvicorn.Server(server_config)
                await server.serve()
                break
            except OSError as e:
                if e.errno in (98, 10048) and attempt < 2:
                    print(f"\n  [!] 端口 {config['port']} 被占用, {attempt + 1}s 后重试...")
                    time.sleep(1)
                    continue
                raise

    server_thread = threading.Thread(target=lambda: asyncio.run(run_uvicorn()), daemon=False)
    server_thread.start()

    print(f"[PID] {os.getpid()}")
    print(f"[日志] {log_file}")
    print(f"[地址] http://localhost:{config['port']}")
    print("[提示] 按 Ctrl+C 停止")
    print(f"{'=' * 60}\n")

    # 恢复 stdout
    sys.stdout = original_stdout

    # 等待服务器启动
    time.sleep(1)

    # 日志监控:等待 Ctrl+C
    try:
        while server_thread.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[停止] 正在关闭后端...")
        print("[停止] 后端已关闭")

    # 关闭日志写入器
    log_writer.close()


def run_server() -> None:
    """直接运行后端服务(供子进程调用)"""
    EnvFileLoader.load_local_envs()
    # 使用 run.py 所在目录的绝对路径作为日志目录
    backend_dir = Path(__file__).resolve().parent
    log_dir = backend_dir / "logs"
    init_logger(level="INFO", log_dir=log_dir)
    config = get_config()

    if config["reload"]:
        uvicorn.run(
            "api.main:create_app",
            factory=True,
            host=config["host"],
            port=config["port"],
            reload=config["reload"],
            log_level=config["log_level"],
        )
    else:
        app = create_app()
        uvicorn.run(app, host=config["host"], port=config["port"], reload=False, log_level=config["log_level"])


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--no-cleanup":
        # 子进程模式,直接运行服务
        run_server()
    else:
        # 主进程模式,清理端口后启动服务
        main()
