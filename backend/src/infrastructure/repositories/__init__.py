#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_04_09_21:20:00
# 描述: 数据仓储模块

from __future__ import annotations

from infrastructure.repositories.user_repository import UserRepository

__all__ = ["UserRepository"]
