import os
import uuid

import dashscope
from dashscope.audio.tts_v2 import AudioFormat, SpeechSynthesizer, VoiceEnrollmentService
from loguru import logger

from core.exceptions import ExternalServiceError


class CosyVoiceClient:
    """CosyVoice 声音克隆与合成客户端 (基于 DashScope API)"""

    def __init__(self) -> None:
        api_key = os.getenv("DASHSCOPE_API_KEY") or os.getenv("AI_DASHSCOPE_API_KEY")
        if not api_key:
            logger.warning("未配置 DASHSCOPE_API_KEY，声音克隆功能可能无法使用")
        dashscope.api_key = api_key
        self.enrollment_service = VoiceEnrollmentService()

    def clone_and_synthesize(self, text: str, reference_audio_url: str, language: str = "zh") -> bytes:
        """
        零样本声音克隆并合成
        
        Args:
            text: 要合成的文本
            reference_audio_url: 参考音频(原声)的公网可访问URL
            language: 语言提示 (zh, en, ja, ko, 等)
            
        Returns:
            合成后的音频字节数据 (WAV格式)
        """
        try:
            logger.info(f"开始声音克隆注册 | 参考音频: {reference_audio_url} | 语言: {language}")
            # 1. 注册音色
            prefix = f"clone_{uuid.uuid4().hex[:6]}"
            voice_id = self.enrollment_service.create_voice(
                target_model="cosyvoice-v1",
                prefix=prefix,
                url=reference_audio_url,
            )
            logger.info(f"音色注册成功 | voice_id: {voice_id}")

            # 2. 合成语音
            logger.info(f"开始语音合成 | 文本长度: {len(text)}")
            synthesizer = SpeechSynthesizer(
                model="cosyvoice-v1",
                voice=voice_id,
                format=AudioFormat.WAV_24000HZ_MONO_16BIT
            )

            audio_bytes = synthesizer.call(text)
            logger.info(f"语音合成成功 | 音频大小: {len(audio_bytes)} bytes")
            return audio_bytes

        except Exception as e:
            logger.error(f"CosyVoice API 调用失败: {str(e)}")
            raise ExternalServiceError(f"声音克隆失败: {str(e)}")
