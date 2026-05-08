#!/usr/bin/env python
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: 会话管理接口 - 基础CRUD功能 (Skills合规: 单文件<=1500行)

from __future__ import annotations

import asyncio
import re
import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser, CurrentUserOptional
from core.context_manager import ContextManager, get_context_manager
from infrastructure.database import get_db_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.services.chat_history_service import get_chat_history_service


class InputValidator:
    """Input validation and sanitization utility class"""

    # Regex patterns for validation
    UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.IGNORECASE)
    SESSION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
    SAFE_STRING_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-_.@#$%^&*()+=\[\]{}|\\:";\'<>,.?/~`!]+$')

    @classmethod
    def validate_session_id(cls, session_id: str) -> str:
        """Validate and sanitize session ID

        Args:
            session_id: Session ID string

        Returns:
            Sanitized session ID

        Raises:
            HTTPException: If session ID is invalid
        """
        if not session_id or not isinstance(session_id, str):
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Session ID is required"})

        session_id = session_id.strip()

        if not (cls.UUID_PATTERN.match(session_id) or cls.SESSION_ID_PATTERN.match(session_id)):
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Invalid session ID format"})

        return session_id

    @classmethod
    def sanitize_string(cls, input_str: str, max_length: int = 32000) -> str:
        """Sanitize user input string to prevent XSS and injection attacks

        Args:
            input_str: User input string
            max_length: Maximum allowed length

        Returns:
            Sanitized string

        Raises:
            HTTPException: If input is too long
        """
        if not isinstance(input_str, str):
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Invalid input type, expected string"})

        sanitized = input_str.strip()

        if len(sanitized) > max_length:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": f"Input too long. Maximum length: {max_length} characters"},
            )

        return sanitized

    @classmethod
    def sanitize_message_content(cls, content: str) -> str:
        """Sanitize message content with special handling for code blocks

        Args:
            content: Message content

        Returns:
            Sanitized content
        """
        if not content:
            return ""

        content = cls.sanitize_string(content, max_length=32000)

        content = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", content)

        return content

    @classmethod
    def validate_date(cls, date_str: str) -> datetime:
        """Validate and parse date string

        Args:
            date_str: Date string in YYYY-MM-DD format

        Returns:
            Parsed datetime object

        Raises:
            HTTPException: If date format is invalid
        """
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Invalid date format. Use YYYY-MM-DD"})

    @classmethod
    def validate_tags(cls, tags: list[str]) -> list[str]:
        """Validate and sanitize tags

        Args:
            tags: List of tag strings

        Returns:
            Sanitized tag list

        Raises:
            HTTPException: If tags are invalid
        """
        if not isinstance(tags, list):
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Tags must be a list"})

        if len(tags) > 20:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Maximum 20 tags allowed"})

        sanitized_tags = []
        for tag in tags:
            if not isinstance(tag, str):
                raise HTTPException(status_code=400, detail={"code": 400, "message": "Each tag must be a string"})

            tag = tag.strip()
            if len(tag) < 1 or len(tag) > 50:
                raise HTTPException(
                    status_code=400, detail={"code": 400, "message": "Tag length must be between 1-50 characters"}
                )

            if not re.match(r"^[\w\s\-]+$", tag, re.UNICODE):
                raise HTTPException(status_code=400, detail={"code": 400, "message": f"Invalid tag format: {tag}"})

            sanitized_tags.append(tag)

        return sanitized_tags

    @classmethod
    def validate_pagination(cls, page: int, page_size: int) -> tuple[int, int]:
        """Validate pagination parameters

        Args:
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Tuple of validated (page, page_size)

        Raises:
            HTTPException: If parameters are invalid
        """
        if page < 1:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Page must be >= 1"})

        if page_size < 1 or page_size > 100:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "Page size must be between 1-100"})

        return page, page_size


router = APIRouter()


class CreateSessionRequest(BaseModel):
    """创建会话请求"""

    title: Annotated[str | None, Field(default=None, max_length=255, description="会话标题")] = None
    model: Annotated[str, Field(default="gpt-4o", description="模型名称")] = "gpt-4o"


class SessionItem(BaseModel):
    """会话项"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    message_count: int = Field(default=0, description="消息数量")
    created_at: str | None = Field(description="创建时间")
    updated_at: str | None = Field(description="更新时间")


class CreateSessionResponse(BaseModel):
    """创建会话响应"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    message: str = Field(default="会话创建成功", description="提示信息")


class SessionListResponse(BaseModel):
    """会话列表响应"""

    total: int = Field(description="会话总数")
    sessions: list[SessionItem] = Field(description="会话列表")


class SessionDetailResponse(BaseModel):
    """会话详情响应"""

    session_id: str = Field(description="会话唯一标识")
    title: str | None = Field(description="会话标题")
    model: str = Field(description="模型名称")
    messages: list[dict[str, Any]] = Field(description="消息列表")
    created_at: str | None = Field(description="创建时间")
    updated_at: str | None = Field(description="更新时间")


