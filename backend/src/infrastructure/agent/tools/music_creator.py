#!/usr/bin/env python
# 文件名: music_creator.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 音乐创作自动化工具, 包含作词、作曲(生成音乐)、封面生成

from __future__ import annotations

import asyncio
import uuid
from typing import Any

from infrastructure.ai.llm_client_factory import LLMClientFactory
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
from infrastructure.ai.audio.local_music_client import MusicClientProvider
from infrastructure.ai.vision.image_client_factory import ImageClientFactory


class MusicCreatorTool(BaseTool):
    """全自动音乐创作工具（作词、封面、作曲）."""

    def __init__(self) -> None:
        """
        初始化音乐创作工具.

        参数:
            无.

        返回值:
            无.

        异常:
            无.
        """
        super().__init__()
        self._definition = ToolDefinition(
            id="music_creator",
            name="AI 音乐工作室",
            description="自动生成一首完整的音乐作品. 根据用户的主题或内容, 使用 LLM 生成歌词, 使用文生图生成音乐封面, 并调用音乐模型生成配乐. 当你收到用户要求写歌、生成音乐、创作专辑时调用此工具.",
            category=ToolCategory.AUDIO,
            risk_level=RiskLevel.SAFE,
            parameters=[
                ToolParameter(
                    name="topic",
                    type="string",
                    description="用户提供的音乐主题、风格或具体内容描述",
                    required=True,
                )
            ],
        )

    @property
    def definition(self) -> ToolDefinition:
        """
        获取工具定义.

        参数:
            无.

        返回值:
            ToolDefinition: 工具定义.

        异常:
            无.
        """
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        """
        执行音乐创作流水线.

        参数:
            params: dict[str, Any], 工具参数.
            context: ExecutionContext, 执行上下文.

        返回值:
            ToolCallResult: 工具执行结果.

        异常:
            Exception: 执行异常.
        """
        topic = params.get("topic", "")
        if not topic:
            return ToolCallResult(success=False, data={}, error="缺少音乐主题 (topic) 参数")

        logger.info(f"开始执行全自动音乐创作流水线 | 主题: {topic}")
        task_id = str(uuid.uuid4())

        try:
            logger.info("[MusicCreator] Step 1: LLM 创作歌词")
            llm = LLMClientFactory.create_client()
            lyrics_prompt = f"请根据以下主题创作一首简短的歌词(包含主歌和副歌), 并给出这首歌的视觉封面描述提示词.\n主题: {topic}\n\n请按以下严格的格式输出: \n【歌词】\n(此处写歌词)\n【封面提示词】\n(此处写封面提示词, 必须是英文)"
            llm_result = await llm.chat(lyrics_prompt)

            lyrics = llm_result
            cover_prompt = f"A beautiful music album cover about {topic}, high quality, masterpiece, 4k"
            if "【封面提示词】" in llm_result:
                parts = llm_result.split("【封面提示词】")
                lyrics = parts[0].replace("【歌词】", "").strip()
                cover_prompt = parts[1].strip()

            logger.info(f"[MusicCreator] Step 2: 生成音乐封面 | 提示词: {cover_prompt}")
            image_factory = ImageClientFactory()
            cover_url = ""
            try:
                image_result = await image_factory.generate_image(
                    prompt=cover_prompt,
                    task_id=task_id,
                    user_id=context.user_id if context else "anonymous",
                    tenant_id=context.tenant_id if context else "default",
                )
                cover_url = image_result.image_url
            except Exception as e:
                logger.warning(f"封面生成失败, 但不阻断流程: {e}")

            logger.info("[MusicCreator] Step 3: 生成音乐音频")
            music_client = MusicClientProvider.get_music_client()
            music_prompt = f"A song about {topic}. {cover_prompt[:100]}"
            loop = asyncio.get_running_loop()
            music_result = await loop.run_in_executor(
                None,
                lambda: music_client.generate(prompt=music_prompt, duration=15),
            )

            music_file = music_result.file_path if music_result.success else None
            music_error = music_result.error if not music_result.success else None

            return ToolCallResult(
                success=True,
                data={
                    "task_id": task_id,
                    "topic": topic,
                    "lyrics": lyrics,
                    "cover_url": cover_url,
                    "music_file": music_file,
                    "music_error": music_error,
                    "message": "音乐全自动创作流水线执行完毕!",
                },
            )

        except Exception as e:
            logger.error(f"MusicCreatorTool 异常: {e}")
            return ToolCallResult(success=False, data={}, error=str(e))

    def check_availability(self) -> bool:
        """
        检查工具可用性.

        参数:
            无.

        返回值:
            bool: 是否可用.

        异常:
            无.
        """
        return True
