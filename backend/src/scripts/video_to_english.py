#!/usr/bin/env python
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Ensure backend/src is in sys.path when running as a standalone script.
_SRC_DIR = Path(__file__).resolve().parents[1]
if str(_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(_SRC_DIR))

from loguru import logger

from infrastructure.ai.openai_client import OpenAIClient


@dataclass(frozen=True)
class SrtEntry:
    index: int
    start: str
    end: str
    text: str


class VideoToEnglishRunner:
    _TIME_RE = re.compile(r"^\d{2}:\d{2}:\d{2},\d{3}$")

    def main(self) -> None:
        args = self._parse_args()
        self._load_env_files()
        self._normalize_env()
        asyncio.run(self._run_async(args))

    def _load_env_files(self) -> None:
        base_dir = Path(__file__).resolve().parents[2]
        self._load_env_file(base_dir / ".env")
        self._load_env_file(base_dir / ".env.local")

        env_dir = base_dir / "env"
        if env_dir.exists() and env_dir.is_dir():
            for env_file in sorted(env_dir.glob("*.env")):
                self._load_env_file(env_file)

    def _load_env_file(self, env_path: Path) -> None:
        if not env_path.exists() or not env_path.is_file():
            return
        try:
            content = env_path.read_text(encoding="utf-8")
        except Exception:
            return

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'").strip()
            if not key:
                continue
            os.environ.setdefault(key, value)

    def _parse_args(self) -> argparse.Namespace:
        parser = argparse.ArgumentParser(description="Convert a local video to an English version (subs + optional TTS).")
        parser.add_argument("input_video", type=str, help="Input video path (mp4/mov/webm).")
        parser.add_argument(
            "--output-video",
            type=str,
            default="",
            help="Output video path. Default: <input_stem>_en.mp4 in the same directory.",
        )
        parser.add_argument(
            "--target-lang",
            type=str,
            default="en",
            help="Target language code for subtitles. Default: en.",
        )
        parser.add_argument(
            "--source-lang",
            type=str,
            default="",
            help="Source language code for STT, empty means auto.",
        )
        parser.add_argument(
            "--subtitle-only",
            action="store_true",
            help="Only generate/burn English subtitles. Do not generate TTS or replace audio.",
        )
        parser.add_argument(
            "--input-srt",
            type=str,
            default="",
            help="Optional input SRT path. If provided, skip STT and translate this SRT directly.",
        )
        parser.add_argument(
            "--skip-translate",
            action="store_true",
            help="Skip translation step and use the original subtitle text as-is (useful for offline burn test).",
        )
        parser.add_argument(
            "--keep-original-audio",
            action="store_true",
            help="Keep original audio even when TTS is generated (mixing is not done, this disables audio replacement).",
        )
        parser.add_argument(
            "--voice",
            type=str,
            default=os.getenv("TTS_VOICE", "alloy"),
            help="TTS voice id. Default: alloy.",
        )
        parser.add_argument(
            "--work-dir",
            type=str,
            default="",
            help="Working directory for temp files. Default: system temp.",
        )
        return parser.parse_args()

    def _normalize_env(self) -> None:
        qwen_key = (os.getenv("QWEN_API_KEY", "") or "").strip()
        qwen_base = (os.getenv("QWEN_API_BASE", "") or "").strip()

        if qwen_base.startswith("`") and qwen_base.endswith("`") and len(qwen_base) >= 2:
            qwen_base = qwen_base[1:-1].strip()

        if qwen_key and not os.getenv("DASHSCOPE_API_KEY", "") and not os.getenv("OPENAI_API_KEY", ""):
            os.environ["DASHSCOPE_API_KEY"] = qwen_key

        if qwen_base and not os.getenv("DASHSCOPE_API_BASE", "") and not os.getenv("OPENAI_BASE_URL", ""):
            os.environ["DASHSCOPE_API_BASE"] = qwen_base

        if os.getenv("DASHSCOPE_API_KEY", "") and not os.getenv("LLM_PROVIDER", ""):
            os.environ["LLM_PROVIDER"] = "modelscope"

        deepseek_key = (os.getenv("DEEPSEEK_API_KEY", "") or "").strip()
        openai_key = (os.getenv("OPENAI_API_KEY", "") or "").strip()
        dashscope_key = (os.getenv("DASHSCOPE_API_KEY", "") or "").strip()

        openai_placeholder = (not openai_key) or openai_key.startswith("sk-your-")
        dashscope_placeholder = (not dashscope_key) or dashscope_key.startswith("sk-your-")

        if deepseek_key and (openai_placeholder and dashscope_placeholder):
            os.environ["LLM_PROVIDER"] = "deepseek"

    async def _run_async(self, args: argparse.Namespace) -> None:
        input_video = Path(args.input_video).expanduser().resolve()
        if not input_video.exists():
            raise FileNotFoundError(f"input video not found: {input_video}")

        output_video = Path(args.output_video).expanduser().resolve() if args.output_video else input_video.with_name(
            f"{input_video.stem}_en.mp4"
        )
        output_video.parent.mkdir(parents=True, exist_ok=True)

        work_dir = Path(args.work_dir).expanduser().resolve() if args.work_dir else None
        tmp_root = Path(tempfile.mkdtemp(prefix="video_to_en_", dir=str(work_dir) if work_dir else None))
        logger.info(f"work_dir={tmp_root}")

        audio_path = tmp_root / "audio.wav"
        raw_srt_path = tmp_root / "raw.srt"
        en_srt_path = tmp_root / "en.srt"
        tts_audio_path = tmp_root / "tts.mp3"
        muxed_video_path = tmp_root / "muxed.mp4"

        client = OpenAIClient()
        if args.input_srt:
            raw_srt = Path(args.input_srt).expanduser().read_text(encoding="utf-8")
        else:
            self._extract_audio_ffmpeg(input_video, audio_path)
            raw_srt = await self._stt_to_srt(
                client=client,
                audio_path=audio_path,
                source_lang=args.source_lang or None,
            )
        raw_srt_path.write_text(raw_srt, encoding="utf-8")

        entries = self._parse_srt(raw_srt)
        if args.skip_translate:
            translated_entries = entries
        else:
            translated_entries = await self._translate_srt_entries(
                client=client,
                entries=entries,
                target_lang=args.target_lang,
            )
        en_srt = self._build_srt(translated_entries)
        en_srt_path.write_text(en_srt, encoding="utf-8")

        if args.subtitle_only:
            self._burn_subtitles_ffmpeg(input_video=input_video, subtitle_path=en_srt_path, output_video=output_video)
            logger.info(f"done: {output_video}")
            return

        if args.keep_original_audio:
            self._burn_subtitles_ffmpeg(input_video=input_video, subtitle_path=en_srt_path, output_video=output_video)
            logger.info(f"done: {output_video}")
            return

        translated_text = self._entries_to_plain_text(translated_entries)
        tts_audio = await client.synthesize_speech(text=translated_text, voice=args.voice, response_format="mp3")
        tts_audio_path.write_bytes(tts_audio)

        self._replace_audio_ffmpeg(input_video=input_video, new_audio=tts_audio_path, output_video=muxed_video_path)
        self._burn_subtitles_ffmpeg(input_video=muxed_video_path, subtitle_path=en_srt_path, output_video=output_video)
        logger.info(f"done: {output_video}")

    def _extract_audio_ffmpeg(self, input_video: Path, output_audio: Path) -> None:
        self._ensure_cmd("ffmpeg")
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_video),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            str(output_audio),
        ]
        self._run_cmd(cmd, "ffmpeg extract audio failed")

    async def _stt_to_srt(
        self,
        client: OpenAIClient,
        audio_path: Path,
        source_lang: str | None,
    ) -> str:
        with open(audio_path, "rb") as fh:
            transcription = await client.transcribe_audio(file=fh, language=source_lang, response_format="srt")

        if isinstance(transcription, str) and transcription.strip():
            return transcription

        if isinstance(transcription, dict) and transcription.get("text"):
            return str(transcription["text"])

        raise RuntimeError("STT did not return SRT content")

    async def _translate_srt_entries(
        self,
        client: OpenAIClient,
        entries: list[SrtEntry],
        target_lang: str,
    ) -> list[SrtEntry]:
        texts = [e.text for e in entries]
        translated_texts = await self._translate_texts(client=client, texts=texts, target_lang=target_lang)
        if len(translated_texts) != len(entries):
            raise RuntimeError(f"translation size mismatch: {len(translated_texts)} != {len(entries)}")
        return [
            SrtEntry(index=e.index, start=e.start, end=e.end, text=translated_texts[i])
            for i, e in enumerate(entries)
        ]

    async def _translate_texts(self, client: OpenAIClient, texts: list[str], target_lang: str) -> list[str]:
        chunk_size = 40
        out: list[str] = []
        for i in range(0, len(texts), chunk_size):
            chunk = texts[i : i + chunk_size]
            out.extend(await self._translate_texts_chunk(client=client, texts=chunk, target_lang=target_lang))
        return out

    async def _translate_texts_chunk(self, client: OpenAIClient, texts: list[str], target_lang: str) -> list[str]:
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
        parsed = self._safe_json_array(raw)
        if parsed is None:
            raise RuntimeError(f"failed to parse translation JSON, content[:200]={raw[:200]}")
        return [str(x).strip() for x in parsed]

    def _safe_json_array(self, content: str) -> list[Any] | None:
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

    def _entries_to_plain_text(self, entries: list[SrtEntry]) -> str:
        lines: list[str] = []
        for e in entries:
            t = self._normalize_subtitle_text(e.text)
            if t:
                lines.append(t)
        return "\n".join(lines)

    def _normalize_subtitle_text(self, text: str) -> str:
        text = re.sub(r"<[^>]+>", "", text)
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = "\n".join([line.strip() for line in text.split("\n") if line.strip()])
        return text.strip()

    def _parse_srt(self, srt: str) -> list[SrtEntry]:
        srt = srt.replace("\r\n", "\n").replace("\r", "\n").strip()
        blocks = [b.strip() for b in srt.split("\n\n") if b.strip()]
        entries: list[SrtEntry] = []
        for block in blocks:
            lines = [l.rstrip() for l in block.split("\n")]
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
            if not (self._TIME_RE.match(start) and self._TIME_RE.match(end)):
                continue
            text = "\n".join(lines[2:]).strip()
            entries.append(SrtEntry(index=index, start=start, end=end, text=text))
        return entries

    def _build_srt(self, entries: list[SrtEntry]) -> str:
        parts: list[str] = []
        for e in entries:
            parts.append(str(e.index))
            parts.append(f"{e.start} --> {e.end}")
            parts.append(e.text.strip())
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _replace_audio_ffmpeg(self, input_video: Path, new_audio: Path, output_video: Path) -> None:
        self._ensure_cmd("ffmpeg")
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_video),
            "-i",
            str(new_audio),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-shortest",
            str(output_video),
        ]
        self._run_cmd(cmd, "ffmpeg replace audio failed")

    def _burn_subtitles_ffmpeg(self, input_video: Path, subtitle_path: Path, output_video: Path) -> None:
        self._ensure_cmd("ffmpeg")
        subtitle_filter_path = self._escape_ffmpeg_subtitle_path(str(subtitle_path))
        vf = f"subtitles={subtitle_filter_path}:force_style='FontSize=24,Outline=1,Shadow=0'"
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
        self._run_cmd(cmd, "ffmpeg burn subtitles failed")

    def _escape_ffmpeg_subtitle_path(self, path_str: str) -> str:
        path_str = path_str.replace("\\", "/")
        path_str = path_str.replace(":", r"\:")
        path_str = path_str.replace("'", r"\'")
        return f"'{path_str}'"

    def _ensure_cmd(self, name: str) -> None:
        from shutil import which

        if which(name):
            return
        raise RuntimeError(f"command not found: {name}")

    def _run_cmd(self, cmd: list[str], error_msg: str) -> None:
        logger.info(" ".join(cmd))
        try:
            proc = subprocess.run(cmd, check=True, capture_output=True, text=True)
            if proc.stderr.strip():
                logger.debug(proc.stderr.strip()[:500])
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").strip()
            raise RuntimeError(f"{error_msg}: {stderr[:800]}") from e


if __name__ == "__main__":
    VideoToEnglishRunner().main()
