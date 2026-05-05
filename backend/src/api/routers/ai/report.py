#!/usr/bin/env python
# 文件名: report.py
# 作者: wuhao
# 日期: 2026_04_23
# 描述: AI 周报生成接口

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.deps import CurrentUser
from infrastructure.ai.openai_client import OpenAIClient

router = APIRouter(prefix="/report", tags=["AI"])


class GenerateReportRequest(BaseModel):
    """生成周报请求"""
    template_base64: str = Field(..., description="模板文件 Base64")
    template_name: str = Field(..., description="模板名称")
    description: str = Field(..., description="周报内容描述")


class GenerateReportResponse(BaseModel):
    """生成周报响应"""
    code: int = Field(200, description="业务状态码")
    msg: str = Field("OK", description="消息")
    data: str = Field(..., description="生成的周报内容")
    req_id: str = Field(..., description="请求追踪 ID")
    ts: str = Field(..., description="时间戳")


@router.post("/generate", response_model=GenerateReportResponse, tags=["AI"])
async def generate_report(
    request: GenerateReportRequest,
    current_user: CurrentUser = None,
) -> Any:
    """生成 AI 周报

    根据用户上传的模板和描述,生成结构化的周报内容.

    Args:
        request: 生成周报请求
        current_user: 当前登录用户

    Returns:
        GenerateReportResponse: 生成的周报内容
    """
    try:
        # 构造提示词
        prompt = f"""
        你是一名专业的周报生成助手.请根据以下模板和本周工作描述,生成一份完整的周报.

        模板名称: {request.template_name}
        本周工作描述:
        {request.description}

        要求:
        1. 基于模板的结构和风格生成周报
        2. 内容要具体,详细,体现工作成果
        3. 语言要专业,简洁
        4. 包含本周工作总结和下周工作计划
        5. 如有需要,可以合理补充一些具体的工作内容
        """

        # 调用 LLM 生成周报
        ai_client = OpenAIClient()
        ai_response = await ai_client.chat(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o"
        )
        content = ai_response["content"]

        # 构造响应
        import uuid
        from datetime import datetime
        req_id = str(uuid.uuid4())
        ts = datetime.now().isoformat()

        return GenerateReportResponse(
            code=200,
            msg="OK",
            data=content,
            req_id=req_id,
            ts=ts
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": 500, "message": f"生成周报失败: {str(e)}"}
        )


__all__ = ["router"]