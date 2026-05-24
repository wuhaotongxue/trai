#!/usr/bin/env python
# 文件名: vision_client.py
# 作者: wuhao
# 日期: 2026_05_14
# 描述: 本地 ModelScope 视觉模型客户端 (Qwen2-VL 等)

from __future__ import annotations

import base64
import gc
import io
import os
import threading
from dataclasses import dataclass, field
from typing import Any

import torch
from loguru import logger
from PIL import Image


@dataclass
class VisionResult:
    """视觉模型结果"""

    content: str = ""
    reasoning_content: str = ""
    model: str = ""
    usage: dict[str, Any] = field(default_factory=dict)
    finish_reason: str = ""
    error: str | None = None


class _VisionModelManager:
    """线程安全的视觉模型单例管理器"""

    _instance: _VisionModelManager | None = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> _VisionModelManager:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls.__new__(cls)
                    cls._instance._init()
        return cls._instance

    def _init(self) -> None:
        self._model = None
        self._processor = None
        self._idle_timer: threading.Timer | None = None
        self._idle_timeout: float = float(os.getenv("VISION_MODEL_IDLE_TIMEOUT", "600"))
        self._timer_lock = threading.Lock()

    def _unload(self) -> None:
        """释放模型，清理 GPU 显存"""
        if self._model is not None:
            logger.info("视觉模型 idle 超时，开始释放...")
            del self._model
            del self._processor
            self._model = None
            self._processor = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.info("GPU 显存已释放")

    def _reset_idle_timer(self) -> None:
        with self._timer_lock:
            if self._idle_timer is not None:
                self._idle_timer.cancel()
            self._idle_timer = threading.Timer(self._idle_timeout, self._unload)
            self._idle_timer.daemon = True
            self._idle_timer.start()

    def get_model(self):
        """获取模型实例（懒加载）"""
        if self._model is None:
            self._load_model()
        self._reset_idle_timer()
        return self._model, self._processor

    def _load_model(self) -> None:
        """懒加载模型，自动选择显存空闲最多的 GPU"""
        from transformers import Qwen2VLForConditionalGeneration, Qwen2VLProcessor

        model_path = os.getenv(
            "MODELSCOPE_VISION_MODEL_PATH", "/home/qyjgylc_whf/.cache/modelscope/hub/models/Qwen/Qwen2-VL-7B-Instruct"
        )

        device_str = "cpu"
        if torch.cuda.is_available():
            device_count = torch.cuda.device_count()
            if device_count > 0:
                free_memories = []
                for i in range(device_count):
                    try:
                        free, total = torch.cuda.mem_get_info(i)
                        free_memories.append((i, free))
                        logger.info(f"GPU {i}: 空闲显存 {free / 1024**3:.2f} GB / 总显存 {total / 1024**3:.2f} GB")
                    except Exception as e:
                        logger.warning(f"无法获取 GPU {i} 信息: {e}")

                if free_memories:
                    best_device_index, max_free = max(free_memories, key=lambda x: x[1])
                    device_str = f"cuda:{best_device_index}"
                    logger.info(f"选择空闲显存最多的设备: {device_str} (剩余: {max_free / 1024**3:.2f} GB)")

        dtype = torch.bfloat16 if device_str.startswith("cuda") else torch.float32

        logger.info(f"加载本地视觉模型: {model_path} | 设备: {device_str} | 精度: {dtype}")

        self._processor = Qwen2VLProcessor.from_pretrained(model_path)
        self._model = Qwen2VLForConditionalGeneration.from_pretrained(
            model_path,
            torch_dtype=dtype,
            device_map=device_str,
        )
        logger.info(f"视觉模型加载完成，运行在设备: {device_str}")


