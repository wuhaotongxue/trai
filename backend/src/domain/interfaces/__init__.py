#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_20:22:00
# 描述: Domain 层接口定义模块

from __future__ import annotations

from domain.interfaces.user_interfaces import IUserRepository
from domain.interfaces.session_interfaces import ISessionRepository, IMessageRepository

__all__ = [
    "IUserRepository",
    "ISessionRepository",
    "IMessageRepository",
]
