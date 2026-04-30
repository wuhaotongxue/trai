#!/usr/bin/env python
# 文件名: image_client_factory.py
# 作者: wuhao
# 日期: 2026-04-23
# 描述: 图片生成客户端工厂 - 支持本地 ModelScope 和 API 模式切换

from __future__ import annotations

import gc
import threading
import os
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


# ============================================================
# 模型单例管理器: 模型常驻 GPU, 生成完成后 idle 释放显存
# ============================================================


class _ImageModelManager:
    """线程安全的模型单例管理器

    模型加载后常驻 GPU 显存, 每次 generate 调用重置 idle 计时器.
    idle 超时后自动释放 pipeline + gc.collect + torch.cuda.empty_cache.
    """

    _instance: "_ImageModelManager | None" = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "_ImageModelManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls.__new__(cls)
                    cls._instance._init()
        return cls._instance

    def _init(self) -> None:
        self._pipe_client: LocalModelScopeImageClient | None = None
        self._idle_timer: threading.Timer | None = None
        self._idle_timeout: float = float(os.getenv("IMAGE_MODEL_IDLE_TIMEOUT", "300"))
        self._timer_lock = threading.Lock()

    def _unload(self) -> None:
        """释放 pipeline，清理 GPU 显存"""
        from loguru import logger

        if self._pipe_client is not None:
            logger.info("图片生成模型 idle 超时，开始释放 pipeline...")
            self._pipe_client._unload_pipe()
            self._pipe_client = None
            gc.collect()
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.info("GPU 显存已释放")
            logger.info("Pipeline 已释放")

    def _reset_timer(self) -> None:
        """重置 idle 计时器"""
        with self._timer_lock:
            if self._idle_timer is not None:
                self._idle_timer.cancel()
            self._idle_timer = threading.Timer(self._idle_timeout, self._unload)
            self._idle_timer.daemon = True
            self._idle_timer.start()

    def get_pipe_client(self) -> LocalModelScopeImageClient:
        """获取 pipeline 客户端单例，每次调用重置 idle 计时器"""
        with self._lock:
            if self._pipe_client is None:
                self._pipe_client = LocalModelScopeImageClient.__new__(LocalModelScopeImageClient)
                self._pipe_client._init_state()
            self._reset_timer()
            return self._pipe_client


_model_manager = _ImageModelManager.get_instance


# ============================================================
# 数据类
# ============================================================


@dataclass
class ImageGenerationResult:
    """图片生成结果"""

    image_url: str
    task_id: str
    status: str = "completed"


class IImageGenerationClient(ABC):
    """图片生成客户端接口"""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> ImageGenerationResult:
        """生成图片

        Args:
            prompt: 图片描述
            width: 宽度
            height: 高度
            steps: 采样步数
            seed: 随机种子

        Returns:
            ImageGenerationResult: 生成结果
        """
        ...


