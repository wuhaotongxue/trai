#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: agent.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: Agent 工具调用路由

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser
from infrastructure.agent.executor import AgentExecutor
from infrastructure.agent.tools.base import ExecutionContext
from infrastructure.agent.tools.registry import get_tool_registry
from infrastructure.agent.tools.loader import get_openai_tools_format

router = APIRouter()


class AgentChatRequest(BaseModel):
    """Agent 对话请求"""

    session_id: Annotated[str, Field(description="会话 ID")]
    message: Annotated[str, Field(description="用户消息")]
    stream: Annotated[bool, Field(default=False, description="是否流式响应")]
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"


class AgentChatResponse(BaseModel):
    """Agent 对话响应"""

    session_id: str = Field(description="会话 ID")
    content: str = Field(description="AI 最终回复")
    reasoning_content: str | None = Field(default=None, description="AI 思维链/推理过程")
    steps: list[dict[str, Any]] = Field(description="执行步骤明细")
    total_turns: int = Field(description="总轮次")
    total_tokens: int = Field(description="总消耗 Token 数")
    total_duration_ms: int = Field(description="总耗时（毫秒）")
    trace_id: str = Field(description="链路追踪 ID")


@router.post("/agent/chat", tags=["Agent"])
async def agent_chat(
    request: AgentChatRequest,
    current_user: CurrentUser,
) -> Any:
    """Agent 对话（支持多轮工具调用）

    支持 AI 自动调用工具（天气/搜索/翻译/计算等），
    多轮对话直到 AI 完成回答或达到最大轮数。

    Args:
        request: Agent 对话请求
        current_user: 当前登录用户

    Returns:
        AgentChatResponse: AI 回复及执行明细
    """
    user_id = current_user.get("user_id", "")
    role = current_user.get("role", "normal")

    trace_id = str(uuid.uuid4())

    context = ExecutionContext(
        user_id=user_id,
        user_role=role,
        session_id=request.session_id,
        trace_id=trace_id,
    )

    executor = get_agent_executor.get_instance()

    messages = [
        {"role": "user", "content": request.message},
    ]

    result = await executor.execute(messages, context, stream=request.stream)
    
    if request.stream:
        # 如果是流式响应，executor.execute 会返回一个 AsyncGenerator
        from fastapi.responses import StreamingResponse
        
        async def event_generator():
            import json
            async for event in result:
                # event is a dict containing type, content, etc.
                yield f"data: {json.dumps(event)}\n\n"
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    
    # 提取所有步骤中的思维链并拼接
    reasoning_parts = []
    for step in result.get("steps", []):
        rc = step.get("reasoning_content")
        if rc:
            reasoning_parts.append(rc)
            
    full_reasoning = "\n\n".join(reasoning_parts) if reasoning_parts else None

    return AgentChatResponse(
        session_id=request.session_id,
        content=result["final_content"],
        reasoning_content=full_reasoning,
        steps=result["steps"],
        total_turns=result["total_turns"],
        total_tokens=result["total_tokens"],
        total_duration_ms=result["total_duration_ms"],
        trace_id=trace_id,
    )


class ToolListResponse(BaseModel):
    """工具列表响应"""

    tools: list[dict[str, Any]] = Field(description="工具定义列表")


@router.get("/agent/tools", response_model=ToolListResponse, tags=["Agent"])
async def list_tools(
    current_user: CurrentUser,
) -> ToolListResponse:
    """获取可用工具列表

    返回所有已注册的工具定义，
    前端据此构建 AI 的工具选择界面。

    Args:
        current_user: 当前登录用户

    Returns:
        ToolListResponse: 工具列表
    """
    registry = get_tool_registry()
    user_role = current_user.get("role", "normal")
    definitions = registry.get_tools_for_user(user_role)
    tools = get_openai_tools_format(definitions)

    return ToolListResponse(tools=tools)


class ToolCallRequest(BaseModel):
    """手动工具调用请求"""

    tool_id: Annotated[str, Field(description="工具 ID")]
    params: dict[str, Any] = Field(default_factory=dict, description="工具参数")


class ToolCallResponse(BaseModel):
    """手动工具调用响应"""

    tool_id: str = Field(description="工具 ID")
    success: bool = Field(description="是否成功")
    output: str | None = Field(default=None, description="执行结果")
    error: str | None = Field(default=None, description="错误信息")
    duration_ms: int = Field(description="执行耗时")


@router.post("/agent/tools/call", response_model=ToolCallResponse, tags=["Agent"])
async def call_tool(
    request: ToolCallRequest,
    current_user: CurrentUser,
) -> ToolCallResponse:
    """手动调用指定工具

    不经过 AI，直接执行工具。
    用于前端手动触发特定工具。

    Args:
        request: 工具调用请求
        current_user: 当前登录用户

    Returns:
        ToolCallResponse: 执行结果
    """
    user_id = current_user.get("user_id", "")
    role = current_user.get("role", "normal")

    registry = get_tool_registry()
    tool = registry.get_tool(request.tool_id)

    if tool is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": 404, "message": f"工具不存在: {request.tool_id}"},
        )

    context = ExecutionContext(
        user_id=user_id,
        user_role=role,
    )

    from infrastructure.agent.tools.governor import get_tool_governor
    governor = get_tool_governor()
    result = await governor.execute(tool, request.params, context)

    return ToolCallResponse(
        tool_id=request.tool_id,
        success=result.success,
        output=result.output,
        error=result.error,
        duration_ms=result.duration_ms,
    )


class QuotaStatusResponse(BaseModel):
    """配额状态响应"""

    quota_type: str = Field(description="配额类型")
    used: int = Field(description="已使用数量")
    limit: int = Field(description="月度上限（0 表示无限制）")
    remaining: int = Field(description="剩余数量（无限制时为 0）")
    unlimited: bool = Field(description="是否无限制")
    billing_month: str = Field(description="账单月份")


class UserQuotaResponse(BaseModel):
    """用户配额响应"""

    user_id: str = Field(description="用户 ID")
    role: str = Field(description="用户角色")
    quotas: list[QuotaStatusResponse] = Field(description="各类型配额状态")


@router.get("/agent/quota", response_model=UserQuotaResponse, tags=["Agent"])
async def get_user_quota(
    current_user: CurrentUser,
) -> UserQuotaResponse:
    """获取当前用户配额状态

    返回用户所有类型的月度配额使用情况。

    Args:
        current_user: 当前登录用户

    Returns:
        UserQuotaResponse: 配额状态列表
    """
    from infrastructure.database import get_session
    from infrastructure.repositories.quota_repository import QuotaRepository
    from infrastructure.quota.quota_service import QuotaService

    user_id = current_user.get("user_id", "")
    role = current_user.get("role", "normal")

    db_session = get_session()
    quota_repo = QuotaRepository(db_session)
    quota_service = QuotaService(quota_repo)

    statuses = quota_service.get_user_quota_status(user_id, role)

    return UserQuotaResponse(
        user_id=user_id,
        role=role,
        quotas=[
            QuotaStatusResponse(
                quota_type=s.t_quota_type,
                used=s.t_used,
                limit=s.t_limit,
                remaining=s.t_remaining,
                unlimited=s.t_unlimited,
                billing_month=s.t_billing_month,
            )
            for s in statuses
        ],
    )


__all__ = ["router"]
