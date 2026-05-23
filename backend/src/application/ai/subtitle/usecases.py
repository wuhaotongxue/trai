#!/usr/bin/env python
# 文件名: usecases.py
# 作者: wuhao
# 日期: 2026_05_23
# 描述: 字幕生成应用层用例

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from loguru import logger

from domain.entities.subtitle_record import SubtitleRecord
from domain.interfaces.subtitle_record_interfaces import ISubtitleRecordRepository
from infrastructure.ai.openai_client import OpenAIClient
from infrastructure.notify.feishu_ai_notify import FeishuAINotifyService, SubtitleGeneratedEvent
from infrastructure.storage.s3_storage import S3StorageService


class SubtitleGenerateUseCase:
    """字幕生成应用服务用例"""

    _TIME_RE = re.compile(r"^\d{2}:\d{2}:\d{2},\d{3}$")

    def __init__(self, repo: ISubtitleRecordRepository) -> None:
        self._repo = repo
        self._notifier = FeishuAINotifyService()
        self._storage = S3StorageService()

    @staticmethod
    def is_video(filename: str, content_type: str | None) -> bool:
        """判断是否为视频文件"""
        if content_type and content_type.lower().startswith("video/"):
            return True
        ext = Path(filename).suffix.lower()
        return ext in {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}

    @staticmethod
    def is_audio(filename: str, content_type: str | None) -> bool:
        """判断是否为音频文件"""
        if content_type and content_type.lower().startswith("audio/"):
            return True
        ext = Path(filename).suffix.lower()
        return ext in {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".aac"}

    @classmethod
    def _parse_srt(cls, srt: str) -> list[dict[str, Any]]:
        srt = srt.replace("\r\n", "\n").replace("\r", "\n").strip()
        blocks = [b.strip() for b in srt.split("\n\n") if b.strip()]
        entries: list[dict[str, Any]] = []
        for block in blocks:
            lines = [line.rstrip() for line in block.split("\n")]
            if len(lines) < 3:
                continue
            try:
                index = int(lines[0].strip())
            except ValueError:
                continue
            times = lines[1].strip()
            if "-->" not in times:
                continue
            start, end = [x.strip() for x in times.split("-->", 1)]
            if not (cls._TIME_RE.match(start) and cls._TIME_RE.match(end)):
                continue
            text = "\n".join(lines[2:]).strip()
            entries.append({"index": index, "start": start, "end": end, "text": text})
        return entries

    @classmethod
    def _build_srt(cls, entries: list[dict[str, Any]]) -> str:
        parts: list[str] = []
        for e in entries:
            parts.append(str(e["index"]))
            parts.append(f"{e['start']} --> {e['end']}")
            parts.append(e["text"].strip())
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    @classmethod
    def _safe_json_array(cls, content: str) -> list[Any] | None:
        content = content.strip()
        if not content:
            return None
        start = content.find("[")
        end = content.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return None
        candidate = content[start : end + 1]
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            return None
        return data if isinstance(data, list) else None

    @classmethod
    async def _translate_chunk(cls, client: OpenAIClient, texts: list[str], target_lang: str) -> list[str]:
        system = "You are a professional translation engine. Translate exactly, preserve meaning and tone."
        user = {
            "target_lang": target_lang,
            "lines": texts,
            "requirements": [
                "Return JSON only.",
                "Return a JSON array with the same length as input lines.",
                "Do not add extra commentary.",
                "Do not merge or split lines.",
            ],
        }
        resp = await client.chat(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
            ],
            temperature=0.2,
            max_tokens=4096,
        )
        raw = (resp.get("content") or "").strip()
        parsed = cls._safe_json_array(raw)
        if parsed is None:
            raise RuntimeError(f"translate parse failed, content[:200]={raw[:200]}")
        return [str(x).strip() for x in parsed]

    @classmethod
    async def _translate_texts(cls, client: OpenAIClient, texts: list[str], target_lang: str) -> list[str]:
        chunk_size = 40
        out: list[str] = []
        for i in range(0, len(texts), chunk_size):
            chunk = texts[i : i + chunk_size]
            out.extend(await cls._translate_chunk(client, chunk, target_lang))
        return out

    @classmethod
    def _run_ffmpeg(cls, cmd: list[str]) -> None:
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").strip()
            raise RuntimeError(f"ffmpeg failed: {stderr[:1000]}") from e

    @classmethod
    def _extract_audio(cls, video_path: Path, wav_path: Path) -> None:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            str(wav_path),
        ]
        cls._run_ffmpeg(cmd)

    @classmethod
    def _burn_subtitles(cls, input_video: Path, srt_path: Path, output_video: Path) -> None:
        subtitle_filter_path = str(srt_path).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")
        vf = f"subtitles='{subtitle_filter_path}':force_style='FontSize=24,Outline=1,Shadow=0'"
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_video),
            "-vf",
            vf,
            "-c:a",
            "copy",
            str(output_video),
        ]
        cls._run_ffmpeg(cmd)

    async def execute(
        self,
        task_id: str,
        user_id: str,
        user_name: str,
        tenant_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        target_lang: str,
        source_lang: str,
        include_zh_subtitle: bool,
        include_target_subtitle: bool,
        burn_mode: str,
    ) -> SubtitleRecord:
        """执行字幕生成业务逻辑"""
        input_is_video = self.is_video(filename, content_type)
        input_is_audio = self.is_audio(filename, content_type)
        if not input_is_video and not input_is_audio:
            raise ValueError(f"unsupported file: {filename}")

        if input_is_audio:
            burn_mode = "none"

        safe_tenant_id = tenant_id or "default"
        safe_user_id = user_id or "anonymous"
        safe_task_id = task_id.replace("-", "")
        object_prefix = f"private/tenants/{safe_tenant_id}/ai_subtitles/{safe_user_id}/{safe_task_id}"

        # 1. 创建初始记录
        record = SubtitleRecord(
            id="",
            task_id=task_id,
            user_id=safe_user_id,
            file_name=filename,
            target_lang=target_lang,
            burn_mode=burn_mode,
            status="processing",
        )
        record = self._repo.save(record)

        tmp_dir = Path(tempfile.mkdtemp(prefix="subtitle_"))
        input_path = tmp_dir / f"input{Path(filename).suffix or ('.mp4' if input_is_video else '.wav')}"
        audio_path = tmp_dir / "audio.wav"
        zh_srt_path = tmp_dir / "zh.srt"
        target_srt_path = tmp_dir / f"{target_lang}.srt"
        burn_srt_path = tmp_dir / "burn.srt"
        output_video_path = tmp_dir / "output.mp4"

        try:
            # 保存文件
            input_path.write_bytes(file_bytes)

            # 提取音频
            if input_is_video:
                self._extract_audio(input_path, audio_path)
            else:
                audio_path.write_bytes(input_path.read_bytes())

            # 语音识别 STT
            stt_srt: str | None = None
            stt_success = False

            # 直接优先尝试魔塔社区 API，跳过可能失败的 OpenAI / DeepSeek 配置
            if os.getenv("DASHSCOPE_API_KEY") or os.getenv("MODELSCOPE_API_KEY"):
                try:
                    logger.info("[字幕生成] 尝试使用魔塔社区 (ModelScope) API 进行 STT...")
                    stt_client = OpenAIClient(provider="modelscope")
                    with open(audio_path, "rb") as fh:
                        stt_srt = await stt_client.transcribe_audio(
                            file=fh,
                            language=source_lang.strip() or None,
                            response_format="srt",
                        )
                    stt_success = True
                except Exception as e:
                    logger.warning(f"[字幕生成] 魔塔社区 API STT 失败，准备降级到本地 FunASR: {e}")

            if not stt_success:
                logger.info("[字幕生成] 尝试使用本地 FunASR 模型进行 STT...")
                from infrastructure.ai.local_asr_client import LocalASRClient

                local_client = LocalASRClient()
                stt_srt = await local_client.transcribe(audio_path)
                stt_success = True

            if not isinstance(stt_srt, str) or not stt_srt.strip():
                raise RuntimeError("stt returned empty srt")

            if include_zh_subtitle:
                zh_srt_path.write_text(stt_srt, encoding="utf-8")

            # 翻译
            target_srt: str | None = None
            if include_target_subtitle:
                entries = self._parse_srt(stt_srt)
                texts = [e["text"] for e in entries]
                translate_client = OpenAIClient()
                translated = await self._translate_texts(translate_client, texts, target_lang=target_lang)
                if len(translated) != len(entries):
                    raise RuntimeError("translate returned wrong length")
                out_entries = []
                for i, e in enumerate(entries):
                    out_entries.append(
                        {"index": e["index"], "start": e["start"], "end": e["end"], "text": translated[i]}
                    )
                target_srt = self._build_srt(out_entries)
                target_srt_path.write_text(target_srt, encoding="utf-8")

            # 烧录
            if input_is_video and burn_mode != "none":
                burn_entries = self._parse_srt(stt_srt)
                burned = []
                for e in burn_entries:
                    zh_text = e["text"]
                    tgt_text = ""
                    if target_srt:
                        tgt_entries = self._parse_srt(target_srt)
                        tgt_map = {x["index"]: x["text"] for x in tgt_entries}
                        tgt_text = tgt_map.get(e["index"], "")

                    if burn_mode == "zh":
                        merged_text = zh_text
                    elif burn_mode == "target":
                        merged_text = tgt_text or zh_text
                    else:
                        merged_text = f"{zh_text}\n{tgt_text}" if tgt_text else zh_text

                    burned.append({"index": e["index"], "start": e["start"], "end": e["end"], "text": merged_text})

                burn_srt_path.write_text(self._build_srt(burned), encoding="utf-8")
                self._burn_subtitles(input_path, burn_srt_path, output_video_path)

            # S3 上传
            if include_zh_subtitle:
                zh_key = f"{object_prefix}/zh.srt"
                self._storage.upload_bytes(zh_srt_path.read_bytes(), zh_key, content_type="text/plain")
                record.zh_srt_url = self._storage.get_long_term_url(zh_key, expires_days=30)

            if include_target_subtitle and target_srt:
                t_key = f"{object_prefix}/{target_lang}.srt"
                self._storage.upload_bytes(target_srt_path.read_bytes(), t_key, content_type="text/plain")
                record.target_srt_url = self._storage.get_long_term_url(t_key, expires_days=30)

            if input_is_video and burn_mode != "none":
                v_key = f"{object_prefix}/output.mp4"
                self._storage.upload_file(str(output_video_path), v_key, content_type="video/mp4")
                record.output_video_url = self._storage.get_long_term_url(v_key, expires_days=30)

            record.status = "completed"

        except Exception as e:
            logger.error(f"Subtitle generate failed: {e}")
            record.status = "failed"
            record.error_message = str(e)
        finally:
            # 清理临时文件
            try:
                for p in tmp_dir.glob("**/*"):
                    if p.is_file():
                        p.unlink(missing_ok=True)
                tmp_dir.rmdir()
            except Exception:
                pass

            # 保存结果到数据库
            record = self._repo.save(record)

            # 飞书通知
            try:
                event = SubtitleGeneratedEvent(
                    user_id=safe_user_id,
                    user_name=user_name,
                    file_name=filename,
                    target_lang=target_lang,
                    burn_mode=burn_mode,
                    status=record.status,
                    error_message=record.error_message or "",
                    task_id=record.task_id,
                    zh_srt_url=record.zh_srt_url or "",
                    target_srt_url=record.target_srt_url or "",
                    output_video_url=record.output_video_url or "",
                )
                self._notifier.notify_subtitle_generated(event)
            except Exception as notify_e:
                logger.error(f"Send feishu notify failed: {notify_e}")

        return record
