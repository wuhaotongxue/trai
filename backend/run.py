#!/usr/bin/env python
# 文件名: run.py
# 作者: wuhao
# 日期: 2026_04_16_17:24:17
# 描述: TRAI 后端服务入口文件

from __future__ import annotations

import os
import sys
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
            os.environ.setdefault(key, value)

    @staticmethod
    def load_local_envs() -> None:
        """
        加载 backend 目录下的本地 env 文件.

        加载顺序:
        1. backend/.env
        2. backend/.env.local

        Args:
            无.

        Returns:
            无.

        Raises:
            无.
        """
        base_dir = Path(__file__).resolve().parent
        EnvFileLoader.load_if_exists(base_dir / ".env")
        EnvFileLoader.load_if_exists(base_dir / ".env.local")


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
    if config["reload"]:
        uvicorn.run(
            "api.main:create_app",
            factory=True,
            host=config["host"],
            port=config["port"],
            reload=config["reload"],
            log_level=config["log_level"],
        )
        return

    app = create_app()
    uvicorn.run(app, host=config["host"], port=config["port"], reload=False, log_level=config["log_level"])


if __name__ == "__main__":
    main()
