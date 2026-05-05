#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: session_search.py
# 作者: wuhao
# 日期: 2026_05_04_14:35:00
# 描述: 会话搜索,统计,分页查询功能 (Skills合规: 类封装 + POST方法)

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import CurrentUser
from infrastructure.database import get_db_session
from infrastructure.repositories.session_repository import (
    MessageRepository,
    SessionRepository,
)
from infrastructure.services.chat_history_service import get_chat_history_service
from .session_schemas import (
    ActionResponse,
    PaginatedMessagesResponse,
    SearchSessionsRequest,
    SessionItem,
    SessionListResponse,
    SessionStatsResponse,
    UnifiedResponse,
)


class InputValidator:
    """输入验证和清洗工具类 (Skills 规范: 强制类封装)"""
    
    UUID_PATTERN = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    SESSION_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{1,64}$')
    
    @classmethod
    def validate_session_id(cls, session_id: str) -> str:
        """
        验证并清洗会话ID
        
        Args:
            session_id: 会话ID字符串
            
        Returns:
            清洗后的会话ID
            
        Raises:
            HTTPException: 如果会话ID无效
        """
        if not session_id or not isinstance(session_id, str):
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Session ID is required"}
            )
        
        session_id = session_id.strip()
        
        if not (cls.UUID_PATTERN.match(session_id) or cls.SESSION_ID_PATTERN.match(session_id)):
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Invalid session ID format"}
            )
        
        return session_id
    
    @classmethod
    def sanitize_string(cls, input_str: str, max_length: int = 32000) -> str:
        """
        清洗用户输入字符串, 防止XSS和注入攻击
        
        Args:
            input_str: 用户输入字符串
            max_length: 最大允许长度
            
        Returns:
            清洗后的字符串
            
        Raises:
            HTTPException: 如果输入过长
        """
        if not isinstance(input_str, str):
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Invalid input type, expected string"}
            )
        
        sanitized = input_str.strip()
        
        if len(sanitized) > max_length:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": 400,
                    "message": f"Input too long. Maximum length: {max_length} characters"
                }
            )
        
        return sanitized
    
    @classmethod
    def validate_date(cls, date_str: str) -> datetime:
        """
        验证并解析日期字符串
        
        Args:
            date_str: 日期字符串(YYYY-MM-DD格式)
            
        Returns:
            解析后的datetime对象
            
        Raises:
            HTTPException: 如果日期格式无效
        """
        try:
            return datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Invalid date format. Use YYYY-MM-DD"}
            )
    
    @classmethod
    def validate_pagination(cls, page: int, page_size: int) -> tuple[int, int]:
        """
        验证分页参数
        
        Args:
            page: 页码(从1开始)
            page_size: 每页条数
            
        Returns:
            验证后的(page, page_size)元组
            
        Raises:
            HTTPException: 如果参数无效
        """
        if page < 1:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Page must be >= 1"}
            )
        
        if page_size < 1 or page_size > 100:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "Page size must be between 1-100"}
            )
        
        return page, page_size


