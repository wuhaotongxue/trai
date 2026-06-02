#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: image_usecases.py
# 作者: wuhao
# 日期: 2026_06_02_14:53:56
# 描述: 图片生成用例, 负责输入校验、提示词优化和结果编排

from __future__ import annotations

from dataclasses import dataclass

from loguru import logger

from application.common.base_usecase import UseCase
from core.exceptions import ExternalServiceError
from domain.ai.entities import (
    ImageGeneration,
    ImageSize,
    ImageStyle,
)
from domain.ai.interfaces import (
    IImageGenerationRepository,
)
from infrastructure.ai.core.modelscope_client import ModelScopeClient
from infrastructure.ai.core.prompt_optimizer import PromptOptimizer


@dataclass
class ImageGenerationInput:
    """图片生成输入."""

    prompt: str
    user_id: str = ""
    tenant_id: str | None = None
    model: str = "AI-ModelScope/FLUX.1-dev"
    width: int = 1024
    height: int = 1024
    steps: int = 30
    seed: int = -1
    negative_prompt: str | None = None
    style: ImageStyle = ImageStyle.AUTO
    size: ImageSize = ImageSize.SQUARE_1K
    session_id: str | None = None
    trace_id: str | None = None
    task_id: str | None = None
    """外部传入的 task_id，若不传则由实体自动生成（保持向后兼容）"""
    enable_optimization: bool = True
    """是否启用提示词优化"""


@dataclass
class ImageGenerationOutput:
    """图片生成输出."""

    task_id: str
    image_url: str | None = None
    image_base64: str | None = None
    status: str = "pending"
    error: str | None = None
    object_key: str | None = None
    """S3 对象键"""
    public_url: str | None = None
    """S3 公共域名 URL"""
    optimized_prompt: str | None = None
    """优化后的提示词"""


