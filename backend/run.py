#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: run.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: TRAI 后端服务入口文件

from __future__ import annotations

import os
from typing import Any

import uvicorn

from api.main import create_app
from core.logger import init_logger


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
    init_logger(level="INFO")
    config = get_config()
    app = create_app()

    uvicorn.run(
        app,
        host=config["host"],
        port=config["port"],
        reload=config["reload"],
        log_level=config["log_level"],
    )


if __name__ == "__main__":
    main()
