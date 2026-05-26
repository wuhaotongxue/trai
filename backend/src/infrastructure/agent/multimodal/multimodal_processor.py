#!/usr/bin/env python
# 文件名: multimodal_processor.py
# 作者: wuhao
# 日期: 2026_05_04_19:15:00
# 描述: 多模态处理器 (Skills合规: 类封装)

from __future__ import annotations

import base64
import io
import mimetypes
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, BinaryIO

from loguru import logger


class ProcessingStatus(str, Enum):
    """处理状态"""

    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class MediaContent:
    """媒体内容数据类"""

    content_type: str  # MIME类型 (image/jpeg, audio/mp3等)
    data: bytes | str  # 原始数据(二进制或base64)
    filename: str | None = None  # 文件名
    size_bytes: int = 0  # 大小(字节)
    metadata: dict[str, Any] = field(default_factory=dict)  # 额外元数据

    def to_base64(self) -> str:
        """转换为base64字符串"""
        if isinstance(self.data, str):
            return self.data
        return base64.b64encode(self.data).decode("utf-8")

    def to_data_url(self) -> str:
        """转换为data URL格式(data:image/jpeg;base64,...)"""
        b64 = self.to_base64()
        return f"data:{self.content_type};base64,{b64}"


@dataclass
class ProcessingResult:
    """处理结果"""

    status: ProcessingStatus
    output_type: str  # 输出类型(text/image/audio等)
    output_data: Any  # 处理后的数据
    processing_time_ms: float = 0.0
    tokens_used: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


