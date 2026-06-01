#!/usr/bin/env python
# 文件名: local_lipsync_runner.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: 本地唇形同步(SadTalker/Wav2Lip)独立执行脚本，进程隔离运行

import json
import os
import sys
import time
import uuid
from pathlib import Path

from loguru import logger

# === 动态路径计算 ===
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent.parent  # backend/src/scripts -> src -> backend

OUT_DIR = str(BACKEND_DIR / "output_video/lipsync")
os.makedirs(OUT_DIR, exist_ok=True)


class LocalLipSyncRunner:
    """
    本地唇形同步执行器类.
    """

    @staticmethod
    def generate_lipsync(source_image: str, driven_audio: str, output_path: str | None = None) -> str:
        """
        运行唇形同步推理.

        参数:
            source_image: str, 源图片路径.
            driven_audio: str, 驱动音频路径.
            output_path: str | None, 输出视频路径.

        返回值:
            str: 生成的视频路径.

        异常:
            Exception: 推理过程中的错误.
        """
        if output_path is None:
            unique_id = str(uuid.uuid4())[:8]
            output_path = os.path.join(OUT_DIR, f"lipsync_{unique_id}.mp4")

        logger.info("[1/4] 初始化唇形同步模型... (模拟加载)")
        time.sleep(1)

        logger.info(f"[2/4] 加载人脸图片: {source_image}")
        logger.info(f"[2/4] 加载驱动音频: {driven_audio}")
        time.sleep(1)

        logger.info("[3/4] 正在生成面部特征与唇形对齐动画...")
        # 模拟推理耗时
        time.sleep(3)

        logger.info(f"[4/4] 正在合成最终视频: {output_path}")
        time.sleep(1)

        # 模拟生成一个假视频文件
        with open(output_path, "wb") as f:
            f.write(b"mock_video_content")

        return output_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        logger.error("用法: python local_lipsync_runner.py <source_image> <driven_audio> [output_path]")
        sys.exit(1)

    source_image_arg = sys.argv[1]
    driven_audio_arg = sys.argv[2]
    output_path_arg = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        t0 = time.time()
        result_path = LocalLipSyncRunner.generate_lipsync(source_image_arg, driven_audio_arg, output_path_arg)
        elapsed_time = time.time() - t0

        # 通过 stdout 输出 JSON 结果给父进程
        sys.stdout.write(json.dumps({"success": True, "output_path": result_path, "elapsed": elapsed_time}) + "\n")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        sys.stdout.write(json.dumps({"success": False, "error": str(e)}) + "\n")
        sys.stdout.flush()
        sys.exit(1)
