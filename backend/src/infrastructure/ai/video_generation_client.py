#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: video_generation_client.py
# 作者: wuhao
# 日期: 2026_05_23_14:00:00
# 描述: 视频生成客户端, 接入 DashScope (如 cogvideox, wanx 等模型)

from __future__ import annotations

import asyncio
import os
import urllib.request
from typing import Any

from loguru import logger

import dashscope
from dashscope import VideoSynthesis
from core.exceptions import ExternalServiceError
from infrastructure.storage.s3_storage import S3StorageService

class VideoGenerationClient:
    """视频生成客户端 (基于 DashScope API)."""

    def __init__(self) -> None:
        """
        初始化客户端.
        """
        api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("AI_DASHSCOPE_API_KEY")
        if not api_key:
            logger.warning("未配置 DASHSCOPE_API_KEY, 视频生成功能可能无法使用")
        dashscope.api_key = api_key
        self._s3 = S3StorageService()

    async def generate_video(
        self,
        prompt: str,
        image_url: str | None = None,
        model: str = "cogvideox",
        task_id: str = "default_task",
        user_id: str = "anonymous",
        tenant_id: str = "default"
    ) -> str:
        """
        调用模型生成视频.

        参数:
            prompt: 视频生成的文本提示词.
            image_url: 图生视频的参考图 URL.
            model: 使用的模型 (如 cogvideox, wanx-video-generation).
            task_id: 任务 ID.
            user_id: 用户 ID.
            tenant_id: 租户 ID.

        返回值:
            str: 最终生成视频的公网可访问 URL (S3 Presigned URL).

        异常:
            ExternalServiceError: 外部 API 调用失败.
        """
        try:
            logger.info(f"开始视频生成 | model: {model} | prompt: {prompt} | image: {image_url}")
            
            loop = asyncio.get_running_loop()
            
            # 使用同步方法包装成异步
            def _call_api():
                if image_url:
                    # 图生视频
                    return VideoSynthesis.call(
                        model=model,
                        prompt=prompt,
                        img_url=image_url,
                    )
                else:
                    # 文生视频
                    return VideoSynthesis.call(
                        model=model,
                        prompt=prompt,
                    )

            response = await loop.run_in_executor(None, _call_api)
            
            if response.status_code != 200:
                raise ExternalServiceError(f"视频生成提交失败: {response.code} - {response.message}")
            
            task_id_remote = response.output.task_id
            logger.info(f"视频生成任务已提交 | task_id: {task_id_remote}, 正在轮询状态...")
            
            # 轮询获取结果
            def _wait_api():
                return VideoSynthesis.wait(task_id_remote)
                
            result = await loop.run_in_executor(None, _wait_api)
            
            if result.status_code != 200:
                raise ExternalServiceError(f"视频生成获取失败: {result.code} - {result.message}")
            
            if result.output.task_status == "SUCCEEDED":
                video_url_remote = result.output.video_url
                logger.info(f"视频生成成功 | 远程 URL: {video_url_remote}")
                
                # 下载到本地并上传至 S3 (以满足平台统一管控和持久化规范)
                logger.info("开始下载生成的视频并转存 S3")
                local_path = f"/tmp/trai_workspace/{task_id}_gen.mp4"
                os.makedirs("/tmp/trai_workspace", exist_ok=True)
                
                def _download():
                    urllib.request.urlretrieve(video_url_remote, local_path)
                
                await loop.run_in_executor(None, _download)
                
                s3_key = f"private/tenants/{tenant_id}/ai_generated/videos/{user_id}/{task_id}.mp4"
                self._s3.upload_file(local_path, s3_key)
                
                final_url = self._s3.get_long_term_url(s3_key)
                
                if os.path.exists(local_path):
                    os.remove(local_path)
                    
                return final_url
            else:
                raise ExternalServiceError(f"视频生成状态异常: {result.output.task_status} - {result.output.message}")
                
        except Exception as e:
            logger.error(f"视频生成失败: {e}")
            raise ExternalServiceError(str(e))
