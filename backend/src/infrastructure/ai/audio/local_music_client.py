#!/usr/bin/env python
# 文件名: local_music_client.py
# 作者: wuhao
# 日期: 2026_05_26_20:53:15
# 描述: ACE-Step 音乐生成客户端 - 进程隔离执行

import asyncio
import os
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass


@dataclass
class MusicGenerateResult:
    """
    音乐生成结果数据类.

    属性:
        success: bool, 是否成功.
        file_path: str | None, 文件路径.
        error: str | None, 错误信息.
        duration: float, 耗时.
    """

    success: bool
    file_path: str | None = None
    error: str | None = None
    duration: float = 0.0


class LocalMusicClient:
    """本地音乐生成客户端 - 使用 ACE-Step 模型."""

    def __init__(
        self,
        output_dir: str = "/home/qyjgylc_whf/code/trai/output_music",
        checkpoint_dir: str | None = None,
        default_steps: int = 27,
        default_duration: int = 30,
    ) -> None:
        """
        初始化音乐生成客户端.

        参数:
            output_dir: str, 输出目录.
            checkpoint_dir: str | None, 权重目录.
            default_steps: int, 默认步数.
            default_duration: int, 默认时长.

        返回值:
            None.
        """
        self.output_dir = output_dir
        self.checkpoint_dir = checkpoint_dir or os.path.join(output_dir, "checkpoints")
        self.default_steps = default_steps
        self.default_duration = default_duration
        self.script_path = "/home/qyjgylc_whf/code/trai/backend/src/scripts/ace_step_music_runner.py"

        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.checkpoint_dir, exist_ok=True)

    def generate(
        self,
        prompt: str,
        duration: float | None = None,
        steps: int | None = None,
        guidance_scale: float = 7.0,
        task: str = "text2music",
        progress_callback=None,
        cancel_check=None,
    ) -> MusicGenerateResult:
        """
        生成音乐（同步调用）.
        """
        actual_duration = duration or self.default_duration
        actual_steps = steps or self.default_steps

        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]
        safe_prompt = "".join(c for c in prompt if c.isalnum() or c in (" ", "_", "-")).strip()[:30]
        output_name = f"{safe_prompt}_{timestamp}_{unique_id}"
        output_path = os.path.join(self.output_dir, f"{output_name}.wav")

        start_time = time.time()

        try:
            cmd = [
                sys.executable,
                self.script_path,
                prompt,
                str(int(actual_duration)),
                str(actual_steps),
                str(guidance_scale),
                output_path,
            ]

            env = os.environ.copy()
            # 使用 Popen 以便实时读取日志和支持取消
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                env=env,
                bufsize=1,
                universal_newlines=True,
            )

            last_output = ""
            while True:
                # 检查是否被取消
                if cancel_check and cancel_check():
                    process.terminate()
                    process.wait(timeout=5)
                    return MusicGenerateResult(
                        success=False,
                        error="已取消",
                        duration=time.time() - start_time,
                    )

                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    line = line.strip()
                    last_output += line + "\n"
                    if progress_callback:
                        # 解析日志中的进度信息
                        if "[1] 导入 pipeline" in line:
                            progress_callback("正在初始化引擎...")
                        elif "[3] 加载 checkpoint" in line:
                            progress_callback("正在加载模型权重...")
                        elif "[4] 模型加载完成" in line:
                            progress_callback("模型加载完成，准备生成...")
                        elif "[5] 生成音乐" in line:
                            progress_callback("正在生成音乐 (约需 3-5 分钟)，请耐心等待...")
                        elif "[6] 生成完成" in line:
                            progress_callback("音乐生成完毕，正在保存...")

            elapsed = time.time() - start_time

            if process.returncode != 0:
                return MusicGenerateResult(
                    success=False,
                    error=f"生成失败: {last_output[-500:]}",
                    duration=elapsed,
                )

            if not os.path.exists(output_path):
                return MusicGenerateResult(
                    success=False,
                    error=f"输出文件不存在: {output_path}",
                    duration=elapsed,
                )

            file_size = os.path.getsize(output_path)
            if file_size < 1000:
                return MusicGenerateResult(
                    success=False,
                    error=f"输出文件过小 ({file_size} bytes)，可能生成失败",
                    duration=elapsed,
                )

            return MusicGenerateResult(
                success=True,
                file_path=output_path,
                duration=elapsed,
            )

        except Exception as e:
            return MusicGenerateResult(
                success=False,
                error=f"生成异常: {str(e)}",
                duration=time.time() - start_time,
            )

    async def generate_async(
        self,
        prompt: str,
        duration: float | None = None,
        steps: int | None = None,
        guidance_scale: float = 7.0,
        task: str = "text2music",
    ) -> MusicGenerateResult:
        """
        异步生成音乐.

        参数:
            prompt: str, 音乐描述提示词.
            duration: float | None, 音频时长（秒）.
            steps: int | None, 推理步数.
            guidance_scale: float, 引导强度.
            task: str, 任务类型.

        返回值:
            MusicGenerateResult: 生成结果.

        异常:
            无.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.generate,
            prompt,
            duration,
            steps,
            guidance_scale,
            task,
        )


class MusicClientProvider:
    """音乐生成客户端提供者类."""

    _music_client: LocalMusicClient | None = None

    @classmethod
    def get_music_client(cls) -> LocalMusicClient:
        """
        获取音乐生成客户端单例.

        参数:
            无.

        返回值:
            LocalMusicClient: 客户端实例.

        异常:
            无.
        """
        if cls._music_client is None:
            cls._music_client = LocalMusicClient()
        return cls._music_client
