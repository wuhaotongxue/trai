#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: error_handler.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 全局异常处理中间件

from __future__ import annotations

import traceback
from typing import TYPE_CHECKING

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from core.logger import get_logger
from core.exceptions import TraiException

if TYPE_CHECKING:
    from starlette.middleware.base import RequestResponseEndpoint
    from fastapi import FastAPI

logger = get_logger()


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """全局异常处理中间件"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> JSONResponse:
        try:
            response = await call_next(request)
            return response

        except TraiException as e:
            logger.warning(
                f"业务异常 | {request.method} {request.url.path} | "
                f"错误码: {e.code} | 消息: {e.message}"
            )
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "code": e.code,
                    "message": e.message,
                    "request_id": getattr(request.state, "request_id", None),
                },
            )

        except Exception as e:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.error(
                f"系统异常 | {request.method} {request.url.path} | "
                f"错误: {str(e)} | 请求ID: {request_id}\n{traceback.format_exc()}"
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "code": "INTERNAL_ERROR",
                    "message": "服务器内部错误",
                    "request_id": request_id,
                },
            )


__all__ = ["ErrorHandlerMiddleware"]
