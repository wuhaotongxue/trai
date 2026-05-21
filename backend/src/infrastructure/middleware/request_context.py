#!/usr/bin/env python
# 文件名: request_context.py
# 作者: wuhao
# 日期: 2026-05-18
# 描述: 请求上下文变量，用于在中间件中设置、路由中读取客户端IP

from __future__ import annotations

from contextvars import ContextVar
from typing import Any

# 请求级上下文变量
_current_client_ip: ContextVar[str | None] = ContextVar("current_client_ip", default=None)
_current_request_id: ContextVar[str | None] = ContextVar("current_request_id", default=None)
_current_request_info: ContextVar[dict[str, Any] | None] = ContextVar("current_request_info", default=None)


def set_client_ip(ip: str | None) -> None:
    """设置当前请求的客户端IP"""
    _current_client_ip.set(ip)


def get_client_ip() -> str | None:
    """获取当前请求的客户端IP"""
    return _current_client_ip.get()


def set_request_id(request_id: str | None) -> None:
    """设置当前请求ID"""
    _current_request_id.set(request_id)


def get_request_id() -> str | None:
    """获取当前请求ID"""
    return _current_request_id.get()


def set_request_info(info: dict[str, Any] | None) -> None:
    """设置当前请求信息"""
    _current_request_info.set(info)


def get_request_info() -> dict[str, Any] | None:
    """获取当前请求信息"""
    return _current_request_info.get()


__all__ = [
    "set_client_ip",
    "get_client_ip",
    "set_request_id",
    "get_request_id",
    "set_request_info",
    "get_request_info",
]
