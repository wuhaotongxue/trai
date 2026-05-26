#!/usr/bin/env python
# 文件名: multimodal_agent_routes.py
# 作者: wuhao
# 日期: 2026_05_04_20:00:00
# 描述: 多模态Agent API路由 (Skills合规: 类封装)

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_current_user
from infrastructure.database.database import get_database, get_db_session
from infrastructure.database.transcribe_model import AudioTranscribeRecordModel

from infrastructure.agent.multimodal.multimodal_processor import (
    MultimodalProcessor,
    ProcessingResult,
    multimodal_processor,
)
from infrastructure.agent.orchestrator.agent_orchestrator import (
    RoutingResult,
    agent_orchestrator,
)
from infrastructure.agent.types.agent_types import (
    AgentType,
    get_agent_template,
    get_all_agent_types,
)

router = APIRouter(prefix="/agent/multimodal", tags=["Multimodal Agent"])


# ========== Request/Response Models ==========


class ImageAnalysisRequest(BaseModel):
    """图像分析请求"""

    prompt: str = Field(default="请详细描述这张图片的内容", description="分析提示词")
    detail: str = Field(default="auto", description="分析精度(auto/low/high)")


class ImageGenerateRequest(BaseModel):
    """图像生成请求"""

    prompt: str = Field(..., description="图像描述(英文效果更好)")
    size: str = Field(default="1024x1024", description="尺寸")
    quality: str = Field(default="standard", description="质量(standard/hd)")
    style: str = Field(default="vivid", description="风格(vivid/natural)")
    n: int = Field(default=1, ge=1, le=4, description="生成数量")


class AudioTranscribeRequest(BaseModel):
    """语音转文字请求"""

    language: str | None = Field(default=None, description="语言代码(可选)")
    response_format: str = Field(default="json", description="返回格式")


class TTSRequest(BaseModel):
    """文字转语音请求"""

    text: str = Field(..., description="要转换的文本")
    voice: str = Field(default="alloy", description="音色(alloy/echo/fable/onyx/nova/shimmer)")
    response_format: str = Field(default="mp3", description="音频格式(mp3/opus/aac/flac/wav)")
    speed: float = Field(default=1.0, ge=0.25, le=4.0, description="语速")


class PDFParseRequest(BaseModel):
    """PDF解析请求"""

    extract_tables: bool = Field(default=True, description="是否提取表格")
    extract_images: bool = Field(default=False, description="是否提取图片描述")


class SmartRouteRequest(BaseModel):
    """智能路由请求"""

    message: str = Field(..., description="用户输入")
    attachment_type: str | None = Field(default=None, description="附件类型(image/pdf/audio等)")


class TaskDecomposeRequest(BaseModel):
    """任务分解请求"""

    complex_input: str = Field(..., description="复杂任务描述")
    max_subtasks: int = Field(default=5, ge=1, le=10, description="最大子任务数")


# ========== Response Models ==========


class MultimodalResponse(BaseModel):
    """通用多模态响应"""

    success: bool
    output_type: str
    data: Any
    processing_time_ms: float
    tokens_used: int | None = None


class RoutingResponse(BaseModel):
    """路由响应"""

    task_type: str
    agent_type: str
    agent_name: str
    confidence: float
    reasoning: str
    fallback_agents: list[str]


class AgentListResponse(BaseModel):
    """Agent列表响应"""

    agents: list[dict]
    total: int


# ========== 路由端点 ==========


@router.get("/agents", summary="获取所有可用Agent类型")
async def list_all_agents() -> AgentListResponse:
    """
    获取所有可用的Agent类型及其能力信息

    返回:
        - Agent ID,名称,描述
        - 支持的输入/输出模态
        - 推荐使用的模型
        - 是否支持流式输出
    """
    agents = get_all_agent_types()

    return AgentListResponse(
        agents=agents,
        total=len(agents),
    )


