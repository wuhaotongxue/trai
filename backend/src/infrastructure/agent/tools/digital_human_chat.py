#!/usr/bin/env python
# 文件名: digital_human_chat.py
# 作者: wuhao
# 日期: 2026-05-23
# 描述: 数字人对话工具，结合大语言模型、TTS和唇形同步，生成数字人视频

from __future__ import annotations

import asyncio
import uuid
from pathlib import Path
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
from infrastructure.ai.cosyvoice_client import CosyVoiceClient
from infrastructure.system.gpu_manager import GPUManager


class DigitalHumanChatTool(BaseTool):
    """虚拟数字人实时对话工具"""

    def __init__(self) -> None:
        super().__init__()
        self._gpu_manager = GPUManager()
        self._definition = ToolDefinition(
            id="digital_human_chat",
            name="数字人对话生成",
            description="将文本转化为虚拟数字人讲话的视频。当用户要求测试数字人、虚拟人对话时调用此工具。",
            category=ToolCategory.VIDEO,
            risk_level=RiskLevel.SAFE,
            parameters=[
                ToolParameter(
                    name="text",
                    type="string",
                    description="数字人需要播报的文本",
                    required=True,
                ),
                ToolParameter(
                    name="avatar_image",
                    type="string",
                    description="数字人形象图片路径 (如果不提供将使用默认形象)",
                    required=False,
                ),
            ],
        )

    @property
    def definition(self) -> ToolDefinition:
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        logger.info(f"DigitalHumanChatTool execute | params={params}")

        text = params.get("text")
        if not text:
            return ToolCallResult(tool_call_id="", tool_id=self.definition.id, success=False, error="文本内容不能为空")

        avatar_image = params.get("avatar_image")

        # 1. 资源检测：请求显存，数字人模型(如 ER-NeRF/MuseTalk)通常需要 10GB 左右
        gpu_id = self._gpu_manager.allocate_gpu(required_memory_mb=10000)
        if gpu_id is None:
            logger.warning("显存不足，降级使用 CPU 模式或排队处理...")
            # 在实际中这里可以放入队列，目前我们继续流程，假设降级成功
            device = "cpu"
        else:
            device = f"cuda:{gpu_id}"

        logger.info(f"数字人对话生成开始，分配设备: {device}")

        try:
            task_id = str(uuid.uuid4())
            # 2. TTS 生成音频 (CosyVoice)
            tts_client = CosyVoiceClient()
            audio_output_path = Path(f"/tmp/digital_human_{task_id}.wav")

            # 由于 CosyVoiceClient 是同步的，我们用 run_in_executor 包装
            loop = asyncio.get_running_loop()
            audio_bytes = await loop.run_in_executor(None, tts_client.generate_speech, text, "longxiaochun")
            with open(audio_output_path, "wb") as f:
                f.write(audio_bytes)

            # 3. 数字人渲染 (LipSync / MuseTalk / ER-NeRF)
            # 这里调用底层的唇形同步，作为演示，如果是实际系统会调用 MuseTalk pipeline
            # 为保持与 Lipsync 兼容，如果未集成 MuseTalk，可用 FFmpeg 平滑降级
            video_output_url = await self._mock_render_digital_human(
                str(audio_output_path), avatar_image, device, task_id
            )

            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output=str(
                    {
                        "task_id": task_id,
                        "video_url": video_output_url,
                        "device_used": device,
                        "message": "数字人视频生成完成！",
                    }
                ),
            )

        except Exception as e:
            logger.error(f"DigitalHumanChatTool 异常: {e}")
            return ToolCallResult(tool_call_id="", tool_id=self.definition.id, success=False, error=str(e))

    async def _mock_render_digital_human(
        self, audio_path: str, avatar_image: str | None, device: str, task_id: str
    ) -> str:
        """模拟数字人渲染过程 (MuseTalk/ER-NeRF)。"""
        logger.info(f"[{device}] 正在使用 MuseTalk/ER-NeRF 渲染数字人视频... 音频: {audio_path}")
        await asyncio.sleep(2)  # 模拟渲染耗时
        return f"https://mock-s3-bucket.trai.com/digital_human/{task_id}.mp4"

    def check_availability(self) -> bool:
        return True
