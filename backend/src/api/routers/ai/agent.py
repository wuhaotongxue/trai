#!/usr/bin/env python
# 文件名: agent.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: Agent 工具调用路由

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser, CurrentUserOptional
from core.exceptions import ExternalServiceError
from infrastructure.agent.executor import AgentExecutor
from infrastructure.agent.tools.base import ExecutionContext
from infrastructure.agent.tools.loader import get_openai_tools_format
from infrastructure.agent.tools.registry import get_tool_registry

router = APIRouter()


class KnowledgeBaseSourceExtractor:
    """
    知识库检索结果来源提取器.

    Args:
        无.

    Returns:
        无.

    Raises:
        无.
    """

    @staticmethod
    def extract(nodes: list[Any]) -> list[dict[str, Any]]:
        """
        从百炼 Retrieve 返回的 nodes 中提取文件来源信息.

        Args:
            nodes: 百炼检索节点列表.

        Returns:
            list[dict[str, Any]]: 来源信息列表.

        Raises:
            无.
        """
        sources: list[dict[str, Any]] = []
        for idx, node in enumerate(nodes):
            raw: dict[str, Any] = {}
            to_map = getattr(node, "to_map", None)
            if callable(to_map):
                try:
                    raw = to_map()
                except Exception:
                    raw = {}

            text = getattr(node, "text", "") or raw.get("text", "")

            score = getattr(node, "score", None)
            if score is None:
                score = raw.get("score")

            file_name = (
                getattr(node, "title", None)
                or getattr(node, "file_name", None)
                or raw.get("title")
                or raw.get("file_name")
                or raw.get("source")
                or "unknown"
            )

            document_id = (
                getattr(node, "document_id", None)
                or getattr(node, "doc_id", None)
                or getattr(node, "file_id", None)
                or raw.get("document_id")
                or raw.get("doc_id")
                or raw.get("file_id")
                or raw.get("id")
            )

            chunk_id = getattr(node, "chunk_id", None) or raw.get("chunk_id") or raw.get("node_id")
            page = getattr(node, "page", None) or raw.get("page")

            sources.append(
                {
                    "index": idx + 1,
                    "file_name": str(file_name),
                    "document_id": str(document_id) if document_id is not None else None,
                    "chunk_id": str(chunk_id) if chunk_id is not None else None,
                    "page": page,
                    "score": score,
                    "snippet": (str(text)[:200] if text else ""),
                }
            )
        return sources


class AgentChatRequest(BaseModel):
    """Agent 对话请求"""

    session_id: Annotated[str, Field(description="会话 ID")]
    message: Annotated[str, Field(description="用户消息")]
    agent_id: Annotated[str | None, Field(default=None, description="指定 Agent ID")]
    knowledge_base_id: Annotated[str | None, Field(default=None, description="指定知识库 ID")]
    stream: Annotated[bool, Field(default=False, description="是否流式响应")]
    role: Annotated[str, Field(default="user", description="消息角色")] = "user"


class AgentChatResponse(BaseModel):
    """Agent 对话响应"""

    session_id: str = Field(description="会话 ID")
    content: str = Field(description="AI 最终回复")
    reasoning_content: str | None = Field(default=None, description="AI 思维链/推理过程")
    sources: list[dict[str, Any]] = Field(default_factory=list, description="知识库引用来源")
    steps: list[dict[str, Any]] = Field(description="执行步骤明细")
    total_turns: int = Field(description="总轮次")
    total_tokens: int = Field(description="总消耗 Token 数")
    total_duration_ms: int = Field(description="总耗时(毫秒)")
    trace_id: str = Field(description="链路追踪 ID")


