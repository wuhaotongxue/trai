#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: monitor.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 系统监控接口

from __future__ import annotations

import os
import platform
from datetime import datetime
from typing import Any

from fastapi import APIRouter

router = APIRouter()


def get_memory_info() -> dict[str, Any]:
    """获取内存信息"""
    try:
        import psutil
        mem = psutil.virtual_memory()
        return {
            "total": round(mem.total / (1024**3), 2),
            "available": round(mem.available / (1024**3), 2),
            "used": round(mem.used / (1024**3), 2),
            "percent": mem.percent,
        }
    except ImportError:
        return {"error": "psutil not installed"}


def get_cpu_info() -> dict[str, Any]:
    """获取 CPU 信息"""
    try:
        import psutil
        return {
            "count": psutil.cpu_count(),
            "usage": psutil.cpu_percent(interval=0.1),
        }
    except ImportError:
        return {"error": "psutil not installed"}


@router.get("/monitor")
async def system_monitor() -> dict:
    """系统监控接口

    Returns:
        dict: 系统状态信息
    """
    return {
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "python_version": platform.python_version(),
        },
        "memory": get_memory_info(),
        "cpu": get_cpu_info(),
    }


__all__ = ["router"]