class SendMessageRequest(BaseModel):
    """发送消息请求"""

    content: Annotated[str, Field(min_length=1, max_length=32000, description="消息内容")]
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"


class SendMessageResponse(BaseModel):
    """发送消息响应"""

    session_id: str = Field(description="会话 ID")
    user_message: dict[str, Any] = Field(description="用户消息")
    assistant_message: dict[str, Any] = Field(description="助手回复")


class RenameSessionRequest(BaseModel):
    """重命名会话请求"""

    title: Annotated[str, Field(min_length=1, max_length=255, description="新标题")]


class ActionResponse(BaseModel):
    """操作响应"""

    message: str = Field(description="提示信息")


@router.post(
    "/sessions/{session_id}/messages",
    response_model=SendMessageResponse,
    tags=["会话"],
    summary="发送消息",
    description="向指定会话追加消息, 并返回助手回复.",
)
async def send_message(
    session_id: str,
    request: SendMessageRequest,
    current_user: CurrentUser,
    fastapi_request: Request,
    session: Annotated[Session, Depends(get_db_session)],
) -> SendMessageResponse:
    """发送消息(联动 AI 对话) - 使用 ChatHistoryService 实现持久化

    Args:
        session_id: 会话 ID
        request: 消息内容
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        SendMessageResponse: 发送结果

    Raises:
        HTTPException: 会话不存在(404)或无权访问(403)
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    history_service = get_chat_history_service(session)

    chat_session = history_service.load_session_history(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    if role != "admin" and chat_session.metadata.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    message_count_before = chat_session.message_count

    context_manager: ContextManager = get_context_manager()

    messages_dict = chat_session.to_ai_format()
    managed_messages, context_stats = context_manager.check_and_manage(messages_dict, session_id)

    try:
        from infrastructure.ai.openai_client import OpenAIClient

        ai_client = OpenAIClient()
        ai_response = await ai_client.chat(
            messages=managed_messages,
            model=chat_session.model or "gpt-4o",
        )

        user_msg_entity, assistant_msg_entity = history_service.save_conversation_turn(
            session_id=session_id,
            user_content=request.content,
            assistant_content=ai_response["content"],
        )

        if message_count_before == 0:
            title = request.content[:30] + ("..." if len(request.content) > 30 else "")
            history_service.update_session_title(session_id=session_id, title=title)

        logger.info(
            f"消息发送成功 | session_id={session_id} | "
            f"user_len={len(request.content)} | ai_len={len(ai_response['content'])}"
        )

        return SendMessageResponse(
            session_id=session_id,
            user_message=user_msg_entity.to_dict(),
            assistant_message=assistant_msg_entity.to_dict(),
        )

    except Exception as e:
        logger.error(f"AI 服务调用失败 | session_id={session_id} | error={e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": 502, "message": f"AI 服务调用失败: {str(e)}"},
        )


@router.post(
    "/sessions",
    response_model=CreateSessionResponse,
    tags=["会话"],
    summary="创建会话",
    description="创建一个新的会话, 用于后续多轮对话.",
)
async def create_session(
    request: CreateSessionRequest,
    current_user_opt: CurrentUserOptional,
    session: Annotated[Session, Depends(get_db_session)],
) -> CreateSessionResponse:
    """创建新会话

    Args:
        request: 创建会话参数
        current_user_opt: 可选当前登录用户
        session: 数据库会话

    Returns:
        CreateSessionResponse: 创建的会话信息
    """
    user_id = current_user_opt.get("user_id") if current_user_opt else None

    session_repo = SessionRepository(session)

    session_id = str(uuid.uuid4())
    title = request.title or "新对话"
    model = request.model

    db_session = session_repo.create_session(
        session_id=session_id,
        user_id=user_id,
        title=title,
        model=model,
    )

    return CreateSessionResponse(
        session_id=db_session.t_session_id,
        title=db_session.t_title,
        model=db_session.t_model,
        message="会话创建成功",
    )


@router.get(
    "/sessions",
    response_model=SessionListResponse,
    tags=["会话"],
    summary="会话列表",
    description="获取当前用户的会话列表.",
)
async def list_sessions(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> SessionListResponse:
    """获取当前用户的会话列表 - 使用领域实体

    Args:
        current_user: 当前登录用户
        session: 数据库会话
        limit: 每页数量
        offset: 偏移量

    Returns:
        SessionListResponse: 会话列表
    """
    user_id = current_user.get("user_id")

    session_repo = SessionRepository(session)
    message_repo = MessageRepository(session)

    session_entities = session_repo.list_sessions(
        user_id=user_id,
        limit=limit,
        offset=offset,
    )

    items = []
    for s in session_entities:
        messages = message_repo.get_messages(s.session_id)
        items.append(
            SessionItem(
                session_id=s.session_id,
                title=s.metadata.get("title"),
                model=s.model,
                message_count=len(messages),
                created_at=s.created_at.isoformat() if s.created_at else None,
                updated_at=s.updated_at.isoformat() if s.updated_at else None,
            )
        )

    return SessionListResponse(
        total=len(items),
        sessions=items,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=SessionDetailResponse,
    tags=["会话"],
    summary="会话详情",
    description="获取指定会话的详情与历史消息.",
)
async def get_session_detail(
    session_id: str,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> SessionDetailResponse:
    """获取会话详情 - 使用 ChatHistoryService 和领域实体

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        SessionDetailResponse: 会话详情

    Raises:
        HTTPException: 会话不存在(404)
    """
    user_id = current_user.get("user_id")

    history_service = get_chat_history_service(session)
    chat_session = history_service.load_session_history(session_id)

    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    role = current_user.get("role", "normal")
    if role != "admin" and chat_session.metadata.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权访问此会话"},
        )

    messages_dict = chat_session.messages

    return SessionDetailResponse(
        session_id=chat_session.session_id,
        title=chat_session.metadata.get("title"),
        model=chat_session.model,
        messages=messages_dict,
        created_at=chat_session.created_at.isoformat() if chat_session.created_at else None,
        updated_at=chat_session.updated_at.isoformat() if chat_session.updated_at else None,
    )


@router.post(
    "/sessions/{session_id}/rename",
    response_model=SessionItem,
    tags=["会话"],
    summary="重命名会话",
    description="更新指定会话的标题.",
)
async def rename_session(
    session_id: str,
    request: RenameSessionRequest,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
) -> SessionItem:
    """重命名会话标题 - 使用 ChatHistoryService

    Args:
        session_id: 会话 ID
        request: 新标题内容
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        SessionItem: 更新后的会话信息
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    history_service = get_chat_history_service(session)

    chat_session = history_service.load_session_history(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    if role != "admin" and chat_session.metadata.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权操作此会话"},
        )

    success = history_service.update_session_title(session_id=session_id, title=request.title)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": "会话更新失败"},
        )

    updated_session = history_service.load_session_history(session_id)
    message_repo = MessageRepository(session)
    messages = message_repo.get_messages(session_id)

    return SessionItem(
        session_id=updated_session.session_id,
        title=updated_session.metadata.get("title"),
        model=updated_session.model,
        message_count=len(messages),
        created_at=updated_session.created_at.isoformat() if updated_session.created_at else None,
        updated_at=updated_session.updated_at.isoformat() if updated_session.updated_at else None,
    )


