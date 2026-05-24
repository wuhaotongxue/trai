#!/usr/bin/env python
# 文件名: base_tts_client.py
# 作者: wuhao
# 日期: 2026_05_24_16:20:00
# 描述: TTS (Text-to-Speech) 客户端基类接口

from typing import Protocol


class ITTSClient(Protocol):
    """
    TTS (Text-to-Speech) 声音克隆与合成抽象接口.
    """

    def clone_and_synthesize(self, text: str, reference_audio_url: str, language: str = "zh") -> bytes:
        """
        零样本声音克隆并合成

        参数:
            text: 要合成的文本
            reference_audio_url: 参考音频的地址或本地路径
            language: 语言提示

        返回:
            bytes: 合成后的音频字节数据 (WAV格式)

        异常:
            ExternalServiceError: 外部服务或本地推理失败时抛出
        """
        ...
