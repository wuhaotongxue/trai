#!/usr/bin/env python
# 文件名: executor.py
# 作者: wuhao
# 日期: 2026_04_10_09:21:00
# 描述: Agent 执行器 - 管理多轮工具调用循环,含自我纠错和配额控制

from __future__ import annotations

import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

from core.logger import logger
from core.token_counter import TokenCounter, get_token_counter
from infrastructure.agent.self_corrector import (
    SelfCorrector,
    get_self_corrector,
)
from infrastructure.agent.tools.base import (
    ExecutionContext,
    ToolCallResult,
)
from infrastructure.agent.tools.governor import get_tool_governor
from infrastructure.agent.tools.loader import (
    get_openai_tools_format,
    load_all_tools,
)
from infrastructure.agent.tools.registry import get_tool_registry
from infrastructure.ai.openai_client import OpenAIClient, StreamEvent


@dataclass
class AgentStep:
    """Agent 单轮执行结果"""

    turn: int
    assistant_message: str
    reasoning_content: str
    tool_calls: list[dict[str, Any]]
    tool_results: list[ToolCallResult]
    total_tokens: int
    duration_ms: int
    correction_info: dict[str, Any] | None = None


class AgentExecutor:
    """Agent 执行器 - 管理多轮工具调用循环,含自我纠错和配额控制"""

    MAX_TURNS = 10
    _instance: AgentExecutor | None = None

    def __init__(self) -> None:
        self._ai_client = OpenAIClient()
        self._governor = get_tool_governor()
        self._token_counter: TokenCounter = get_token_counter()
        self._self_corrector: SelfCorrector = get_self_corrector()
        self._quota_repository: Any = None
        self._quota_service: Any = None
        self._tools: list[dict[str, Any]] = []
        self._initialized = False

    def _ensure_quota(self) -> None:
        """延迟初始化配额服务"""
        if self._quota_repository is not None:
            return

        try:
            from infrastructure.database import get_session as _get_db_session
            from infrastructure.repositories.quota_repository import QuotaRepository

            db_session = _get_db_session()
            self._quota_repository = QuotaRepository(db_session)

            from infrastructure.quota.quota_service import QuotaService

            self._quota_service = QuotaService(self._quota_repository)
            logger.info("AgentExecutor 配额服务初始化完成")
        except Exception as e:
            logger.warning(f"配额服务初始化失败: {e}")

    def _ensure_initialized(self) -> None:
        """延迟初始化:加载工具"""
        if self._initialized:
            return

        definitions = load_all_tools()
        self._tools = get_openai_tools_format(definitions)
        logger.info(f"AgentExecutor 初始化 | 工具数: {len(self._tools)}")
        self._initialized = True

    async def execute(
        self,
        messages: list[dict[str, str]],
        context: ExecutionContext,
        stream: bool = False,
    ) -> Any:
        """执行 Agent 对话(支持多轮工具调用 + 自我纠错)

        Args:
            messages: 消息历史(含 system/user/assistant/tool 消息)
            context: 执行上下文
            stream: 是否流式响应

        Returns:
            dict | AsyncGenerator: 最终结果或流式生成器
        """
        self._ensure_initialized()
        self._ensure_quota()

        # 根据 agent_id 查找对应的系统提示词
        if context.agent_id:
            try:
                from api.routers.ai.management import _MOCK_AGENTS

                agent = next((a for a in _MOCK_AGENTS if a["id"] == context.agent_id), None)
                if agent:
                    # 检查是否已经有 system 消息
                    has_system_msg = len(messages) > 0 and messages[0]["role"] == "system"
                    if not has_system_msg:
                        # 在消息列表开头添加系统提示词
                        messages = [
                            {"role": "system", "content": agent["system_prompt"]},
                            *messages,
                        ]
                        logger.info(f"已设置 Agent {context.agent_id} 的系统提示词")
            except Exception as e:
                logger.warning(f"设置 Agent 系统提示词失败: {e}")

        if stream:
            return self._execute_stream(messages, context)

        steps: list[AgentStep] = []
        turn = 0
        total_tokens = 0
        start_ms = int(time.time() * 1000)
        current_messages = list(messages)

        while turn < self.MAX_TURNS:
            turn += 1
            turn_start = int(time.time() * 1000)

            logger.info(f"Agent Turn {turn} | user_id={context.user_id} | 消息数={len(current_messages)}")

            ai_response = await self._call_ai(current_messages)

            assistant_content = ai_response.get("content", "")
            reasoning_content = ai_response.get("reasoning_content", "")
            tool_calls = ai_response.get("tool_calls", [])
            usage = ai_response.get("usage", {})
            total_tokens += usage.get("total_tokens", 0)

            assistant_msg: dict[str, Any] = {
                "role": "assistant",
                "content": assistant_content,
            }
            if tool_calls:
                assistant_msg["tool_calls"] = tool_calls

            current_messages.append(assistant_msg)

            if not tool_calls:
                steps.append(
                    AgentStep(
                        turn=turn,
                        assistant_message=assistant_content,
                        reasoning_content=reasoning_content,
                        tool_calls=[],
                        tool_results=[],
                        total_tokens=total_tokens,
                        duration_ms=int(time.time() * 1000) - turn_start,
                    )
                )
                break

            tool_results: list[ToolCallResult] = []
            for tc in tool_calls:
                tool_call_id = tc.get("id", "")
                func = tc.get("function", {})
                tool_id = func.get("name", "")
                raw_args = func.get("arguments", "{}")

                import json

                logger.info(f"工具调用原始数据 | turn={turn} | tool_id={tool_id} | raw_args={repr(raw_args)}")

                try:
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception as e:
                    logger.warning(f"工具调用参数解析失败 | error={e}")
                    args = {}

                logger.info(f"工具调用解析后 | turn={turn} | tool_id={tool_id} | args={args}")

                tool_result = await self._execute_tool_with_correction(tool_id, tool_call_id, args, context)
                tool_results.append(tool_result)

                tool_content: str
                if not tool_result.success:
                    tool_content = f"[工具执行失败] {tool_result.error or '未知错误'}"
                else:
                    tool_content = tool_result.output or ""

                current_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call_id,
                        "content": tool_content,
                    }
                )

            steps.append(
                AgentStep(
                    turn=turn,
                    assistant_message=assistant_content,
                    reasoning_content=reasoning_content,
                    tool_calls=tool_calls,
                    tool_results=tool_results,
                    total_tokens=total_tokens,
                    duration_ms=int(time.time() * 1000) - turn_start,
                )
            )

        return {
            "final_content": current_messages[-1].get("content", ""),
            "steps": [
                {
                    "turn": s.turn,
                    "assistant_message": s.assistant_message,
                    "reasoning_content": s.reasoning_content,
                    "tool_calls": [
                        {
                            "id": tc.get("id"),
                            "function": tc.get("function", {}).get("name"),
                        }
                        for tc in s.tool_calls
                    ],
                    "tool_results": [
                        {
                            "tool_id": tr.tool_id,
                            "success": tr.success,
                            "output": tr.output,
                            "error": tr.error,
                            "duration_ms": tr.duration_ms,
                        }
                        for tr in s.tool_results
                    ],
                    "duration_ms": s.duration_ms,
                }
                for s in steps
            ],
            "total_turns": turn,
            "total_tokens": total_tokens,
            "total_duration_ms": int(time.time() * 1000) - start_ms,
        }

    async def _execute_stream(
        self,
        messages: list[dict[str, str]],
        context: ExecutionContext,
    ) -> AsyncIterator[dict[str, Any]]:
        """执行流式 Agent 对话"""
        # 根据 agent_id 查找对应的系统提示词
        if context.agent_id:
            try:
                from api.routers.ai.management import _MOCK_AGENTS

                agent = next((a for a in _MOCK_AGENTS if a["id"] == context.agent_id), None)
                if agent:
                    # 检查是否已经有 system 消息
                    has_system_msg = len(messages) > 0 and messages[0]["role"] == "system"
                    if not has_system_msg:
                        # 在消息列表开头添加系统提示词
                        messages = [
                            {"role": "system", "content": agent["system_prompt"]},
                            *messages,
                        ]
                        logger.info(f"[Stream] 已设置 Agent {context.agent_id} 的系统提示词")
            except Exception as e:
                logger.warning(f"[Stream] 设置 Agent 系统提示词失败: {e}")

        turn = 0
        current_messages = list(messages)

        while turn < self.MAX_TURNS:
            turn += 1
            logger.info(f"Agent Turn (Stream) {turn} | user_id={context.user_id}")

            stream_gen = await self._call_ai(current_messages, stream=True)

            assistant_content = ""
            reasoning_content = ""
            tool_calls: list[dict[str, Any]] = []

            import json

            async for event in stream_gen:
                # pass event to client
                yield {
                    "type": event.type,
                    "content": event.content,
                    "tool_call_id": event.tool_call_id,
                    "tool_name": event.tool_name,
                }

                if event.type == "token":
                    assistant_content += event.content
                elif event.type == "reasoning":
                    reasoning_content += event.content
                elif event.type == "tool_call_end":
                    # 检查是否已存在同 id 的 tool_call
                    existing_idx = next((i for i, tc in enumerate(tool_calls) if tc["id"] == event.tool_call_id), None)
                    if existing_idx is None:
                        # 不存在, 添加新的
                        logger.info(
                            f"[Stream] 添加 tool_call 到数组: id={event.tool_call_id}, name={event.tool_name}, args={repr(event.content)}"
                        )
                        tool_calls.append(
                            {
                                "id": event.tool_call_id,
                                "type": "function",
                                "function": {"name": event.tool_name, "arguments": event.content},
                            }
                        )
                    else:
                        # 已存在, 检查新 content 是否非空, 如果是就替换旧的(避免旧的是空参数! )
                        old_tc = tool_calls[existing_idx]
                        old_args = old_tc["function"]["arguments"]
                        if event.content and (not old_args or len(event.content) > len(old_args)):
                            logger.info(
                                f"[Stream] 替换 tool_call: id={event.tool_call_id} 的 args 从 {repr(old_args)} → {repr(event.content)}"
                            )
                            tool_calls[existing_idx] = {
                                "id": event.tool_call_id,
                                "type": "function",
                                "function": {"name": event.tool_name, "arguments": event.content},
                            }
                        else:
                            logger.warning(
                                f"[Stream] 跳过重复的 tool_call_id: id={event.tool_call_id} (新旧 args 相同或新 args 空)"
                            )

            assistant_msg: dict[str, Any] = {
                "role": "assistant",
                "content": assistant_content,
            }
            if tool_calls:
                assistant_msg["tool_calls"] = tool_calls

            current_messages.append(assistant_msg)

            if not tool_calls:
                break

            for tc in tool_calls:
                tool_call_id = tc.get("id", "")
                func = tc.get("function", {})
                tool_id = func.get("name", "")
                raw_args = func.get("arguments", "")

                # 过滤无效调用: tool_id 空,tool_call_id 空,raw_args 空
                if not tool_call_id or not tool_id or not raw_args:
                    logger.warning(
                        f"[Stream] 跳过无效的 tool_call: id={tool_call_id}, name={tool_id}, args={repr(raw_args)}"
                    )
                    continue

                logger.info(f"流式工具调用原始数据 | tool_id={tool_id} | raw_args={repr(raw_args)}")

                try:
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception as e:
                    logger.warning(f"流式工具调用参数解析失败 | error={e}")
                    args = {}

                logger.info(f"流式工具调用解析后 | tool_id={tool_id} | args={args}")

                # 通知客户端工具开始执行
                yield {
                    "type": "tool_execution_start",
                    "tool_call_id": tool_call_id,
                    "tool_name": tool_id,
                    "content": json.dumps(args, ensure_ascii=False),
                }

                tool_result = await self._execute_tool_with_correction(tool_id, tool_call_id, args, context)

                tool_content = (
                    tool_result.output if tool_result.success else f"[工具执行失败] {tool_result.error or '未知错误'}"
                )

                # 通知客户端工具执行结果
                res_payload = {
                    "type": "tool_execution_result",
                    "tool_call_id": tool_call_id,
                    "tool_name": tool_id,
                    "content": tool_content,
                    "success": tool_result.success,
                }
                if hasattr(tool_result, "sources") and tool_result.sources:
                    res_payload["data"] = {"sources": tool_result.sources}

                yield res_payload

                current_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call_id,
                        "content": tool_content,
                    }
                )

    async def _execute_tool_with_correction(
        self,
        tool_id: str,
        tool_call_id: str,
        args: dict[str, Any],
        context: ExecutionContext,
    ) -> ToolCallResult:
        """执行工具(含自我纠错)

        Args:
            tool_id: 工具 ID
            tool_call_id: 工具调用 ID
            args: 工具参数
            context: 执行上下文

        Returns:
            ToolCallResult: 执行结果
        """
        registry = get_tool_registry()
        tool = registry.get_tool(tool_id)

        if tool is None:
            return ToolCallResult(
                tool_call_id=tool_call_id,
                tool_id=tool_id,
                success=False,
                error=f"工具不存在: {tool_id}",
            )

        self._check_quota_before_call(context, tool_id)

        async def raw_execute() -> ToolCallResult:
            return await self._governor.execute(tool, args, context)

        try:
            result = await raw_execute()
            result.tool_call_id = tool_call_id
            return result
        except Exception as e:
            logger.warning(f"工具执行异常,进入纠错流程 | tool_id={tool_id} | error={e}")
            result, correction_result = await self._self_corrector.handle(e, raw_execute)

            if result is not None:
                result.tool_call_id = tool_call_id
                return result

            return ToolCallResult(
                tool_call_id=tool_call_id,
                tool_id=tool_id,
                success=False,
                error=correction_result.message if correction_result else str(e),
            )

    def _check_quota_before_call(self, context: ExecutionContext, tool_id: str) -> None:
        """工具调用前检查配额

        Args:
            context: 执行上下文
            tool_id: 工具 ID

        Raises:
            AIQuotaExceededError: 配额不足
        """
        if self._quota_service is None:
            return

        if context.user_role in ("vip", "admin"):
            return

        try:
            self._quota_service.check_quota(
                user_id=context.user_id,
                role=context.user_role,
                tool_id=tool_id,
            )
            self._quota_service.deduct_quota(
                user_id=context.user_id,
                role=context.user_role,
                tool_id=tool_id,
                session_id=context.session_id,
                trace_id=context.trace_id,
            )
        except Exception as e:
            logger.warning(f"配额检查/扣减失败: {e}")

    async def _call_ai(
        self, messages: list[dict[str, str]], stream: bool = False
    ) -> dict[str, Any] | AsyncIterator[StreamEvent]:
        """调用 AI

        Args:
            messages: 消息列表
            stream: 是否使用流式返回

        Returns:
            dict | AsyncIterator[StreamEvent]: AI 响应或流
        """
        if stream:
            return self._ai_client.chat_stream(
                messages=messages,
                tools=self._tools if self._tools else None,
            )

        return await self._ai_client.chat(
            messages=messages,
            tools=self._tools if self._tools else None,
            tool_choice="auto",
        )

    @classmethod
    def get_instance(cls) -> AgentExecutor:
        """获取 Agent 执行器单例

        Returns:
            AgentExecutor: Agent 执行器实例
        """
        if cls._instance is None:
            cls._instance = AgentExecutor()
        return cls._instance


__all__ = ["AgentExecutor", "AgentStep"]