class LocalModelScopeVisionClient:
    """本地 ModelScope 视觉模型客户端"""

    def __init__(self):
        self._manager = _VisionModelManager.get_instance()

    def _prepare_inputs(self, image: Image.Image, prompt: str, processor):
        """准备模型输入"""
        # 构建消息，使用 chat template
        messages = [
            {
                "role": "user",
                "content": [{"type": "image_url", "image_url": {"url": ""}}, {"type": "text", "text": prompt}],
            }
        ]

        # 使用 apply_chat_template 生成包含 <|image_pad|> 的模板
        prompt_text = processor.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

        # 使用 Qwen2VLProcessor 处理
        inputs = processor(
            images=[image],
            text=[prompt_text],
            return_tensors="pt",
        )

        # 移到模型设备
        device = self._manager._model.device
        inputs = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}
        return inputs

    async def analyze_image(
        self,
        image_data: bytes | str,
        prompt: str = "请详细描述这张图片的内容",
        **kwargs,
    ) -> VisionResult:
        """图像理解/分析"""
        import time

        time.perf_counter()

        try:
            model, processor = self._manager.get_model()

            # 处理图片数据
            if isinstance(image_data, bytes):
                image = Image.open(io.BytesIO(image_data))
            else:
                image_bytes = base64.b64decode(image_data)
                image = Image.open(io.BytesIO(image_bytes))

            # 准备输入
            inputs = self._prepare_inputs(image, prompt, processor)

            # 生成
            gen_kwargs = {
                "max_new_tokens": kwargs.get("max_tokens", 1024),
                "do_sample": kwargs.get("temperature", 0.7) > 0,
            }
            temp = kwargs.get("temperature", 0.7)
            if temp > 0:
                gen_kwargs["temperature"] = temp
            gen_kwargs["pad_token_id"] = processor.tokenizer.pad_token_id or processor.tokenizer.eos_token_id

            generated_ids = model.generate(**inputs, **gen_kwargs)

            # 解码
            generated_ids_trimmed = generated_ids[:, inputs["input_ids"].shape[1] :]
            response = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True)[0]

            return VisionResult(
                content=response,
                model=os.getenv("MODELSCOPE_VISION_MODEL", "Qwen/Qwen2-VL-7B-Instruct"),
                usage={
                    "prompt_tokens": inputs["input_ids"].shape[1],
                    "completion_tokens": generated_ids_trimmed.shape[1],
                    "total_tokens": generated_ids.shape[1],
                },
                finish_reason="stop",
            )

        except Exception as e:
            logger.error(f"视觉模型分析失败: {e}")
            import traceback

            traceback.print_exc()
            return VisionResult(error=str(e), content="")

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        **kwargs,
    ):
        """流式对话接口"""
        try:
            model, processor = self._manager.get_model()

            # 提取图片和文本
            image = None
            text_parts = []

            for msg in messages:
                if isinstance(msg.get("content"), list):
                    for item in msg["content"]:
                        if item.get("type") == "image_url":
                            image_url = item.get("image_url", {}).get("url", "")
                            if image_url.startswith("data:"):
                                b64_data = image_url.split(",", 1)[1]
                                image_bytes = base64.b64decode(b64_data)
                                image = Image.open(io.BytesIO(image_bytes))
                            elif image_url.startswith("http"):
                                import requests

                                response = requests.get(image_url)
                                image = Image.open(io.BytesIO(response.content))
                        elif item.get("type") == "text":
                            text_parts.append(item.get("text", ""))
                elif isinstance(msg.get("content"), str):
                    text_parts.append(msg["content"])

            prompt = "\n".join(text_parts)

            if image is None:
                yield "错误：未检测到图片数据"
                return

            # 准备输入
            inputs = self._prepare_inputs(image, prompt, processor)

            # 生成
            max_new_tokens = kwargs.get("max_tokens", 2048)
            temperature = kwargs.get("temperature", 0.7)

            gen_kwargs = {
                "max_new_tokens": max_new_tokens,
                "do_sample": temperature > 0,
                "pad_token_id": processor.tokenizer.pad_token_id or processor.tokenizer.eos_token_id,
            }
            if temperature > 0:
                gen_kwargs["temperature"] = temperature

            generated_ids = model.generate(**inputs, **gen_kwargs)

            # 解码
            generated_ids_trimmed = generated_ids[:, inputs["input_ids"].shape[1] :]
            response = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True)[0]

            # 流式输出
            buffer = ""
            for char in response:
                buffer += char
                if char in "。！？；\n":
                    yield buffer
                    buffer = ""
            if buffer:
                yield buffer

        except Exception as e:
            logger.error(f"视觉模型流式对话失败: {e}")
            yield f"错误：{str(e)}"

    async def chat(
        self,
        messages: list[dict[str, Any]],
        **kwargs,
    ) -> VisionResult:
        """对话接口"""
        try:
            model, processor = self._manager.get_model()

            image = None
            text_parts = []

            for msg in messages:
                if isinstance(msg.get("content"), list):
                    for item in msg["content"]:
                        if item.get("type") == "image_url":
                            image_url = item.get("image_url", {}).get("url", "")
                            if image_url.startswith("data:"):
                                b64_data = image_url.split(",", 1)[1]
                                image_bytes = base64.b64decode(b64_data)
                                image = Image.open(io.BytesIO(image_bytes))
                        elif item.get("type") == "text":
                            text_parts.append(item.get("text", ""))
                elif isinstance(msg.get("content"), str):
                    text_parts.append(msg["content"])

            prompt = "\n".join(text_parts)

            if image is None:
                return VisionResult(error="未检测到图片数据", content="")

            return await self.analyze_image(image_to_bytes(image), prompt, **kwargs)

        except Exception as e:
            logger.error(f"视觉模型对话失败: {e}")
            return VisionResult(error=str(e), content="")


def image_to_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format=image.format or "PNG")
    return buf.getvalue()


__all__ = ["LocalModelScopeVisionClient", "VisionResult"]
