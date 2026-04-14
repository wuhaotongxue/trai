#!/usr/bin/env python
# 文件名: request_id.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: 请求 ID 中间件，为每个请求生成唯一 ID

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

if TYPE_CHECKING:
    from starlette.middleware.base import RequestResponseEndpoint


class RequestIdMiddleware(BaseHTTPMiddleware):
    """请求 ID 中间件"""

    HEADER_NAME: str = "X-Request-ID"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get(self.HEADER_NAME) or str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers[self.HEADER_NAME] = request_id

        return response


__all__ = ["RequestIdMiddleware"]
