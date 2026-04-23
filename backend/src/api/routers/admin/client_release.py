#!/usr/bin/env python
# 文件名: client_release.py
# 作者: wuhao
# 日期: 2026_04_14_16:45:00
# 描述: 客户端发版管理接口

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.deps import AdminUser, CurrentUser
from core.logger import get_logger
from infrastructure.database import get_db_session, get_session
from infrastructure.database.models import ClientReleaseModel
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()


class ReleaseResponse(BaseModel):
    """发版结果响应"""

    version: str = Field(description="版本号")
    message: str = Field(description="提示信息")


class ReleaseListItem(BaseModel):
    """发版列表项"""

    id: int = Field(description="ID")
    version: str = Field(description="版本号")
    release_notes: str | None = Field(default=None, description="更新日志")
    created_at: str = Field(description="创建时间")
    installer_url: str | None = Field(default=None, description="下载链接")


class SessionGroupedItem(BaseModel):
    """按用户分组的会话统计项"""

    session_id: str = Field(description="会话ID")
    user_id: str = Field(description="用户ID")
    username: str = Field(description="用户名")
    display_name: str | None = Field(default=None, description="显示名称")
    email: str | None = Field(default=None, description="邮箱")
    sessions_count: int = Field(default=0, description="会话数量")
    messages_count: int = Field(default=0, description="消息数量")
    agent_calls: int = Field(default=0, description="Agent 调用次数")
    last_active: str | None = Field(default=None, description="最后活跃时间")
    status: str = Field(default="inactive", description="状态")


class SessionGroupedResponse(BaseModel):
    """按用户分组的会话统计响应"""

    total: int = Field(description="总数")
    sessions: list[SessionGroupedItem] = Field(description="会话列表")


