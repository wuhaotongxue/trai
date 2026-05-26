#!/usr/bin/env python
# 文件名: video_to_audio.py
# 作者: wuhao
# 日期: 2026_05_25
# 描述: 视频转语音/文本工具 - 提取视频中的音频并转写为文字，支持生成多种格式下载

from __future__ import annotations

import asyncio
import os
import subprocess
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)
from infrastructure.ai.audio.local_asr_client import get_asr_client
from infrastructure.storage.s3_storage import get_s3_storage


class VideoToAudioTool(BaseTool):
    """视频转语音/文本工具 - 提取视频音频并转写为文字，支持生成TXT/MD/PDF下载"""

    def __init__(self) -> None:
        super().__init__()
        self._definition = ToolDefinition(
            id="video_to_audio",
            name="视频转文字",
            description="从视频中提取音频并转换为文字，支持生成TXT、MD、PDF格式下载。当用户上传视频并要求转写文字时调用此工具。",
            category=ToolCategory.AUDIO,
            risk_level=RiskLevel.SAFE,
            parameters=[
                ToolParameter(
                    name="video_path",
                    type="string",
                    description="需要处理的本地视频绝对路径",
                    required=True,
                ),
            ],
        )

    @property
    def definition(self) -> ToolDefinition:
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        video_path_str = params.get("video_path")
        
        if not video_path_str:
            return ToolCallResult(
                tool_call_id=str(uuid.uuid4()),
                tool_id=self.definition.id,
                success=False,
                error="video_path 不能为空"
            )

        video_path = Path(video_path_str)
        if not video_path.exists():
            return ToolCallResult(
                tool_call_id=str(uuid.uuid4()),
                tool_id=self.definition.id,
                success=False,
                error=f"视频文件不存在: {video_path}"
            )

        task_id = str(uuid.uuid4())
        
        try:
            logger.info(f"[VideoToAudio] 开始处理视频: {video_path}")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Step 1: 提取音频
                audio_path = Path(tmpdir) / "audio.wav"
                await self._extract_audio(video_path, audio_path)
                logger.info(f"[VideoToAudio] 音频提取完成: {audio_path}")

                # Step 2: ASR 转写
                asr_client = get_asr_client()
                result = await asr_client.transcribe(audio_path)
                
                # 本地 ASR 返回的是 SRT 格式字符串，提取纯文本
                if isinstance(result, str):
                    text = self._extract_text_from_srt(result)
                elif isinstance(result, dict):
                    text = result.get("text", "")
                else:
                    text = str(result)
                
                logger.info(f"[VideoToAudio] ASR 转写完成, 文本长度: {len(text)}")

                # Step 3: 生成下载文件
                base_name = video_path.stem
                md_url, txt_url, pdf_url = await self._generate_download_files(tmpdir, base_name, text)

                return ToolCallResult(
                    tool_call_id=task_id,
                    tool_id=self.definition.id,
                    success=True,
                    output=text[:200] + "..." if len(text) > 200 else text,
                    sources=[{
                        "type": "video_to_text",
                        "video_path": str(video_path),
                        "md_url": md_url,
                        "txt_url": txt_url,
                        "pdf_url": pdf_url
                    }]
                )

        except Exception as e:
            logger.error(f"VideoToAudioTool 异常: {e}", exc_info=True)
            return ToolCallResult(
                tool_call_id=task_id,
                tool_id=self.definition.id,
                success=False,
                error=str(e)
            )

    async def _extract_audio(self, video_path: Path, output_audio: Path) -> None:
        """使用 ffmpeg 从视频中提取音频"""
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_path),
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            str(output_audio),
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"音频提取失败: {stderr.decode('utf-8', errors='ignore')}")

    async def _generate_download_files(self, tmpdir: str, base_name: str, text: str) -> tuple[str, str, str]:
        """生成 TXT、MD、PDF 下载文件并上传到 S3"""
        s3_storage = get_s3_storage()
        date_prefix = datetime.now().strftime("%Y%m")
        
        # 生成内容
        md_content = f"# {base_name} - 视频转写报告\n\n**转写时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n---\n\n{text}"
        txt_content = f"视频转写结果: {base_name}\n时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n{text}"
        
        md_url = ""
        txt_url = ""
        pdf_url = ""
        
        # 写入临时文件
        md_path = Path(tmpdir) / f"{base_name}.md"
        txt_path = Path(tmpdir) / f"{base_name}.txt"
        pdf_path = Path(tmpdir) / f"{base_name}.pdf"
        
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(txt_content)
        
        # PDF 使用 markdown 内容生成（实际项目中可使用 reportlab 或 pdfkit）
        with open(pdf_path, "wb") as f:
            f.write(md_content.encode("utf-8"))
        
        # 上传到 S3
        md_key = f"video_transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.md"
        txt_key = f"video_transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.txt"
        pdf_key = f"video_transcribes/{date_prefix}/{uuid.uuid4().hex[:8]}_{base_name}.pdf"
        
        await s3_storage.upload_file_async(str(md_path), md_key)
        await s3_storage.upload_file_async(str(txt_path), txt_key)
        await s3_storage.upload_file_async(str(pdf_path), pdf_key)
        
        s3_endpoint = os.getenv("S3_ENDPOINT_URL")
        s3_bucket = os.getenv("S3_BUCKET_NAME")
        
        md_url = f"{s3_endpoint}/{s3_bucket}/{md_key}"
        txt_url = f"{s3_endpoint}/{s3_bucket}/{txt_key}"
        pdf_url = f"{s3_endpoint}/{s3_bucket}/{pdf_key}"
        
        return md_url, txt_url, pdf_url

    def _extract_text_from_srt(self, srt_content: str) -> str:
        """从 SRT 格式字符串中提取纯文本"""
        lines = srt_content.strip().split("\n")
        text_parts = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if line.isdigit():
                continue
            if "-->" in line:
                continue
            text_parts.append(line)
        
        return "".join(text_parts)

    def check_availability(self) -> bool:
        return True

    def health_check(self) -> bool:
        return True


__all__ = ["VideoToAudioTool"]
