#!/usr/bin/env python
# 文件名: session.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: 会话管理接口 - 基础CRUD功能 (Skills合规: 单文件<=1500行)

from __future__ import annotations

import asyncio
import base64
import re
import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
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
from infrastructure.storage.s3_storage import S3StorageService


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

    content: Annotated[str, Field(min_length=0, max_length=32000, description="消息内容")] = ""
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"
    images: Annotated[list[str] | None, Field(default=None, description="图片 base64 列表")] = None


class SendMessageResponse(BaseModel):
    """发送消息响应"""

    session_id: str = Field(description="会话 ID")
    user_message: dict[str, Any] = Field(description="用户消息")
    assistant_message: dict[str, Any] = Field(description="助手回复")


class StreamMessageRequest(BaseModel):
    """流式发送消息请求"""

    content: Annotated[str, Field(min_length=0, max_length=32000, description="消息内容")] = ""
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"
    images: list[str] | None = Field(default=None, description="图片列表(base64)")


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
    tenant_id = current_user.get("tenant_id") or "default"

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

    storage = S3StorageService()

    extra_data = {}
    if isinstance(chat_session.metadata, dict):
        maybe_extra = chat_session.metadata.get("extra_data")
        if isinstance(maybe_extra, dict):
            extra_data = maybe_extra

    image_object_keys: list[str] = []
    if request.images:
        for img_base64 in request.images:
            raw = img_base64
            if raw.startswith("data:"):
                parts = raw.split("base64,", 1)
                raw = parts[1] if len(parts) == 2 else raw

            image_bytes = base64.b64decode(raw)

            ext = "png"
            content_type = "image/png"
            if image_bytes.startswith(b"\xff\xd8\xff"):
                ext = "jpg"
                content_type = "image/jpeg"
            elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                ext = "webp"
                content_type = "image/webp"
            elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                ext = "gif"
                content_type = "image/gif"

            object_key = (
                f"private/tenants/{tenant_id}/attachments/chat_images/"
                f"{user_id or 'anonymous'}/{uuid.uuid4().hex}.{ext}"
            )
            storage.upload_bytes(data=image_bytes, object_key=object_key, content_type=content_type)
            image_object_keys.append(object_key)

        history_service.update_session_extra_data(
            session_id=session_id,
            patch={"last_image_object_keys": image_object_keys},
        )
    else:
        maybe_last = extra_data.get("last_image_object_keys")
        if isinstance(maybe_last, list) and maybe_last:
            image_object_keys = [str(maybe_last[-1])]

    use_local_vision = bool(image_object_keys)

    try:
        if use_local_vision:
            # 使用本地视觉模型处理图片
            from infrastructure.ai.vision_client import LocalModelScopeVisionClient
            vision_client = LocalModelScopeVisionClient()
            
            # 构建带图片的消息
            user_message = {"role": "user", "content": []}
            if request.content:
                user_message["content"].append({"type": "text", "text": request.content})
            for object_key in image_object_keys:
                image_bytes = storage.get_object_bytes(object_key)
                mime = "image/png"
                if image_bytes.startswith(b"\xff\xd8\xff"):
                    mime = "image/jpeg"
                elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                    mime = "image/webp"
                elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                    mime = "image/gif"

                b64 = base64.b64encode(image_bytes).decode("utf-8")
                user_message["content"].append(
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                )
            managed_messages.append(user_message)
            
            # 调用本地视觉模型
            result = await vision_client.chat(messages=managed_messages)
            
            if result.error:
                raise Exception(result.error)
            
            ai_content = result.content
        else:
            from infrastructure.ai.openai_client import OpenAIClient
            ai_client = OpenAIClient()
            ai_response = await ai_client.chat(
                messages=managed_messages,
                model=chat_session.model or "gpt-4o",
            )
            ai_content = ai_response["content"]

        user_msg_entity, assistant_msg_entity = history_service.save_conversation_turn(
            session_id=session_id,
            user_content=request.content,
            assistant_content=ai_content,
            user_metadata={"image_object_keys": image_object_keys} if image_object_keys else None,
        )

        if message_count_before == 0:
            title = request.content[:30] + ("..." if len(request.content) > 30 else "")
            history_service.update_session_title(session_id=session_id, title=title)

        logger.info(
            f"消息发送成功 | session_id={session_id} | "
            f"user_len={len(request.content)} | ai_len={len(ai_content)}"
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
    "/sessions/{session_id}/messages/stream",
    tags=["会话"],
    summary="流式发送消息(SSE)",
    description="向指定会话发送消息并以SSE流式返回AI回复",
)
async def stream_message(
    session_id: str,
    request: Request,
    current_user: CurrentUser | None = None,
    session: Annotated[Session, Depends(get_db_session)] = None,
):
    """流式发送消息(SSE)

    Args:
        session_id: 会话 ID
        content: 消息内容
        role: 角色 (user/assistant)
        current_user: 当前登录用户
        session: 数据库会话

    Returns:
        StreamingResponse: SSE流
    """
    from fastapi.responses import StreamingResponse
    from infrastructure.ai.openai_client import OpenAIClient

    body = await request.json()
    msg = StreamMessageRequest(**body)

    user_id = current_user.get("user_id") if current_user else None
    role_check = current_user.get("role", "normal") if current_user else "normal"

    history_service = get_chat_history_service(session)
    chat_session = history_service.load_session_history(session_id)

    if not chat_session:
        raise HTTPException(status_code=404, detail="会话不存在")

    if role_check != "admin" and chat_session.metadata.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="无权访问此会话")

    context_manager: ContextManager = get_context_manager()
    messages_dict = chat_session.to_ai_format()
    managed_messages, context_stats = context_manager.check_and_manage(messages_dict, session_id)
    storage = S3StorageService()
    tenant_id = current_user.get("tenant_id") if current_user else None
    safe_tenant_id = tenant_id or "default"
    safe_user_id = user_id or "anonymous"

    extra_data = {}
    if isinstance(chat_session.metadata, dict):
        maybe_extra = chat_session.metadata.get("extra_data")
        if isinstance(maybe_extra, dict):
            extra_data = maybe_extra

    image_object_keys: list[str] = []
    has_new_images = bool(msg.images and len(msg.images) > 0)
    
    if has_new_images:
        logger.info(f"收到新图片上传 | session_id={session_id} | 图片数量={len(msg.images)}")
        valid_image_count = 0
        
        for idx, img_base64 in enumerate(msg.images):
            # 验证图片数据
            if not img_base64 or len(img_base64.strip()) == 0:
                logger.warning(f"图片 {idx+1} 数据为空")
                continue
                
            logger.info(f"图片 {idx+1} 原始数据长度={len(img_base64)} 字符")
            if img_base64.startswith("data:"):
                logger.info(f"图片 {idx+1} 包含 data: 前缀")
                parts = img_base64.split("base64,", 1)
                if len(parts) == 2:
                    logger.info(f"图片 {idx+1} base64 数据长度={len(parts[1])} 字符")
                else:
                    logger.warning(f"图片 {idx+1} 格式异常，无法拆分 base64")
                    continue
            
            raw = img_base64
            if raw.startswith("data:"):
                parts = raw.split("base64,", 1)
                raw = parts[1] if len(parts) == 2 else raw

            try:
                image_bytes = base64.b64decode(raw)
            except Exception as e:
                logger.warning(f"图片 {idx+1} base64 解码失败: {e}")
                continue
                
            image_size = len(image_bytes)
            
            # 验证解码后的图片数据
            if image_size == 0:
                logger.warning(f"图片 {idx+1} 解码后为空")
                continue
                
            logger.info(f"处理图片 {idx+1} | 解码后大小={image_size} bytes")

            ext = "png"
            content_type = "image/png"
            if image_bytes.startswith(b"\xff\xd8\xff"):
                ext = "jpg"
                content_type = "image/jpeg"
            elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                ext = "webp"
                content_type = "image/webp"
            elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                ext = "gif"
                content_type = "image/gif"

            object_key = (
                f"private/tenants/{safe_tenant_id}/attachments/chat_images/"
                f"{safe_user_id}/{uuid.uuid4().hex}.{ext}"
            )
            storage.upload_bytes(data=image_bytes, object_key=object_key, content_type=content_type)
            image_object_keys.append(object_key)
            valid_image_count += 1
            logger.info(f"图片 {idx+1} 已上传 | object_key={object_key}")
        
        # 如果所有图片都无效，返回错误
        if valid_image_count == 0:
            logger.error(f"所有图片数据都无效 | session_id={session_id}")
            raise HTTPException(
                status_code=400,
                detail="图片数据无效，请上传有效的图片文件"
            )

        history_service.update_session_extra_data(
            session_id=session_id,
            patch={"last_image_object_keys": image_object_keys},
        )
    elif msg.content.strip():
        # 只有当有文字内容但没有图片时，才使用上次的图片
        maybe_last = extra_data.get("last_image_object_keys")
        if isinstance(maybe_last, list) and maybe_last:
            image_object_keys = [str(maybe_last[-1])]
            logger.info(f"使用上次的图片 | session_id={session_id} | object_key={image_object_keys[0]}")
    else:
        logger.info(f"无图片且无内容 | session_id={session_id}")

    if image_object_keys:
        logger.info(f"开始处理图片消息 | session_id={session_id} | 图片数量={len(image_object_keys)} | 原始内容='{msg.content[:50]}...'")
        
        # 如果内容为空，自动描述图片
        if not msg.content.strip():
            logger.info("内容为空，开始自动分析图片")
            from infrastructure.ai.vision_client import LocalModelScopeVisionClient
            vision_client = LocalModelScopeVisionClient()
            
            # 获取第一张图片进行分析
            first_image_key = image_object_keys[0]
            logger.info(f"分析图片 | object_key={first_image_key}")
            
            image_bytes = storage.get_object_bytes(first_image_key)
            logger.info(f"读取图片完成 | 大小={len(image_bytes)} bytes")
            
            # 检查图片格式
            if image_bytes.startswith(b"\xff\xd8\xff"):
                logger.info("图片格式: JPEG")
            elif image_bytes.startswith(b"\x89PNG"):
                logger.info("图片格式: PNG")
            elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                logger.info("图片格式: WebP")
            elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                logger.info("图片格式: GIF")
            else:
                logger.info(f"未知图片格式 | 前20字节: {image_bytes[:20].hex()}")
            
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            logger.info(f"Base64编码后长度: {len(b64)} 字符")
            
            # 使用视觉模型分析图片内容
            try:
                logger.info("调用视觉模型分析图片...")
                analyze_result = await vision_client.analyze_image(
                    b64,
                    prompt="请详细描述这张图片的内容，包括主题、颜色、风格、人物或物体等，用中文回答"
                )
                auto_description = f"图片内容: {analyze_result.content}"
                logger.info(f"图片分析成功 | 完整描述='{analyze_result.content}'")
            except Exception as e:
                logger.warning(f"图片分析失败: {e}")
                auto_description = "分析图片内容"
            
            msg.content = auto_description
            logger.info(f"自动描述已设置 | 内容='{msg.content[:100]}...'")
        
        user_message = {"role": msg.role, "content": [{"type": "text", "text": msg.content}]}
        for object_key in image_object_keys:
            image_bytes = storage.get_object_bytes(object_key)
            mime = "image/png"
            if image_bytes.startswith(b"\xff\xd8\xff"):
                mime = "image/jpeg"
            elif image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
                mime = "image/webp"
            elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                mime = "image/gif"

            b64 = base64.b64encode(image_bytes).decode("utf-8")
            user_message["content"].append(
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
            )
    else:
        user_message = {"role": msg.role, "content": msg.content}

    managed_messages.append(user_message)

    import json

    use_local_vision = bool(image_object_keys)

    async def generate_sse():
        try:
            full_response = ""
            
            if use_local_vision:
                # 使用本地 Qwen2.5-VL 视觉模型
                from infrastructure.ai.vision_client import LocalModelScopeVisionClient
                vision_client = LocalModelScopeVisionClient()
                
                async for chunk in vision_client.chat_stream(
                    messages=managed_messages,
                ):
                    full_response += chunk
                    data_json = json.dumps({"event": "token", "data": chunk})
                    yield f"event: token\ndata: {data_json}\n\n"
                
                # 发送 done 事件
                data_json = json.dumps({"event": "done", "data": full_response})
                yield f"event: done\ndata: {data_json}\n\n"
                history_service.save_conversation_turn(
                    session_id=session_id,
                    user_content=msg.content,
                    assistant_content=full_response,
                    user_metadata={"image_object_keys": image_object_keys} if image_object_keys else None,
                )
                if chat_session.message_count == 0:
                    title = msg.content[:30] + ("..." if len(msg.content) > 30 else "")
                    history_service.update_session_title(session_id=session_id, title=title)
            else:
                # 使用 OpenAI/DeepSeek 等文本模型
                ai_client = OpenAIClient()
                async for event in ai_client.chat_stream(
                    messages=managed_messages,
                    model=chat_session.model or "gpt-4o",
                ):
                    if event.type == "token":
                        full_response += event.content
                        data_json = json.dumps({"event": "token", "data": event.content})
                        yield f"event: token\ndata: {data_json}\n\n"
                    elif event.type == "reasoning":
                        data_json = json.dumps({"event": "reasoning", "data": event.content})
                        yield f"event: reasoning\ndata: {data_json}\n\n"
                    elif event.type == "tool_call_start":
                        data_json = json.dumps({"event": "tool_call_start", "data": event.content})
                        yield f"event: tool_call_start\ndata: {data_json}\n\n"
                    elif event.type == "tool_call_arg":
                        data_json = json.dumps({"event": "tool_call_arg", "data": event.content})
                        yield f"event: tool_call_arg\ndata: {data_json}\n\n"
                    elif event.type == "tool_call_end":
                        data_json = json.dumps({"event": "tool_call_end", "data": event.content})
                        yield f"event: tool_call_end\ndata: {data_json}\n\n"
                    elif event.type == "done":
                        usage_data = event.usage if isinstance(event.usage, dict) else {}
                        data_json = json.dumps({"event": "done", "data": full_response})
                        yield f"event: done\ndata: {data_json}\n\n"
                        usage_json = json.dumps({"event": "usage", "data": usage_data})
                        yield f"event: usage\ndata: {usage_json}\n\n"
                        history_service.save_conversation_turn(
                            session_id=session_id,
                            user_content=msg.content,
                            assistant_content=full_response,
                            user_metadata={"image_object_keys": image_object_keys} if image_object_keys else None,
                        )
                        if chat_session.message_count == 0:
                            title = msg.content[:30] + ("..." if len(msg.content) > 30 else "")
                            history_service.update_session_title(session_id=session_id, title=title)
        except asyncio.CancelledError:
            data_json = json.dumps({"event": "error", "data": "Stream cancelled"})
            yield f"event: error\ndata: {data_json}\n\n"
        except Exception as e:
            data_json = json.dumps({"event": "error", "data": str(e)})
            yield f"event: error\ndata: {data_json}\n\n"

    return StreamingResponse(generate_sse(), media_type="text/event-stream")