@router.get("/agents/{agent_type}", summary="获取Agent详细信息")
async def get_agent_detail(agent_type: str) -> dict:
    """
    获取指定Agent类型的详细配置

    Args:
        agent_type: Agent类型ID

    Returns:
        Agent完整配置(系统提示词,温度,可用工具等)
    """
    try:
        agent_enum = AgentType(agent_type)
        config = get_agent_template(agent_enum)

        if not config:
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_type}")

        return {
            "agent_id": config.agent_id,
            "name": config.name,
            "description": config.description,
            "type": config.type.value,
            "model": config.model,
            "system_prompt": config.system_prompt[:500] + "...",
            "temperature": config.temperature,
            "max_tokens": config.max_tokens,
            "input_modalities": [m.value for m in config.capability.input_modalities],
            "output_modalities": [m.value for m in config.capability.output_modalities],
            "streaming_supported": config.capability.streaming_supported,
            "supported_formats": config.capability.supported_formats,
            "tools": config.tools,
        }

    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")


@router.post("/route", summary="智能任务路由")
async def smart_route(request: SmartRouteRequest) -> RoutingResponse:
    """
    根据用户输入自动选择最合适的Agent

    功能:
    - 基于关键词和语义分析进行智能路由
    - 支持附件类型判断(图片→视觉Agent,PDF→文档Agent等)
    - 提供备选Agent列表

    使用场景:
    - 用户不确定该使用哪个Agent时
    - 需要自动分类用户请求时
    """
    attachments = [request.attachment_type] if request.attachment_type else None

    routing_result: RoutingResult = await agent_orchestrator.route(
        user_input=request.message,
        attachments=attachments,
    )

    # 获取Agent名称
    primary_config = get_agent_template(routing_result.agent_type)

    return RoutingResponse(
        task_type=routing_result.task_type.value,
        agent_type=routing_result.agent_type.value,
        agent_name=primary_config.name if primary_config else "Unknown",
        confidence=routing_result.confidence,
        reasoning=routing_result.reasoning,
        fallback_agents=[a.value for a in routing_result.fallback_agents],
    )


@router.post("/decompose", summary="分解复杂任务")
async def decompose_task(request: TaskDecomposeRequest) -> dict:
    """
    将复杂任务分解为多个子任务

    功能:
    - 自动识别任务中的多个需求点
    - 为每个子任务分配合适的Agent
    - 返回结构化的子任务列表

    示例输入:
        "帮我翻译这段英文,然后总结要点,最后生成一张配图"

    输出:
        [
            {task: "翻译...", agent: "translator"},
            {task: "总结...", agent: "summarizer"},
            {task: "生成图片...", agent: "image_generator"}
        ]
    """
    subtasks = await agent_orchestrator.decompose_complex_task(
        user_input=request.complex_input,
        max_subtasks=request.max_subtasks,
    )

    return {
        "original_input": request.complex_input,
        "subtask_count": len(subtasks),
        "subtasks": [
            {
                "task_id": st.task_id,
                "task_type": st.task_type.value,
                "agent_name": st.primary_agent.name,
                "agent_type": st.primary_agent.type.value,
                "input_preview": (st.context.get("original_input", "")[:50] if st.context else ""),
            }
            for st in subtasks
        ],
    }


# ========== 图像相关端点 ==========


@router.post("/vision/analyze", summary="图像理解分析")
async def analyze_image(
    file: UploadFile = File(..., description="图片文件"),
    request: ImageAnalysisRequest = Depends(),
) -> MultimodalResponse:
    """
    图像理解和分析(GPT-4 Vision)

    功能:
    - 详细描述图片内容
    - OCR文字识别
    - 物体和场景识别
    - 回答关于图片的问题

    支持格式: JPG, PNG, GIF, WebP, BMP
    最大大小: 20MB
    """
    # 验证文件
    content = await file.read()

    is_valid, error_msg = MultimodalProcessor.validate_file(content, file.filename or "image.jpg")

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    result: ProcessingResult = await multimodal_processor.analyze_image(
        image_data=content,
        prompt=request.prompt,
        detail=request.detail,
    )

    return MultimodalResponse(
        success=result.status.value == "success",
        output_type=result.output_type,
        data=result.output_data,
        processing_time_ms=result.processing_time_ms,
        tokens_used=result.tokens_used,
    )


@router.post("/vision/generate", summary="AI图像生成")
async def generate_image(request: ImageGenerateRequest) -> MultimodalResponse:
    """
    AI图像生成(DALL-E 3)

    功能:
    - 根据文字描述生成高质量图像
    - 多种尺寸和质量选项
    - 支持 vivid(生动) 和 natural(自然) 两种风格

    注意事项:
    - 英文提示词效果更好
    - 避免涉及公众人物,商标等受版权保护的内容
    """
    result: ProcessingResult = await multimodal_processor.generate_image(
        prompt=request.prompt,
        size=request.size,
        quality=request.quality,
        style=request.style,
        n=request.n,
    )

    return MultimodalResponse(
        success=result.status.value == "success",
        output_type=result.output_type,
        data=result.output_data,
        processing_time_ms=result.processing_time_ms,
    )


