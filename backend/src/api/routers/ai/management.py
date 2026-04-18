#!/usr/bin/env python
# 文件名: management.py
# 作者: wuhao
# 日期: 2026_04_14_12:45:00
# 描述: 多 Agent 管理接口,负责智能体的注册、启动、停止和列表查询

from typing import Any

from fastapi import APIRouter, Depends
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import get_current_user

router = APIRouter(prefix="/agent/management", tags=["AI Agent 管理"])


class AgentRegisterRequest(BaseModel):
    """注册 Agent 请求模型"""

    name: str = Field(..., description="Agent 名称")
    description: str = Field(..., description="Agent 描述")
    model: str = Field("gpt-4o", description="使用模型")
    system_prompt: str = Field(..., description="系统提示词")
    icon: str = Field("Bot", description="Agent 图标")


class AgentToggleRequest(BaseModel):
    """启停 Agent 请求模型"""

    agent_id: str = Field(..., description="Agent ID")
    action: str = Field(..., description="操作: start / stop")


class AgentCheckRequest(BaseModel):
    """检测 Agent 状态请求模型"""

    agent_id: str = Field(..., description="Agent ID")


class AgentUpdateRequest(BaseModel):
    """更新 Agent 请求模型"""

    agent_id: str = Field(..., description="Agent ID")
    name: str = Field(..., description="Agent 名称")
    description: str = Field(..., description="Agent 描述")
    model: str = Field(..., description="使用模型")
    system_prompt: str = Field(..., description="系统提示词")
    icon: str = Field(..., description="Agent 图标")


# 模拟内存中的 Agent 列表库
_MOCK_AGENTS = [
    {
        "id": "agent-default",
        "name": "默认",
        "description": "全能型助手，可以处理各种问题",
        "model": "gpt-4o",
        "system_prompt": "你是一个友好、专业的全能型 AI 助手。你可以回答各种问题，帮助用户解决困难。请用清晰、简洁、有帮助的方式回复。",
        "icon": "Bot",
        "status": "running",
        "created_at": "2026-04-10T10:00:00Z",
    },
    {
        "id": "agent-001",
        "name": "代码助手",
        "description": "精通多种语言的代码编写和审查",
        "model": "gpt-4o",
        "system_prompt": "你是一位精通多种编程语言的资深开发工程师。你可以帮助用户编写代码、调试问题、优化性能、审查代码。请给出专业、清晰、可运行的代码解决方案。",
        "icon": "Wrench",
        "status": "running",
        "created_at": "2026-04-10T10:00:00Z",
    },
    {
        "id": "agent-002",
        "name": "设计大师",
        "description": "专门负责文生图和图生图的提示词优化",
        "model": "claude-3-opus",
        "system_prompt": "你是一位创意设计大师，专门负责生成高质量的图像提示词。你擅长将用户的想法转化为详细、专业的 AI 绘画提示词，以生成精美的图像。",
        "icon": "Sparkles",
        "status": "stopped",
        "created_at": "2026-04-11T12:30:00Z",
    },
    {
        "id": "agent-calculator",
        "name": "计算器",
        "description": "专业的数学计算工具，可以处理各种数学问题",
        "model": "gpt-4o",
        "system_prompt": "你是一位专业的数学助手，专门帮助用户解决各种数学问题。你可以进行基本运算、代数计算、几何分析、统计计算等。请给出准确的计算结果和详细的解题过程。",
        "icon": "Calculator",
        "status": "running",
        "created_at": "2026-04-19T00:45:00Z",
    },
    {
        "id": "agent-weather",
        "name": "天气助手",
        "description": "专业的天气预报和气象信息查询助手",
        "model": "gpt-4o",
        "system_prompt": "你是天气查询助手。当用户问天气时，你必须使用 weather_current 工具来查询天气信息。你要从用户的问题里找出城市名，用这个城市名来调用天气工具。",
        "icon": "Cloud",
        "status": "running",
        "created_at": "2026-04-19T00:45:00Z",
    },
]