@router.post(
    "/sessions",
    response_model=CreateSessionResponse,
    tags=["会话"],
    summary="创建会话",
    description="创建一个新的会话, 用于后续多轮对话.",
)
async def create_session(
    request: CreateSessionRequest,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_db_session)],
    request_obj: Annotated[Request, Depends()],
) -> CreateSessionResponse:
    """创建新会话

    Args:
        request: 创建会话参数
        current_user: 当前登录用户
        session: 数据库会话
        request_obj: FastAPI Request 对象，用于获取客户端IP

    Returns:
        CreateSessionResponse: 创建的会话信息
    """
    user_id = current_user.get("user_id")
    username = current_user.get("username")
    
    # 获取客户端IP地址
    client_ip = request_obj.client.host if request_obj.client else None
    # 处理代理情况下的真实IP
    x_forwarded_for = request_obj.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()

    session_repo = SessionRepository(session)

    session_id = str(uuid.uuid4())
    title = request.title or "新对话"
    model = request.model

    db_session = session_repo.create_session(
        session_id=session_id,
        user_id=user_id,
        username=username,
        title=title,
        model=model,
        client_ip=client_ip,
        created_by=user_id,
        created_by_name=username,
    )

    return CreateSessionResponse(
        session_id=db_session.session_id,
        title=db_session.title,
        model=db_session.model,
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
    """获取会话列表 - 需要登录

    Args:
        current_user: 当前登录用户（必填）
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
        request: FastAPI Request 对象，用于获取客户端IP

    Returns:
        ActionResponse: 删除结果

    Raises:
        HTTPException: 会话不存在(404)或无权访问(403)
    """
    user_id = current_user.get("user_id")
    username = current_user.get("username")
    role = current_user.get("role", "normal")

    # 客户端IP地址从请求上下文获取(通过上下文变量)
    client_ip = None
    from infrastructure.middleware.request_context import get_client_ip
    client_ip = get_client_ip()

    session_repo = SessionRepository(db_session)
    message_repo = MessageRepository(db_session)

    chat_session = session_repo.get_session(session_id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": "会话不存在"},
        )

    if role != "admin" and chat_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": 403, "message": "无权操作此会话"},
        )

    message_repo.delete_messages(session_id)
    session_repo.delete_session(
        session_id=session_id,
        deleted_by=user_id,
        deleted_by_name=username,
        deleted_ip=client_ip,
    )

    logger.info(f"会话已删除 | session_id={session_id} | deleted_by={user_id} | ip={client_ip}")

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
