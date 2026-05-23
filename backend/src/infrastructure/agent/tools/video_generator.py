#!/usr/bin/env python
# 文件名: video_generator.py
# 作者: wuhao
# 日期: 2026_05_23_14:30:00
# 描述: 视频生成自动化工具 (Text2Video / Image2Video)

from __future__ import annotations

import uuid
from typing import Any

from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)
from infrastructure.ai.video_generation_client import VideoGenerationClient


class VideoGeneratorTool(BaseTool):
    """全自动视频生成工具（文生视频/图生视频）."""

    def __init__(self) -> None:
        """
        初始化工具.
        """
        super().__init__()
        self._definition = ToolDefinition(
            id="video_generator",
            name="AI 视频生成",
            description="根据用户提供的文字提示或参考图片，自动生成一段视频。当你收到用户要求'生成视频'、'让这张图动起来'等指令时调用此工具。",
            category=ToolCategory.MEDIA,
            risk_level=RiskLevel.MEDIUM,
            parameters=[
                ToolParameter(
                    name="prompt",
                    type="string",
                    description="描述视频画面的提示词，建议详细描述场景、动作和光影。",
                    required=True,
                ),
                ToolParameter(
                    name="image_url",
                    type="string",
                    description="如果用户提供了参考图片，或者你想让某张特定的图动起来，传入该图的公网 URL。如果没有则留空。",
                    required=False,
                ),
            ],
        )

    @property
    def definition(self) -> ToolDefinition:
        """获取定义."""
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        """执行视频生成流水线."""
        prompt = params.get("prompt", "")
        image_url = params.get("image_url")

        if not prompt:
            return ToolCallResult(success=False, data={}, error="缺少视频提示词 (prompt)")

        logger.info(f"开始执行自动视频生成 | 提示词: {prompt} | 图片: {image_url}")
        task_id = str(uuid.uuid4())

        try:
            client = VideoGenerationClient()
            video_url = await client.generate_video(
                prompt=prompt,
                image_url=image_url,
                model="cogvideox",
                task_id=task_id,
                user_id=context.user_id if context else "anonymous",
                tenant_id=context.tenant_id if context else "default",
            )

            return ToolCallResult(
                success=True,
                data={
                    "task_id": task_id,
                    "video_url": video_url,
                    "message": "视频生成成功!",
                },
            )

        except Exception as e:
            logger.error(f"VideoGeneratorTool 异常: {e}")
            return ToolCallResult(success=False, data={}, error=str(e))

    def check_availability(self) -> bool:
        """检查可用性."""
        return True
