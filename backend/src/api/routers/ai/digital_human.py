# 文件名: digital_human.py
# 作者: wuhao
# 日期: 2026-05-23
# 描述: 数字人对话接口

from typing import Any

from fastapi import APIRouter
from loguru import logger
from pydantic import BaseModel, Field

from api.deps import CurrentUserOptional
from infrastructure.agent.tools.base import ExecutionContext
from infrastructure.agent.tools.digital_human_chat import DigitalHumanChatTool
from infrastructure.ai.core.openai_client import OpenAIClient

router = APIRouter(prefix="/digital_human", tags=["AI Digital Human"])


class DigitalHumanChatRequest(BaseModel):
    text: str = Field(..., description="用户输入的对话内容")


class DigitalHumanChatResponse(BaseModel):
    code: int = 200
    msg: str = "OK"
    data: dict[str, Any]


@router.post("/chat", response_model=DigitalHumanChatResponse)
async def digital_human_chat(
    req: DigitalHumanChatRequest,
    current_user: CurrentUserOptional,
):
    try:
        # 1. 使用 LLM 生成回复
        llm = OpenAIClient()
        prompt = f"你是一个友好的虚拟数字人助理, 请用简短, 自然, 口语化的语言回复用户的提问. 用户的提问是: {req.text}"
        res = await llm.chat(messages=[{"role": "user", "content": prompt}])
        reply_text = res.get("content", "").strip()
        logger.info(f"Digital human reply generated: {reply_text[:50]}...")

        # 2. 调用工具生成视频
        tool = DigitalHumanChatTool()
        user_id = current_user.get("user_id", "") if current_user else "anonymous"
        context = ExecutionContext(user_id=str(user_id), tenant_id="default")
        params = {"text": reply_text}

        result = await tool.execute(params, context)

        video_url = ""
        if result.success and result.output:
            import ast

            try:
                # 解析输出获取 video_url
                output_dict = ast.literal_eval(result.output)
                video_url = output_dict.get("video_url", "")
            except Exception:
                pass

        return DigitalHumanChatResponse(data={"reply": reply_text, "video_url": video_url})
    except Exception as e:
        logger.error(f"数字人对话生成失败: {e}")
        return DigitalHumanChatResponse(code=500, msg=str(e), data={})
