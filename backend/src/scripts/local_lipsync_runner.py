#!/usr/bin/env python
# 文件名: local_lipsync_runner.py
# 作者: wuhao
# 日期: 2026-05-24
# 描述: 本地唇形同步(SadTalker/Wav2Lip)独立执行脚本，进程隔离运行

import json
import os
import sys
import time
import uuid

from loguru import logger

OUT_DIR = "/home/qyjgylc_whf/code/trai/output_video/lipsync"
os.makedirs(OUT_DIR, exist_ok=True)


def generate_lipsync(source_image: str, driven_audio: str, output_path: str = None) -> str:
    """
    运行唇形同步推理
    (这里模拟调用 SadTalker 或 Wav2Lip 的命令行，具体依赖可在后续安装)
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

    source_image = sys.argv[1]
    driven_audio = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        t0 = time.time()
        result_path = generate_lipsync(source_image, driven_audio, output_path)
        elapsed = time.time() - t0

        # 通过 stdout 输出 JSON 结果给父进程
        print(json.dumps({"success": True, "output_path": result_path, "elapsed": elapsed}), flush=True)
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), flush=True)
        sys.exit(1)