class LocalModelScopeImageClient(IImageGenerationClient):
    """本地 ModelScope 图片生成客户端 (Z-Image-Turbo)

    模型通过全局单例管理：首次调用时加载至 GPU，完成后 idle 5 分钟自动释放，
    释放后 GPU 显存恢复空闲，后续请求重新加载。
    """

    def _init_state(self) -> None:
        """初始化实例状态（供单例管理器调用）"""
        self._model_path: str = os.getenv(
            "MODELSCOPE_IMAGE_MODEL_PATH",
            "/root/.cache/modelscope/hub/models/Tongyi-MAI/Z-Image-Turbo"
        )
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_HEIGHT", "1024"))
        self._default_steps: int = int(os.getenv("MODELSCOPE_IMAGE_STEPS", "4"))
        self._default_seed: int = int(os.getenv("MODELSCOPE_IMAGE_SEED", "-1"))
        self._pipe = None

    def _unload_pipe(self) -> None:
        """释放 pipeline，清理 GPU 显存"""
        import torch
        from loguru import logger

        if self._pipe is not None:
            logger.info("图片生成模型 idle 超时，开始释放 pipeline...")
            del self._pipe
            self._pipe = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.info("GPU 显存已释放")
            else:
                logger.info("Pipeline 已释放（CPU 模式）")

    def _load_pipe(self) -> None:
        """懒加载模型，自动选择显存空闲最多的 GPU（单例内部使用）"""
        if self._pipe is None:
            import torch
            from loguru import logger
            
            # 自动选择空闲显存最多的 GPU
            device_str = "cpu"
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                if device_count > 0:
                    free_memories = []
                    for i in range(device_count):
                        try:
                            # torch.cuda.mem_get_info 返回 (free_memory, total_memory)
                            free, total = torch.cuda.mem_get_info(i)
                            free_memories.append((i, free))
                            logger.info(f"GPU {i}: 空闲显存 {free / 1024**3:.2f} GB / 总显存 {total / 1024**3:.2f} GB")
                        except Exception as e:
                            logger.warning(f"无法获取 GPU {i} 信息: {e}")
                    
                    if free_memories:
                        # 按空闲显存排序，选择最大的
                        best_device_index, max_free = max(free_memories, key=lambda x: x[1])
                        device_str = f"cuda:{best_device_index}"
                        logger.info(f"选择空闲显存最多的设备: {device_str} (剩余: {max_free / 1024**3:.2f} GB)")
            
            dtype = torch.bfloat16 if device_str.startswith("cuda") else torch.float32
            
            logger.info(f"加载本地 ModelScope 模型: {self._model_path} | 设备: {device_str} | 精度: {dtype}")
            
            try:
                from modelscope import ZImagePipeline
                self._pipe = ZImagePipeline.from_pretrained(
                    self._model_path,
                    torch_dtype=dtype,
                    low_cpu_mem_usage=False,
                )
                self._pipe.to(device_str)
                logger.info(f"模型加载完成，运行在设备: {device_str}")
            except Exception as e:
                logger.error(f"模型加载失败: {e}")
                # 尝试使用 CPU
                logger.warning("尝试使用 CPU 加载模型")
                device_str = "cpu"
                dtype = torch.float32
                from modelscope import ZImagePipeline
                self._pipe = ZImagePipeline.from_pretrained(
                    self._model_path,
                    torch_dtype=dtype,
                    low_cpu_mem_usage=False,
                )
                logger.info("模型已切换至 CPU 加载完成")

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> ImageGenerationResult:
        """通过本地 ModelScope 模型生成图片，生成完成后 idle 超时自动释放 GPU 显存"""
        from loguru import logger
        import torch
        import io

        from core.exceptions import ExternalServiceError
        from infrastructure.storage.s3_storage import S3StorageService

        logger.info(f"本地 ModelScope 图片生成 | 提示词: {prompt[:50]}...")

        # 从单例获取 pipeline（首次加载，后续复用），并重置 idle 计时器
        pipe_client = _model_manager().get_pipe_client()
        pipe_client._load_pipe()
        pipe = pipe_client._pipe

        try:
            device = pipe.device
            w = width or pipe_client._default_width
            h = height or pipe_client._default_height
            num_inference_steps = steps or pipe_client._default_steps
            generator_seed = seed if seed is not None and seed != -1 else None

            generator = torch.Generator(device=device).manual_seed(generator_seed) if generator_seed else None

            with torch.inference_mode():
                result = pipe(
                    prompt,
                    width=w,
                    height=h,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=0.0,  # Z-Image-Turbo 需要设置为 0
                    generator=generator,
                )
                image = result.images[0]

                import numpy as np
                img_array = np.array(image)
                logger.info(f"图像形状: {img_array.shape}")
                logger.info(f"图像数据类型: {img_array.dtype}")
                logger.info(f"图像最小值: {img_array.min()}")
                logger.info(f"图像最大值: {img_array.max()}")
                logger.info(f"图像平均值: {img_array.mean()}")

            img_bytes = io.BytesIO()
            image.save(img_bytes, format="PNG")
            img_bytes.seek(0)
            img_data = img_bytes.getvalue()
            logger.info(f"保存的图像大小: {len(img_data)} 字节")

            task_id = str(uuid.uuid4())
            object_key = f"ai_images/{task_id}.png"

            storage = S3StorageService()
            storage.upload_bytes(
                data=img_data,
                object_key=object_key,
                content_type="image/png",
            )
            image_url = storage.get_presigned_url(object_key, expires_in=3600)  # 1小时有效期

            logger.info(f"本地图片生成成功 | task_id={task_id} | url={image_url}")
            return ImageGenerationResult(
                image_url=image_url,
                task_id=task_id,
                status="completed",
            )

        except Exception as e:
            logger.error(f"本地图片生成异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"本地图片生成失败: {str(e)}",
                details={"error": str(e)},
            )


