#!/usr/bin/env python
# 文件名: email_config.py
# 作者: wuhao
# 日期: 2026_04_26_18:55:00
# 描述: 邮件配置管理 API

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select, update

from api.deps import AdminUser
from core.logger import get_logger
from infrastructure.database.database import get_db_session
from infrastructure.database.models import EmailConfigModel
from infrastructure.security.encryption import get_encryption_service

router = APIRouter()
logger = get_logger()


class EmailConfigCreate(BaseModel):
    """创建邮件配置"""

    config_name: str = Field(..., max_length=100, description="配置名称")
    host: str = Field(..., max_length=255, description="SMTP 服务器")
    port: int = Field(587, description="SMTP 端口")
    use_ssl: bool = Field(True, description="是否使用 SSL")
    username: str = Field(..., max_length=255, description="邮箱用户名")
    password: str = Field(..., max_length=255, description="邮箱密码/授权码")
    from_name: str = Field(..., max_length=100, description="发件人显示名称")
    to_emails: list[str] = Field(default_factory=list, description="默认收件人列表")
    is_active: bool = Field(True, description="是否启用")
    remark: str | None = Field(None, description="备注")


class EmailConfigUpdate(BaseModel):
    """更新邮件配置"""

    host: str | None = Field(None, max_length=255, description="SMTP 服务器")
    port: int | None = Field(None, description="SMTP 端口")
    use_ssl: bool | None = Field(None, description="是否使用 SSL")
    username: str | None = Field(None, max_length=255, description="邮箱用户名")
    password: str | None = Field(None, max_length=255, description="邮箱密码/授权码")
    from_name: str | None = Field(None, max_length=100, description="发件人显示名称")
    to_emails: list[str] | None = Field(None, description="默认收件人列表")
    is_active: bool | None = Field(None, description="是否启用")
    remark: str | None = Field(None, description="备注")


class EmailConfigResponse(BaseModel):
    """邮件配置响应"""

    id: int
    config_name: str
    host: str
    port: int
    use_ssl: bool
    username: str
    password_masked: str = "********"
    from_name: str
    to_emails: list[str]
    is_active: bool
    remark: str | None
    created_at: str
    updated_at: str


class EmailConfigListResponse(BaseModel):
    """邮件配置列表响应"""

    code: int = 200
    message: str = "success"
    data: list[EmailConfigResponse] = []
    total: int = 0


def mask_password(password: str) -> str:
    """掩码密码"""
    if len(password) <= 4:
        return "********"
    return password[:2] + "*" * (len(password) - 4) + password[-2:]


def model_to_response(model: EmailConfigModel) -> EmailConfigResponse:
    """模型转响应"""
    return EmailConfigResponse(
        id=model.t_id,
        config_name=model.t_config_name,
        host=model.t_host,
        port=model.t_port,
        use_ssl=model.t_use_ssl,
        username=model.t_username,
        password_masked=mask_password(model.t_password),
        from_name=model.t_from_name,
        to_emails=model.t_to_emails or [],
        is_active=model.t_is_active,
        remark=model.t_remark,
        created_at=model.t_created_at.strftime("%Y-%m-%d %H:%M:%S") if model.t_created_at else "",
        updated_at=model.t_updated_at.strftime("%Y-%m-%d %H:%M:%S") if model.t_updated_at else "",
    )


@router.get(
    "/email/configs",
    response_model=EmailConfigListResponse,
    summary="获取邮件配置列表",
    description="获取所有邮件配置列表",
    tags=["管理后台"],
)
async def list_email_configs(
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: AdminUser,
) -> dict[str, Any]:
    """获取邮件配置列表"""
    stmt = select(EmailConfigModel).order_by(EmailConfigModel.t_id.desc())
    result = db.execute(stmt)
    configs = result.scalars().all()

    return {
        "code": 200,
        "message": "success",
        "data": [model_to_response(c) for c in configs],
        "total": len(configs),
    }


