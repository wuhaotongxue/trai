#!/usr/bin/env python
# 文件名: __init__.py
# 作者: wuhao
# 日期: 2026_05_24_16:20:00
# 描述: TTS 模块导出

from .base_tts_client import ITTSClient
from .dashscope_tts_client import DashScopeTTSClient
from .local_tts_client import LocalTTSClient

__all__ = ["ITTSClient", "DashScopeTTSClient", "LocalTTSClient"]
