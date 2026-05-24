#!/usr/bin/env python
# 文件名: main.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: FastAPI 应用配置和路由注册

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

# 确保环境变量在整个应用启动前被加载 (兼容 uvicorn reload 模式)
try:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
    from run import EnvFileLoader

    EnvFileLoader.load_local_envs()
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

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

_OPENAPI_LANG = os.getenv("OPENAPI_LANG", "zh").strip().lower()

_TAG_NAME_MAP: dict[str, str] = {
    "AI": "AI 能力",
    "Agent": "智能体",
    "Agent 管理": "智能体管理",
    "管理": "管理后台",
}

_TAG_NAME_MAP_EN: dict[str, str] = {
    "系统": "System",
    "通知": "Notifications",
    "认证": "Auth",
    "企业微信": "WeCom",
    "管理后台": "Admin",
    "管理": "Admin",
    "AI 能力": "AI",
    "AI": "AI",
    "智能体": "Agent",
    "Agent": "Agent",
    "智能体管理": "Agent Management",
    "Agent 管理": "Agent Management",
    "媒体": "Media",
    "会话": "Sessions",
    "工具": "Tools",
    "客户端更新": "Client Update",
    "首页": "Root",
    "策略": "Policy",
}

_SUMMARY_TRANSLATION_MAP: dict[str, str] = {
    "Health Check": "健康检查",
    "Detailed Health Check": "详细健康检查",
    "Liveness Check": "存活探针",
    "Readiness Check": "就绪探针",
    "System Monitor": "系统监控",
    "Metrics": "监控指标",
    "Login": "登录",
    "Register": "注册",
    "Logout": "退出登录",
    "Refresh Token": "刷新令牌",
    "Get Current User Info": "获取当前用户信息",
    "Change Password": "修改密码",
    "Reset Password": "重置密码",
    "List Users": "获取用户列表",
    "Get User": "获取用户信息",
    "Update User": "更新用户信息",
    "Delete User": "删除用户",
    "Get Dashboard": "获取仪表盘数据",
    "Get Analytics": "获取数据分析",
    "List Quota Plans": "获取配额方案列表",
    "Create Quota Plan": "创建配额方案",
    "Update Quota Plan": "更新配额方案",
    "Demo Create": "创建知识库 Demo",
    "Chat": "对话",
    "Chat Stream": "对话流式输出",
    "Chat With Session": "会话对话",
    "Generate Image": "生成图片",
    "List Image Models": "获取图片模型列表",
    "Generate Music": "生成音乐",
    "Generate Video": "生成视频",
    "SendNotify": "发送通知",
    "TestNotify": "测试通知",
    "ListNotifyConfigs": "通知配置列表",
    "MdToPdfEndpoint": "Markdown转PDF",
    "CompressImageEndpoint": "压缩图片",
    "CompressZipEndpoint": "压缩为ZIP",
    "ConvertImageEndpoint": "转换图片格式",
    "AgentChat": "智能体对话",
}