@router.get(
    "/email/config/{config_id}",
    response_model=EmailConfigResponse,
    summary="获取邮件配置详情",
    description="根据 ID 获取邮件配置详情",
    tags=["管理后台"],
)
async def get_email_config(
    config_id: int,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: Annotated[AdminUser, Depends(AdminUser)],
) -> dict[str, Any]:
    """获取邮件配置详情"""
    stmt = select(EmailConfigModel).where(EmailConfigModel.t_id == config_id)
    result = db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "邮件配置不存在"},
        )

    return model_to_response(config)


@router.post(
    "/email/config",
    response_model=EmailConfigResponse,
    summary="创建邮件配置",
    description="创建新的邮件配置",
    tags=["管理后台"],
)
async def create_email_config(
    config_data: EmailConfigCreate,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: Annotated[AdminUser, Depends(AdminUser)],
    encryption_service: Annotated[Any, Depends(get_encryption_service)],
) -> dict[str, Any]:
    """创建邮件配置"""
    stmt = select(EmailConfigModel).where(EmailConfigModel.t_config_name == config_data.config_name)
    result = db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": "配置名称已存在"},
        )

    # 加密邮箱密码
    encrypted_password = encryption_service.encrypt(config_data.password)

    model = EmailConfigModel(
        t_config_name=config_data.config_name,
        t_host=config_data.host,
        t_port=config_data.port,
        t_use_ssl=config_data.use_ssl,
        t_username=config_data.username,
        t_password=encrypted_password,
        t_from_name=config_data.from_name,
        t_to_emails=config_data.to_emails,
        t_is_active=config_data.is_active,
        t_remark=config_data.remark,
        t_created_at=datetime.now(),
        t_created_by=admin_user.get("user_id"),
        t_updated_at=datetime.now(),
    )

    db.add(model)
    db.commit()
    db.refresh(model)

    logger.info(f"Email config created: {config_data.config_name} by {admin_user.get('username')}")

    return model_to_response(model)


@router.put(
    "/email/config/{config_id}",
    response_model=EmailConfigResponse,
    summary="更新邮件配置",
    description="更新邮件配置信息",
    tags=["管理后台"],
)
async def update_email_config(
    config_id: int,
    config_data: EmailConfigUpdate,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: Annotated[AdminUser, Depends(AdminUser)],
    encryption_service: Annotated[Any, Depends(get_encryption_service)],
) -> dict[str, Any]:
    """更新邮件配置"""
    stmt = select(EmailConfigModel).where(EmailConfigModel.t_id == config_id)
    result = db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "邮件配置不存在"},
        )

    update_data = config_data.model_dump(exclude_unset=True)
    if update_data:
        # 如果更新了密码,需要加密
        if "password" in update_data:
            update_data["t_password"] = encryption_service.encrypt(update_data.pop("password"))

        update_data["t_updated_at"] = datetime.now()
        update_data["t_updated_by"] = admin_user.get("user_id")

        stmt = update(EmailConfigModel).where(EmailConfigModel.t_id == config_id).values(**update_data)
        db.execute(stmt)
        db.commit()

        stmt = select(EmailConfigModel).where(EmailConfigModel.t_id == config_id)
        result = db.execute(stmt)
        config = result.scalar_one()

    logger.info(f"Email config updated: {config_id} by {admin_user.get('username')}")

    return model_to_response(config)


@router.delete(
    "/email/config/{config_id}",
    summary="删除邮件配置",
    description="删除邮件配置",
    tags=["管理后台"],
)
async def delete_email_config(
    config_id: int,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: Annotated[AdminUser, Depends(AdminUser)],
) -> dict[str, Any]:
    """删除邮件配置"""
    stmt = select(EmailConfigModel).where(EmailConfigModel.t_id == config_id)
    result = db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "邮件配置不存在"},
        )

    stmt = delete(EmailConfigModel).where(EmailConfigModel.t_id == config_id)
    db.execute(stmt)
    db.commit()

    logger.info(f"Email config deleted: {config_id} by {admin_user.get('username')}")

    return {
        "code": 200,
        "message": "删除成功",
    }


__all__ = ["router"]
