#!/usr/bin/env python
# 文件名: contact_messages.py
# 作者: wuhao
# 日期: 2026_04_26_19:00:00
# 描述: 联系我们消息管理 API

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, select, update

from api.deps import AdminUser
from core.logger import get_logger
from infrastructure.database.database import get_db_session
from infrastructure.database.models import ContactMessageModel

router = APIRouter()
logger = get_logger()


class ContactMessageResponse(BaseModel):
    """联系我们消息响应"""

    id: int
    name: str
    email: str | None
    phone: str | None
    company: str | None
    type: str
    content: str
    attachment_urls: list[str]
    status: str
    reply_note: str | None
    ip_address: str | None
    created_at: str
    updated_at: str


class ContactMessageListResponse(BaseModel):
    """联系我们消息列表响应"""

    code: int = 200
    message: str = "success"
    data: list[ContactMessageResponse] = []
    total: int = 0


class UpdateContactStatusRequest(BaseModel):
    """更新消息状态"""

    status: str = Field(..., description="状态: pending/processed/replied")
    reply_note: str | None = Field(None, description="回复备注")


def model_to_response(model: ContactMessageModel) -> ContactMessageResponse:
    """模型转响应"""
    return ContactMessageResponse(
        id=model.t_id,
        name=model.t_name,
        email=model.t_email,
        phone=model.t_phone,
        company=model.t_company,
        type=model.t_type,
        content=model.t_content,
        attachment_urls=model.t_attachment_urls or [],
        status=model.t_status,
        reply_note=model.t_reply_note,
        ip_address=model.t_ip_address,
        created_at=model.t_created_at.strftime("%Y-%m-%d %H:%M:%S") if model.t_created_at else "",
        updated_at=model.t_updated_at.strftime("%Y-%m-%d %H:%M:%S") if model.t_updated_at else "",
    )


@router.get(
    "/contact/messages",
    response_model=ContactMessageListResponse,
    summary="获取联系我们消息列表",
    description="分页获取联系我们消息列表",
    tags=["管理后台"],
)
async def list_contact_messages(
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: AdminUser,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: str | None = Query(None, description="状态筛选"),
    contact_type: str | None = Query(None, alias="type", description="咨询类型筛选"),
) -> dict[str, Any]:
    """获取联系我们消息列表"""
    stmt = select(ContactMessageModel).order_by(ContactMessageModel.t_id.desc())

    if status:
        stmt = stmt.where(ContactMessageModel.t_status == status)
    if contact_type:
        stmt = stmt.where(ContactMessageModel.t_type == contact_type)

    count_stmt = select(ContactMessageModel)
    if status:
        count_stmt = count_stmt.where(ContactMessageModel.t_status == status)
    if contact_type:
        count_stmt = count_stmt.where(ContactMessageModel.t_type == contact_type)

    count_result = db.execute(count_stmt)
    total = len(count_result.scalars().all())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    result = db.execute(stmt)
    messages = result.scalars().all()

    return {
        "code": 200,
        "message": "success",
        "data": [model_to_response(m) for m in messages],
        "total": total,
    }


@router.get(
    "/contact/message/{message_id}",
    response_model=ContactMessageResponse,
    summary="获取联系我们消息详情",
    description="根据 ID 获取消息详情",
    tags=["管理后台"],
)
async def get_contact_message(
    message_id: int,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: AdminUser,
) -> dict[str, Any]:
    """获取联系我们消息详情"""
    stmt = select(ContactMessageModel).where(ContactMessageModel.t_id == message_id)
    result = db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "消息不存在"},
        )

    return model_to_response(message)


@router.put(
    "/contact/message/{message_id}/status",
    summary="更新消息状态",
    description="更新联系我们消息的处理状态",
    tags=["管理后台"],
)
async def update_contact_message_status(
    message_id: int,
    update_data: UpdateContactStatusRequest,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: AdminUser,
) -> dict[str, Any]:
    """更新消息状态"""
    stmt = select(ContactMessageModel).where(ContactMessageModel.t_id == message_id)
    result = db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "消息不存在"},
        )

    valid_statuses = ["pending", "processed", "replied"]
    if update_data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": 400, "message": f"状态必须是以下之一: {', '.join(valid_statuses)}"},
        )

    stmt = (
        update(ContactMessageModel)
        .where(ContactMessageModel.t_id == message_id)
        .values(
            t_status=update_data.status,
            t_reply_note=update_data.reply_note,
            t_updated_at=datetime.now(),
        )
    )
    db.execute(stmt)
    db.commit()

    logger.info(f"Contact message status updated: {message_id} -> {update_data.status} by {admin_user.get('username')}")

    return {
        "code": 200,
        "message": "更新成功",
    }


@router.delete(
    "/contact/message/{message_id}",
    summary="删除消息",
    description="删除联系我们消息",
    tags=["管理后台"],
)
async def delete_contact_message(
    message_id: int,
    db: Annotated[Any, Depends(get_db_session)],
    admin_user: AdminUser,
) -> dict[str, Any]:
    """删除消息"""
    stmt = select(ContactMessageModel).where(ContactMessageModel.t_id == message_id)
    result = db.execute(stmt)
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "消息不存在"},
        )

    stmt = delete(ContactMessageModel).where(ContactMessageModel.t_id == message_id)
    db.execute(stmt)
    db.commit()

    logger.info(f"Contact message deleted: {message_id} by {admin_user.get('username')}")

    return {
        "code": 200,
        "message": "删除成功",
    }


__all__ = ["router"]
