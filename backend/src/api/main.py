#!/usr/bin/env python
# 文件名: main.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: FastAPI 应用配置和路由注册

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logger import get_logger
from core.telemetry import init_telemetry

from .middleware.audit import AuditMiddleware
from .middleware.error_handler import ErrorHandlerMiddleware
from .middleware.logging import LoggingMiddleware
from .middleware.rate_limiter import RateLimitMiddleware
from .middleware.request_id import RequestIdMiddleware

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = get_logger()


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    app = FastAPI(
        title="TRAI API",
        description="TRAI 项目后端 API 服务",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    register_middlewares(app)
    register_routers(app)

    return app


def register_middlewares(app: FastAPI) -> None:
    """注册中间件(顺序很重要)"""
    # 1. 错误处理(最先,捕获所有异常)
    app.add_middleware(ErrorHandlerMiddleware)

    # 2. 请求 ID(生成追踪 ID)
    app.add_middleware(RequestIdMiddleware)

    # 3. 审计日志(记录操作)
    app.add_middleware(AuditMiddleware)

    # 4. 速率限制(防止滥用)
    app.add_middleware(RateLimitMiddleware)

    # 5. 日志记录(最后,记录完整请求)
    app.add_middleware(LoggingMiddleware)

    # 6. CORS(跨域支持)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def register_routers(app: FastAPI) -> None:
    """注册路由"""
    from api.routers import tools
    from api.routers.admin import (
        analytics_router,
        dashboard_router,
        organization,
        quota_config_router,
        user_router,
    )
    from api.routers.admin.client_release import router as admin_client_release_router
    from api.routers.ai import agent, chat, comfyui, image, management, music, video
    from api.routers.auth import login, logout, me, password, refresh, register, wecom
    from api.routers.client.update import router as client_update_router
    from api.routers.media import upload
    from api.routers.session import session
    from api.routers.system import feedback, health, monitor, notify

    app.include_router(health.router, prefix="/api/system", tags=["系统"])
    app.include_router(monitor.router, prefix="/api/system", tags=["系统"])
    app.include_router(notify.router, prefix="/api/system", tags=["通知"])
    app.include_router(feedback.router, prefix="/api/system", tags=["系统"])
    app.include_router(login.router, prefix="/api/auth", tags=["认证"])
    app.include_router(register.router, prefix="/api/auth", tags=["认证"])
    app.include_router(logout.router, prefix="/api/auth", tags=["认证"])
    app.include_router(refresh.router, prefix="/api/auth", tags=["认证"])
    app.include_router(me.router, prefix="/api/auth", tags=["认证"])
    app.include_router(password.router, prefix="/api/auth", tags=["认证"])
    app.include_router(wecom.router, prefix="/api/auth/wecom", tags=["企业微信"])
    app.include_router(user_router, prefix="/api/admin", tags=["管理"])
    app.include_router(dashboard_router, prefix="/api/admin", tags=["管理"])
    app.include_router(analytics_router, prefix="/api/admin", tags=["管理"])
    app.include_router(quota_config_router, prefix="/api/admin", tags=["管理"])
    app.include_router(admin_client_release_router, prefix="/api/admin", tags=["管理"])
    app.include_router(organization.router, prefix="/api/admin/organization", tags=["管理"])
    app.include_router(client_update_router, prefix="/api/client", tags=["客户端更新"])
    app.include_router(chat.router, prefix="/api/ai", tags=["AI"])
    app.include_router(image.router, prefix="/api/ai", tags=["AI"])
    app.include_router(music.router, prefix="/api/ai", tags=["AI"])
    app.include_router(video.router, prefix="/api/ai", tags=["AI"])
    app.include_router(agent.router, prefix="/api", tags=["Agent"])
    app.include_router(management.router, prefix="/api", tags=["Agent 管理"])
    app.include_router(comfyui.router, prefix="/api/ai", tags=["AI"])
    app.include_router(upload.router, prefix="/api/media", tags=["媒体"])
    app.include_router(session.router, prefix="/api", tags=["会话"])
    app.include_router(tools.router, prefix="/api/tools", tags=["工具"])

    @app.get("/", tags=["首页"])
    async def root() -> dict:
        """根路径,返回服务信息"""
        return {
            "service": "TRAI API",
            "version": "0.1.0",
            "docs": "/docs",
            "health": "/api/system/health",
            "monitor": "/api/system/monitor",
            "timestamp": datetime.now().isoformat(),
        }

    @app.on_event("startup")
    async def startup_event() -> None:
        init_telemetry()
        logger.info("TRAI API 服务启动")

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("TRAI API 服务关闭")


__all__ = ["create_app"]
