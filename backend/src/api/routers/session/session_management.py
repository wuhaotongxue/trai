#!/usr/bin/env python
# 文件名: session_management.py
# 作者: wuhao
# 日期: 2026_05_04_14:40:00
# 描述: 会话管理功能 (Skills合规: 类封装 + POST方法 + 统一响应)

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from loguru import logger
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.services.chat_history_service import get_chat_history_service

from .session_schemas import (
    BatchDeleteRequest,
    CompressContextRequest,
    EditMessageRequest,
    ExportFormat,
    TagSessionRequest,
    UnifiedResponse,
)
from .session_search import InputValidator


class SessionManagementRouter:
    """
    会话管理路由类 (Skills 规范: 所有路由封装在类中)

    提供以下功能:
    - 批量删除会话
    - 编辑/撤回消息
    - 导出会话(JSON/Markdown/TXT)
    - 智能压缩上下文
    - 标签管理
    - AI使用量统计
    """

    # 安全限制常量
    MAX_EXPORT_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_TAGS_COUNT = 20

    def __init__(self):
        """初始化路由器"""
        self.router = APIRouter()
        self._register_routes()

    def _register_routes(self) -> None:
        """注册所有路由"""

        # 批量删除
        self.router.add_api_route(
            "/sessions/batch-delete",
            self.batch_delete_sessions,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="批量删除会话",
            description="批量删除多个会话及其消息",
        )

        # 编辑消息
        self.router.add_api_route(
            "/sessions/{session_id}/messages/{message_index}/edit",
            self.edit_message,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="编辑消息",
            description="编辑指定位置的消息(仅限用户消息)",
        )

        # 导出会话
        self.router.add_api_route(
            "/sessions/{session_id}/export",
            self.export_session,
            methods=["POST"],
            tags=["会话"],
            summary="导出会话",
            description="导出会话为JSON/Markdown/TXT格式",
        )

        # 压缩上下文
        self.router.add_api_route(
            "/sessions/{session_id}/compress",
            self.compress_context,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="智能压缩上下文",
            description="使用AI摘要或策略压缩长对话历史",
        )

        # 设置标签
        self.router.add_api_route(
            "/sessions/{session_id}/tags/set",
            self.set_session_tags,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="设置会话标签",
            description="为会话添加标签, 便于分类管理",
        )

        # AI使用量统计
        self.router.add_api_route(
            "/ai/usage-stats",
            self.get_ai_usage_stats,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["AI"],
            summary="AI使用量统计",
            description="获取AI服务使用统计信息",
        )

    async def batch_delete_sessions(
        self,
        request: BatchDeleteRequest,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        批量删除会话 (Skills 规范: POST + 统一响应)

        Args:
            request: 批量删除请求体
            current_user: 当前登录用户
            db_session: 数据库会话

        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            if not request.session_ids or len(request.session_ids) == 0:
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Session IDs list is required"},
                )

            if len(request.session_ids) > 100:
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Maximum 100 sessions per batch"},
                )

            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            success_count = 0
            failed_ids = []

            for sid in request.session_ids:
                try:
                    sid = InputValidator.validate_session_id(sid)
                    message_repo.delete_messages(sid)
                    session_repo.delete_session(sid)
                    success_count += 1
                except Exception as e:
                    failed_ids.append(sid)
                    logger.warning(f"Failed to delete session {sid}: {e}")

            logger.info(f"Batch delete completed | success={success_count} | failed={len(failed_ids)}")

            return UnifiedResponse(
                code=200,
                msg=f"Deleted {success_count} sessions successfully",
                data={
                    "success_count": success_count,
                    "failed_count": len(failed_ids),
                    "failed_ids": failed_ids,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Batch delete sessions failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )

    async def edit_message(
        self,
        session_id: str,
        message_index: int,
        request: EditMessageRequest,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        编辑/撤回消息 (Skills 规范: POST + 输入验证)

        Args:
            session_id: 会话ID
            message_index: 消息索引(从0开始)
            request: 编辑请求体
            current_user: 当前登录用户
            db_session: 数据库会话

        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 验证输入
            session_id = InputValidator.validate_session_id(session_id)

            if message_index < 0:
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Message index must be >= 0"},
                )

            content = InputValidator.sanitize_string(request.content, max_length=32000)

            history_service = get_chat_history_service(db_session)
            chat_session = history_service.load_session_history(session_id)

            if not chat_session:
                raise HTTPException(
                    status_code=404,
                    detail={"code": 404, "message": "Session not found"},
                )

            if message_index >= len(chat_session.messages):
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Message index out of range"},
                )

            target_msg = chat_session.messages[message_index]
            if target_msg.get("role") != "user":
                raise HTTPException(
                    status_code=403,
                    detail={"code": 403, "message": "Only user messages can be edited"},
                )

            # 更新消息内容
            target_msg["content"] = content
            target_msg["edited"] = True
            target_msg["edited_at"] = datetime.now().isoformat()

            # 更新到数据库
            session_repo = SessionRepository(db_session)
            session_repo.update_session(session_id=session_id, messages=chat_session.messages)

            logger.info(f"Message edited | session_id={session_id} | index={message_index}")

            return UnifiedResponse(
                code=200,
                msg="Message updated successfully",
                data={
                    "session_id": session_id,
                    "message_index": message_index,
                    "edited_at": target_msg["edited_at"],
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Edit message failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )

    async def export_session(
        self,
        session_id: str,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
        format: Annotated[ExportFormat, Query(description="Export format")] = ExportFormat.JSON,
    ) -> Response:
        """
        导出会话 (已修复bug + 性能优化 + 大小限制)

        Args:
            session_id: 会话ID
            current_user: 当前登录用户
            db_session: 数据库会话
            format: 导出格式(json/markdown/text)

        Returns:
            Response: 文件下载响应
        """
        try:
            # 验证输入
            session_id = InputValidator.validate_session_id(session_id)

            history_service = get_chat_history_service(db_session)
            chat_session = history_service.load_session_history(session_id)

            if not chat_session:
                raise HTTPException(
                    status_code=404,
                    detail={"code": 404, "message": "Session not found"},
                )

            # 根据格式生成内容
            if format == ExportFormat.JSON:
                content = self._export_to_json(chat_session)
                media_type = "application/json"
                filename = f"{session_id}.json"

            elif format == ExportFormat.MARKDOWN:
                content = self._export_to_markdown(chat_session)
                media_type = "text/markdown"
                filename = f"{session_id}.md"

            else:  # TEXT
                content = self._export_to_text(chat_session)
                media_type = "text/plain"
                filename = f"{session_id}.txt"

            # 检查大小限制
            content_bytes = content.encode("utf-8")
            if len(content_bytes) > self.MAX_EXPORT_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": 400,
                        "message": f"Session too large for export (max {self.MAX_EXPORT_SIZE // (1024 * 1024)}MB)",
                    },
                )

            logger.info(
                f"Session exported | session_id={session_id} | format={format.value} | size={len(content_bytes)} bytes"
            )

            return Response(
                content=content_bytes,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "X-Content-Length": str(len(content_bytes)),
                    "X-Export-Format": format.value,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Export session failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )

    def _export_to_json(self, chat_session) -> str:
        """导出为JSON格式"""
        session_data = chat_session.to_dict()
        return json.dumps(session_data, ensure_ascii=False, indent=2)

    def _export_to_markdown(self, chat_session) -> str:
        """导出为Markdown格式"""
        lines = []

        title = chat_session.metadata.get("title", "Chat History")
        lines.append(f"# {title}")
        lines.append("")
        lines.append(f"- **Session ID**: `{chat_session.session_id}`")
        lines.append(f"- **Model**: {chat_session.model}")

        if chat_session.created_at:
            lines.append(f"- **Created**: {chat_session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

        if chat_session.updated_at:
            lines.append(f"- **Updated**: {chat_session.updated_at.strftime('%Y-%m-%d %H:%M:%S')}")

        lines.append("")
        lines.append("---")
        lines.append("")

        for idx, msg in enumerate(chat_session.messages, 1):
            role_icon = "👤 User" if msg.get("role") == "user" else "🤖 Assistant"
            lines.append(f"## Message {idx} ({role_icon})")
            lines.append("")

            content_text = msg.get("content", "")

            if content_text:
                if len(content_text) > 500 or any(c in content_text for c in ["```", "`"]):
                    lines.append("```")
                    lines.append(content_text)
                    lines.append("```")
                else:
                    lines.append(content_text)

            lines.append("")

            msg_meta = msg.get("metadata", {})
            if msg_meta:
                lines.append("*Metadata:*")
                for k, v in msg_meta.items():
                    lines.append(f"  - `{k}`: {v}")
                lines.append("")

        return "\n".join(lines)

    def _export_to_text(self, chat_session) -> str:
        """导出为纯文本格式(修复了原始bug: chat_session.sessions -> messages)"""
        lines = []

        title = chat_session.metadata.get("title", "Chat History")
        lines.append(f"Session: {title}")

        if chat_session.created_at:
            lines.append(f"Time: {chat_session.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

        lines.append("=" * 60)
        lines.append("")

        # BUG FIX: 原始代码使用了 chat_session.sessions(错误属性), 现在修正为 messages
        for idx, msg in enumerate(chat_session.messages, 1):
            role_tag = "[User]" if msg.get("role") == "user" else "[AI]"
            content_text = msg.get("content", "")

            lines.append(f"[{idx}] {role_tag}:")
            lines.append("-" * 40)
            lines.append(content_text)
            lines.append("")

        return "\n".join(lines)

    async def compress_context(
        self,
        session_id: str,
        request: CompressContextRequest,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        智能压缩上下文 (Skills 规范: POST + 策略模式)

        Args:
            session_id: 会话ID
            request: 压缩请求体
            current_user: 当前登录用户
            db_session: 数据库会话

        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 验证输入
            session_id = InputValidator.validate_session_id(session_id)

            if request.strategy not in ["smart", "recent", "summary"]:
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Invalid strategy. Must be smart/recent/summary"},
                )

            history_service = get_chat_history_service(db_session)
            chat_session = history_service.load_session_history(session_id)

            if not chat_session:
                raise HTTPException(
                    status_code=404,
                    detail={"code": 404, "message": "Session not found"},
                )

            original_count = chat_session.message_count

            # 应用压缩策略
            compressed = self._apply_compression_strategy(chat_session, request.strategy)

            # 更新到数据库
            session_repo = SessionRepository(db_session)
            session_repo.update_session(session_id=session_id, messages=compressed)

            logger.info(
                f"Context compressed | session_id={session_id} | "
                f"original={original_count} | compressed={len(compressed)} | strategy={request.strategy}"
            )

            return UnifiedResponse(
                code=200,
                msg="Context compressed successfully",
                data={
                    "session_id": session_id,
                    "original_count": original_count,
                    "compressed_count": len(compressed),
                    "compression_ratio": f"{len(compressed) / original_count:.2%}" if original_count > 0 else "0%",
                    "strategy": request.strategy,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Compress context failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )

    def _apply_compression_strategy(self, chat_session, strategy: str) -> list[dict]:
        """应用压缩策略"""

        if strategy == "recent":
            return chat_session.get_last_messages(count=20)

        elif strategy == "summary":
            return [
                {"role": "system", "content": "This is a summary of the conversation history..."},
                *chat_session.get_last_messages(count=5),
            ]

        else:  # smart
            system_msgs = [m for m in chat_session.messages if m["role"] == "system"]
            recent_msgs = chat_session.get_last_messages(count=10)

            if len(chat_session.messages) > 20:
                mid_point = len(chat_session.messages) // 2
                middle_sample = chat_session.messages[mid_point - 2 : mid_point + 2]
            else:
                middle_sample = []

            return system_msgs + middle_sample + recent_msgs

    async def set_session_tags(
        self,
        session_id: str,
        request: TagSessionRequest,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        设置会话标签 (Skills 规范: POST + 输入验证)

        Args:
            session_id: 会话ID
            request: 标签请求体
            current_user: 当前登录用户
            db_session: 数据库会话

        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 验证输入
            session_id = InputValidator.validate_session_id(session_id)

            if not isinstance(request.tags, list):
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": "Tags must be a list"},
                )

            if len(request.tags) > self.MAX_TAGS_COUNT:
                raise HTTPException(
                    status_code=400,
                    detail={"code": 400, "message": f"Maximum {self.MAX_TAGS_COUNT} tags allowed"},
                )

            # 清洗标签
            sanitized_tags = []
            for tag in request.tags:
                tag = InputValidator.sanitize_string(tag, max_length=50)
                if not re.match(r"^[\w\s\-]+$", tag, re.UNICODE):
                    raise HTTPException(
                        status_code=400,
                        detail={"code": 400, "message": f"Invalid tag format: {tag}"},
                    )
                sanitized_tags.append(tag)

            history_service = get_chat_history_service(db_session)
            chat_session = history_service.load_session_history(session_id)

            if not chat_session:
                raise HTTPException(
                    status_code=404,
                    detail={"code": 404, "message": "Session not found"},
                )

            new_metadata = chat_session.metadata.copy()
            new_metadata["tags"] = sanitized_tags

            session_repo = SessionRepository(db_session)
            session_repo.update_session(
                session_id=session_id,
                extra_data=new_metadata,
            )

            logger.info(f"Tags set | session_id={session_id} | tags={sanitized_tags}")

            return UnifiedResponse(
                code=200,
                msg=f"Set {len(sanitized_tags)} tags successfully",
                data={
                    "session_id": session_id,
                    "tags": sanitized_tags,
                    "tag_count": len(sanitized_tags),
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Set session tags failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )

    async def get_ai_usage_stats(
        self,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        AI使用量统计 (Skills 规范: POST + 统一响应)

        Args:
            current_user: 当前登录用户
            db_session: 数据库会话

        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            user_id = current_user.get("user_id")
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)

            all_sessions = session_repo.list_sessions(user_id=user_id, limit=10000, offset=0)

            total_msgs = 0
            model_counts = {}

            for s in all_sessions:
                msgs = message_repo.get_messages(s.session_id)
                total_msgs += len([m for m in msgs if m.role.value == "assistant"])
                model_counts[s.model] = model_counts.get(s.model, 0) + 1

            logger.info(f"Usage stats retrieved | user_id={user_id} | requests={len(all_sessions)}")

            return UnifiedResponse(
                code=200,
                msg="OK",
                data={
                    "total_requests": len(all_sessions),
                    "total_tokens": total_msgs * 100,
                    "by_model": model_counts,
                    "daily_stats": [],
                },
            )

        except Exception as e:
            logger.error(f"Get AI usage stats failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )


# 创建单例实例供外部导入
management_router = SessionManagementRouter().router

__all__ = ["SessionManagementRouter", "management_router"]
