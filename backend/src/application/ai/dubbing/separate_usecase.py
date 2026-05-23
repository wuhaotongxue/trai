#!/usr/bin/env python
# 文件名: separate_usecase.py
# 作者: wuhao
# 日期: 2026_05_23_10:00:00
# 描述: 视频人声分离应用层用例

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from loguru import logger

from domain.entities.subtitle_record import SubtitleRecord
from domain.interfaces.subtitle_record_interfaces import ISubtitleRecordRepository
from infrastructure.notify.feishu_ai_notify import FeishuAINotifyService, SubtitleGeneratedEvent
from infrastructure.storage.s3_storage import S3StorageService


class AudioSeparateUseCase:
    """人声分离应用服务用例 (Demucs)"""

    def __init__(self, repo: ISubtitleRecordRepository) -> None:
        self._repo = repo
        self._notifier = FeishuAINotifyService()
        self._storage = S3StorageService()

    @staticmethod
    def is_video(filename: str, content_type: str | None) -> bool:
        """
        判断是否为视频文件.

        参数:
            filename: str, 文件名.
            content_type: str | None, 内容类型.

        返回值:
            bool: 是否为视频.

        异常:
            无.
        """
        if content_type and content_type.lower().startswith("video/"):
            return True
        ext = Path(filename).suffix.lower()
        return ext in {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"}

    @staticmethod
    def is_audio(filename: str, content_type: str | None) -> bool:
        """
        判断是否为音频文件.

        参数:
            filename: str, 文件名.
            content_type: str | None, 内容类型.

        返回值:
            bool: 是否为音频.

        异常:
            无.
        """
        if content_type and content_type.lower().startswith("audio/"):
            return True
        ext = Path(filename).suffix.lower()
        return ext in {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm", ".aac"}

    @classmethod
    def _run_ffmpeg(cls, cmd: list[str]) -> None:
        """
        运行 ffmpeg 命令.

        参数:
            cmd: list[str], 命令列表.

        返回值:
            None.

        异常:
            RuntimeError: 命令执行失败时抛出.
        """
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").strip()
            raise RuntimeError(f"ffmpeg failed: {stderr[:1000]}") from e

    @classmethod
    def _extract_audio(cls, video_path: Path, wav_path: Path) -> None:
        """
        从视频中提取音频.

        参数:
            video_path: Path, 视频路径.
            wav_path: Path, 音频保存路径.

        返回值:
            None.

        异常:
            RuntimeError: 执行失败时抛出.
        """
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
    def _run_demucs(cls, audio_path: Path, out_dir: Path) -> tuple[Path, Path]:
        """
        执行 Demucs 分离并返回人声和伴奏路径.

        参数:
            audio_path: Path, 音频路径.
            out_dir: Path, 输出目录.

        返回值:
            tuple[Path, Path]: (人声路径, 伴奏路径).

        异常:
            RuntimeError: 执行失败时抛出.
        """
        cmd = [
            "demucs",
            "-n",
            "htdemucs",
            "--out",
            str(out_dir),
            str(audio_path),
        ]
        try:
            logger.info(f"执行 Demucs: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").strip()
            raise RuntimeError(f"Demucs failed: {stderr[:1000]}") from e

        # Demucs 默认输出到: out_dir/htdemucs/{basename}/
        basename = audio_path.stem
        model_dir = out_dir / "htdemucs" / basename
        vocal_path = model_dir / "vocals.wav"
        bgm_path = model_dir / "no_vocals.wav"

        if not vocal_path.exists() or not bgm_path.exists():
            raise RuntimeError("Demucs failed to generate output files.")

        return vocal_path, bgm_path

    async def execute(
        self,
        task_id: str,
        user_id: str,
        user_name: str,
        tenant_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> SubtitleRecord:
        """
        执行人声分离业务逻辑.

        参数:
            task_id: str, 任务 ID.
            user_id: str, 用户 ID.
            user_name: str, 用户名.
            tenant_id: str, 租户 ID.
            file_bytes: bytes, 文件数据.
            filename: str, 文件名.
            content_type: str, 内容类型.

        返回值:
            SubtitleRecord: 处理后的记录.

        异常:
            ValueError: 不支持的文件格式.
        """
        input_is_video = self.is_video(filename, content_type)
        input_is_audio = self.is_audio(filename, content_type)
        if not input_is_video and not input_is_audio:
            raise ValueError(f"unsupported file: {filename}")

        safe_tenant_id = tenant_id or "default"
        safe_user_id = user_id or "anonymous"
        safe_task_id = task_id.replace("-", "")
        object_prefix = f"private/tenants/{safe_tenant_id}/ai_subtitles/{safe_user_id}/{safe_task_id}"

        # 1. 创建初始记录
        record = SubtitleRecord(
            id="",
            task_id=task_id,
            task_type="separate",
            user_id=safe_user_id,
            file_name=filename,
            target_lang="",
            burn_mode="none",
            status="processing",
        )
        record = self._repo.save(record)

        tmp_dir = Path(tempfile.mkdtemp(prefix="separate_"))
        input_path = tmp_dir / f"input{Path(filename).suffix or ('.mp4' if input_is_video else '.wav')}"
        audio_path = tmp_dir / "audio.wav"

        try:
            # 保存文件
            input_path.write_bytes(file_bytes)

            # 提取音频
            if input_is_video:
                self._extract_audio(input_path, audio_path)
            else:
                audio_path.write_bytes(input_path.read_bytes())

            # 运行 Demucs
            demucs_out = tmp_dir / "demucs_out"
            demucs_out.mkdir()
            vocal_path, bgm_path = self._run_demucs(audio_path, demucs_out)

            # S3 上传
            v_key = f"{object_prefix}/vocals.wav"
            self._storage.upload_file(str(vocal_path), v_key, content_type="audio/wav")
            record.vocal_url = self._storage.get_long_term_url(v_key, expires_days=30)

            b_key = f"{object_prefix}/no_vocals.wav"
            self._storage.upload_file(str(bgm_path), b_key, content_type="audio/wav")
            record.bgm_url = self._storage.get_long_term_url(b_key, expires_days=30)

            record.status = "completed"

        except Exception as e:
            logger.error(f"Audio separate failed: {e}")
            record.status = "failed"
            record.error_message = str(e)
        finally:
            # 清理临时文件
            try:
                import shutil

                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception:
                pass

            # 保存结果到数据库
            record = self._repo.save(record)

            # 飞书通知 (复用现有的 SubtitleGeneratedEvent 或者创建新的，这里复用以加快进度)
            try:
                event = SubtitleGeneratedEvent(
                    user_id=safe_user_id,
                    user_name=user_name,
                    file_name=filename,
                    target_lang="分离人声",
                    burn_mode="分离",
                    status=record.status,
                    error_message=record.error_message or "",
                    task_id=record.task_id,
                    zh_srt_url=record.vocal_url or "",  # hack: 借用字段展示下载按钮
                    target_srt_url=record.bgm_url or "",  # hack
                    output_video_url="",
                )
                self._notifier.notify_subtitle_generated(event)
            except Exception as notify_e:
                logger.error(f"Send feishu notify failed: {notify_e}")

        return record
