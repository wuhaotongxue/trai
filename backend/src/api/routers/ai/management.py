#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: management.py
# 作者: wuhao
# 日期: 2026_04_14_12:45:00
# 描述: 多 Agent 管理接口，负责智能体的注册、启动、停止和列表查询

from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from loguru import logger

from core.auth.jwt import get_current_user
from api.schemas.common import ResponseModel

router = APIRouter(prefix="/agent/management", tags=["AI Agent 管理"])


class AgentRegisterRequest(BaseModel):
    """注册 Agent 请求模型"""
    name: str = Field(..., description="Agent 名称")
    description: str = Field(..., description="Agent 描述")
    model: str = Field("gpt-4o", description="使用模型")
    system_prompt: str = Field(..., description="系统提示词")


class AgentToggleRequest(BaseModel):
    """启停 Agent 请求模型"""
    agent_id: str = Field(..., description="Agent ID")
    action: str = Field(..., description="操作: start / stop")


# 模拟内存中的 Agent 列表库
_MOCK_AGENTS = [
    {
        "id": "agent-001",
        "name": "代码助手",
        "description": "精通多种语言的代码编写和审查",
        "model": "gpt-4o",
        "status": "running",
        "created_at": "2026-04-10T10:00:00Z"
    },
    {
        "id": "agent-002",
        "name": "设计大师",
        "description": "专门负责文生图和图生图的提示词优化",
        "model": "claude-3-opus",
        "status": "stopped",
        "created_at": "2026-04-11T12:30:00Z"
    }
]


class AgentManagementAPI:
    """Agent 管理接口类"""

    @staticmethod
    @router.get("/list", summary="获取 Agent 列表")
    async def list_agents(
        user: dict[str, Any] = Depends(get_current_user)
    ) -> ResponseModel:
        """获取当前系统中注册的全部 Agent 列表
        
        Args:
            user: 当前登录用户
            
        Returns:
            ResponseModel: 包含 Agent 列表的统一响应
            
        Raises:
            Exception: 获取失败时抛出异常由全局异常处理
        """
        logger.info(f"User {user.get('user_id')} requested agent list")
        return ResponseModel(code=200, msg="OK", data={"agents": _MOCK_AGENTS})

    @staticmethod
    @router.post("/register", summary="注册新 Agent")
    async def register_agent(
        request: AgentRegisterRequest,
        user: dict[str, Any] = Depends(get_current_user)
    ) -> ResponseModel:
        """注册一个全新的 Agent
        
        Args:
            request: 注册参数
            user: 当前登录用户
            
        Returns:
            ResponseModel: 包含新 Agent 信息的统一响应
        """
        import uuid
        new_agent = {
            "id": f"agent-{str(uuid.uuid4())[:8]}",
            "name": request.name,
            "description": request.description,
            "model": request.model,
            "status": "stopped",
            "created_at": "2026-04-14T12:45:00Z"
        }
        _MOCK_AGENTS.append(new_agent)
        logger.info(f"User {user.get('user_id')} registered a new agent: {request.name}")
        return ResponseModel(code=200, msg="OK", data=new_agent)

    @staticmethod
    @router.post("/toggle", summary="启停 Agent")
    async def toggle_agent(
        request: AgentToggleRequest,
        user: dict[str, Any] = Depends(get_current_user)
    ) -> ResponseModel:
        """启动或停止某个指定的 Agent
        
        Args:
            request: 启停参数
            user: 当前登录用户
            
        Returns:
            ResponseModel: 操作结果
        """
        target_agent = None
        for agent in _MOCK_AGENTS:
            if agent["id"] == request.agent_id:
                target_agent = agent
                break
                
        if not target_agent:
            logger.warning(f"User {user.get('user_id')} tried to toggle non-existent agent: {request.agent_id}")
            return ResponseModel(code=404, msg="Agent 不存在", data={})
            
        if request.action == "start":
            target_agent["status"] = "running"
        elif request.action == "stop":
            target_agent["status"] = "stopped"
        else:
            return ResponseModel(code=400, msg="非法操作，仅支持 start/stop", data={})
            
        logger.info(f"User {user.get('user_id')} toggled agent {request.agent_id} to {request.action}")
        return ResponseModel(code=200, msg="OK", data=target_agent)
