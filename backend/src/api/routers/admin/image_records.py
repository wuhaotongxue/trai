#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_records.py
# 作者: wuhao
# 日期: 2026_05_20_0830
# 描述: AI 图片记录管理接口，支持多条件查询、增删改查


from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser, CurrentUserOptional
from infrastructure.database import get_db_session
from infrastructure.repositories.image_record_repository import ImageRecordRepository


router = APIRouter()


class ImageRecordResponse(BaseModel):
    """图片记录响应"""

    task_id: str = Field(description="任务 ID")
    record_type: str = Field(description="记录类型")
    user_id: str = Field(description="用户 ID")
    username: str | None = Field(description="用户名")
    client_ip: str | None = Field(description="客户端 IP")
    request_ip: str | None = Field(description="请求来源 IP")
    is_guest: bool = Field(description="是否游客")
    tenant_id: str | None = Field(description="租户 ID")
    prompt: str = Field(description="提示词")
    source_image_url: str | None = Field(description="源图片 URL")
    result_url: str | None = Field(description="结果图片 URL")
    model: str | None = Field(description="模型名称")
    status: str = Field(description="任务状态")
    error_message: str | None = Field(description="错误信息")
    width: int = Field(description="宽度")
    height: int = Field(description="高度")
    steps: int = Field(description="采样步数")
    seed: int = Field(description="随机种子")
    session_id: str | None = Field(description="会话 ID")
    trace_id: str | None = Field(description="链路追踪 ID")
    feishu_notified: bool = Field(description="是否已发送飞书通知")
    notify_status: str = Field(description="通知状态")
    created_at: str = Field(description="创建时间")
    updated_at: str = Field(description="更新时间")
    completed_at: str | None = Field(description="完成时间")
    extra_data: dict[str, Any] = Field(default_factory=dict, description="扩展数据")


class ImageRecordListResponse(BaseModel):
    """图片记录列表响应"""

    records: list[ImageRecordResponse] = Field(description="图片记录列表")
    total: int = Field(description="总数")
    page: int = Field(description="当前页")
    page_size: int = Field(description="每页数量")


class ImageRecordUpdateRequest(BaseModel):
    """图片记录更新请求（管理员）"""

    prompt: str | None = Field(default=None, description="提示词")
    status: str | None = Field(default=None, description="状态")
    error_message: str | None = Field(default=None, description="错误信息")


class ImageRecordStatsResponse(BaseModel):
    """图片记录统计响应"""

    total: int = Field(description="总记录数")
    completed: int = Field(description="已完成")
    failed: int = Field(description="失败")
    pending: int = Field(description="等待中")
    processing: int = Field(description="处理中")
    text_to_image_count: int = Field(description="文生图数量")
    image_to_image_count: int = Field(description="图生图数量")
    image_edit_count: int = Field(description="图片编辑数量")


def _entity_to_response(entity: Any) -> ImageRecordResponse:
    """Entity 转响应"""
    return ImageRecordResponse(
        task_id=entity.task_id,
        record_type=entity.record_type.value,
        user_id=entity.user_id,
        username=entity.username or None,
        client_ip=entity.client_ip or None,
        request_ip=entity.request_ip or None,
        is_guest=entity.is_guest,
        tenant_id=entity.tenant_id or None,
        prompt=entity.prompt,
        source_image_url=entity.source_image_url or None,
        result_url=entity.result_url or None,
        model=entity.model or None,
        status=entity.status.value,
        error_message=entity.error_message or None,
        width=entity.width,
        height=entity.height,
        steps=entity.steps,
        seed=entity.seed,
        session_id=entity.session_id or None,
        trace_id=entity.trace_id or None,
        feishu_notified=entity.feishu_notified,
        notify_status=entity.notify_status,
        created_at=entity.created_at.isoformat() if entity.created_at else "",
        updated_at=entity.updated_at.isoformat() if entity.updated_at else "",
        completed_at=entity.completed_at.isoformat() if entity.completed_at else None,
        extra_data=entity.extra_data or {},
    )


