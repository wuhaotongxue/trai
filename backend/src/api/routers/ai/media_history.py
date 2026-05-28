#!/usr/bin/env python
# 文件名: media_history.py
# 作者: wuhao
# 日期: 2026_05_28_13:59:23
# 描述: Agent 媒体历史接口, 提供图片、音乐、视频历史查询与删除能力

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.services.media_history_service import MediaHistoryService

router = APIRouter()


class MediaHistoryUtils:
    """
    媒体历史工具类, 负责提取客户端 IP 等公共逻辑.
    """

    @staticmethod
    def get_client_ip(request: Request) -> str:
        """
        提取请求真实 IP.

        参数:
            request (Request): FastAPI 请求对象.

        返回值:
            str: 客户端 IP.

        异常:
            无.
        """
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host or ""
        return ""


class MediaHistoryListRequest(BaseModel):
    """
    媒体历史列表查询请求.
    """

    limit: int = Field(default=100, ge=1, le=200, description="单类媒体最大返回数量")
    include_deleted: bool = Field(default=False, description="是否包含已软删除记录")


class MediaHistoryDeleteRequest(BaseModel):
    """
    媒体历史删除请求.
    """

    media_type: str = Field(description="媒体类型, 支持 image/music/video")
    task_id: str = Field(description="任务 ID")


class MediaHistoryBatchDeleteRequest(BaseModel):
    """
    媒体历史批量删除请求.
    """

    media_type: str = Field(description="媒体类型, 支持 image/music/video")
    task_ids: list[str] = Field(min_length=1, description="任务 ID 列表")


class MediaHistoryItemResponse(BaseModel):
    """
    媒体历史条目响应.
    """

    task_id: str = Field(description="任务 ID")
    media_type: str = Field(description="媒体类型")
    prompt: str = Field(description="提示词")
    url: str | None = Field(default=None, description="主访问地址")
    public_url: str | None = Field(default=None, description="公共访问地址")
    object_key: str | None = Field(default=None, description="S3 对象键")
    status: str = Field(description="任务状态")
    model: str | None = Field(default=None, description="模型名称")
    created_at: str = Field(description="创建时间")
    updated_at: str = Field(description="更新时间")
    deleted_at: str | None = Field(default=None, description="软删除时间")
    meta: dict[str, Any] = Field(default_factory=dict, description="扩展元数据")


class MediaHistoryListResponse(BaseModel):
    """
    媒体历史列表响应.
    """

    images: list[MediaHistoryItemResponse] = Field(default_factory=list, description="图片历史")
    music: list[MediaHistoryItemResponse] = Field(default_factory=list, description="音乐历史")
    videos: list[MediaHistoryItemResponse] = Field(default_factory=list, description="视频历史")


class MediaHistoryRouter:
    """
    Agent 媒体历史路由类.
    """

    @staticmethod
    @router.post(
        "/media/history/list",
        response_model=MediaHistoryListResponse,
        summary="查询媒体历史",
        description="查询当前登录用户的图片、音乐、视频生成历史记录.",
        tags=["AI 能力"],
    )
    async def list_media_history(
        req: MediaHistoryListRequest,
        current_user: CurrentUser,
        session: Annotated[Session, Depends(get_db_session)],
    ) -> MediaHistoryListResponse:
        """
        查询当前用户的媒体历史记录.

        参数:
            req (MediaHistoryListRequest): 查询参数.
            current_user (CurrentUser): 当前登录用户.
            session (Session): 数据库会话.

        返回值:
            MediaHistoryListResponse: 分组后的历史记录.

        异常:
            无.
        """
        service = MediaHistoryService(session)
        records = service.list_user_media_records(
            user_id=str(current_user.get("user_id", "")),
            limit=req.limit,
            include_deleted=req.include_deleted,
        )
        return MediaHistoryListResponse(
            images=[MediaHistoryItemResponse(**item) for item in records["images"]],
            music=[MediaHistoryItemResponse(**item) for item in records["music"]],
            videos=[MediaHistoryItemResponse(**item) for item in records["videos"]],
        )

    @staticmethod
    @router.post(
        "/media/history/delete",
        summary="删除媒体历史",
        description="删除当前登录用户的一条图片、音乐或视频历史记录.",
        tags=["AI 能力"],
    )
    async def delete_media_history(
        req: MediaHistoryDeleteRequest,
        request: Request,
        current_user: CurrentUser,
        session: Annotated[Session, Depends(get_db_session)],
    ) -> dict[str, Any]:
        """
        删除单条媒体历史记录.

        参数:
            req (MediaHistoryDeleteRequest): 删除参数.
            request (Request): HTTP 请求对象.
            current_user (CurrentUser): 当前登录用户.
            session (Session): 数据库会话.

        返回值:
            dict[str, Any]: 删除结果.

        异常:
            HTTPException: 记录不存在时抛出.
        """
        service = MediaHistoryService(session)
        success = service.delete_media_record(
            media_type=req.media_type,
            task_id=req.task_id,
            user_id=str(current_user.get("user_id", "")),
            operator_ip=MediaHistoryUtils.get_client_ip(request),
        )
        if not success:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "记录不存在"})
        session.commit()
        return {"code": 200, "msg": "OK", "data": {"task_id": req.task_id}, "req_id": "", "ts": ""}

    @staticmethod
    @router.post(
        "/media/history/batch_delete",
        summary="批量删除媒体历史",
        description="批量删除当前登录用户的图片、音乐或视频历史记录.",
        tags=["AI 能力"],
    )
    async def batch_delete_media_history(
        req: MediaHistoryBatchDeleteRequest,
        request: Request,
        current_user: CurrentUser,
        session: Annotated[Session, Depends(get_db_session)],
    ) -> dict[str, Any]:
        """
        批量删除媒体历史记录.

        参数:
            req (MediaHistoryBatchDeleteRequest): 批量删除参数.
            request (Request): HTTP 请求对象.
            current_user (CurrentUser): 当前登录用户.
            session (Session): 数据库会话.

        返回值:
            dict[str, Any]: 删除结果.

        异常:
            无.
        """
        service = MediaHistoryService(session)
        count = service.batch_delete_media_records(
            media_type=req.media_type,
            task_ids=req.task_ids,
            user_id=str(current_user.get("user_id", "")),
            operator_ip=MediaHistoryUtils.get_client_ip(request),
        )
        session.commit()
        return {"code": 200, "msg": "OK", "data": {"deleted_count": count}, "req_id": "", "ts": ""}
