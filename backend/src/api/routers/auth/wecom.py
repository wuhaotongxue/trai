#!/usr/bin/env python
# 文件名: wecom.py
# 作者: wuhao
# 日期: 2026_04_15_13:41:02
# 描述: 企业微信扫码登录及回调接口

from __future__ import annotations

import os
from typing import Annotated
from urllib.parse import urlencode, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from core.logger import get_logger
from infrastructure.agent.tools.wecom_contact import WeComContactClient
from infrastructure.database import get_db_session
from infrastructure.repositories.user_repository import UserRepository
from infrastructure.security.jwt import JWTService, get_jwt_service

logger = get_logger()
router = APIRouter()


class WeComLoginUrlResponse(BaseModel):
    """企业微信登录链接响应"""

    url: str = Field(description="企业微信 OAuth 授权链接")


class WeComController:
    """企业微信登录相关接口控制器"""

    @staticmethod
    @router.get("/url", response_model=WeComLoginUrlResponse, summary="获取企业微信授权链接")
    async def get_wecom_login_url() -> WeComLoginUrlResponse:
        """获取企业微信扫码登录授权链接

        Returns:
            WeComLoginUrlResponse: 包含 OAuth 链接的响应
        """
        corp_id = os.getenv("WECOM_CORP_ID")
        agent_id = os.getenv("WECOM_AGENT_ID")

        api_prefix = os.getenv("API_PREFIX", "").strip()
        if not api_prefix.startswith("/api_trai/"):
            api_prefix = "/api_trai/v1"
        if not api_prefix.startswith("/"):
            api_prefix = f"/{api_prefix}"
        api_prefix = api_prefix.rstrip("/")
        callback_path = f"{api_prefix}/auth/wecom/callback"

        redirect_uri = os.getenv("WECOM_REDIRECT_URI", "").strip()
        if not redirect_uri:
            redirect_uri = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:5666").rstrip("/") + callback_path
        # 兼容历史错误配置: 旧值曾指向前端回调页, 导致企业微信回调域名校验失败.
        backend_public_url = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:5666").rstrip("/")
        parsed = urlparse(redirect_uri)
        if parsed.netloc.startswith("localhost:3000"):
            redirect_uri = f"{backend_public_url}{callback_path}"
            logger.warning("检测到旧版 WECOM_REDIRECT_URI 配置(3000), 已自动修正为后端回调路径")
        elif parsed.path in {"/auth/wecom/callback", "/api/auth/wecom/callback", "/api_trai/auth/wecom/callback"}:
            redirect_uri = redirect_uri.replace(parsed.path, callback_path)
            logger.warning("检测到旧版 WECOM_REDIRECT_URI 路径, 已自动修正为当前 API_PREFIX")

        if not corp_id or not agent_id:
            logger.error("企业微信环境变量 WECOM_CORP_ID 或 WECOM_AGENT_ID 未配置")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "系统未配置企业微信相关参数"},
            )

        qs = urlencode(
            {
                "appid": corp_id,
                "agentid": agent_id,
                "redirect_uri": redirect_uri,
                "state": "trai_login",
            }
        )
        url = f"https://open.work.weixin.qq.com/wwopen/sso/qrConnect?{qs}"

        return WeComLoginUrlResponse(url=url)

    @staticmethod
    @router.get("/callback", summary="企业微信授权回调", response_class=RedirectResponse)
    async def wecom_callback(
        code: Annotated[str, Query(description="企业微信授权码")],
        state: Annotated[str | None, Query(description="防重放状态码")] = None,
        request: Request = None,  # type: ignore # 移除 | None, 让 FastAPI 正确识别 Request 依赖
        session: Session = Depends(get_db_session),
        jwt_service: JWTService = Depends(get_jwt_service),
    ) -> RedirectResponse:
        """企业微信扫码登录回调接口

        Args:
            code: 授权 code
            state: 状态码
            session: 数据库会话
            jwt_service: JWT 服务实例

        Returns:
            RedirectResponse: 携带 Token 跳转到前端

        Raises:
            HTTPException: 获取用户信息失败或账号未绑定
        """
        logger.info(f"收到企业微信登录回调, code={code}")

        corp_id = os.getenv("WECOM_CORP_ID")
        agent_id = os.getenv("WECOM_AGENT_ID")
        secret = os.getenv("WECOM_CORP_SECRET") or os.getenv("WECOM_SECRET")

        if not corp_id or not secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "企业微信密钥未配置"},
            )

        client = WeComContactClient(corp_id=corp_id, agent_id=agent_id, app_secret=secret)

        try:
            # 1. 用 code 换取 UserId
            user_info = await client.get_user_info_by_code(code)
            wecom_userid = user_info.get("userid") or user_info.get("UserId")

            if not wecom_userid:
                logger.error(f"无法从 code 获取 userid: {user_info}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"code": 401, "message": "企业微信授权失败: 未获取到用户信息"},
                )

            logger.info(f"企业微信授权成功, 获取到 UserId: {wecom_userid}")

            # 2. 查询本地数据库, 查找该 wecom_user_id 绑定的账号
            user_repo = UserRepository(session)
            user = user_repo.get_by_wecom_user_id(wecom_userid)

            if not user:
                logger.warning(f"企业微信用户 {wecom_userid} 尚未绑定系统账号")
                # 重定向到前端的一个绑定页面, 这里演示直接重定向到带有错误参数的登录页
                frontend_url = _resolve_frontend_url(request)
                return RedirectResponse(f"{frontend_url}/login?error=not_bound&userid={wecom_userid}")

            # 检查账号状态
            if not user.is_active():
                logger.warning(f"用户账号被禁用: {user.username}")
                frontend_url = _resolve_frontend_url(request)
                return RedirectResponse(f"{frontend_url}/login?error=account_disabled")

            # 3. 生成 JWT Token
            access_token = jwt_service.create_access_token(
                user_id=user.user_id,
                username=user.username,
                role=user.role.value,
                tenant_id=user.tenant_id,
            )
            refresh_token = jwt_service.create_refresh_token(user_id=user.user_id)

            # 4. 重定向回前端, 将 token 放在 URL 参数中传递给前端
            # 实际生产中可以存在 Cookie 或专门的中间页
            frontend_url = _resolve_frontend_url(request)
            redirect_url = (
                f"{frontend_url}/auth/wecom/callback?access_token={access_token}&refresh_token={refresh_token}"
            )

            logger.info(f"用户 {user.username} 企业微信登录成功")
            return RedirectResponse(redirect_url)

        except Exception as e:
            logger.error(f"企业微信回调处理异常: {str(e)}")
            frontend_url = _resolve_frontend_url(request)
            return RedirectResponse(f"{frontend_url}/login?error=auth_failed")


def _resolve_frontend_url(request: Request | None) -> str:
    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if frontend_url:
        return frontend_url.rstrip("/")

    if request is None:
        return "http://localhost:3000"

    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    forwarded_proto = request.headers.get("x-forwarded-proto") or ""

    host = forwarded_host.strip() or request.url.netloc
    scheme = forwarded_proto.strip() or request.url.scheme

    if host.startswith("localhost:5666") or host.startswith("127.0.0.1:5666"):
        return "http://localhost:3000"

    return f"{scheme}://{host}".rstrip("/")


__all__ = ["router"]