# ========== 音频相关端点 ==========


@router.post("/audio/transcribe", summary="语音转文字")
async def speech_to_text(
    file: UploadFile = File(..., description="音频文件"),
    request: AudioTranscribeRequest = Depends(),
) -> MultimodalResponse:
    """
    语音转文字(Whisper)

    功能:
    - 高精度语音识别
    - 支持多种语言和方言
    - 自动检测语言或手动指定
    - 支持带背景噪音的音频

    支持格式: MP3, WAV, M4A, FLAC, OGG, WebM
    最大大小: 25MB
    """
    content = await file.read()

    is_valid, error_msg = MultimodalProcessor.validate_file(content, file.filename or "audio.mp3", max_size_mb=100)

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    result: ProcessingResult = await multimodal_processor.speech_to_text(
        audio_data=content,
        language=request.language,
        response_format=request.response_format,
        filename=file.filename,
    )

    return MultimodalResponse(
        success=result.status.value == "success",
        output_type=result.output_type,
        data=result.output_data,
        processing_time_ms=result.processing_time_ms,
        tokens_used=result.tokens_used,
    )


@router.post("/audio/synthesize", summary="文字转语音")
async def text_to_speech(request: TTSRequest) -> MultimodalResponse:
    """
    文字转语音(TTS)

    功能:
    - 自然流畅的语音合成
    - 6种音色选择(alloy/echo/fable/onyx/nova/shimmer)
    - 可调节语速(0.25x - 4.0x)
    - 多种音频格式输出

    音色说明:
    - alloy: 中性音色(推荐默认)
    - echo: 低沉男声
    - fable: 故事叙述风格
    - onyx: 深沉稳重
    - nova: 清亮女声
    - shimmer: 柔和温暖
    """
    result: ProcessingResult = await multimodal_processor.text_to_speech(
        text=request.text,
        voice=request.voice,
        response_format=request.response_format,
        speed=request.speed,
    )

    if result.status.value == "success":
        from fastapi.responses import Response as FastAPIResponse

        audio_bytes = result.output_data.get("audio_bytes", b"")

        return FastAPIResponse(
            content=audio_bytes,
            media_type=f"audio/{request.response_format}",
            headers={
                "X-Processing-Time": f"{result.processing_time_ms:.1f}ms",
                "X-Voice": request.voice,
            },
        )

    else:
        raise HTTPException(status_code=500, detail=str(result.output_data))


# ========== 文档相关端点 ==========


@router.post("/document/pdf/parse", summary="PDF文档解析")
async def parse_pdf(
    file: UploadFile = File(..., description="PDF文件"),
    request: PDFParseRequest = Depends(),
) -> MultimodalResponse:
    """
    PDF文档解析

    功能:
    - 提取全部文本内容(保留层级结构)
    - 表格数据提取(转为结构化格式)
    - 图片内容描述和分析
    - 元数据提取(标题,作者,日期等)

    最大大小: 50MB
    """
    content = await file.read()

    is_valid, error_msg = MultimodalProcessor.validate_file(content, file.filename or "document.pdf", max_size_mb=50)

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    result: ProcessingResult = await multimodal_processor.parse_pdf(
        pdf_data=content,
        extract_tables=request.extract_tables,
        extract_images=request.extract_images,
    )

    return MultimodalResponse(
        success=result.status.value == "success",
        output_type=result.output_type,
        data=result.output_data,
        processing_time_ms=result.processing_time_ms,
    )


@router.post("/document/ocr", summary="OCR文字识别")
async def ocr_recognize(
    file: UploadFile = File(..., description="包含文字的图片"),
) -> MultimodalResponse:
    """
    OCR高精度文字识别

    功能:
    - 扫描件文字提取
    - 手写体识别
    - 多语言混合识别
    - 表格结构保持

    适用场景:
    - 扫描文档数字化
    - 名片/发票/证件识别
    - 截图中的文字提取
    """
    content = await file.read()

    is_valid, error_msg = MultimodalProcessor.validate_file(content, file.filename or "image.jpg")

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    result: ProcessingResult = await multimodal_processor.ocr_recognize(image_data=content)

    return MultimodalResponse(
        success=result.status.value == "success",
        output_type=result.output_type,
        data=result.output_data,
        processing_time_ms=result.processing_time_ms,
    )