@router.post(
    "/agent/chat",
    tags=["Agent"],
    summary="智能体对话",
    description="智能体对话入口, 支持工具调用与知识库检索, 可选流式输出.",
)
async def agent_chat(
    request: AgentChatRequest,
    current_user: CurrentUser,
) -> Any:
    """Agent 对话(支持多轮工具调用)

    支持 AI 自动调用工具(天气/搜索/翻译/计算等),
    多轮对话直到 AI 完成回答或达到最大轮数.

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
        agent_id=request.agent_id,
        knowledge_base_id=request.knowledge_base_id,
        trace_id=trace_id,
    )

    executor = AgentExecutor.get_instance()

    # == RAG: 若用户选择了知识库, 提前去百炼查一次并把结果拼到系统提示里 ==
    rag_context = ""
    rag_sources: list[dict[str, Any]] = []
    if request.knowledge_base_id:
        try:
            import asyncio

            from api.routers.admin.knowledge_base import KnowledgeBaseDemoService

            svc = KnowledgeBaseDemoService()
            client, m, wid = svc._create_bailian_client()
            req = m.RetrieveRequest(index_id=request.knowledge_base_id, query=request.message)

            def _do_retrieve():
                return client.retrieve(wid, req)

            res = await asyncio.to_thread(_do_retrieve)
            if res.body and res.body.data and res.body.data.nodes:
                rag_sources = KnowledgeBaseSourceExtractor.extract(res.body.data.nodes)
                rag_context = "\n\n以下是相关的知识库参考资料:\n"
                for i, node in enumerate(res.body.data.nodes):
                    rag_context += f"【资料 {i + 1}】\n{node.text}\n"
        except Exception as e:
            from loguru import logger

            logger.warning(f"RAG retrieve failed for kb {request.knowledge_base_id}: {e}")

    messages = []
    if rag_context:
        final_message = (
            "请结合以下参考资料回答我的问题. "
            "如果资料中没有相关信息, 请明确说明无法从知识库获取答案. "
            f"{rag_context}\n\n我的问题是: {request.message}"
        )
        messages.append({"role": "user", "content": final_message})
    else:
        messages.append({"role": "user", "content": request.message})

    result = await executor.execute(messages, context, stream=request.stream)

    if request.stream:
        # 如果是流式响应,executor.execute 会返回一个 AsyncGenerator
        from fastapi.responses import StreamingResponse

        async def event_generator():
            import json

            from loguru import logger

            try:
                async for event in result:
                    yield f"data: {json.dumps(event)}\n\n"
                if rag_sources:
                    yield f"data: {json.dumps({'type': 'sources', 'sources': rag_sources})}\n\n"
                yield "data: [DONE]\n\n"
            except ExternalServiceError as e:
                logger.warning(f"event_generator service error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            except Exception as e:
                logger.exception("Error in event_generator")
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

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
        sources=rag_sources,
        steps=result["steps"],
        total_turns=result["total_turns"],
        total_tokens=result["total_tokens"],
        total_duration_ms=result["total_duration_ms"],
        trace_id=trace_id,
    )


class ToolListResponse(BaseModel):
    """工具列表响应"""

    tools: list[dict[str, Any]] = Field(description="工具定义列表")


@router.get(
    "/agent/tools",
    response_model=ToolListResponse,
    tags=["Agent"],
    summary="工具列表",
    description="获取智能体可用工具列表.",
)
async def list_tools(
    current_user: CurrentUser,
) -> ToolListResponse:
    """获取可用工具列表

    返回所有已注册的工具定义,
    前端据此构建 AI 的工具选择界面.

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


@router.post(
    "/agent/tools/call",
    response_model=ToolCallResponse,
    tags=["Agent"],
    summary="调用工具",
    description="手动调用指定工具, 便于联调与排查.",
)
async def call_tool(
    request: ToolCallRequest,
    current_user: CurrentUser,
) -> ToolCallResponse:
    """手动调用指定工具

    不经过 AI,直接执行工具.
    用于前端手动触发特定工具.

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
    limit: int = Field(description="月度上限(0 表示无限制)")
    remaining: int = Field(description="剩余数量(无限制时为 0)")
    unlimited: bool = Field(description="是否无限制")
    billing_month: str = Field(description="账单月份")


class UserQuotaResponse(BaseModel):
    """用户配额响应"""

    user_id: str = Field(description="用户 ID")
    role: str = Field(description="用户角色")
    quotas: list[QuotaStatusResponse] = Field(description="各类型配额状态")


@router.get(
    "/agent/quota",
    response_model=UserQuotaResponse,
    tags=["Agent"],
    summary="配额信息",
    description="获取当前用户的智能体配额信息.",
)
async def get_user_quota(
    current_user_opt: CurrentUserOptional,
) -> UserQuotaResponse:
    """获取当前用户配额状态

    返回用户所有类型的月度配额使用情况.

    Args:
        current_user_opt: 可选当前登录用户

    Returns:
        UserQuotaResponse: 配额状态列表
    """
    from infrastructure.database import get_session
    from infrastructure.quota.quota_service import QuotaService
    from infrastructure.repositories.quota_repository import QuotaRepository

    user_id = current_user_opt.get("user_id", "") if current_user_opt else "guest"
    role = current_user_opt.get("role", "normal") if current_user_opt else "guest"

    if role == "guest":
        return UserQuotaResponse(
            user_id="guest",
            role="guest",
            quotas=[
                QuotaStatusResponse(
                    quota_type="agent_chat",
                    used=0,
                    limit=100,
                    remaining=100,
                    unlimited=False,
                    billing_month="N/A",
                )
            ],
        )

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