class AgentManagementAPI:
    """Agent 管理接口类"""

    @staticmethod
    @router.get("/list", summary="获取 Agent 列表")
    async def list_agents(user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """获取当前系统中注册的全部 Agent 列表

        Args:
            user: 当前登录用户

        Returns:
            包含 Agent 列表的统一响应

        Raises:
            Exception: 获取失败时抛出异常由全局异常处理
        """
        logger.info(f"User {user.get('user_id')} requested agent list")
        return {"code": 200, "msg": "OK", "data": {"agents": _MOCK_AGENTS}}

    @staticmethod
    @router.post("/register", summary="注册新 Agent")
    async def register_agent(request: AgentRegisterRequest, user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """注册一个全新的 Agent

        Args:
            request: 注册参数
            user: 当前登录用户

        Returns:
            包含新 Agent 信息的统一响应
        """
        import uuid

        new_agent = {
            "id": f"agent-{str(uuid.uuid4())[:8]}",
            "name": request.name,
            "description": request.description,
            "model": request.model,
            "system_prompt": request.system_prompt,
            "icon": request.icon,
            "status": "stopped",
            "created_at": "2026-04-14T12:45:00Z",
        }
        _MOCK_AGENTS.append(new_agent)

        logger.info(f"User {user.get('user_id')} registered new agent: {new_agent['id']}")
        return {"code": 200, "msg": "Agent 注册成功", "data": {"agent": new_agent}}

    @staticmethod
    @router.post("/toggle", summary="启停 Agent")
    async def toggle_agent(request: AgentToggleRequest, user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """启动或停止一个已注册的 Agent

        Args:
            request: 启停参数
            user: 当前登录用户

        Returns:
            操作结果的统一响应
        """
        target_agent = next((a for a in _MOCK_AGENTS if a["id"] == request.agent_id), None)
        if not target_agent:
            return {"code": 404, "msg": f"Agent {request.agent_id} 不存在"}

        if request.action not in ["start", "stop"]:
            return {"code": 400, "msg": "无效的操作指令,仅支持 start 或 stop"}

        target_agent["status"] = "running" if request.action == "start" else "stopped"

        logger.info(f"User {user.get('user_id')} toggled agent {request.agent_id} to {target_agent['status']}")
        return {
            "code": 200,
            "msg": f"Agent 已{'启动' if request.action == 'start' else '停止'}",
            "data": {"agent": target_agent},
        }

    @staticmethod
    @router.post("/check", summary="检测 Agent 状态")
    async def check_agent(request: AgentCheckRequest, user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """检测一个已注册的 Agent 状态是否正常

        Args:
            request: 检测参数
            user: 当前登录用户

        Returns:
            检测结果的统一响应
        """
        import asyncio
        import random

        target_agent = next((a for a in _MOCK_AGENTS if a["id"] == request.agent_id), None)
        if not target_agent:
            return {"code": 404, "msg": f"Agent {request.agent_id} 不存在"}

        # 模拟网络延迟
        await asyncio.sleep(0.5)

        # 模拟检测逻辑：如果 agent 是 stopped 状态，那必定是正常（因为它没在运行）
        # 如果是 running 状态，有 20% 的概率检测为异常
        is_normal = True
        if target_agent["status"] == "running":
            is_normal = random.random() > 0.2
            if not is_normal:
                target_agent["status"] = "error"

        logger.info(f"User {user.get('user_id')} checked agent {request.agent_id}, normal: {is_normal}")

        return {
            "code": 200,
            "msg": "检测完成" if is_normal else "检测到 Agent 运行异常",
            "data": {"agent": target_agent, "is_normal": is_normal},
        }

    @staticmethod
    @router.post("/update", summary="更新 Agent 信息")
    async def update_agent(request: AgentUpdateRequest, user: dict[str, Any] = Depends(get_current_user)) -> Any:
        """更新已注册的 Agent 信息

        Args:
            request: 更新参数
            user: 当前登录用户

        Returns:
            更新结果的统一响应
        """
        target_agent = next((a for a in _MOCK_AGENTS if a["id"] == request.agent_id), None)
        if not target_agent:
            return {"code": 404, "msg": f"Agent {request.agent_id} 不存在"}

        # 更新 Agent 信息
        target_agent["name"] = request.name
        target_agent["description"] = request.description
        target_agent["model"] = request.model
        target_agent["system_prompt"] = request.system_prompt
        target_agent["icon"] = request.icon

        logger.info(f"User {user.get('user_id')} updated agent {request.agent_id}")

        return {
            "code": 200,
            "msg": "Agent 更新成功",
            "data": {"agent": target_agent},
        }
