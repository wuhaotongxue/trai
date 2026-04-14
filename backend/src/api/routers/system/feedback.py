#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: feedback.py
# 作者: wuhao
# 日期: 2026-04-14 13:30:00
# 描述: 系统用户反馈 API

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any
from loguru import logger
from api.deps import get_current_user

router = APIRouter(prefix="/feedback", tags=["system", "feedback"])

class FeedbackRequest(BaseModel):
    """用户反馈请求模型"""
    type: str = Field(..., description="反馈类型 (bug/suggestion/other)")
    title: str = Field(..., description="反馈标题")
    content: str = Field(..., description="反馈内容")
    contact: str | None = Field(default=None, description="联系方式")

# 模拟的反馈数据存储
_MOCK_FEEDBACKS = []

@router.post("/submit", summary="提交用户反馈")
async def submit_feedback(
    request: FeedbackRequest,
    user: dict[str, Any] = Depends(get_current_user)
) -> Any:
    """提交一个用户反馈
    
    Args:
        request: 反馈内容
        user: 当前登录用户
        
    Returns:
        操作结果的统一响应
    """
    import uuid
    from datetime import datetime
    
    new_feedback = {
        "id": f"fb-{str(uuid.uuid4())[:8]}",
        "user_id": user.get("user_id"),
        "username": user.get("username"),
        "type": request.type,
        "title": request.title,
        "content": request.content,
        "contact": request.contact,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    _MOCK_FEEDBACKS.append(new_feedback)
    
    logger.info(f"User {user.get('user_id')} submitted feedback: {new_feedback['id']} ({request.type})")
    return {"code": 200, "msg": "反馈提交成功，感谢您的支持！", "data": {"feedback_id": new_feedback["id"]}}

@router.get("/list", summary="获取当前用户的反馈列表")
async def list_feedbacks(
    user: dict[str, Any] = Depends(get_current_user)
) -> Any:
    """获取当前用户提交的所有反馈
    
    Args:
        user: 当前登录用户
        
    Returns:
        包含反馈列表的统一响应
    """
    user_id = user.get("user_id")
    user_feedbacks = [fb for fb in _MOCK_FEEDBACKS if fb["user_id"] == user_id]
    
    return {"code": 200, "msg": "OK", "data": {"feedbacks": user_feedbacks}}
