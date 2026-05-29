#!/usr/bin/env python
# 文件名: clone_usecase.py
# 作者: wuhao
# 日期: 2026_05_23_11:00:00
# 描述: 零样本声音克隆用例, 接收视频并将其中的语音替换为外语克隆音色

import subprocess
from pathlib import Path

from infrastructure.ai.cosyvoice_client import CosyVoiceClient
from infrastructure.ai.llm_client_factory import LLMClientFactory
from loguru import logger

from application.ai.dubbing.separate_usecase import AudioSeparateUseCase
from domain.ai.entities import SubtitleRecord
from infrastructure.ai.audio.local_asr_client import LocalASRClient
from infrastructure.storage.s3_storage import S3StorageService


class CloneVoiceUseCase:
    """
    零样本声音克隆用例类.
    """

    def __init__(self, repo) -> None:
        """
        初始化声音克隆用例.

        参数:
            repo: 字幕记录仓储接口实例.

        返回值:
            无.

        异常:
            无.
        """
        self._repo = repo
        self._s3 = S3StorageService()
        self._separate_usecase = AudioSeparateUseCase(repo)
        self._cosyvoice = CosyVoiceClient()
        self._asr = LocalASRClient()
        self._llm = LLMClientFactory.create_client()

    async def execute(self, record: SubtitleRecord, local_file: Path) -> SubtitleRecord:
        """
        执行声音克隆流水线.

        参数:
            record: SubtitleRecord, 字幕记录实体.
            local_file: Path, 本地视频文件路径.

        返回值:
            SubtitleRecord: 更新后的记录.

        异常:
            Exception: 如果克隆过程中发生错误.
        """
        record.status = "processing"
        await self._repo.save(record)

        try:
            logger.info("[Clone] Step 1: 提取人声与伴奏")
            tmp_dir = Path(f"/tmp/trai_workspace/demucs_{record.id}")
            tmp_dir.mkdir(parents=True, exist_ok=True)

            audio_path = tmp_dir / f"{record.id}_audio.wav"
            self._separate_usecase._extract_audio(local_file, audio_path)
            vocal_path, bgm_path = AudioSeparateUseCase._run_demucs(audio_path, tmp_dir)

            logger.info("[Clone] Step 2: 语音识别 (ASR)")
            asr_res = await self._asr.recognize(str(vocal_path))
            original_text = " ".join([seg["text"] for seg in asr_res])
            logger.info(f"原台词: {original_text}")

            logger.info(f"[Clone] Step 3: 翻译为 {record.target_lang}")
            prompt = f"请将以下台词翻译为 {record.target_lang}. 只返回翻译后的纯文本, 不要任何解释或多余内容: \n{original_text}"
            res = await self._llm.chat(messages=[{"role": "user", "content": prompt}])
            translated_text = res.get("content", "")
            logger.info(f"翻译结果: {translated_text}")

            logger.info("[Clone] Step 4: 上传参考人声到 S3")
            vocal_key = f"public/temp/{record.id}_vocal_ref.wav"
            self._s3.upload_file(str(vocal_path), vocal_key)
            vocal_url = self._s3.get_file_url(vocal_key)

            logger.info("[Clone] Step 5: 声音克隆 (CosyVoice)")
            lang_hint = "en" if record.target_lang == "英文" else "zh"
            cloned_audio_bytes = self._cosyvoice.clone_and_synthesize(
                text=translated_text, reference_audio_url=vocal_url, language=lang_hint
            )

            cloned_path = Path(f"/tmp/trai_workspace/{record.id}_cloned.wav")
            with open(cloned_path, "wb") as f:
                f.write(cloned_audio_bytes)

            logger.info("[Clone] Step 6: 合并伴奏与克隆人声")
            merged_audio = Path(f"/tmp/trai_workspace/{record.id}_merged.wav")
            cmd_mix = [
                "ffmpeg",
                "-y",
                "-i",
                str(cloned_path),
                "-i",
                str(bgm_path),
                "-filter_complex",
                "amix=inputs=2:duration=longest",
                str(merged_audio),
            ]
            subprocess.run(cmd_mix, check=True, capture_output=True)

            logger.info("[Clone] Step 7: 替换视频原声")
            final_video = Path(f"/tmp/trai_workspace/{record.id}_cloned_output.mp4")
            cmd_merge = [
                "ffmpeg",
                "-y",
                "-i",
                str(local_file),
                "-i",
                str(merged_audio),
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                str(final_video),
            ]
            subprocess.run(cmd_merge, check=True, capture_output=True)

            logger.info("[Clone] Step 8: 上传成品至 S3")
            out_key = f"private/tenants/default/ai_generated/videos/anonymous/{record.id}_cloned.mp4"
            self._s3.upload_file(str(final_video), out_key)

            record.output_video_url = self._s3.get_long_term_url(out_key)
            record.status = "completed"
            await self._repo.save(record)

            logger.info("声音克隆流水线全部完成!")

            for p in [vocal_path, bgm_path, cloned_path, merged_audio, final_video]:
                if p.exists():
                    p.unlink()

            return record

        except Exception as e:
            logger.error(f"声音克隆失败: {e}")
            record.status = "failed"
            await self._repo.save(record)
            raise e
