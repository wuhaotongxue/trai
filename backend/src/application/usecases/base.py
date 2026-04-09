#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: base.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 用例基类

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")


class UseCase(ABC, Generic[TInput, TOutput]):
    """用例基类"""

    @abstractmethod
    async def execute(self, input_data: TInput) -> TOutput:
        """执行用例"""
        raise NotImplementedError


__all__ = ["UseCase"]