@router.get("/client/releases", response_model=list[ReleaseListItem], summary="获取发版历史列表")
async def list_releases(
    current_user: CurrentUser,
    s3_service: S3StorageService = Depends(),
) -> list[ReleaseListItem]:
    """获取所有已发布的版本列表.

    Args:
        current_user: 当前管理员信息
        s3_service: S3 存储服务实例

    Returns:
        list[ReleaseListItem]: 包含版本号、更新日志及下载链接的列表
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可查看发版记录"},
        )

    db = get_session()
    try:
        stmt = select(ClientReleaseModel).order_by(ClientReleaseModel.t_created_at.desc())
        releases = db.execute(stmt).scalars().all()

        items = []
        for r in releases:
            # 优先使用静态代理 URL, 确保 EXE 可正常访问
            url = s3_service.get_file_url(r.t_installer_exe_key) if r.t_installer_exe_key else None

            items.append(
                ReleaseListItem(
                    id=r.t_id,
                    version=r.t_version,
                    release_notes=r.t_release_notes,
                    created_at=r.t_created_at.isoformat(),
                    installer_url=url,
                )
            )
        return items
    finally:
        db.close()


@router.post(
    "/client/release",
    response_model=ReleaseResponse,
    summary="发布新版本客户端",
    description="管理员发布新版本的 Electron 客户端并上传至 S3, 自动发送飞书和企微通知.",
)
async def release_client(
    version: Annotated[str, Form(..., description="版本号, 如 0.1.0")],
    latest_yml: Annotated[UploadFile, File(..., description="latest.yml 文件")],
    installer_exe: Annotated[UploadFile, File(..., description="安装包 exe 文件")],
    current_user: CurrentUser,
    s3_service: S3StorageService = Depends(),
    release_notes: str | None = Form(None, description="更新日志内容"),
) -> ReleaseResponse:
    """管理员发布新版本的 Electron 客户端并上传至 S3.

    Args:
        version: 版本号 (如 1.0.0)
        latest_yml: electron-builder 生成的 yml 配置文件
        installer_exe: 客户端安装包二进制文件
        current_user: 当前登录的管理员信息
        s3_service: S3 存储服务实例
        release_notes: 本次版本的更新日志

    Returns:
        ReleaseResponse: 包含版本号和成功提示的消息

    Raises:
        HTTPException: 权限不足、版本冲突或上传失败
    """
    # 简单权限校验
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可执行发布操作"},
        )

    db = get_session()
    try:
        # 检查版本号是否已存在
        stmt = select(ClientReleaseModel).where(ClientReleaseModel.t_version == version)
        result = db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": f"版本 {version} 已存在"},
            )
        # 1. 上传 latest.yml
        yml_content = await latest_yml.read()
        yml_key = f"releases/{version}/latest.yml"
        s3_service.upload_bytes(yml_content, yml_key, content_type="application/x-yaml")

        # 2. 上传 installer
        exe_content = await installer_exe.read()
        exe_key = f"releases/{version}/{installer_exe.filename}"
        s3_service.upload_bytes(exe_content, exe_key, content_type="application/x-msdownload")

        # 3. 记录到数据库
        new_release = ClientReleaseModel(
            t_version=version,
            t_release_notes=release_notes,
            t_latest_yml_key=yml_key,
            t_installer_exe_key=exe_key,
            t_created_by=current_user.get("user_id"),
        )
        db.add(new_release)
        db.commit()

        logger.info(f"用户 {current_user.get('user_id')} 成功发布客户端新版本 {version}")

        # 4. 发送通知 (飞书 & 企微)
        from application.usecases.release_client import ReleaseClientUseCase

        releaser = ReleaseClientUseCase()
        download_url = s3_service.get_file_url(exe_key)
        releaser._send_notifications(version, download_url, release_notes or "无更新日志")

        return ReleaseResponse(version=version, message="发布成功, 已通知飞书和企业微信")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发布客户端失败: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"发布客户端失败: {str(e)}"},
        )
    finally:
        db.close()


@router.get(
    "/sessions/grouped",
    response_model=SessionGroupedResponse,
    tags=["管理后台"],
    summary="获取按用户分组的会话统计",
    description="获取所有用户的会话统计信息, 用于管理后台会话记录页面.",
)
async def get_sessions_grouped_by_user(
    current_user: AdminUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> SessionGroupedResponse:
    """获取所有用户的会话统计信息

    Args:
        current_user: 管理员用户
        session: 数据库会话

    Returns:
        SessionGroupedResponse: 按用户分组的会话统计列表
    """
    from infrastructure.repositories.session_repository import SessionRepository
    from datetime import datetime, timedelta

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "仅管理员可查看"},
        )

    session_repo = SessionRepository(session)
    sessions = session_repo.list_sessions(user_id=None, limit=10000, offset=0)

    user_stats: dict[str, dict[str, Any]] = {}
    for s in sessions:
        uid = s.t_user_id or "guest"
        if uid not in user_stats:
            user_stats[uid] = {
                "user_id": uid,
                "username": uid[:8] if uid != "guest" else "游客",
                "display_name": uid[:8] if uid != "guest" else "游客",
                "email": None,
                "sessions_count": 0,
                "messages_count": 0,
                "agent_calls": 0,
                "last_active": None,
                "status": "inactive",
            }
        user_stats[uid]["sessions_count"] += 1
        if s.t_updated_at:
            last = user_stats[uid]["last_active"]
            if not last or s.t_updated_at.isoformat() > last:
                user_stats[uid]["last_active"] = s.t_updated_at.isoformat()
            if s.t_updated_at >= datetime.now() - timedelta(days=30):
                user_stats[uid]["status"] = "active"

    items = [
        SessionGroupedItem(
            session_id="",
            user_id=uid,
            username=stats["username"],
            display_name=stats["display_name"],
            email=stats["email"],
            sessions_count=stats["sessions_count"],
            messages_count=0,
            agent_calls=stats["agent_calls"],
            last_active=stats["last_active"],
            status=stats["status"],
        )
        for uid, stats in user_stats.items()
    ]

    return SessionGroupedResponse(total=len(items), sessions=items)
