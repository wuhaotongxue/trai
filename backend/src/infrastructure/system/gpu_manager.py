"""
Author: wuhao
Date: 2026-05-23
"""

import subprocess
import threading

from loguru import logger


class GPUManager:
    """GPU 资源管理器，负责监控和分配多卡显存。"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init()
            return cls._instance

    def _init(self):
        """初始化 GPU 管理器。"""
        self.gpu_count = 0
        self.gpu_memory_total: dict[int, int] = {}
        self.gpu_memory_free: dict[int, int] = {}
        self._refresh_gpu_status()

    def _refresh_gpu_status(self):
        """刷新当前所有 GPU 的状态。"""
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,memory.total,memory.free", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                check=True,
            )
            lines = result.stdout.strip().split("\n")
            self.gpu_count = len(lines)
            for line in lines:
                if not line.strip():
                    continue
                parts = line.split(",")
                idx = int(parts[0].strip())
                total = int(parts[1].strip())
                free = int(parts[2].strip())
                self.gpu_memory_total[idx] = total
                self.gpu_memory_free[idx] = free
            logger.info(f"成功探测到 {self.gpu_count} 张 GPU 状态")
        except Exception as e:
            logger.error(f"探测 GPU 状态失败: {str(e)}")

    def allocate_gpu(self, required_memory_mb: int) -> int | None:
        """分配显存足够的 GPU。"""
        with self._lock:
            self._refresh_gpu_status()
            best_gpu = None
            max_free = -1

            for idx, free_mem in self.gpu_memory_free.items():
                if free_mem >= required_memory_mb and free_mem > max_free:
                    best_gpu = idx
                    max_free = free_mem

            if best_gpu is not None:
                logger.info(f"为任务分配 GPU {best_gpu}，需求显存 {required_memory_mb} MB")
                return best_gpu
            else:
                logger.warning(f"无法分配 GPU，所有显卡均无法满足 {required_memory_mb} MB 需求")
                return None

    def get_gpu_status(self) -> list[dict[str, int]]:
        """获取所有 GPU 状态。"""
        self._refresh_gpu_status()
        status = []
        for idx in range(self.gpu_count):
            status.append(
                {
                    "index": idx,
                    "total_mb": self.gpu_memory_total.get(idx, 0),
                    "free_mb": self.gpu_memory_free.get(idx, 0),
                }
            )
        return status
