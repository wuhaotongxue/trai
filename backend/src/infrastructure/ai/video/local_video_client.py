#!/usr/bin/env python
# 文件名: local_video_client.py
# 作者: wuhao
# 日期: 2026_05_20
# 描述: 本地视频生成客户端，使用 Wan-AI/Wan2.1-T2V-1.3B 模型 + DiffSynth Pipeline
# 模型下载: modelscope download --model Wan-AI/Wan2.1-T2V-1.3B
# DiffSynth 安装: pip install diffsynth


from __future__ import annotations

import asyncio
import json
import os
import select
import subprocess
import sys
import tempfile
from typing import Any

import torch
from loguru import logger

from core.exceptions import ExternalServiceError

# Wan2.1-T2V-1.3B 约需 ~10GB 显存，预留余量
_MIN_FREE_GB = 10


class LocalVideoClient:
    """本地视频生成客户端 (Wan-AI/Wan2.1-T2V-1.3B + DiffSynth)

    每次推理启动独立 subprocess，进程退出后显存自动释放。
    """

    _instance: LocalVideoClient | None = None
    _device_locks: dict[int, asyncio.Lock] = {}

    def __new__(cls) -> LocalVideoClient:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        self._model_path: str = os.getenv(
            "MODELSCOPE_VIDEO_MODEL_PATH",
            "/home/qyjgylc_whf/.cache/modelscope/hub/models/Wan-AI/Wan2.1-T2V-1.3B",
        )
        self._default_frames: int = int(os.getenv("MODELSCOPE_VIDEO_FRAMES", "81"))
        self._default_resolution: str = os.getenv("MODELSCOPE_VIDEO_RESOLUTION", "1280x720")

    def _get_gpu_free_memory(self, device: int) -> float:
        """查询指定 GPU 的空闲显存（GB）"""
        if device < 0:
            return float("inf")
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,memory.free", "--format=csv,noheader,nounits", "-i", str(device)],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                free_mb = float(result.stdout.strip().split(",")[-1].strip())
                return free_mb / 1024
        except Exception:
            pass
        return -1.0

    def _get_devices_by_free_memory(self) -> list[tuple[int, float]]:
        """获取所有 GPU，按空闲显存从多到少排序"""
        if not torch.cuda.is_available():
            return [(-1, float("inf"))]

        devices: list[tuple[int, float]] = []
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,memory.free", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    parts = line.split(",")
                    if len(parts) >= 2:
                        idx = int(parts[0].strip())
                        free_mb = float(parts[1].strip())
                        free_gb = free_mb / 1024
                        devices.append((idx, free_gb))
                        logger.info(f"GPU {idx}: free={free_gb:.2f}GB")
        except Exception as error:
            logger.warning(f"nvidia-smi 查询失败: {error}")

        if not devices:
            for i in range(torch.cuda.device_count()):
                try:
                    free, total = torch.cuda.mem_get_info(i)
                    free_gb = free / (1024**3)
                    devices.append((i, free_gb))
                except Exception:
                    devices.append((i, 0.0))

        devices.sort(key=lambda x: x[1], reverse=True)
        return devices

    def _ensure_lock(self, device: int) -> asyncio.Lock:
        """确保指定 GPU 的锁存在"""
        if device not in LocalVideoClient._device_locks:
            LocalVideoClient._device_locks[device] = asyncio.Lock()
        return LocalVideoClient._device_locks[device]

    def _build_script(
        self,
        prompt: str,
        frames: int,
        resolution: str,
        model_path: str = "",
    ) -> str:
        """构建推理脚本内容（纯字符串模板，不用 f-string 避免插值问题）"""
        width, height = resolution.split("x")

        # 预定义的本地模型路径（~/.cache/modelscope 已完整下载）
        local_path = model_path or os.path.expanduser("~/.cache/modelscope/hub/models/Wan-AI/Wan2.1-T2V-1.3B")

        # 用 7 个步骤，清晰的进度输出
        # 生成的脚本使用 print(..., flush=True) 强制刷新，用 PYTHONUNBUFFERED=1 + -u 标志
        script = [
            "import json, sys, os, base64, torch",
            f"base_path = r'{local_path}'",
            "",
            "device = 'cuda'",
            "print('[1/7] 初始化 | GPU数量: ' + str(torch.cuda.device_count()), flush=True)",
            "",
            "try:",
            "    from diffsynth.pipelines.wan_video import WanVideoPipeline, ModelConfig",
            "    from diffsynth.utils.data import save_video",
            "    print('[2/7] DiffSynth 已安装', flush=True)",
            "except ImportError:",
            "    print('[2/7] 安装 DiffSynth...', flush=True)",
            "    os.system('pip install diffsynth -q')",
            "    from diffsynth.pipelines.wan_video import WanVideoPipeline, ModelConfig",
            "    from diffsynth.utils.data import save_video",
            "    print('[2/7] DiffSynth 安装完成', flush=True)",
            "",
            "print('[3/7] 加载模型: Wan2.1-T2V-1.3B (本地)', flush=True)",
            "",
            "pipe = WanVideoPipeline.from_pretrained(",
            "    torch_dtype=torch.bfloat16,",
            "    device=device,",
            "    model_configs=[",
            "        ModelConfig(path=base_path + '/diffusion_pytorch_model.safetensors'),",
            "        ModelConfig(path=base_path + '/models_t5_umt5-xxl-enc-bf16.pth'),",
            "        ModelConfig(path=base_path + '/Wan2.1_VAE.pth'),",
            "    ],",
            "    tokenizer_config=ModelConfig(path=base_path + '/google/umt5-xxl/'),",
            ")",
            "",
            "print('[4/7] 模型加载完成', flush=True)",
            "",
            "prompt_input = sys.stdin.read().strip()",
            "print('[5/7] 开始推理 | frames: " + str(frames) + " | res: " + width + "x" + height + "', flush=True)",
            "print('[推理中] 已开始 | " + str(frames) + " 帧推理中，每30秒心跳...', flush=True)",
            "",
            "import time as _time",
            "_start_ts = _time.time()",
            "_last_hb = _start_ts",
            "_hb_interval = 30",
            "",
            "def _heartbeat(label='推理'):",
            "    global _last_hb",
            "    now = _time.time()",
            "    elapsed = int(now - _start_ts)",
            "    print('[推理心跳] " + str(frames) + "帧推理中 | 已用 ' + str(elapsed) + ' 秒', flush=True)",
            "    _last_hb = now",
            "",
            # 用 tqdm 或简单线程做心跳（不阻塞 pipe）
            "import threading as _thr",
            "_stop_hb = False",
            "def _hb_worker():",
            "    while not _stop_hb:",
            "        _time.sleep(_hb_interval)",
            "        if not _stop_hb:",
            "            _heartbeat()",
            "",
            "_hb_thread = _thr.Thread(target=_hb_worker, daemon=True)",
            "_hb_thread.start()",
            "",
            "video = pipe(",
            "    prompt=prompt_input,",
            '    negative_prompt="blurry, low quality, distorted, artifacts, watermark",',
            "    seed=42,",
            ")",
            "",
            "_stop_hb = True",
            "_hb_thread.join(timeout=1)",
            "_elapsed_total = int(_time.time() - _start_ts)",
            "print('[推理心跳] 推理完成 | 共用时 ' + str(_elapsed_total) + ' 秒', flush=True)",
            "",
            "print('[6/7] 视频生成完成 | 帧数: ' + str(len(video)), flush=True)",
            "",
            'tmp_out = "/tmp/wan2_1_output.mp4"',
            "save_video(video, tmp_out, fps=15, quality=5)",
            "with open(tmp_out, 'rb') as f:",
            "    video_bytes = f.read()",
            "os.unlink(tmp_out)",
            "",
            "output_b64 = base64.b64encode(video_bytes).decode('utf-8')",
            "print('[7/7] 视频编码完成，准备返回...', flush=True)",
            "print(json.dumps({",
            "    'video_base64': output_b64,",
            "    'size_bytes': len(video_bytes),",
            "    'frames': " + str(frames) + ",",
            "    'resolution': '" + width + "x" + height + "',",
            "    'frame_count': len(video),",
            "    'inference_time_seconds': _elapsed_total,",
            "}))",
        ]
        return "\n".join(script)

    async def _run_subprocess(
        self,
        device: int,
        prompt: str,
        frames: int,
        resolution: str,
        task_id: str = "",
    ) -> dict[str, Any]:
        """在独立子进程中执行视频生成，用 subprocess.Popen + asyncio.to_thread() 避免 pipe 协程冲突"""

        def _sync_run() -> tuple[str, str, int]:
            """同步执行子进程，返回 (stdout_str, stderr_str, returncode)"""
            script_content = self._build_script(prompt, frames, resolution, self._model_path)
            script_fd, script_path = tempfile.mkstemp(suffix=".py", prefix="video_")
            os.close(script_fd)
            try:
                with open(script_path, "w", encoding="utf-8") as fh:
                    fh.write(script_content)

                env = os.environ.copy()
                env["CUDA_VISIBLE_DEVICES"] = str(device)
                env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
                # 让 ModelScope 从已有的缓存目录读取模型，避免每次重新下载
                modelscope_cache = os.path.expanduser("~/.cache/modelscope")
                env["MODELSCOPE_CACHE"] = modelscope_cache
                env["HF_HOME"] = modelscope_cache
                env["TRANSFORMERS_CACHE"] = modelscope_cache

                proc = subprocess.Popen(
                    [sys.executable, "-u", script_path],  # -u = unbuffered mode
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env,
                )

                # 先发 prompt（进程启动后等待 stdin）
                proc.stdin.write(prompt.encode("utf-8") + b"\n")
                proc.stdin.close()

                stdout_buf: list[bytes] = []
                stderr_buf: list[bytes] = []
                stdout_done = False
                stderr_done = False

                while not (stdout_done and stderr_done):
                    ready_r, _, _ = select.select([proc.stdout, proc.stderr], [], [], 0.5)
                    if proc.stdout in ready_r:
                        chunk = os.read(proc.stdout.fileno(), 16384)
                        if not chunk:
                            stdout_done = True
                        else:
                            stdout_buf.append(chunk)
                            line_text = chunk.decode("utf-8", errors="replace")
                            for ln in line_text.splitlines():
                                ln = ln.strip()
                                if ln:
                                    logger.info(f"[子进程] {ln}")
                    if proc.stderr in ready_r:
                        chunk = os.read(proc.stderr.fileno(), 4096)
                        if not chunk:
                            stderr_done = True
                        else:
                            stderr_buf.append(chunk)

                    # 进程已结束，收集剩余输出
                    if proc.poll() is not None and not stdout_done:
                        try:
                            remaining = os.read(proc.stdout.fileno(), 65536)
                            if remaining:
                                stdout_buf.append(remaining)
                        except OSError:
                            pass
                        stdout_done = True
                    if proc.poll() is not None and not stderr_done:
                        try:
                            remaining = os.read(proc.stderr.fileno(), 65536)
                            if remaining:
                                stderr_buf.append(remaining)
                        except OSError:
                            pass
                        stderr_done = True

                return (
                    b"".join(stdout_buf).decode("utf-8", errors="replace"),
                    b"".join(stderr_buf).decode("utf-8", errors="replace"),
                    proc.poll() or 0,
                )
            finally:
                try:
                    os.unlink(script_path)
                except OSError:
                    pass

        stdout_str, stderr_str, returncode = await asyncio.to_thread(_sync_run)

        if stderr_str.strip():
            logger.warning(f"[子进程 stderr] {stderr_str[:500]}")

        if returncode != 0:
            logger.error(f"视频生成子进程失败 | returncode={returncode}")
            if "OutOfMemoryError" in stderr_str or "CUDA out of memory" in stderr_str:
                raise torch.cuda.OutOfMemoryError(stderr_str)
            raise RuntimeError(f"视频生成子进程失败(returncode={returncode}): {stderr_str[:500]}")

        lines = [l.strip() for l in stdout_str.strip().splitlines() if l.strip()]
        for line in reversed(lines):
            if line.startswith("{"):
                return json.loads(line)

        raise RuntimeError(f"视频生成未返回有效 JSON 输出: stdout[:200]={stdout_str[:200]}")

    async def generate(
        self,
        prompt: str,
        frames: int | None = None,
        resolution: str | None = None,
        task_id: str = "",
    ) -> dict[str, Any]:
        """异步生成视频，自动选择最空闲的 GPU，OOM 时自动换 GPU 重试

        Args:
            prompt: 视频描述文本
            frames: 视频帧数（决定时长，约 5fps，81帧约 16 秒）
            resolution: 分辨率，如 "1280x720"
            task_id: 任务 ID（用于日志追踪）

        Returns:
            dict: {"video_base64": ..., "size_bytes": ..., "frames": ..., "resolution": ...}
        """
        actual_frames = frames or self._default_frames
        actual_resolution = resolution or self._default_resolution

        devices = self._get_devices_by_free_memory()
        last_error: Exception | None = None

        # 截取 prompt 前50字符用于日志（避免过长）
        prompt_short = prompt[:50]
        task_id_hash = task_id[:8] if task_id else "N/A"

        logger.info(
            f"[===== 视频生成任务开始 =====] task_id={task_id_hash} | "
            f"提示词: {prompt_short}... | frames: {actual_frames} | resolution: {actual_resolution} | "
            f"可用GPU: {[f'GPU{d}({g:.1f}GB)' for d, g in devices]}"
        )

        for device, free_gb in devices:
            if device >= 0 and free_gb < _MIN_FREE_GB:
                logger.warning(f"[{task_id_hash}] GPU {device} 空闲显存 {free_gb:.2f}GB < {_MIN_FREE_GB}GB，跳过")
                continue

            device_name = f"GPU {device}" if device >= 0 else "CPU"
            lock = self._ensure_lock(device)

            async with lock:
                if device >= 0:
                    free_now = self._get_gpu_free_memory(device)
                    if free_now >= 0 and free_now < _MIN_FREE_GB:
                        logger.warning(
                            f"[{task_id_hash}] {device_name} 当前空闲 {free_now:.2f}GB < {_MIN_FREE_GB}GB，跳过"
                        )
                        continue

                logger.info(f"[{task_id_hash}] 选择 {device_name} | 空闲显存: {free_gb:.2f}GB | 准备启动推理进程")

                for attempt in range(2):
                    attempt_label = f"尝试{attempt + 1}/2"
                    try:
                        logger.info(f"[{task_id_hash}] {device_name} | {attempt_label} | 开始执行推理脚本...")
                        result = await self._run_subprocess(
                            device,
                            prompt,
                            actual_frames,
                            actual_resolution,
                            task_id_hash,
                        )

                        size = result.get("size_bytes", 0)
                        if size == 0:
                            logger.warning(f"[{task_id_hash}] {device_name} {attempt_label} | 输出为空，跳过")
                            last_error = RuntimeError("视频生成结果为空")
                            break

                        logger.info(
                            f"[{task_id_hash}] {device_name} {attempt_label} === 视频生成成功 === | "
                            f"大小: {size:,} bytes ({size / 1024 / 1024:.2f} MB) | "
                            f"帧数: {result.get('frames')} | "
                            f"分辨率: {result.get('resolution')} | "
                            f"frame_count: {result.get('frame_count')}"
                        )
                        return result

                    except torch.cuda.OutOfMemoryError:
                        logger.warning(f"[{task_id_hash}] {device_name} {attempt_label} | OOM，换GPU重试")
                        if attempt == 1:
                            logger.error(f"[{task_id_hash}] {device_name} | OOM两次，放弃 | error={last_error}")
                            break
                    except Exception as error:
                        logger.error(
                            f"[{task_id_hash}] {device_name} {attempt_label} | 异常: {type(error).__name__}: {error}"
                        )
                        last_error = error
                        break

        raise ExternalServiceError(
            message="所有 GPU 均不可用或显存不足，视频生成失败",
            details={"last_error": str(last_error) if last_error else None},
        )

    @classmethod
    def unload(cls, device: int | None = None) -> None:
        """subprocess 模式下无需手动卸载"""

    @classmethod
    def is_loaded(cls, device: int | None = None) -> bool:
        """subprocess 模式下始终返回 False"""
        return False


__all__ = ["LocalVideoClient"]
