#!/usr/bin/env python
# 文件名: prompt_optimizer.py
# 作者: wuhao
# 日期: 2026_06_02_14:53:56
# 描述: 提示词优化器, 统一处理图片、视频、音乐提示词增强逻辑

from __future__ import annotations

from loguru import logger

from core.exceptions import ExternalServiceError
from infrastructure.ai.core.openai_client import OpenAIClient


class PromptOptimizer:
    """
    提示词优化器类.

    用途:
        统一优化图片、视频、音乐提示词, 让角色设定、画面质感与常识约束保持一致.
    参数:
        provider (str): 大模型供应商名称.
        llm_client (OpenAIClient | None): 可选的 LLM 客户端注入对象, 便于测试和替换实现.
    返回值:
        None.
    异常:
        无. 初始化阶段不主动抛出异常.
    """

    def __init__(self, provider: str = "deepseek", llm_client: OpenAIClient | None = None) -> None:
        """
        初始化提示词优化器.

        用途:
            创建统一的提示词优化入口, 支持依赖注入和测试替身.
        参数:
            provider (str): 大模型供应商名称.
            llm_client (OpenAIClient | None): 可选的 LLM 客户端实例.
        返回值:
            None.
        异常:
            无. 客户端初始化异常由底层客户端自行处理.
        """
        self._llm = llm_client or OpenAIClient(provider=provider)

    async def optimize_video_prompt(self, user_prompt: str) -> str:
        """
        优化视频生成提示词.

        用途:
            将用户的视频描述转化为更适合视频模型的英文提示词.
        参数:
            user_prompt (str): 原始用户输入.
        返回值:
            str: 优化后的提示词, 若优化失败则返回原始输入.
        异常:
            无. 所有异常都会被记录并回退到原始输入.
        """
        return await self._optimize_prompt(
            scene_type="视频",
            user_prompt=user_prompt,
            system_prompt=self._build_video_system_prompt(),
        )

    async def optimize_music_prompt(self, user_prompt: str) -> str:
        """
        优化音乐生成提示词.

        用途:
            将用户的音乐描述转化为更清晰的英文风格标签和情感描述.
        参数:
            user_prompt (str): 原始用户输入.
        返回值:
            str: 优化后的提示词, 若优化失败则返回原始输入.
        异常:
            无. 所有异常都会被记录并回退到原始输入.
        """
        return await self._optimize_prompt(
            scene_type="音乐",
            user_prompt=user_prompt,
            system_prompt=self._build_music_system_prompt(),
        )

    async def optimize_image_prompt(self, user_prompt: str) -> str:
        """
        优化图像生成提示词.

        用途:
            将用户的图像描述转化为更适合 Turbo 架构绘图模型的英文提示词.
        参数:
            user_prompt (str): 原始用户输入.
        返回值:
            str: 优化后的提示词, 若优化失败则返回原始输入.
        异常:
            无. 所有异常都会被记录并回退到原始输入.
        """
        return await self._optimize_prompt(
            scene_type="图像",
            user_prompt=user_prompt,
            system_prompt=self._build_image_system_prompt(),
        )

    async def _optimize_prompt(self, scene_type: str, user_prompt: str, system_prompt: str) -> str:
        """
        执行统一的提示词优化流程.

        用途:
            统一处理输入清洗、LLM 调用、日志记录和失败回退逻辑.
        参数:
            scene_type (str): 业务场景名称, 例如图像、视频、音乐.
            user_prompt (str): 原始用户输入.
            system_prompt (str): 对应场景的系统提示词.
        返回值:
            str: 优化后的提示词, 若无结果则返回原始输入.
        异常:
            无. 任何异常都会被捕获并记录.
        """
        normalized_prompt = self._normalize_user_prompt(user_prompt)
        if not normalized_prompt:
            logger.warning(f"[Prompt优化-{scene_type}] 输入为空, 跳过优化")
            return user_prompt

        try:
            response = await self._llm.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"原始描述: {normalized_prompt}"},
                ],
                temperature=0.6,
            )
            optimized_prompt = self._extract_response_text(response)
            if optimized_prompt:
                logger.info(
                    f"[Prompt优化-{scene_type}] 优化成功 | 原始长度={len(normalized_prompt)} | 优化长度={len(optimized_prompt)}"
                )
                return optimized_prompt

            logger.warning(f"[Prompt优化-{scene_type}] LLM 返回空内容, 使用原始提示词")
        except ExternalServiceError as error:
            logger.warning(f"[Prompt优化-{scene_type}] 外部服务异常, 回退原始提示词 | error={error}")
        except Exception as error:
            logger.exception(f"[Prompt优化-{scene_type}] 未知异常, 回退原始提示词 | error={error}")

        return normalized_prompt

    def _normalize_user_prompt(self, user_prompt: str) -> str:
        """
        规范化用户输入提示词.

        用途:
            去除前后空白并压缩多余空格, 避免无效输入直接进入优化链路.
        参数:
            user_prompt (str): 原始用户输入.
        返回值:
            str: 清洗后的提示词文本.
        异常:
            无. 非字符串输入会被安全转成字符串.
        """
        return " ".join(str(user_prompt or "").split())

    def _extract_response_text(self, response: dict[str, object] | None) -> str:
        """
        从大模型响应中提取文本内容.

        用途:
            统一处理不同返回结果下的 content 提取, 降低调用层分支复杂度.
        参数:
            response (dict[str, object] | None): LLM 原始响应.
        返回值:
            str: 提取后的文本结果, 若不存在则返回空字符串.
        异常:
            无. 异常情况直接返回空字符串.
        """
        if not isinstance(response, dict):
            return ""
        content = response.get("content", "")
        if not isinstance(content, str):
            return ""
        return content.strip()

    def _build_common_character_rules(self) -> str:
        """
        构建通用角色一致性规则.

        用途:
            将角色设定、风格增强、常识约束拆分成可复用的统一规则文本.
        参数:
            无.
        返回值:
            str: 通用角色规则文本.
        异常:
            无.
        """
        return (
            "[角色一致性法则]\n"
            "1. 用户显式给出的角色设定属于硬约束, 包括年龄、身份、物种、时代、性别、气质、服装和动作. 你必须原样保留语义, 不能擅自改写成别的年龄段或别的生命形态.\n"
            "2. 对于非现实年龄, 如上古、几百岁、几千岁, 必须结合上下文理解其身份语义. 如果用户描述的是仙人、神女、精灵、妖灵, 可表现为超越人类寿命但外表自洽的形象, 而不是机械地增加皱纹.\n"
            "3. 必须严格区分角色外观与画面质感. cinematic, highly detailed, masterpiece, 8k 这类词只能提升镜头、材质、光影和整体质感, 不能自动推导出皱纹、衰老、幼态化或夸张五官.\n"
            "4. 若用户未明确要求幻想性畸变, 必须保持正常解剖和物理常识, 例如 flawless anatomy, coherent body structure, realistic proportions, exactly two arms and two legs.\n"
            "5. 必须使用纯正向表达. 不要输出 no, without, avoid 这类否定词, 因为 Turbo 架构容易误读否定词."
        )

    def _build_image_system_prompt(self) -> str:
        """
        构建图像优化系统提示词.

        用途:
            生成适用于 Turbo 架构图像模型的高质量系统提示词.
        参数:
            无.
        返回值:
            str: 图像场景系统提示词.
        异常:
            无.
        """
        return (
            "你是一位世界级 AI 视觉提示词工程师. 你的任务是把中文图像描述转写成高质量英文提示词, 专门服务于 Turbo 架构绘图模型.\n\n"
            f"{self._build_common_character_rules()}\n\n"
            "[图像增强法则]\n"
            "1. 在不篡改主体设定的前提下, 主动补充构图、材质、服饰纹理、武器反光、景深、色彩层次和空间氛围.\n"
            "2. 如果用户强调电影感、国风、水墨、赛博、产品海报等风格, 需要把风格落实到镜头语言、材质语言和环境语言, 而不是改坏人物年龄和面相.\n"
            "3. 如果用户包含节日语义, 只给环境和色彩增加仪式感元素, 不改变主体身份.\n\n"
            "[输出格式]\n"
            "直接输出英文提示词, 使用逗号分隔. 顺序必须是: [主体身份与外观硬约束] + [服装与动作] + [环境与构图] + [光影与材质] + [质量与结构标签]. 不要输出解释和前缀."
        )

    def _build_video_system_prompt(self) -> str:
        """
        构建视频优化系统提示词.

        用途:
            生成适用于视频模型的高质量系统提示词.
        参数:
            无.
        返回值:
            str: 视频场景系统提示词.
        异常:
            无.
        """
        return (
            "你是一位世界级 AI 视频提示词工程师. 你的任务是把中文视频描述转写成高质量英文提示词, 用于生成动态、连贯且角色设定稳定的视频.\n\n"
            f"{self._build_common_character_rules()}\n\n"
            "[视频增强法则]\n"
            "1. 在保留主体设定的前提下, 主动补充镜头调度, 如 fixed low-angle shot, slow pan, tracking shot, subtle camera movement.\n"
            "2. 主动补充动作连续性与物理连贯性描述, 如 smooth motion, flowing fabric, natural hair movement, controlled weapon sway.\n"
            "3. 电影感应优先作用于运镜、节奏、灯光、景别和氛围, 不能把角色误画成别的年龄层.\n\n"
            "[输出格式]\n"
            "直接输出英文提示词, 使用逗号分隔. 顺序必须是: [主体身份与外观硬约束] + [动作与姿态] + [镜头与动态] + [环境背景] + [光影与画质] + [结构与常识标签]. 不要输出解释和前缀."
        )

    def _build_music_system_prompt(self) -> str:
        """
        构建音乐优化系统提示词.

        用途:
            生成适用于音乐模型的高质量系统提示词.
        参数:
            无.
        返回值:
            str: 音乐场景系统提示词.
        异常:
            无.
        """
        return (
            "你是一位世界级 AI 音乐提示词工程师. 你的任务是把中文音乐需求转写成清晰、专业、可执行的英文音乐提示词.\n\n"
            "[音乐增强法则]\n"
            "1. 保留用户给出的核心风格、情绪、节奏和场景, 不要擅自改变音乐主题.\n"
            "2. 主动补充流派、配器、速度、氛围和制作质感, 如 cinematic orchestra, guzheng, synth bass, uplifting, melancholic, driving rhythm.\n"
            "3. 输出结果必须适合音乐生成模型直接消费, 避免散文化说明.\n\n"
            "[输出格式]\n"
            "直接输出英文提示词, 使用逗号分隔, 内容包括: [核心风格] + [配器] + [节奏与情绪] + [制作质感]. 不要输出解释和前缀."
        )
