#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: health.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 健康检查接口

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """健康检查接口

    Returns:
        dict: 健康状态信息
    """
    return {
        "status": "healthy",
        "service": "TRAI API",
        "version": "0.1.0",
        "timestamp": datetime.now().isoformat(),
    }


__all__ = ["router"]
