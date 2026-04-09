#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_21:00:00
# 描述: 认证路由模块

from __future__ import annotations

from api.routers.auth.login import router as login_router
from api.routers.auth.register import router as register_router
from api.routers.auth.logout import router as logout_router
from api.routers.auth.refresh import router as refresh_router
from api.routers.auth.me import router as me_router

__all__ = [
    "login_router",
    "register_router",
    "logout_router",
    "refresh_router",
    "me_router",
]
