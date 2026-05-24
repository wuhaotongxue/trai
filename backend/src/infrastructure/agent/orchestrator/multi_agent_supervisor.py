#!/usr/bin/env python
# 文件名: multi_agent_supervisor.py
# 作者: wuhao
# 日期: 2026-05-24
# 描述: 多智能体主控中枢 (Supervisor) - 负责任务拆解、下发命令给不同子 Agent、汇总汇报

from __future__ import annotations

import json
from typing import Any

from loguru import logger

from infrastructure.ai.core.openai_client import OpenAIClient


class MultiAgentSupervisor:
    """
    主智能体 (Supervisor)
    负责管理和下发任务给不同的子 Agent
    """

    def __init__(self):
        self.ai_client = OpenAIClient()
        self.registered_agents = {
            "agent_file_op": "文件操作 Agent - 负责读取、写入、解析各类文档(PDF, Excel等)",
            "agent_browser_search": "浏览器搜索 Agent - 负责联网检索最新资讯",
            "agent_image_analyzer": "图片分析 Agent - 负责解析图片内容、OCR、目标检测",
            "agent_video_analyzer": "视频分析 Agent - 负责提取视频帧、字幕、动作识别",
            "agent_music_analyzer": "音乐分析 Agent - 负责识别音轨、分离人声伴奏、克隆音色",
            "agent_media_generator": "多媒体生成 Agent - 负责文生音乐、唇形同步、MV拼接与生成",
            "agent_skill_creator": "技能创造 Agent - 负责当系统缺乏能力时，自动编写代码生成新的 Skill",
        }

    async def decompose_and_dispatch(self, user_prompt: str) -> dict[str, Any]:
        """
        核心调度流程：
        1. 任务拆解
        2. 下发给不同 Agent
        3. 汇总汇报
        """
        logger.info(f"主 Agent 收到任务: {user_prompt}")

        # 1. 拆解任务 (简化版)
        agent_list = "\n".join([f"- {k}: {v}" for k, v in self.registered_agents.items()])
        prompt = f"""
你是一个高级主智能体 (Supervisor)。请根据用户的输入，拆解任务并分配给以下合适的子 Agent。
如果任务需要多个步骤，请列出执行流。

可用子 Agent:
{agent_list}

用户任务: "{user_prompt}"

请以 JSON 格式输出任务计划，格式如下：
{{
    "tasks": [
        {{"step": 1, "agent": "agent_xxx", "command": "具体指令"}}
    ]
}}
"""
        try:
            response = await self.ai_client.chat(
                messages=[{"role": "user", "content": prompt}], model="gpt-4o-mini", temperature=0.2
            )
            content = response["content"]

            # 清理 Markdown 代码块包裹
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()

            plan = json.loads(content)
            logger.info(f"主 Agent 任务拆解完成: {plan}")

            # 2. 模拟执行下发命令给不同 Agent
            results = []
            for task in plan.get("tasks", []):
                agent_name = task.get("agent")
                command = task.get("command")
                logger.info(f"主 Agent 正在下发命令给 {agent_name}: {command}")

                # TODO: 这里应调用各个子 Agent 的真实 execute 方法
                mock_result = f"[{agent_name}] 执行 '{command}' 成功"
                results.append(mock_result)

            # 3. 汇总汇报
            summary = "任务汇报:\n" + "\n".join(results)
            logger.info("主 Agent 任务执行完毕，正在汇报")

            return {"status": "success", "plan": plan, "summary": summary}

        except Exception as e:
            logger.error(f"主 Agent 调度失败: {e}")
            return {"status": "error", "message": str(e)}