async def _process_transcribe_result(record_id: uuid.UUID, text: str, file_path: str, file_name: str, creator_id: str):
    """后台处理转写结果：保存到 S3、数据库，发送飞书通知"""
    try:
        from datetime import datetime
        import uuid
        import os
        import tempfile
        from infrastructure.storage.s3_storage import get_s3_storage
        from infrastructure.database.database import get_database
        
        s3_storage = get_s3_storage()
        base_name = os.path.splitext(file_name)[0]
        
        # 1. 生成下载文件
        md_content = f"# {base_name} - 语音转写报告\n\n**转写时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n---\n\n{text}"
        txt_content = f"语音转写结果：{base_name}\n时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n{text}"
        
        with tempfile.TemporaryDirectory() as tmpdir:
            md_path = os.path.join(tmpdir, f"{base_name}.md")
            txt_path = os.path.join(tmpdir, f"{base_name}.txt")
            pdf_path = os.path.join(tmpdir, f"{base_name}.pdf")
            
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(txt_content)
            with open(pdf_path, "wb") as f:
                f.write(md_content.encode("utf-8"))
            
            # 2. 上传到 S3
            date_prefix = datetime.now().strftime("%Y%m")
            md_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.md"
            txt_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.txt"
            pdf_key = f"transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.pdf"
            
            await s3_storage.upload_file_async(md_path, md_key)
            await s3_storage.upload_file_async(txt_path, txt_key)
            await s3_storage.upload_file_async(pdf_path, pdf_key)
            
            md_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{md_key}"
            txt_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{txt_key}"
            pdf_url = f"{os.getenv('S3_ENDPOINT_URL')}/{os.getenv('S3_BUCKET_NAME')}/{pdf_key}"
            
            # 3. 更新数据库
            db = get_database().get_session()
            try:
                record = db.query(AudioTranscribeRecordModel).filter(AudioTranscribeRecordModel.id == record_id).first()
                if record:
                    record.status = "success"
                    record.result_text = text
                    record.md_url = md_url
                    record.txt_url = txt_url
                    record.pdf_url = pdf_url
                    db.commit()
            finally:
                db.close()
            
            # 4. 发送飞书通知
            _send_transcribe_notify(creator_id, file_name, text, md_url, txt_url, pdf_url)
            
        logger.info(f"转写结果处理完成：{record_id}")
        
    except Exception as e:
        logger.error(f"处理转写结果异常：{e}")
        # 更新状态为失败
        from infrastructure.database.database import get_database
        db = get_database().get_session()
        try:
            record = db.query(AudioTranscribeRecordModel).filter(AudioTranscribeRecordModel.id == record_id).first()
            if record:
                record.status = "failed"
                db.commit()
        finally:
            db.close()
    finally:
        # 清理临时文件
        if os.path.exists(file_path):
            os.remove(file_path)


def _send_transcribe_notify(user_id: str, file_name: str, text: str, md_url: str, txt_url: str, pdf_url: str) -> None:
    """发送音频转写完成飞书通知（不阻塞主请求）"""
    if not os.getenv("NOTIFY_FEISHU_AUDIO_ENABLED", "true").lower() == "true":
        return
    try:
        from infrastructure.notify.feishu_ai_notify import get_feishu_ai_notify_service
        service = get_feishu_ai_notify_service()
        card_content = f"""**📝 音频转写完成**

**用户**: {user_id}
**文件**: {file_name}

**转写内容预览**:
{text[:200]}{'...' if len(text) > 200 else ''}

**下载链接**:
- 📝 [Markdown]({md_url})
- 📄 [TXT]({txt_url})
- 📑 [PDF]({pdf_url})"""
        
        service.send_card(
            title="🎙️ 音频转写完成通知",
            content=card_content,
            extra={"level": "INFO"}
        )
        logger.info(f"飞书通知发送成功：{user_id} - {file_name}")
    except Exception as e:
        logger.error(f"发送飞书通知失败：{e}")


__all__ = ["router"]
