#!/usr/bin/env python
# 文件名: local_asr_client.py
# 作者: wuhao
# 日期: 2026_05_22_17:29:22
# 描述: 本地语音识别客户端, 基于 FunASR 或 ModelScope 加载本地模型并执行 STT

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from loguru import logger


class LocalASRClient:
    """
    本地语音识别客户端, 使用 FunASR 或 ModelScope 加载本地 ASR 模型.

    参数:
        无.

    异常:
        无.
    """

    def __init__(self) -> None:
        self._model_id: str = os.getenv(
            "ASR_MODEL_ID",
            "iic/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
        )
        self._model = None

    def _get_model(self) -> Any:
        """
        懒加载并获取 ASR 模型.

        参数:
            无.

        返回值:
            Any: FunASR AutoModel 对象.

        异常:
            RuntimeError: 当加载模型失败时抛出.
        """
        if self._model is None:
            try:
                logger.info(f"加载本地 ASR 模型: {self._model_id}")
                from funasr import AutoModel

                self._model = AutoModel(
                    model=self._model_id,
                    vad_model="damo/speech_fsmn_vad_zh-cn-16k-common-pytorch",
                    punc_model="damo/punc_ct-transformer_zh-cn-common-vocab272727-pytorch",
                    disable_update=True,
                )
            except ImportError:
                logger.error("缺少 funasr 库, 请执行: pip install funasr torchaudio")
                raise RuntimeError("缺少 funasr 库, 请执行: pip install funasr torchaudio")
            except Exception as e:
                logger.error(f"加载 ASR 模型失败: {e}", exc_info=True)
                raise RuntimeError(f"加载本地 ASR 模型失败: {e}") from e
        return self._model

    async def transcribe(self, audio_path: str | Path) -> str:
        """
        将音频文件转换为字幕 (SRT格式) 字符串.

        参数:
            audio_path: str | Path, 音频文件路径.

        返回值:
            str: 转换后的 SRT 字幕内容.

        异常:
            RuntimeError: 转换失败时抛出.
        """
        try:
            model = self._get_model()
            logger.info(f"开始本地 ASR 识别: {audio_path}")
            res = model.generate(input=str(audio_path), batch_size_s=300)

            if not res or not isinstance(res, list):
                return ""

            text = res[0].get("text", "")
            timestamp = res[0].get("timestamp", [])

            if not text:
                return ""

            # 获取音频时长
            duration_s = 0
            try:
                import contextlib
                import wave

                with contextlib.closing(wave.open(str(audio_path), "rb")) as f:
                    frames = f.getnframes()
                    rate = f.getframerate()
                    duration_s = frames / float(rate)
            except Exception as e:
                logger.warning(f"无法获取音频时长, 将使用默认估算: {e}")
                duration_s = len(text) * 0.3  # 粗略估算: 约 3 字/秒

            # 如果有时间戳, 生成真实 SRT
            if timestamp and len(timestamp) > 0:
                return self._build_srt_from_timestamp(text, timestamp)
            else:
                return self._build_fake_srt(text, duration_s)
        except Exception as e:
            logger.error(f"本地 ASR 识别失败: {e}", exc_info=True)
            raise RuntimeError(f"本地 ASR 识别失败: {e}") from e

    def _build_srt_from_timestamp(self, text: str, timestamp: list[list[int]]) -> str:
        """
        将 FunASR 带时间戳的结果转换为 SRT 格式.

        参数:
            text: str, 识别出的文本.
            timestamp: list[list[int]], 毫秒级时间戳列表.

        返回值:
            str: SRT 格式字符串.

        异常:
            无.
        """
        # 简单按标点切分或直接按字/词拼接
        # 这里做简化处理, 把整个句子当作一句, 使用开始和结束时间
        start_ms = timestamp[0][0]
        end_ms = timestamp[-1][1]

        start_str = self._format_time_ms(start_ms)
        end_str = self._format_time_ms(end_ms)

        lines = ["1", f"{start_str} --> {end_str}", text, ""]
        return "\n".join(lines)

    def _build_fake_srt(self, text: str, duration_s: float = 0) -> str:
        """
        将纯文本转换为伪 SRT 格式, 均匀分布在整个音频时长内.

        参数:
            text: str, 识别出的文本.
            duration_s: float, 音频总时长(秒).

        返回值:
            str: SRT 格式字符串.

        异常:
            无.
        """
        lines = []
        chunk_size = 20
        total_chunks = (len(text) + chunk_size - 1) // chunk_size

        # 如果没有获取到时长或文本极短, 默认每块 3 秒
        if duration_s <= 0:
            duration_s = total_chunks * 3.0

        time_per_chunk = duration_s / total_chunks if total_chunks > 0 else 3.0

        idx = 1
        for i in range(0, len(text), chunk_size):
            chunk = text[i : i + chunk_size]
            start_s = (idx - 1) * time_per_chunk
            end_s = idx * time_per_chunk

            # 最后一块对齐到总时长
            if idx == total_chunks:
                end_s = duration_s

            start_str = self._format_time_s(start_s)
            end_str = self._format_time_s(end_s)

            lines.append(str(idx))
            lines.append(f"{start_str} --> {end_str}")
            lines.append(chunk)
            lines.append("")
            idx += 1

        return "\n".join(lines)

    def _format_time_s(self, seconds: float) -> str:
        """
        格式化秒数为 SRT 时间字符串.

        参数:
            seconds: float, 秒数.

        返回值:
            str: 如 00:00:00,000

        异常:
            无.
        """
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    def _format_time_ms(self, ms: int) -> str:
        """
        格式化毫秒数为 SRT 时间字符串.

        参数:
            ms: int, 毫秒数.

        返回值:
            str: 如 00:00:00,000

        异常:
            无.
        """
        seconds = ms // 1000
        milli = ms % 1000
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:02d},{milli:03d}"


_asr_client: LocalASRClient | None = None


def get_asr_client() -> LocalASRClient:
    """
    获取本地 ASR 客户端单例.

    返回值:
        LocalASRClient: 本地语音识别客户端实例.

    异常:
        无.
    """
    global _asr_client
    if _asr_client is None:
        _asr_client = LocalASRClient()
    return _asr_client


__all__ = ["LocalASRClient", "get_asr_client"]