def _get_client_ip(request: Request) -> str:
    """从请求中提取真实 IP（支持代理）"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host or ""
    return ""


@router.get("/admin/image-records", response_model=ImageRecordListResponse, tags=["管理"])
async def list_image_records(
    request: Request,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    keyword: Annotated[str | None, Query(description="搜索关键词（task_id/用户名/prompt）")] = None,
    record_type: Annotated[str | None, Query(description="记录类型: text_to_image/image_to_image/image_edit")] = None,
    status: Annotated[str | None, Query(description="任务状态: pending/processing/completed/failed")] = None,
    user_id: Annotated[str | None, Query(description="用户 ID")] = None,
    start_date: Annotated[str | None, Query(description="开始日期 ISO 格式")] = None,
    end_date: Annotated[str | None, Query(description="结束日期 ISO 格式")] = None,
    page: Annotated[int, Query(ge=1, description="页码")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="每页数量")] = 20,
) -> ImageRecordListResponse:
    """获取图片记录列表（管理员）

    Args:
        request: HTTP 请求
        current_user: 当前登录用户
        session: 数据库会话
        keyword: 搜索关键词
        record_type: 记录类型
        status: 任务状态
        user_id: 用户 ID
        start_date: 开始日期
        end_date: 结束日期
        page: 页码
        page_size: 每页数量

    Returns:
        ImageRecordListResponse: 图片记录列表
    """
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问"})

    repo = ImageRecordRepository(session)
    offset = (page - 1) * page_size

    records, total = repo.admin_list(
        keyword=keyword or "",
        record_type=record_type,
        status=status,
        user_id=user_id or "",
        start_date=start_date or "",
        end_date=end_date or "",
        limit=page_size,
        offset=offset,
    )

    return ImageRecordListResponse(
        records=[_entity_to_response(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/image-records/stats", response_model=ImageRecordStatsResponse, tags=["管理"])
async def get_image_record_stats(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> ImageRecordStatsResponse:
    """获取图片记录统计（管理员）"""
    from sqlalchemy import func, select

    from infrastructure.database.models import ImageRecordModel

    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问"})

    stmt = (
        select(
            func.count(ImageRecordModel.t_id).label("total"),
            func.sum(func.case((ImageRecordModel.t_status == "completed", 1), else_=0)).label("completed"),
            func.sum(func.case((ImageRecordModel.t_status == "failed", 1), else_=0)).label("failed"),
            func.sum(func.case((ImageRecordModel.t_status == "pending", 1), else_=0)).label("pending"),
            func.sum(func.case((ImageRecordModel.t_status == "processing", 1), else_=0)).label("processing"),
            func.sum(func.case((ImageRecordModel.t_record_type == "text_to_image", 1), else_=0)).label("text_to_image"),
            func.sum(func.case((ImageRecordModel.t_record_type == "image_to_image", 1), else_=0)).label("image_to_image"),
            func.sum(func.case((ImageRecordModel.t_record_type == "image_edit", 1), else_=0)).label("image_edit"),
        ).where(ImageRecordModel.t_deleted_at.is_(None))
    )

    result = session.execute(stmt).first()

    return ImageRecordStatsResponse(
        total=result.total or 0,
        completed=result.completed or 0,
        failed=result.failed or 0,
        pending=result.pending or 0,
        processing=result.processing or 0,
        text_to_image_count=result.text_to_image or 0,
        image_to_image_count=result.image_to_image or 0,
        image_edit_count=result.image_edit or 0,
    )


@router.get("/admin/image-records/{task_id}", response_model=ImageRecordResponse, tags=["管理"])
async def get_image_record(
    task_id: str,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> ImageRecordResponse:
    """获取单条图片记录（管理员）"""
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问"})

    repo = ImageRecordRepository(session)
    record = repo.get_by_id(task_id)
    if record is None:
        raise HTTPException(status_code=404, detail={"code": 404, "message": "记录不存在"})

    return _entity_to_response(record)


@router.delete("/admin/image-records/{task_id}", tags=["管理"])
async def delete_image_record(
    task_id: str,
    request: Request,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> dict[str, Any]:
    """删除图片记录（管理员）"""
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问"})

    operator_id = current_user.get("user_id", "")
    operator_name = current_user.get("username", "admin")
    operator_ip = _get_client_ip(request)

    repo = ImageRecordRepository(session)
    success = repo.admin_delete(task_id, operator_id, operator_name, operator_ip)
    if not success:
        raise HTTPException(status_code=404, detail={"code": 404, "message": "记录不存在"})

    session.commit()
    return {"code": 200, "message": "删除成功", "task_id": task_id}


@router.delete("/admin/image-records", tags=["管理"])
async def batch_delete_image_records(
    request: Request,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    task_ids: Annotated[str, Query(description="逗号分隔的 task_id 列表")],
) -> dict[str, Any]:
    """批量删除图片记录（管理员）"""
    role = current_user.get("role", "normal")
    if role != "admin":
        raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问"})

    operator_id = current_user.get("user_id", "")
    operator_name = current_user.get("username", "admin")
    operator_ip = _get_client_ip(request)

    task_id_list = [tid.strip() for tid in task_ids.split(",") if tid.strip()]
    if not task_id_list:
        raise HTTPException(status_code=400, detail={"code": 400, "message": "task_ids 不能为空"})

    repo = ImageRecordRepository(session)
    count = repo.admin_batch_delete(task_id_list, operator_id, operator_name, operator_ip)
    session.commit()

    return {"code": 200, "message": f"批量删除成功，共删除 {count} 条记录", "deleted_count": count}


@router.get("/image-records/me", response_model=ImageRecordListResponse, tags=["AI"])
async def list_my_image_records(
    request: Request,
    current_user: CurrentUserOptional,
    session: Annotated[Session, Depends(get_db_session)],
    record_type: Annotated[str | None, Query(description="记录类型")] = None,
    page: Annotated[int, Query(ge=1, description="页码")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="每页数量")] = 20,
) -> ImageRecordListResponse:
    """获取当前用户的图片记录（登录用户）"""
    user_id = current_user.get("user_id", "") if current_user else ""
    if not user_id:
        raise HTTPException(status_code=401, detail={"code": 401, "message": "未登录"})

    repo = ImageRecordRepository(session)
    offset = (page - 1) * page_size
    records = repo.get_by_user(user_id, limit=page_size, offset=offset, record_type=record_type)

    return ImageRecordListResponse(
        records=[_entity_to_response(r) for r in records],
        total=len(records),
        page=page,
        page_size=page_size,
    )


__all__ = ["router"]
