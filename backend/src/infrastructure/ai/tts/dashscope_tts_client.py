#!/usr/bin/env python
# 文件名: dashscope_tts_client.py
# 作者: wuhao
# 日期: 2026_05_24_16:20:00
# 描述: 基于阿里百炼 (DashScope) 的 CosyVoice 声音克隆与合成实现

import os
import uuid

import dashscope
from dashscope.audio.tts_v2 import AudioFormat, SpeechSynthesizer, VoiceEnrollmentService
from loguru import logger

from core.exceptions import ExternalServiceError

from .base_tts_client import ITTSClient


class DashScopeTTSClient(ITTSClient):
    """
    基于 DashScope API 的 CosyVoice TTS 客户端.
    """

    def __init__(self) -> None:
        """
        初始化 DashScope TTS 客户端.

        参数:
            无

        返回:
            None

        异常:
            无
        """
        api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("AI_DASHSCOPE_API_KEY")
        if not api_key:
            logger.warning("未配置 DASHSCOPE_API_KEY，DashScope 声音克隆功能可能无法使用")
        dashscope.api_key = api_key
        self.enrollment_service = VoiceEnrollmentService()

    def generate_speech(self, text: str, voice: str = "longxiaochun") -> bytes:
        """
        使用预设音色合成语音.

        参数:
            text: 要合成的文本.
            voice: 预设音色名称, 默认 longxiaochun (龙小纯).

        返回:
            bytes: 合成后的音频字节数据 (WAV格式).

        异常:
            ExternalServiceError: API 调用失败时抛出.
        """
        try:
            logger.info(f"开始 DashScope TTS 合成 | voice: {voice} | 文本长度: {len(text)}")
            synthesizer = SpeechSynthesizer(
                model="cosyvoice-v1", voice=voice, format=AudioFormat.WAV_24000HZ_MONO_16BIT
            )
            audio_bytes = synthesizer.call(text)

            if audio_bytes is None:
                raise ExternalServiceError("DashScope TTS 返回数据为空，请检查 API Key 或配额状态")

            logger.info(f"语音合成成功 | 音频大小: {len(audio_bytes)} bytes")
            return audio_bytes
        except Exception as e:
            logger.warning(f"DashScope TTS 合成失败: {str(e)}")
            raise ExternalServiceError(f"语音合成失败: {str(e)}")

    def clone_and_synthesize(self, text: str, reference_audio_url: str, language: str = "zh") -> bytes:
        """
        零样本声音克隆并合成 (通过云端 API).

        参数:
            text: 要合成的文本
            reference_audio_url: 参考音频的公网可访问 URL
            language: 语言提示 (zh, en, ja, ko, 等)

        返回:
            bytes: 合成后的音频字节数据 (WAV格式)

        异常:
            ExternalServiceError: 云端 API 调用失败时抛出
        """
        try:
            logger.info(f"开始 DashScope 声音克隆注册 | 参考音频: {reference_audio_url} | 语言: {language}")
            prefix = f"clone_{uuid.uuid4().hex[:6]}"
            voice_id = self.enrollment_service.create_voice(
                target_model="cosyvoice-v1",
                prefix=prefix,
                url=reference_audio_url,
            )
            logger.info(f"音色注册成功 | voice_id: {voice_id}")

            logger.info(f"开始语音合成 | 文本长度: {len(text)}")
            synthesizer = SpeechSynthesizer(
                model="cosyvoice-v1", voice=voice_id, format=AudioFormat.WAV_24000HZ_MONO_16BIT
            )

            audio_bytes = synthesizer.call(text)
            logger.info(f"语音合成成功 | 音频大小: {len(audio_bytes)} bytes")
            return audio_bytes

        except Exception as e:
            logger.warning(f"DashScope CosyVoice API 调用失败: {str(e)}")
            raise ExternalServiceError(f"声音克隆失败: {str(e)}")