class ImageGenerationUseCase(UseCase[ImageGenerationInput, ImageGenerationOutput]):
    """
    图片生成用例.

    用途:
        统一处理图片生成的输入校验、提示词优化、模型调用与结果落库流程.
    参数:
        无.
    返回值:
        无.
    异常:
        无. 具体异常由 execute 方法处理.
    """

    def __init__(
        self,
        client: ModelScopeClient | None = None,
        repository: IImageGenerationRepository | None = None,
        optimizer: PromptOptimizer | None = None,
    ) -> None:
        """
        初始化图片生成用例.

        用途:
            注入图片客户端、仓储和提示词优化器, 便于测试和替换实现.
        参数:
            client (ModelScopeClient | None): 图片生成客户端.
            repository (IImageGenerationRepository | None): 仓储实现.
            optimizer (PromptOptimizer | None): 提示词优化器.
        返回值:
            None.
        异常:
            无.
        """
        self._client = client or ModelScopeClient()
        self._repository = repository
        self._optimizer = optimizer or PromptOptimizer()

    async def execute(self, input_data: ImageGenerationInput) -> ImageGenerationOutput:
        """
        执行图片生成流程.

        用途:
            校验输入参数, 生成优化提示词, 调用底层模型并封装统一输出.
        参数:
            input_data (ImageGenerationInput): 图片生成输入对象.
        返回值:
            ImageGenerationOutput: 图片生成结果对象.
        异常:
            无. 所有异常都会被捕获并转成失败结果.
        """
        task_id = input_data.task_id or ""
        try:
            self._validate_input(input_data)
            optimized_prompt = await self._resolve_prompt(input_data)
            generation = self._build_generation_entity(input_data, optimized_prompt)
            task_id = generation.task_id
            self._create_generation_record(generation)

            result = await self._client.generate(
                prompt=optimized_prompt,
                width=input_data.width,
                height=input_data.height,
                steps=input_data.steps,
                seed=input_data.seed,
                user_id=input_data.user_id,
                tenant_id=input_data.tenant_id,
            )
            return self._build_success_output(
                generation=generation,
                optimized_prompt=optimized_prompt,
                result=result,
            )
        except ValueError as error:
            logger.warning(f"[图片生成] 输入校验失败 | task_id={task_id} | error={error}")
            return ImageGenerationOutput(
                task_id=task_id,
                status="failed",
                error=str(error),
                optimized_prompt=input_data.prompt,
            )
        except ExternalServiceError as error:
            logger.warning(f"[图片生成] 外部服务异常 | task_id={task_id} | error={error}")
            return self._build_failure_output(
                task_id=task_id,
                error_message=str(error),
                optimized_prompt=input_data.prompt,
            )
        except Exception as error:
            logger.exception(f"[图片生成] 未知异常 | task_id={task_id} | error={error}")
            return self._build_failure_output(
                task_id=task_id,
                error_message=str(error),
                optimized_prompt=input_data.prompt,
            )

    def _validate_input(self, input_data: ImageGenerationInput) -> None:
        """
        校验图片生成输入参数.

        用途:
            提前拦截空提示词和非法尺寸参数, 降低无效调用和资源浪费.
        参数:
            input_data (ImageGenerationInput): 输入对象.
        返回值:
            None.
        异常:
            ValueError: 当输入参数不满足要求时抛出.
        """
        if not str(input_data.prompt or "").strip():
            raise ValueError("提示词不能为空")
        if input_data.width <= 0 or input_data.height <= 0:
            raise ValueError("图片宽高必须大于 0")
        if input_data.steps <= 0 or input_data.steps > 100:
            raise ValueError("采样步数必须在 1 到 100 之间")

    async def _resolve_prompt(self, input_data: ImageGenerationInput) -> str:
        """
        解析最终用于生成的提示词.

        用途:
            根据配置决定是否启用提示词优化, 并统一处理空白字符.
        参数:
            input_data (ImageGenerationInput): 输入对象.
        返回值:
            str: 最终提示词.
        异常:
            无. 优化失败时由优化器内部回退.
        """
        original_prompt = str(input_data.prompt).strip()
        if not input_data.enable_optimization:
            return original_prompt
        return await self._optimizer.optimize_image_prompt(original_prompt)

    def _build_generation_entity(
        self,
        input_data: ImageGenerationInput,
        optimized_prompt: str,
    ) -> ImageGeneration:
        """
        构建图片生成实体.

        用途:
            按是否提供 task_id 统一创建领域实体, 减少重复分支代码.
        参数:
            input_data (ImageGenerationInput): 输入对象.
            optimized_prompt (str): 优化后的提示词.
        返回值:
            ImageGeneration: 构建完成的领域实体.
        异常:
            无.
        """
        if input_data.task_id:
            return ImageGeneration.with_task_id(
                task_id=input_data.task_id,
                prompt=optimized_prompt,
                user_id=input_data.user_id,
                model=input_data.model,
                width=input_data.width,
                height=input_data.height,
                steps=input_data.steps,
                seed=input_data.seed,
                negative_prompt=input_data.negative_prompt,
                style=input_data.style,
                size=input_data.size,
                session_id=input_data.session_id,
                trace_id=input_data.trace_id,
            )
        return ImageGeneration(
            prompt=optimized_prompt,
            user_id=input_data.user_id,
            model=input_data.model,
            width=input_data.width,
            height=input_data.height,
            steps=input_data.steps,
            seed=input_data.seed,
            negative_prompt=input_data.negative_prompt,
            style=input_data.style,
            size=input_data.size,
            session_id=input_data.session_id,
            trace_id=input_data.trace_id,
        )

    def _create_generation_record(self, generation: ImageGeneration) -> None:
        """
        创建初始任务记录.

        用途:
            在仓储存在时保存初始生成记录, 便于后续状态更新.
        参数:
            generation (ImageGeneration): 图片生成实体.
        返回值:
            None.
        异常:
            无. 仓储为空时直接跳过.
        """
        if self._repository:
            self._repository.create(generation)

    def _build_success_output(
        self,
        generation: ImageGeneration,
        optimized_prompt: str,
        result: dict[str, object],
    ) -> ImageGenerationOutput:
        """
        构建成功输出结果.

        用途:
            统一处理生成完成后的状态变更、仓储更新和结果封装.
        参数:
            generation (ImageGeneration): 图片生成实体.
            optimized_prompt (str): 优化后的提示词.
            result (dict[str, object]): 底层模型返回结果.
        返回值:
            ImageGenerationOutput: 成功输出结果.
        异常:
            无.
        """
        image_url = self._safe_string(result.get("image_url"))
        image_base64 = self._safe_string(result.get("image_base64"))
        warning_error = self._safe_string(result.get("error")) or None
        result_object_key = self._safe_string(result.get("object_key")) or None
        result_public_url = self._safe_string(result.get("public_url")) or None

        if image_url:
            generation.mark_completed(image_url)
        elif image_base64:
            generation.mark_completed(f"data:image/png;base64,{image_base64[:50]}...")

        if self._repository:
            self._repository.update_status(
                generation.task_id,
                generation.status.value,
                result_url=image_url or None,
            )

        return ImageGenerationOutput(
            task_id=generation.task_id,
            image_url=image_url or None,
            image_base64=image_base64 or None,
            status="completed",
            error=warning_error,
            object_key=result_object_key,
            public_url=result_public_url,
            optimized_prompt=optimized_prompt,
        )

    def _build_failure_output(
        self,
        task_id: str,
        error_message: str,
        optimized_prompt: str,
    ) -> ImageGenerationOutput:
        """
        构建失败输出结果.

        用途:
            统一记录失败任务状态并输出失败结果, 降低异常分支重复代码.
        参数:
            task_id (str): 任务 ID.
            error_message (str): 失败信息.
            optimized_prompt (str): 当前提示词.
        返回值:
            ImageGenerationOutput: 失败输出结果.
        异常:
            无.
        """
        if task_id and self._repository:
            self._repository.update_status(
                task_id,
                "failed",
                error_message=error_message,
            )
        return ImageGenerationOutput(
            task_id=task_id,
            status="failed",
            error=error_message,
            optimized_prompt=optimized_prompt,
        )

    def _safe_string(self, value: object) -> str:
        """
        将任意值安全转换为字符串.

        用途:
            避免结果字典中的 None 或非字符串对象影响统一输出封装.
        参数:
            value (object): 任意输入值.
        返回值:
            str: 转换后的字符串, 空值返回空字符串.
        异常:
            无.
        """
        if value is None:
            return ""
        return str(value)


__all__ = ["ImageGenerationUseCase", "ImageGenerationInput", "ImageGenerationOutput"]
