#!/usr/bin/env python
# _*_coding: utf_8_*_
# 文件名: prompt_optimizer.py
# 作者: wuhao
# 日期: 2026_06_01_10:35:00
# 描述: 提示词优化器，利用 LLM 增强用户的原始提示词

from loguru import logger
from infrastructure.ai.core.openai_client import OpenAIClient

class PromptOptimizer:
    """
    提示词优化器类.
    
    使用 DeepSeek 等大模型将简单的用户输入转化为丰富、艺术化的专业 AI 绘画提示词.
    """

    def __init__(self, provider: str = "deepseek"):
        self._llm = OpenAIClient(provider=provider)

    async def optimize_image_prompt(self, user_prompt: str) -> str:
        """
        优化图像生成提示词.
        """
        system_prompt = (
            "你是一位顶级的 AI 绘画提示词专家。请将用户简单的中文描述转化为丰富、专业且极具视觉冲击力的英文提示词。\n"
            "要求：\n"
            "1. 增加艺术风格、光影效果、材质细节和构图描述。\n"
            "2. 保持用户原始意图，但让画面更精美。\n"
            "3. 直接输出优化后的英文提示词，不要任何解释或标点符号前缀。\n"
            "4. 如果用户提到节日（如儿童节），请加入相关的梦幻和庆祝元素。"
        )
        
        try:
            resp = await self._llm.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"原始描述: {user_prompt}"}
                ],
                temperature=0.7
            )
            optimized = resp.get("content", "").strip()
            if optimized:
                logger.info(f"[Prompt优化] 原始: {user_prompt} -> 优化: {optimized[:50]}...")
                return optimized
        except Exception as e:
            logger.warning(f"提示词优化失败: {e}")
            
        return user_prompt
