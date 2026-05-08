#!/usr/bin/env python
# 文件名: router.py
# 作者: wuhao
# 日期: 2026-04-23
# 描述: Agent 编排器与路由 - 负责根据用户意图分发任务到不同的智能体

from __future__ import annotations

from typing import Any

from loguru import logger

from infrastructure.ai.openai_client import OpenAIClient


class AgentRouter:
    """Agent 路由分发器"""

    def __init__(self, agents: list[dict[str, Any]]):
        self.agents = agents
        self.ai_client = OpenAIClient()

    async def route(self, query: str) -> str:
        """根据查询内容路由到最佳 Agent ID"""

        # 构造路由提示词
        agent_descriptions = "\n".join(
            [f"- ID: {a['id']}, 名称: {a['name']}, 描述: {a['description']}" for a in self.agents]
        )

        prompt = f"""
你是一个智能路由系统. 请根据用户的输入, 从下面的 Agent 列表中选择一个最适合处理该请求的 Agent ID.

Agent 列表:
{agent_descriptions}

规则:
1. 只输出选中的 Agent ID, 不要有任何其他文字.
2. 如果不确定, 请选择 'agent-default'.
3. 如果用户询问天气, 请务必选择 'agent-weather'.

用户输入: "{query}"

选中的 Agent ID:"""

        try:
            # 使用较快的模型进行路由决策
            response = await self.ai_client.chat(
                messages=[{"role": "user", "content": prompt}], model="gpt-4o-mini", temperature=0
            )
            selected_id = response["content"].strip()

            # 校验 ID 是否合法
            if any(a["id"] == selected_id for a in self.agents):
                logger.info(f"Agent 路由成功: '{query}' -> {selected_id}")
                return selected_id

            logger.warning(f"Agent 路由返回无效 ID: {selected_id}, 使用默认值")
            return "agent-default"

        except Exception as e:
            logger.error(f"Agent 路由失败: {e}")
            return "agent-default"


class Orchestrator:
    """Agent 编排器 - 协调多 Agent 协作"""

    def __init__(self, agents: list[dict[str, Any]]):
        self.router = AgentRouter(agents)

    async def dispatch(self, query: str) -> str:
        """分发任务并获取 Agent ID"""
        return await self.router.route(query)
