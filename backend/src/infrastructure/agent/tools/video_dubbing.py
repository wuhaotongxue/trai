#!/usr/bin/env python
# 文件名: video_dubbing.py
# 作者: wuhao
# 日期: 2026_05_23_13:00:00
# 描述: 视频配音自动化工具, 暴露给Agent以自动化调用配音流水线

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from infrastructure.persistence.repositories.subtitle_repository import SubtitleRecordRepositoryImpl
from loguru import logger

from application.ai.dubbing.clone_usecase import CloneVoiceUseCase
from application.ai.dubbing.lipsync_usecase import LipSyncUseCase
from domain.ai.entities import SubtitleRecord
from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)


class VideoDubbingTool(BaseTool):
    """视频自动化配音与口型同步工具"""

    def __init__(self) -> None:
        super().__init__()
        self._definition = ToolDefinition(
            id="video_dubbing",
            name="视频自动配音",
            description="自动对视频进行人声分离、翻译、声音克隆或口型同步操作。当你收到用户的视频配音指令时调用此工具。",
            category=ToolCategory.VIDEO,
            risk_level=RiskLevel.MONITORED,
            parameters=[
                ToolParameter(
                    name="video_path",
                    type="string",
                    description="需要处理的本地视频绝对路径",
                    required=True,
                ),
                ToolParameter(
                    name="task_type",
                    type="string",
                    description="任务类型：'clone'表示声音克隆，'lipsync'表示口型同步",
                    required=True,
                    enum=["clone", "lipsync"],
                ),
                ToolParameter(
                    name="target_lang",
                    type="string",
                    description="目标语言，如'英文'或'中文' (仅在 clone 模式下有效)",
                    required=False,
                ),
                ToolParameter(
                    name="audio_path",
                    type="string",
                    description="口型同步需要的目标音频路径 (仅在 lipsync 模式下必填)",
                    required=False,
                ),
            ],
        )

    @property
    def definition(self) -> ToolDefinition:
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        logger.info(f"VideoDubbingTool execute | params={params}")

        video_path_str = params.get("video_path")
        task_type = params.get("task_type")
        target_lang = params.get("target_lang", "英文")
        audio_path_str = params.get("audio_path")

        if not video_path_str:
            return ToolCallResult(success=False, data={}, error="video_path 不能为空")

        video_path = Path(video_path_str)
        if not video_path.exists():
            return ToolCallResult(success=False, data={}, error=f"视频文件不存在: {video_path}")

        # 使用 db session
        from api.deps import get_db_session_context

        try:
            async for session in get_db_session_context():
                repo = SubtitleRecordRepositoryImpl(session)
                task_id = str(uuid.uuid4())

                if task_type == "clone":
                    record = SubtitleRecord(
                        id=task_id,
                        user_id=context.user_id if context else "anonymous",
                        task_type="clone",
                        status="pending",
                        input_type="video",
                        target_lang=target_lang,
                        burn_mode="none",
                        object_prefix="none",
                        file_name=video_path.name,
                    )
                    await repo.save(record)
                    usecase = CloneVoiceUseCase(repo)
                    # Agent 环境中最好直接 await 等待执行完成返回结果
                    await usecase.execute(record, video_path)

                    return ToolCallResult(
                        success=True,
                        data={"task_id": task_id, "video_url": record.output_video_url, "message": "声音克隆完成！"},
                    )

                elif task_type == "lipsync":
                    if not audio_path_str:
                        return ToolCallResult(success=False, data={}, error="口型同步需要 audio_path")
                    audio_path = Path(audio_path_str)
                    if not audio_path.exists():
                        return ToolCallResult(success=False, data={}, error=f"音频文件不存在: {audio_path}")

                    record = SubtitleRecord(
                        id=task_id,
                        user_id=context.user_id if context else "anonymous",
                        task_type="lipsync",
                        status="pending",
                        input_type="video",
                        target_lang="none",
                        burn_mode="none",
                        object_prefix="none",
                        file_name=video_path.name,
                    )
                    await repo.save(record)
                    usecase = LipSyncUseCase(repo)
                    await usecase.execute(record, video_path, audio_path)

                    return ToolCallResult(
                        success=True,
                        data={"task_id": task_id, "video_url": record.output_video_url, "message": "口型同步完成！"},
                    )

                else:
                    return ToolCallResult(success=False, data={}, error=f"未知的 task_type: {task_type}")

        except Exception as e:
            logger.error(f"VideoDubbingTool 异常: {e}")
            return ToolCallResult(success=False, data={}, error=str(e))

    def check_availability(self) -> bool:
        return True
