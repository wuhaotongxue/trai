#!/usr/bin/env python
# 文件名: local_lipsync_client.py
# 作者: wuhao
# 日期: 2026-05-24
# 描述: 唇形同步(SadTalker/Wav2Lip)进程隔离客户端

import asyncio
import json
import os
import sys

from loguru import logger


class LocalLipSyncClient:
    """本地唇形同步客户端 - 进程隔离"""

    def __init__(self):
        self.script_path = "/home/qyjgylc_whf/code/trai/backend/src/scripts/local_lipsync_runner.py"

    async def generate_lipsync(self, source_image: str, driven_audio: str) -> dict:
        """异步生成唇形同步视频"""
        logger.info(f"启动唇形同步子进程: image={source_image}, audio={driven_audio}")

        cmd = [
            sys.executable,
            "-u",  # 强制无缓冲输出
            self.script_path,
            source_image,
            driven_audio,
        ]

        try:
            # 异步执行子进程
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE, env=os.environ.copy()
            )

            stdout_data, stderr_data = await proc.communicate()

            # 解析最后一行 JSON 结果
            stdout_str = stdout_data.decode("utf-8").strip()
            if not stdout_str:
                logger.error(f"唇形同步子进程无输出. stderr: {stderr_data.decode('utf-8')}")
                return {"success": False, "error": "No output from subprocess"}

            last_line = stdout_str.split("\n")[-1]
            try:
                result = json.loads(last_line)
                return result
            except json.JSONDecodeError:
                logger.error(f"无法解析子进程结果: {last_line}")
                return {"success": False, "error": "Invalid JSON output"}

        except Exception as e:
            logger.error(f"唇形同步客户端执行异常: {e}")
            return {"success": False, "error": str(e)}


_lipsync_client = None


def get_lipsync_client() -> LocalLipSyncClient:
    global _lipsync_client
    if _lipsync_client is None:
        _lipsync_client = LocalLipSyncClient()
    return _lipsync_client
