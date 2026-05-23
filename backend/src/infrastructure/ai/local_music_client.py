"""ACE-Step 音乐生成客户端 - 进程隔离执行"""
import asyncio
import sys
import os
import time
import uuid
import subprocess
from typing import Optional
from dataclasses import dataclass


@dataclass
class MusicGenerateResult:
    """音乐生成结果"""
    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None
    duration: float = 0.0


class LocalMusicClient:
    """本地音乐生成客户端 - 使用 ACE-Step 模型"""

    def __init__(
        self,
        output_dir: str = "/home/qyjgylc_whf/code/trai/output_music",
        checkpoint_dir: str = None,
        default_steps: int = 27,
        default_duration: int = 30,
    ):
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
        duration: Optional[float] = None,
        steps: Optional[int] = None,
        guidance_scale: float = 7.0,
        task: str = "text2music",
    ) -> MusicGenerateResult:
        """
        生成音乐（同步调用）

        Args:
            prompt: 音乐描述提示词
            duration: 音频时长（秒）
            steps: 推理步数
            guidance_scale: 引导强度
            task: 任务类型 (text2music, audio2music)

        Returns:
            MusicGenerateResult: 生成结果
        """
        duration = duration or self.default_duration
        steps = steps or self.default_steps

        # 生成唯一文件名
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]
        safe_prompt = "".join(c for c in prompt if c.isalnum() or c in (" ", "_", "-")).strip()[:30]
        output_name = f"{safe_prompt}_{timestamp}_{unique_id}"
        output_path = os.path.join(self.output_dir, f"{output_name}.wav")

        start_time = time.time()

        try:
            # 构建命令
            cmd = [
                sys.executable,
                self.script_path,
                prompt,
                str(int(duration)),
                str(steps),
                str(guidance_scale),
                output_path,
            ]

            # 执行（使用独立环境）
            env = os.environ.copy()
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10分钟超时
                env=env,
            )

            elapsed = time.time() - start_time

            if result.returncode != 0:
                return MusicGenerateResult(
                    success=False,
                    error=f"生成失败: {result.stderr[:500]}",
                    duration=elapsed,
                )

            # 检查输出文件
            if not os.path.exists(output_path):
                return MusicGenerateResult(
                    success=False,
                    error=f"输出文件不存在: {output_path}",
                    duration=elapsed,
                )

            file_size = os.path.getsize(output_path)
            if file_size < 1000:  # 文件太小，可能是错误的
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

        except subprocess.TimeoutExpired:
            return MusicGenerateResult(
                success=False,
                error="生成超时（超过10分钟）",
                duration=time.time() - start_time,
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
        duration: Optional[float] = None,
        steps: Optional[int] = None,
        guidance_scale: float = 7.0,
        task: str = "text2music",
    ) -> MusicGenerateResult:
        """异步生成音乐"""
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


# 全局客户端实例
_music_client: Optional[LocalMusicClient] = None


def get_music_client() -> LocalMusicClient:
    """获取音乐生成客户端单例"""
    global _music_client
    if _music_client is None:
        _music_client = LocalMusicClient()
    return _music_client
