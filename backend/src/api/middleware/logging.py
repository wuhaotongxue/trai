#!/usr/bin/env python
# 文件名: logging.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 请求日志中间件,记录请求和响应信息

from __future__ import annotations

import time
from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from core.logger import get_logger
from infrastructure.middleware.request_context import set_client_ip

if TYPE_CHECKING:
    from starlette.middleware.base import RequestResponseEndpoint

logger = get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = getattr(request.state, "request_id", "unknown")
        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"

        # 设置客户端IP到上下文变量
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = client_host
        set_client_ip(client_ip)

        start_time = time.perf_counter()

        logger.info(f"请求开始 | {method} {path} | 客户端: {client_host} | 请求ID: {request_id}")

        try:
            response = await call_next(request)
            duration = (time.perf_counter() - start_time) * 1000

            logger.info(
                f"请求完成 | {method} {path} | 状态: {response.status_code} | "
                f"耗时: {duration:.2f}ms | 请求ID: {request_id}"
            )

            return response

        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(f"请求异常 | {method} {path} | 错误: {str(e)} | 耗时: {duration:.2f}ms | 请求ID: {request_id}")
            raise


__all__ = ["LoggingMiddleware"]