class DashScopeImageClient(IImageGenerationClient):
    """DashScope 云端图片生成客户端"""

    def __init__(self) -> None:
        self._api_key: str = (
            os.getenv("DASHSCOPE_API_KEY", "")
            or os.getenv("MODELSCOPE_API_KEY", "")
            or os.getenv("AI_DASHSCOPE_API_KEY", "")
        )
        self._model: str = os.getenv("MODELSCOPE_IMAGE_MODEL", "wanx-v1")
        self._default_width: int = int(os.getenv("MODELSCOPE_IMAGE_WIDTH", "1024"))
        self._default_height: int = int(os.getenv("MODELSCOPE_IMAGE_HEIGHT", "1024"))
        self._default_steps: int = int(os.getenv("MODELSCOPE_IMAGE_STEPS", "30"))
        self._default_seed: int = int(os.getenv("MODELSCOPE_IMAGE_SEED", "-1"))

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> ImageGenerationResult:
        """通过 DashScope API 生成图片"""
        import httpx
        from loguru import logger
        import asyncio

        from core.exceptions import ExternalServiceError

        logger.info(f"DashScope 图片生成 | 提示词: {prompt[:50]}...")

        if not self._api_key or self._api_key.startswith("xxx"):
            raise ExternalServiceError(
                message="DASHSCOPE_API_KEY 未配置或无效",
                details={"provider": "dashscope"},
            )

        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable",
        }

        payload = {
            "model": self._model,
            "input": {
                "prompt": prompt
            },
            "parameters": {
                "size": f"{(width or self._default_width)}*{(height or self._default_height)}",
                "n": 1,
                "steps": steps or self._default_steps,
                "seed": seed if seed is not None else (self._default_seed if self._default_seed != -1 else None)
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                task_data = response.json()

                task_id = task_data.get("output", {}).get("task_id")
                if not task_id:
                    raise ExternalServiceError("提交任务失败,未获取到 task_id", details=task_data)

                status_url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
                max_retries = 60

                for _ in range(max_retries):
                    await asyncio.sleep(2)
                    status_resp = await client.get(status_url, headers={"Authorization": f"Bearer {self._api_key}"})
                    status_resp.raise_for_status()
                    result_data = status_resp.json()

                    status = result_data.get("output", {}).get("task_status")
                    if status == "SUCCEEDED":
                        image_url = result_data.get("output", {}).get("results", [{}])[0].get("url")
                        return ImageGenerationResult(
                            image_url=image_url or "",
                            task_id=task_id,
                            status="completed",
                        )
                    elif status == "FAILED":
                        error_msg = result_data.get("output", {}).get("message", "未知错误")
                        raise ExternalServiceError(f"DashScope 生成失败: {error_msg}", details=result_data)
                    elif status == "CANCELED":
                        raise ExternalServiceError("任务被取消")

                raise ExternalServiceError("等待任务超时")

        except httpx.HTTPStatusError as e:
            logger.error(f"DashScope HTTP 错误 | 状态码: {e.response.status_code} | 响应: {e.response.text}")
            raise ExternalServiceError(
                message=f"DashScope API 请求失败: {e.response.status_code}",
                details={"status_code": e.response.status_code, "response": e.response.text},
            )
        except Exception as e:
            logger.error(f"DashScope 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"DashScope API 请求异常: {str(e)}",
                details={"error": str(e)},
            )


class OpenAIImageClient(IImageGenerationClient):
    """OpenAI DALL-E 图片生成客户端 (API 模式)"""

    def __init__(self) -> None:
        self._base_url: str = os.getenv(
            "IMAGE_API_BASE_URL", "https://api.openai.com/v1"
        )
        self._model: str = os.getenv("IMAGE_API_MODEL", "dall-e-3")
        self._api_key: str = os.getenv("IMAGE_API_KEY", "")
        self._timeout: int = int(os.getenv("IMAGE_API_TIMEOUT", "120"))

    async def generate(
        self,
        prompt: str,
        width: int | None = None,
        height: int | None = None,
        steps: int | None = None,
        seed: int | None = None,
    ) -> ImageGenerationResult:
        """通过 OpenAI DALL-E API 生成图片"""
        import uuid

        import httpx
        from loguru import logger

        from core.exceptions import ExternalServiceError

        logger.info(f"OpenAI DALL-E 图片生成 | 提示词: {prompt[:50]}...")

        if not self._api_key:
            raise ExternalServiceError(
                message="IMAGE_API_KEY 未配置",
                details={"provider": "openai_image"},
            )

        url = f"{self._base_url}/images/generations"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        size = f"{(width or 1024)}x{(height or 1024)}"
        payload = {
            "model": self._model,
            "prompt": prompt,
            "size": size,
            "n": 1,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

                return ImageGenerationResult(
                    image_url=data["data"][0]["url"],
                    task_id=data.get("id", str(uuid.uuid4())),
                    status="completed",
                )

        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI DALL-E HTTP 错误 | 状态码: {e.response.status_code}")
            raise ExternalServiceError(
                message=f"DALL-E API 请求失败: {e.response.status_code}",
                details={"status_code": e.response.status_code},
            )
        except Exception as e:
            logger.error(f"OpenAI DALL-E 请求异常 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"DALL-E API 请求异常: {str(e)}",
                details={"error": str(e)},
            )


class ImageClientFactory:
    """图片生成客户端工厂"""

    @staticmethod
    def create() -> IImageGenerationClient:
        """创建图片生成客户端

        根据 IMAGE_GENERATION_PROVIDER 环境变量创建对应的客户端:
        - "local": 本地 ModelScope Z-Image-Turbo (默认,使用已下载模型)
        - "dashscope": DashScope 云端 API (wanx-v1 等)
        - "openai": OpenAI DALL-E
        - "api": 自定义 API 模式

        Returns:
            IImageGenerationClient: 图片生成客户端实例
        """
        provider = os.getenv("IMAGE_PROVIDER", "local").lower()

        if provider == "openai":
            return OpenAIImageClient()
        elif provider == "api":
            return OpenAIImageClient()
        elif provider == "dashscope":
            return DashScopeImageClient()
        else:
            return LocalModelScopeImageClient()

    @staticmethod
    def get_available_models() -> list[dict[str, Any]]:
        """获取可用的图片生成模型列表

        Returns:
            list[dict]: 模型列表
        """
        provider = os.getenv("IMAGE_PROVIDER", "local").lower()

        if provider == "openai":
            return [
                {"id": "dall-e-3", "name": "DALL-E 3", "description": "OpenAI 高质量图片生成"},
                {"id": "dall-e-2", "name": "DALL-E 2", "description": "OpenAI 快速图片生成"},
            ]
        elif provider == "api":
            model = os.getenv("IMAGE_API_MODEL", "custom")
            return [
                {"id": model, "name": model, "description": f"自定义 API 模型: {model}"},
            ]
        elif provider == "dashscope":
            return [
                {"id": "wanx-v1", "name": "通义万相-v1", "description": "阿里高质量图片生成"},
                {"id": "wanx-v2", "name": "通义万相-v2", "description": "更强大的图片生成"},
            ]
        else:
            return [
                {"id": "local", "name": "Z-Image-Turbo (本地)", "description": "本地 ModelScope 模型,无需 API Key"},
            ]


__all__ = [
    "ImageClientFactory",
    "IImageGenerationClient",
    "LocalModelScopeImageClient",
    "DashScopeImageClient",
    "OpenAIImageClient",
    "ImageGenerationResult",
]