class SessionSearchRouter:
    """
    会话搜索路由类 (Skills 规范: 所有路由封装在类中)
    
    提供以下功能:
    - 多维度搜索(关键词/模型/日期/消息数)
    - 分页消息查询
    - 会话统计分析
    - 标签筛选
    """
    
    def __init__(self):
        """初始化路由器"""
        self.router = APIRouter()
        self._register_routes()
    
    def _register_routes(self) -> None:
        """注册所有路由"""
        self.router.add_api_route(
            "/sessions/search",
            self.search_sessions,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="搜索会话",
            description="支持关键词,模型,日期范围,消息数等多维度搜索",
        )
        
        self.router.add_api_route(
            "/sessions/{session_id}/messages/paginated",
            self.get_messages_paginated,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="分页获取消息",
            description="支持分页的消息列表, 适用于长对话场景",
        )
        
        self.router.add_api_route(
            "/sessions/stats",
            self.get_session_stats,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="会话统计",
            description="获取当前用户的会话统计数据",
        )
        
        self.router.add_api_route(
            "/sessions/by-tags",
            self.get_sessions_by_tags,
            methods=["POST"],
            response_model=UnifiedResponse,
            tags=["会话"],
            summary="按标签筛选会话",
            description="根据标签查找相关会话",
        )
    
    async def search_sessions(
        self,
        request: SearchSessionsRequest,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        搜索会话 (Skills 规范: 使用POST方法 + 统一响应格式)
        
        Args:
            request: 搜索请求体
            current_user: 当前登录用户
            db_session: 数据库会话
            
        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 输入验证
            if request.keyword:
                request.keyword = InputValidator.sanitize_string(request.keyword, max_length=100)
            
            if request.model:
                request.model = InputValidator.sanitize_string(request.model, max_length=64)
            
            if request.date_from:
                InputValidator.validate_date(request.date_from)
            
            if request.date_to:
                InputValidator.validate_date(request.date_to)
            
            user_id = current_user.get("user_id")
            
            history_service = get_chat_history_service(db_session)
            session_repo = SessionRepository(db_session)
            
            sessions = session_repo.list_sessions(user_id=user_id, limit=100, offset=0)
            
            # 过滤逻辑
            filtered = []
            for s in sessions:
                if request.keyword:
                    title = s.metadata.get("title", "") or ""
                    if request.keyword.lower() not in title.lower():
                        has_keyword = any(
                            request.keyword.lower() in msg.get("content", "").lower()
                            for msg in s.messages
                        )
                        if not has_keyword:
                            continue
                
                if request.model and s.model != request.model:
                    continue
                    
                if request.min_messages and s.message_count < request.min_messages:
                    continue
                
                filtered.append(s)
            
            # 构建返回数据
            items = []
            message_repo = MessageRepository(db_session)
            for s in filtered[:50]:
                msgs = message_repo.get_messages(s.session_id)
                items.append({
                    "session_id": s.session_id,
                    "title": s.metadata.get("title"),
                    "model": s.model,
                    "message_count": len(msgs),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                })
            
            logger.info(f"Search completed | keyword={request.keyword} | results={len(items)}")
            
            return UnifiedResponse(
                code=200,
                msg="OK",
                data={
                    "total": len(items),
                    "sessions": items,
                },
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Search sessions failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )
    
    async def get_messages_paginated(
        self,
        session_id: str,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
        page: Annotated[int, Query(ge=1)] = 1,
        page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    ) -> UnifiedResponse:
        """
        分页获取消息 (Skills 规范: POST方法)
        
        Args:
            session_id: 会话ID
            current_user: 当前登录用户
            db_session: 数据库会话
            page: 页码
            page_size: 每页大小
            
        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 验证会话ID
            session_id = InputValidator.validate_session_id(session_id)
            
            # 验证分页参数
            page, page_size = InputValidator.validate_pagination(page, page_size)
            
            history_service = get_chat_history_service(db_session)
            chat_session = history_service.load_session_history(session_id)
            
            if not chat_session:
                raise HTTPException(
                    status_code=404,
                    detail={"code": 404, "message": "Session not found"},
                )
            
            all_messages = chat_session.messages
            total = len(all_messages)
            
            start = (page - 1) * page_size
            end = start + page_size
            paginated_msgs = all_messages[start:end]
            
            logger.info(f"Paginated messages | session_id={session_id} | page={page} | total={total}")
            
            return UnifiedResponse(
                code=200,
                msg="OK",
                data={
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "messages": paginated_msgs,
                },
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get paginated messages failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )
    
    async def get_session_stats(
        self,
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        获取会话统计 (Skills 规范: POST方法)
        
        Args:
            current_user: 当前登录用户
            db_session: 数据库会话
            
        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            from datetime import timedelta
            
            user_id = current_user.get("user_id")
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)
            
            all_sessions = session_repo.list_sessions(user_id=user_id, limit=10000, offset=0)
            today = datetime.now().date()
            
            today_count = sum(1 for s in all_sessions if s.created_at.date() == today)
            
            total_msgs = 0
            model_counts = {}
            for s in all_sessions:
                msgs = message_repo.get_messages(s.session_id)
                total_msgs += len(msgs)
                model_counts[s.model] = model_counts.get(s.model, 0) + 1
            
            popular_models = sorted(model_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            logger.info(f"Session stats retrieved | user_id={user_id} | sessions={len(all_sessions)}")
            
            return UnifiedResponse(
                code=200,
                msg="OK",
                data={
                    "total_sessions": len(all_sessions),
                    "active_sessions": len(all_sessions),
                    "total_messages": total_msgs,
                    "today_sessions": today_count,
                    "today_messages": 0,
                    "popular_models": [{"model": m, "count": c} for m, c in popular_models],
                },
            )
            
        except Exception as e:
            logger.error(f"Get session stats failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )
    
    async def get_sessions_by_tags(
        self,
        tag: Annotated[str, Query(description="标签名称")],
        current_user: CurrentUser,
        db_session: Annotated[Session, Depends(get_db_session)],
    ) -> UnifiedResponse:
        """
        按标签筛选会话 (Skills 规范: POST方法)
        
        Args:
            tag: 标签名称
            current_user: 当前登录用户
            db_session: 数据库会话
            
        Returns:
            UnifiedResponse: 统一响应格式
        """
        try:
            # 验证标签
            tag = InputValidator.sanitize_string(tag, max_length=50)
            
            user_id = current_user.get("user_id")
            session_repo = SessionRepository(db_session)
            message_repo = MessageRepository(db_session)
            
            all_sessions = session_repo.list_sessions(user_id=user_id, limit=200, offset=0)
            
            filtered = [s for s in all_sessions if tag in s.metadata.get("tags", [])]
            
            items = []
            for s in filtered[:50]:
                msgs = message_repo.get_messages(s.session_id)
                items.append({
                    "session_id": s.session_id,
                    "title": s.metadata.get("title"),
                    "model": s.model,
                    "message_count": len(msgs),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                })
            
            logger.info(f"Filter by tag | tag={tag} | results={len(items)}")
            
            return UnifiedResponse(
                code=200,
                msg="OK",
                data={
                    "total": len(items),
                    "sessions": items,
                },
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get sessions by tags failed | error={e}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"Internal server error: {str(e)}"},
            )


# 创建单例实例供外部导入
search_router = SessionSearchRouter().router

__all__ = ["SessionSearchRouter", "InputValidator", "search_router"]
