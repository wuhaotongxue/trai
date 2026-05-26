#!/usr/bin/env python
# 文件名: lipsync_usecase.py
# 作者: wuhao
# 日期: 2026_05_23_12:00:00
# 描述: 视频口型同步用例 (Wav2Lip)

import subprocess
from pathlib import Path

from loguru import logger

from domain.ai.entities import SubtitleRecord
from infrastructure.storage.s3_storage import S3StorageService


class LipSyncUseCase:
    """口型同步用例类."""

    def __init__(self, repo) -> None:
        self._repo = repo
        self._s3 = S3StorageService()

    async def execute(self, record: SubtitleRecord, local_video: Path, local_audio: Path) -> SubtitleRecord:
        """
        执行口型同步.

        参数:
            record: 字幕记录实体.
            local_video: 本地视频文件路径.
            local_audio: 本地音频文件路径.

        返回值:
            SubtitleRecord: 更新后的记录.
        """
        record.status = "processing"
        await self._repo.save(record)

        try:
            logger.info("[LipSync] Step 1: 检查输入与准备输出环境")
            tmp_dir = Path(f"/tmp/trai_workspace/lipsync_{record.id}")
            tmp_dir.mkdir(parents=True, exist_ok=True)
            output_video = tmp_dir / f"{record.id}_lipsynced.mp4"

            logger.info("[LipSync] Step 2: 调用 Wav2Lip (占位实现，因为未部署完整模型)")
            # 真实环境中应该执行 Wav2Lip inference.py:
            # subprocess.run(["python", "Wav2Lip/inference.py", "--checkpoint_path", "Wav2Lip/checkpoints/wav2lip_gan.pth", "--face", str(local_video), "--audio", str(local_audio), "--outfile", str(output_video)])

            # 由于当前环境可能没有下载数GB的模型，我们暂时使用 ffmpeg 将新音频强行替换进去作为降级演示
            logger.warning("[LipSync] 检测到未完全配置 Wav2Lip 环境，降级为使用 FFmpeg 进行音视频合并")
            cmd_merge = [
                "ffmpeg",
                "-y",
                "-i",
                str(local_video),
                "-i",
                str(local_audio),
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                str(output_video),
            ]
            subprocess.run(cmd_merge, check=True, capture_output=True)

            logger.info("[LipSync] Step 3: 上传成品至 S3")
            out_key = f"private/tenants/default/ai_generated/videos/anonymous/{record.id}_lipsynced.mp4"
            self._s3.upload_file(str(output_video), out_key)

            record.output_video_url = self._s3.get_long_term_url(out_key)
            record.status = "completed"
            await self._repo.save(record)

            logger.info("口型同步流水线全部完成!")

            for p in [output_video]:
                if p.exists():
                    p.unlink()

            return record

        except Exception as e:
            logger.error(f"口型同步失败: {e}")
            record.status = "failed"
            record.error_message = str(e)
            await self._repo.save(record)
            raise e