class MultimodalProcessor:
    """
    多模态处理器类 (Skills 规范: 强制类封装)

    功能:
    - 图像理解(Vision API调用)
    - 图像生成(DALL-E等)
    - 语音转文字(Whisper)
    - 文字转语音(TTS)
    - PDF文档解析
    - OCR文字识别
    - 音频分析

    使用示例:
        processor = MultimodalProcessor()

        # 图像理解
        result = await processor.analyze_image(image_data, question="描述这张图片")

        # 语音识别
        result = await processor.speech_to_text(audio_data)
    """

    # 支持的文件类型映射
    SUPPORTED_FORMATS = {
        "image": ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"],
        "audio": ["mp3", "wav", "m4a", "flac", "ogg", "aac", "webm"],
        "video": ["mp4", "mov", "mkv", "avi", "webm", "flv"],
        "pdf": ["pdf"],
        "document": ["docx", "doc", "txt", "md", "csv", "xlsx", "xls"],
    }

    # 最大文件大小限制 (MB)
    MAX_SIZES = {
        "image": 20,
        "audio": 100,
        "video": 100,
        "pdf": 50,
        "document": 10,
    }

    def __init__(self):
        """初始化多模态处理器"""
        self._ai_client = None
        self._vision_client = None
        logger.info("MultimodalProcessor initialized")

    def _get_ai_client(self):
        """延迟初始化AI客户端"""
        if self._ai_client is None:
            from infrastructure.ai.core.openai_client import OpenAIClient

            self._ai_client = OpenAIClient()
        return self._ai_client

    def _get_vision_client(self):
        """延迟初始化本地视觉客户端"""
        if self._vision_client is None:
            from infrastructure.ai.vision.vision_client import LocalModelScopeVisionClient

            self._vision_client = LocalModelScopeVisionClient()
        return self._vision_client

    def _use_local_vision(self) -> bool:
        """判断是否使用本地视觉模型"""
        vision_model = os.getenv("VISION_MODEL", "")
        vision_provider = os.getenv("VISION_PROVIDER", os.getenv("LLM_PROVIDER", ""))
        return (
            vision_model.startswith("Qwen/")
            or vision_model.startswith("local:")
            or vision_provider == "qwen_vl"
            or vision_provider == "local_vision"
        )

    async def analyze_image(
        self,
        image_data: bytes | BinaryIO,
        prompt: str = "请详细描述这张图片的内容",
        detail: str = "auto",  # auto/low/high
        **kwargs,
    ) -> ProcessingResult:
        """
        图像理解/分析

        Args:
            image_data: 图片数据(字节流或文件对象)
            prompt: 分析提示词
            detail: 分析精度(auto/low/high)

        Returns:
            ProcessingResult: 包含分析结果
        """
        import time

        start_time = time.perf_counter()

        try:
            # 确定MIME类型
            if hasattr(image_data, "read"):
                raw_data = image_data.read()
                content_type = self._guess_content_type(getattr(image_data, "name", "image.jpg"))
            else:
                raw_data = image_data if isinstance(image_data, bytes) else image_data.encode()
                content_type = "image/jpeg"

            # 转换为base64
            base64_image = base64.b64encode(raw_data).decode("utf-8")

            # 判断是否使用本地视觉模型
            if self._use_local_vision():
                # 使用本地 ModelScope 视觉模型
                logger.info("使用本地 ModelScope 视觉模型")
                vision_client = self._get_vision_client()

                response = await vision_client.analyze_image(
                    image_data=raw_data,
                    prompt=prompt,
                    max_tokens=kwargs.get("max_tokens", 2048),
                    temperature=kwargs.get("temperature", 0.7),
                )

                if response.error:
                    raise Exception(response.error)

                duration_ms = (time.perf_counter() - start_time) * 1000

                return ProcessingResult(
                    status=ProcessingStatus.SUCCESS,
                    output_type="text",
                    output_data=response.content,
                    processing_time_ms=duration_ms,
                    tokens_used=response.usage.get("total_tokens", 0),
                    metadata={
                        "model": response.model,
                        "provider": "local_vision",
                        "image_size_mb": len(raw_data) / (1024 * 1024),
                        "detail_level": detail,
                    },
                )
            else:
                # 使用 API 视觉模型
                logger.info("使用 API 视觉模型")
                vision_model = os.getenv("VISION_MODEL", "gpt-4o-vision-preview")
                client = self._get_ai_client()

                # 构建Vision API请求
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{content_type};base64,{base64_image}",
                                    "detail": detail,
                                },
                            },
                        ],
                    }
                ]

                response = await client.chat(
                    messages=messages,
                    model=vision_model,
                    max_tokens=2000,
                )

                duration_ms = (time.perf_counter() - start_time) * 1000

                return ProcessingResult(
                    status=ProcessingStatus.SUCCESS,
                    output_type="text",
                    output_data=response.get("content", ""),
                    processing_time_ms=duration_ms,
                    tokens_used=response.get("total_tokens", 0),
                    metadata={
                        "model": vision_model,
                        "provider": "api",
                        "image_size_mb": len(raw_data) / (1024 * 1024),
                        "detail_level": detail,
                    },
                )

        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",  # 256x256, 512x512, 1024x1024, 1792x1024, 1024x1792
        quality: str = "standard",  # standard/hd
        style: str = "vivid",  # vivid/natural
        n: int = 1,
        **kwargs,
    ) -> ProcessingResult:
        """
        图像生成(文生图)

        Args:
            prompt: 图像描述
            size: 图像尺寸
            quality: 质量(standard/hd)
            style: 风格(vivid-生动/natural-自然)
            n: 生成数量

        Returns:
            ProcessingResult: 包含生成的图像URL或base64
        """
        import time

        start_time = time.perf_counter()

        try:
            client = self._get_ai_client()

            response = await client.generate_image(
                prompt=prompt,
                size=size,
                quality=quality,
                style=style,
                n=n,
            )

            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.SUCCESS,
                output_type="image",
                output_data=response,
                processing_time_ms=duration_ms,
                metadata={
                    "prompt": prompt[:100],
                    "size": size,
                    "quality": quality,
                    "style": style,
                },
            )

        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    async def speech_to_text(
        self,
        audio_data: bytes | BinaryIO,
        language: str | None = None,  # 自动检测或指定 (zh/en/ja 等)
        response_format: str = "json",  # json/text/srt/vtt/verbose_json
        filename: str | None = None,  # 文件名，用于检测是否为视频
        **kwargs,
    ) -> ProcessingResult:
        """
        语音转文字 (STT) - 支持音频和视频文件

        Args:
            audio_data: 音频数据
            language: 语言代码 (可选，自动检测)
            response_format: 返回格式
            filename: 文件名，用于检测是否为视频文件

        Returns:
            ProcessingResult: 包含转录文本
        """
        import time
        import tempfile
        import os
        import subprocess
        import asyncio

        start_time = time.perf_counter()

        try:
            # 使用本地 ASR 客户端进行语音转文字
            from infrastructure.ai.audio.local_asr_client import get_asr_client

            # 检测是否为视频文件
            is_video = False
            if filename:
                video_extensions = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.flv']
                is_video = any(filename.lower().endswith(ext) for ext in video_extensions)

            # 将数据保存到临时文件
            with tempfile.NamedTemporaryFile(suffix=".wav" if not is_video else ".mp4", delete=False) as tmp_file:
                if hasattr(audio_data, "read"):
                    tmp_file.write(audio_data.read())
                else:
                    tmp_file.write(audio_data)
                tmp_path = tmp_file.name

            # 如果是视频文件，先提取音频
            if is_video:
                logger.info(f"检测到视频文件：{filename}, 开始提取音频")
                audio_path = tmp_path + ".extracted.wav"
                
                cmd = [
                    "ffmpeg",
                    "-y",
                    "-i", tmp_path,
                    "-vn",
                    "-ac", "1",
                    "-ar", "16000",
                    audio_path,
                ]
                
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode != 0:
                    raise RuntimeError(f"音频提取失败：{stderr.decode('utf-8', errors='ignore')}")
                
                # 使用提取的音频文件
                tmp_path = audio_path
                logger.info(f"音频提取完成：{audio_path}")

            try:
                asr_client = get_asr_client()
                result = await asr_client.transcribe(tmp_path)

                # 本地 ASR 返回的是 SRT 格式字符串，需要提取纯文本
                if not result or not isinstance(result, str):
                    raise Exception("ASR 返回空结果")

                # 从 SRT 格式中提取纯文本
                text_content = self._extract_text_from_srt(result)

                duration_ms = (time.perf_counter() - start_time) * 1000

                return ProcessingResult(
                    status=ProcessingStatus.SUCCESS,
                    output_type="text",
                    output_data=text_content,
                    processing_time_ms=duration_ms,
                    tokens_used=len(text_content.split()),
                    metadata={
                        "language": language or "auto-detected",
                        "format": response_format,
                        "source": "video" if is_video else "audio",
                    },
                )
            finally:
                # 清理临时文件
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                # 如果是视频，还要清理提取的音频文件
                if is_video:
                    extracted_audio = tmp_path + ".extracted.wav"
                    if os.path.exists(extracted_audio):
                        os.remove(extracted_audio)

        except Exception as e:
            logger.error(f"Speech-to-text failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    def _extract_text_from_srt(self, srt_content: str) -> str:
        """从 SRT 格式字符串中提取纯文本"""
        lines = srt_content.strip().split("\n")
        text_parts = []
        
        for line in lines:
            line = line.strip()
            # 跳过数字序号、时间戳行、空行
            if not line:
                continue
            if line.isdigit():
                continue
            if "-->" in line:
                continue
            text_parts.append(line)
        
        return "".join(text_parts)

    async def text_to_speech(
        self,
        text: str,
        voice: str = "alloy",  # alloy/echo/fable/onyx/nova/shimmer
        response_format: str = "mp3",  # mp3/opus/aac/flac/wav/pcm
        speed: float = 1.0,  # 0.25-4.0
        **kwargs,
    ) -> ProcessingResult:
        """
        文字转语音(TTS)

        Args:
            text: 要转换的文本
            voice: 音色选择
            response_format: 音频格式
            speed: 语速(0.25-4.0)

        Returns:
            ProcessingResult: 包含音频数据
        """
        import time

        start_time = time.perf_counter()

        try:
            client = self._get_ai_client()

            audio_data = await client.synthesize_speech(
                text=text,
                voice=voice,
                response_format=response_format,
                speed=speed,
            )

            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.SUCCESS,
                output_type="audio",
                output_data={
                    "audio_bytes": audio_data,
                    "format": response_format,
                    "voice": voice,
                },
                processing_time_ms=duration_ms,
                metadata={
                    "text_length": len(text),
                    "voice": voice,
                    "speed": speed,
                },
            )

        except Exception as e:
            logger.error(f"Text-to-speech failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    async def parse_pdf(
        self,
        pdf_data: bytes | BinaryIO,
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_fallback: bool = True,
        **kwargs,
    ) -> ProcessingResult:
        """
        PDF文档解析

        Args:
            pdf_data: PDF文件数据
            extract_tables: 是否提取表格
            extract_images: 是否提取图片描述
            ocr_fallback: 是否对扫描件使用OCR回退

        Returns:
            ProcessingResult: 包含解析结果(Markdown文本)
        """
        import time

        start_time = time.perf_counter()

        try:
            # 方法1: 尝试使用PyMuPDF直接解析
            text_content = ""
            tables = []

            try:
                import fitz  # PyMuPDF

                if hasattr(pdf_data, "read"):
                    doc = fitz.open(stream=pdf_data.read(), filetype="pdf")
                else:
                    doc = fitz.open(stream=pdf_data, filetype="pdf")

                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text_content += f"\n## 第{page_num + 1}页\n\n"
                    text_content += page.get_text()

                    if extract_tables:
                        # 尝试提取表格
                        tabs = page.find_tables()
                        for tab_idx, table in enumerate(tabs):
                            table_data = table.extract()
                            tables.append(
                                {
                                    "page": page_num + 1,
                                    "table_index": tab_idx,
                                    "data": table_data,
                                }
                            )

                doc.close()

            except ImportError:
                # PyMuPDF未安装,使用Vision API作为备选
                logger.warning("PyMuPDF not installed, falling back to Vision API")

                if hasattr(pdf_data, "read"):
                    pdf_bytes = pdf_data.read()
                else:
                    pdf_bytes = pdf_data

                # 将PDF转为图像后使用Vision API(简化版)
                pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

                client = self._get_ai_client()
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "请完整提取这个PDF文档的所有文本内容,保持原有的结构和层级."},
                            {
                                "type": "file",
                                "file_data": f"data:application/pdf;base64,{pdf_base64}",
                            },
                        ],
                    }
                ]

                response = await client.chat(messages=messages, model="gpt-4o-turbo")
                text_content = response.get("content", "")

            duration_ms = (time.perf_counter() - start_time) * 1000

            result_data = {
                "text": text_content,
                "tables": tables if extract_tables else [],
                "page_count": len(tables) + 1 if tables else 1,
            }

            return ProcessingResult(
                status=ProcessingStatus.SUCCESS,
                output_type="document",
                output_data=result_data,
                processing_time_ms=duration_ms,
                metadata={
                    "extract_tables": extract_tables,
                    "extract_images": extract_images,
                    "table_count": len(tables),
                },
            )

        except Exception as e:
            logger.error(f"PDF parsing failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    async def ocr_recognize(
        self,
        image_data: bytes | BinaryIO,
        languages: list[str] | None = None,  # 支持的语言列表
        **kwargs,
    ) -> ProcessingResult:
        """
        OCR文字识别

        Args:
            image_data: 图像数据
            languages: 要识别的语言(如["zh", "en"])

        Returns:
            ProcessingResult: 包含识别的文本
        """
        import time

        start_time = time.perf_counter()

        try:
            prompt = "请准确识别图片中的所有文字内容.如果是表格,请用Markdown表格格式输出.保持原有的排版结构."

            if languages and len(languages) > 0:
                prompt += f"\n主要语言: {', '.join(languages)}"

            result = await self.analyze_image(image_data, prompt=prompt, detail="high")

            return ProcessingResult(
                status=result.status,
                output_type="text",
                output_data=result.output_data,
                processing_time_ms=result.processing_time_ms,
                metadata={**result.metadata, "ocr_mode": True},
            )

        except Exception as e:
            logger.error(f"OCR recognition failed: {e}")
            duration_ms = (time.perf_counter() - start_time) * 1000

            return ProcessingResult(
                status=ProcessingStatus.FAILED,
                output_type="error",
                output_data=str(e),
                processing_time_ms=duration_ms,
            )

    @staticmethod
    def _guess_content_type(filename: str) -> str:
        """根据文件名猜测MIME类型"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"

    @staticmethod
    def validate_file(file_data: bytes, filename: str, max_size_mb: int = 20) -> tuple[bool, str]:
        """
        验证文件是否可处理

        Args:
            file_data: 文件数据
            filename: 文件名
            max_size_mb: 最大允许大小(MB)

        Returns:
            (是否有效, 错误消息)
        """
        size_mb = len(file_data) / (1024 * 1024)

        if size_mb > max_size_mb:
            return False, f"File too large ({size_mb:.1f}MB > {max_size_mb}MB)"

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        supported = []
        for fmt, extensions in MultimodalProcessor.SUPPORTED_FORMATS.items():
            if ext in extensions:
                supported.append(fmt)

        if not supported:
            return False, f"Unsupported file format: .{ext}"

        return True, ""


# 全局单例实例
multimodal_processor = MultimodalProcessor()


__all__ = [
    "MultimodalProcessor",
    "MediaContent",
    "ProcessingResult",
    "ProcessingStatus",
    "multimodal_processor",
]