class OpenApiChineseNormalizer:
    """OpenAPI 文档中文化处理器"""

    @staticmethod
    def _is_ascii_text(text: str) -> bool:
        try:
            text.encode("ascii")
            return True
        except UnicodeEncodeError:
            return False

    @staticmethod
    def _translate_summary(summary: str) -> str:
        mapped = _SUMMARY_TRANSLATION_MAP.get(summary)
        if mapped:
            return mapped

        if not OpenApiChineseNormalizer._is_ascii_text(summary):
            return summary

        token_map: dict[str, str] = {
            "send": "发送",
            "test": "测试",
            "token": "令牌",
            "notify": "通知",
            "configs": "配置列表",
            "config": "配置",
            "user": "用户",
            "users": "用户列表",
            "dashboard": "仪表盘数据",
            "analytics": "数据分析",
            "quota": "配额",
            "plans": "方案",
            "plan": "方案",
            "password": "密码",
            "current": "当前",
            "info": "信息",
            "health": "健康检查",
            "detailed": "详细",
            "liveness": "存活",
            "readiness": "就绪",
            "monitor": "监控",
            "metrics": "指标",
            "demo": "Demo",
            "create": "创建",
            "md": "Markdown",
            "pdf": "PDF",
            "endpoint": "",
            "compress": "压缩",
            "image": "图片",
            "zip": "ZIP",
            "convert": "转换",
            "agent": "智能体",
        }
        if " " in summary.strip():
            words = [w for w in summary.strip().split(" ") if w]
            translated: list[str] = []
            for word in words:
                translated.append(token_map.get(word.lower(), word))
            joined = "".join(translated)
            if joined and joined != summary:
                return joined

        lowered = summary.strip().lower()
        verb_map: list[tuple[str, str]] = [
            ("get ", "获取"),
            ("list ", "获取"),
            ("create ", "创建"),
            ("update ", "更新"),
            ("delete ", "删除"),
            ("generate ", "生成"),
            ("sync ", "同步"),
        ]

        for prefix, chinese in verb_map:
            if lowered.startswith(prefix):
                rest = summary.strip()[len(prefix) :].strip()
                rest_map: dict[str, str] = {
                    "dashboard": "仪表盘数据",
                    "analytics": "数据分析",
                    "quota plans": "配额方案",
                    "users": "用户列表",
                    "user": "用户信息",
                    "image models": "图片模型列表",
                    "image": "图片",
                    "music": "音乐",
                    "video": "视频",
                    "organization": "组织架构",
                }
                rest_cn = rest_map.get(rest.lower(), rest)
                return f"{chinese}{rest_cn}"

        return summary

    @staticmethod
    def normalize(schema: dict) -> dict:
        if _OPENAPI_LANG not in {"zh", "cn", "zh-cn"}:
            return OpenApiChineseNormalizer._normalize_en(schema)

        paths = schema.get("paths", {})
        for path_item in paths.values():
            if not isinstance(path_item, dict):
                continue
            for method, op in path_item.items():
                if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                    continue
                if not isinstance(op, dict):
                    continue

                tags = op.get("tags", [])
                if isinstance(tags, list):
                    renamed = [_TAG_NAME_MAP.get(str(t), str(t)) for t in tags]
                    deduped: list[str] = []
                    for t in renamed:
                        if t not in deduped:
                            deduped.append(t)
                    op["tags"] = deduped

                summary = op.get("summary")
                if isinstance(summary, str) and summary.strip():
                    op["summary"] = OpenApiChineseNormalizer._translate_summary(summary)
                else:
                    operation_id = op.get("operationId")
                    if isinstance(operation_id, str) and operation_id.strip():
                        op["summary"] = OpenApiChineseNormalizer._translate_summary(operation_id)

        if "tags" in schema and isinstance(schema["tags"], list):
            for tag in schema["tags"]:
                if isinstance(tag, dict) and "name" in tag:
                    name = str(tag["name"])
                    tag["name"] = _TAG_NAME_MAP.get(name, name)

        return schema

    @staticmethod
    def _normalize_en(schema: dict) -> dict:
        paths = schema.get("paths", {})
        for path_item in paths.values():
            if not isinstance(path_item, dict):
                continue
            for method, op in path_item.items():
                if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                    continue
                if not isinstance(op, dict):
                    continue

                tags = op.get("tags", [])
                if isinstance(tags, list):
                    renamed = [_TAG_NAME_MAP_EN.get(str(t), str(t)) for t in tags]
                    deduped: list[str] = []
                    for t in renamed:
                        if t not in deduped:
                            deduped.append(t)
                    op["tags"] = deduped

        if "tags" in schema and isinstance(schema["tags"], list):
            for tag in schema["tags"]:
                if isinstance(tag, dict) and "name" in tag:
                    name = str(tag["name"])
                    tag["name"] = _TAG_NAME_MAP_EN.get(name, name)
                    desc = tag.get("description")
                    if isinstance(desc, str) and desc.strip():
                        tag["description"] = desc

        return schema


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    openapi_tags = [
        {"name": "系统", "description": "健康检查, 监控与系统反馈等接口."},
        {"name": "通知", "description": "系统通知相关接口."},
        {"name": "认证", "description": "登录, 注册, 刷新 token 与用户信息."},
        {"name": "企业微信", "description": "企业微信扫码登录与组织架构相关接口."},
        {"name": "管理后台", "description": "后台管理接口, 需要管理员权限."},
        {"name": "AI 能力", "description": "AI 能力接口, 如对话与生成能力."},
        {"name": "智能体", "description": "智能体对话与工具调用接口."},
        {"name": "智能体管理", "description": "智能体管理接口."},
        {"name": "多模态Agent", "description": "多模态AI能力接口, 包括图像理解/生成, 语音识别/合成, PDF解析等."},
        {"name": "WebSocket", "description": "实时通信接口."},
        {"name": "媒体", "description": "文件上传等媒体接口."},
        {"name": "会话", "description": "会话管理接口."},
        {"name": "工具", "description": "通用工具接口."},
        {"name": "客户端更新", "description": "桌面客户端自动更新接口."},
    ]
    if _OPENAPI_LANG not in {"zh", "cn", "zh-cn"}:
        openapi_tags = [
            {"name": "System", "description": "Health checks, monitoring, and system feedback."},
            {"name": "Notifications", "description": "System notifications."},
            {"name": "Auth", "description": "Login, register, token refresh, and user info."},
            {"name": "WeCom", "description": "WeCom SSO and organization APIs."},
            {"name": "Admin", "description": "Admin APIs, admin role required."},
            {"name": "AI", "description": "AI APIs, chat and generations."},
            {"name": "Agent", "description": "Agent chat and tool calling."},
            {"name": "Agent Management", "description": "Agent management APIs."},
            {"name": "Multimodal Agent", "description": "Multimodal AI APIs: vision, audio, document processing."},
            {"name": "WebSocket", "description": "Real-time communication APIs."},
            {"name": "Media", "description": "Media upload APIs."},
            {"name": "Sessions", "description": "Session APIs."},
            {"name": "Tools", "description": "Utility tools APIs."},
            {"name": "Client Update", "description": "Desktop client auto-update APIs."},
        ]

    app = FastAPI(
        title="TRAI 项目后端 API 服务",
        description="TRAI 后端接口文档, 统一返回格式与鉴权规则详见各接口说明.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=openapi_tags,
    )

    register_middlewares(app)
    register_routers(app)

    def custom_openapi() -> dict:
        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        app.openapi_schema = OpenApiChineseNormalizer.normalize(schema)
        return app.openapi_schema

    app.openapi = custom_openapi

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
    api_prefix = os.getenv("API_PREFIX", "").strip()
    if not api_prefix.startswith("/api_trai/"):
        api_prefix = "/api_trai/v1"
    if not api_prefix.startswith("/"):
        api_prefix = f"/{api_prefix}"
    api_prefix = api_prefix.rstrip("/")

    from api.routers import tools
    from api.routers.admin import (
        ai_mgmt,
        analytics_router,
        backup,
        dashboard_router,
        knowledge_base_router,
        login_logs,
        organization,
        quota_config_router,
        schema_doc_router,
        user_router,
    )
    from api.routers.admin import (
        monitor as admin_monitor,
    )
    from api.routers.admin.agent_role import router as admin_agent_role_router
    from api.routers.admin.client_release import router as admin_client_release_router
    from api.routers.admin.i18n import router as admin_i18n_router
    from api.routers.admin.image_gen_config import router as image_gen_config_router
    from api.routers.admin.image_records import router as admin_image_records_router
    from api.routers.ai import agent, chat, comfyui, image, management, music, report, subtitle, video
    from api.routers.apps.extensions import router as extensions_router

    app.include_router(extensions_router, prefix=f"{api_prefix}/apps", tags=["应用扩展"])
    from api.routers.ai.multimodal_agent_routes import router as multimodal_agent_router
    from api.routers.auth import login, logout, me, password, refresh, register, wecom
    from api.routers.client.update import router as client_update_router
    from api.routers.contact import router as contact_router
    from api.routers.i18n_public import router as i18n_public_router
    from api.routers.media import upload
    from api.routers.session import session
    from api.routers.system import feedback, health, notify
    from api.routers.system import monitor as system_monitor
    from api.routers.websocket_routes import websocket_router

    app.include_router(health.router, prefix=f"{api_prefix}/system", tags=["系统"])
    app.include_router(system_monitor.router, prefix=f"{api_prefix}/system", tags=["系统"])
    app.include_router(notify.router, prefix=f"{api_prefix}/system", tags=["通知"])
    app.include_router(feedback.router, prefix=f"{api_prefix}/system", tags=["系统"])
    app.include_router(login.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(register.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(logout.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(refresh.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(me.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(password.router, prefix=f"{api_prefix}/auth", tags=["认证"])
    app.include_router(wecom.router, prefix=f"{api_prefix}/auth/wecom", tags=["企业微信"])
    app.include_router(user_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(dashboard_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(analytics_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(quota_config_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(knowledge_base_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(admin_client_release_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(admin_agent_role_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(organization.router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(login_logs.router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(ai_mgmt.router, prefix=f"{api_prefix}", tags=["管理"])
    app.include_router(backup.router, prefix=f"{api_prefix}/admin", tags=["系统管理"])
    app.include_router(schema_doc_router, prefix=f"{api_prefix}/admin", tags=["系统管理"])
    app.include_router(image_gen_config_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(admin_image_records_router, prefix=f"{api_prefix}/admin", tags=["管理"])
    app.include_router(admin_monitor.router, prefix=f"{api_prefix}", tags=["管理"])
    app.include_router(client_update_router, prefix=f"{api_prefix}/client", tags=["客户端更新"])
    app.include_router(chat.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(image.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(music.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(video.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(subtitle.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(comfyui.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(report.router, prefix=f"{api_prefix}/ai", tags=["AI"])
    app.include_router(session.router, prefix=api_prefix, tags=["会话"])
    app.include_router(agent.router, prefix=api_prefix, tags=["Agent"])
    app.include_router(management.router, prefix=api_prefix, tags=["Agent 管理"])
    app.include_router(multimodal_agent_router, prefix=api_prefix, tags=["Multimodal Agent"])
    app.include_router(websocket_router.router, tags=["WebSocket"])
    app.include_router(upload.router, prefix=f"{api_prefix}/media", tags=["媒体"])
    app.include_router(tools.router, prefix=f"{api_prefix}/tools", tags=["工具"])
    app.include_router(contact_router, prefix=api_prefix, tags=["公开接口"])
    app.include_router(i18n_public_router, prefix=api_prefix, tags=["翻译"])
    app.include_router(admin_i18n_router, prefix=f"{api_prefix}/admin", tags=["国际化管理"])

    @app.get("/", tags=["首页"])
    async def root() -> dict:
        """根路径,返回服务信息"""
        return {
            "service": "TRAI API",
            "version": "0.1.0",
            "docs": "/docs",
            "health": f"{api_prefix}/system/health",
            "monitor": f"{api_prefix}/system/monitor",
            "timestamp": datetime.now().isoformat(),
        }

    @app.on_event("startup")
    async def startup_event() -> None:
        init_telemetry()
        # 初始化数据库(单例)，触发建表
        from infrastructure.database import get_database

        _ = get_database()
        logger.info("TRAI API 服务启动")

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("TRAI API 服务关闭")


__all__ = ["create_app"]