@router.delete(
    "/sessions/{session_id}",
    response_model=ActionResponse,
    tags=["会话"],
    summary="删除会话",
    description="删除指定会话及其所有消息.",
)
async def delete_session(
    session_id: str,
    current_user: CurrentUser,
    db_session: Annotated[Session, Depends(get_db_session)],
) -> ActionResponse:
    """删除会话 - 使用 ChatHistoryService

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        db_session: 数据库会话

    Returns:
        ActionResponse: 删除结果

    Raises:
        HTTPException: 会话不存在(404)或无权访问(403)
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "normal")

    session_repo = SessionRepository(db_session)
    message_repo = MessageRepository(db_session)

    chat_session = session_repo.get_session(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    if role != "admin" and chat_session.t_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权操作此会话"},
        )

    message_repo.delete_messages(session_id)
    session_repo.delete_session(session_id)

    logger.info(f"会话已删除 | session_id={session_id}")

    return ActionResponse(message="会话删除成功")


_active_abort_events: dict[str, asyncio.Event] = {}


@router.post(
    "/sessions/{session_id}/abort",
    response_model=ActionResponse,
    tags=["会话"],
    summary="中止生成",
    description="中止正在进行的 AI 回复生成.",
)
async def abort_generation(
    session_id: str,
    current_user: CurrentUser,
    fastapi_request: Request,
    db_session: Annotated[Session, Depends(get_db_session)],
) -> ActionResponse:
    """中止 AI 生成

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        fastapi_request: FastAPI 请求对象
        db_session: 数据库会话

    Returns:
        ActionResponse: 中止结果
    """
    user_id = current_user.get("user_id")

    abort_event = _active_abort_events.get(session_id)
    if abort_event:
        abort_event.set()
        logger.info(f"AI 生成已中止 | session_id={session_id}")
        return ActionResponse(message="AI 生成已中止")

    return ActionResponse(message="没有正在进行的生成任务")


@router.post(
    "/sessions/{session_id}/confirm-action",
    response_model=ActionResponse,
    tags=["会话"],
    summary="确认操作",
    description="确认敏感操作(如删除,修改等).",
)
async def confirm_action(
    session_id: str,
    current_user: CurrentUser,
    db_session: Annotated[Session, Depends(get_db_session)],
) -> ActionResponse:
    """确认操作(示例端点)

    Args:
        session_id: 会话 ID
        current_user: 当前登录用户
        db_session: 数据库会话

    Returns:
        ActionResponse: 确认结果
    """
    success = True

    return ActionResponse(message="操作已确认" if success else "确认失败,请重试")


__all__ = ["router"]
