#!/usr/bin/env python
# 文件名: agnes_video_client.py
# 作者: wuhao
# 日期: 2026_06_01_16:05:56
# 描述: Agnes AI 视频生成客户端，包含自动回退机制

from __future__ import annotations

import asyncio
import os
from typing import Any

import requests
from loguru import logger

from core.exceptions import ExternalServiceError
from infrastructure.ai.video.local_video_client import LocalVideoClient


class AgnesVideoClient:
    """Agnes AI 视频生成客户端，带有本地回退机制"""

    def __init__(self) -> None:
        self._api_key = os.getenv("AGNES_API_KEY", "")
        self._base_url = os.getenv("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1")
        self._fallback_client = LocalVideoClient()
        self._is_healthy = False
        self._tested = False

    def _test_connection(self) -> bool:
        """测试 Agnes API 连通性"""
        if self._tested:
            return self._is_healthy

        self._tested = True
        if not self._api_key:
            logger.warning("未配置 AGNES_API_KEY，将使用本地视频生成回退方案")
            self._is_healthy = False
            return False

        try:
            # 使用 requests 测试一下任意端点或直接认为 OK（也可以测 models 接口）
            url = f"{self._base_url}/models"
            res = requests.get(url, headers={"Authorization": f"Bearer {self._api_key}"}, timeout=5)
            if res.status_code == 200:
                self._is_healthy = True
                logger.info("Agnes AI 视频生成服务连通性测试通过 ✅")
                return True
            else:
                self._is_healthy = False
                logger.warning(f"Agnes AI 连通性测试失败: HTTP {res.status_code}")
                return False
        except Exception as e:
            logger.warning(f"Agnes AI 连通性测试异常，将回退到本地模型: {e}")
            self._is_healthy = False
            return False

    async def generate(
        self,
        prompt: str,
        frames: int | None = None,
        resolution: str | None = None,
        task_id: str = "",
        progress_callback: Any | None = None,
    ) -> dict[str, Any]:
        """
        调用模型生成视频，支持回退
        与 LocalVideoClient 保持一致的接口签名
        """
        if self._test_connection():
            try:
                model = "agnes-video-v2.0"
                logger.info(f"使用 Agnes AI ({model}) 生成视频...")
                headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}

                payload = {"model": model, "prompt": prompt}

                loop = asyncio.get_running_loop()

                def _submit_task():
                    url = f"{self._base_url}/video/generations"
                    return requests.post(url, headers=headers, json=payload, timeout=10)

                response = await loop.run_in_executor(None, _submit_task)

                if response.status_code == 200:
                    response_data = response.json()
                    remote_task_id = response_data.get("task_id") or response_data.get("id")
                    if remote_task_id:
                        logger.info(f"Agnes AI 视频任务已提交，Task ID: {remote_task_id}，开始轮询...")
                        video_url = await self._poll_task(remote_task_id, headers)

                        # 下载视频并转为 base64，以兼容 LocalVideoClient 的返回格式
                        logger.info(f"正在下载生成的视频: {video_url}")

                        def _download_video():
                            res = requests.get(video_url, timeout=60)
                            res.raise_for_status()
                            return res.content

                        video_bytes = await loop.run_in_executor(None, _download_video)
                        import base64

                        video_base64 = base64.b64encode(video_bytes).decode("utf-8")

                        return {
                            "video_base64": video_base64,
                            "size_bytes": len(video_bytes),
                            "frames": frames or 81,
                            "resolution": resolution or "1280x720",
                        }
                    else:
                        raise ExternalServiceError("未返回 Task ID")
                else:
                    raise ExternalServiceError(f"HTTP {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(f"Agnes AI 视频生成失败，执行本地回退: {e}")
                # 继续往下执行回退逻辑

        logger.info("使用本地 LocalVideoClient 回退方案生成视频...")
        return await self._fallback_client.generate(
            prompt=prompt, frames=frames, resolution=resolution, task_id=task_id, progress_callback=progress_callback
        )

    async def _poll_task(self, task_id: str, headers: dict) -> str:
        """轮询视频生成结果"""
        loop = asyncio.get_running_loop()
        poll_url = f"{self._base_url}/tasks/{task_id}"

        max_retries = 60
        for i in range(max_retries):
            await asyncio.sleep(10)

            def _check():
                return requests.get(poll_url, headers=headers, timeout=10)

            poll_res = await loop.run_in_executor(None, _check)
            if poll_res.status_code == 200:
                poll_data = poll_res.json()
                task_info = poll_data.get("data", {})
                status = task_info.get("status", "unknown")

                if status in ["SUCCESS", "success", "completed", "succeeded"]:
                    video_url = task_info.get("result_url")
                    inner_data = task_info.get("data", {})
                    if not video_url or "videos/task_" in video_url:
                        video_url = inner_data.get("remixed_from_video_id") or inner_data.get("url")

                    if video_url:
                        logger.info(f"Agnes AI 视频生成成功 ✅ URL: {video_url}")
                        return video_url
                    else:
                        raise ExternalServiceError(f"生成成功但未找到视频URL: {poll_data}")

                elif status in ["FAILED", "failed", "error"]:
                    raise ExternalServiceError(f"视频生成失败: {task_info.get('fail_reason')}")
            else:
                logger.warning(f"轮询请求异常: HTTP {poll_res.status_code}")

        raise ExternalServiceError("视频生成轮询超时")
