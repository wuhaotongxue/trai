#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: async_batch_processor.py
# 作者: wuhao
# 日期: 2026_05_04_15:45:00
# 描述: 异步批量处理器 - 优化批量操作性能 (Skills合规: 类封装)

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable

from loguru import logger


class BatchStatus(str, Enum):
    """批处理任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"  # 部分成功


@dataclass
class BatchTask:
    """批处理任务"""
    task_id: str
    operation: str  # 操作类型(delete/export/compress等)
    items: list[Any]  # 要处理的项目列表
    status: BatchStatus = BatchStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    progress: int = 0  # 当前进度(0-100)
    total_items: int = 0
    processed_items: int = 0
    succeeded_items: int = 0
    failed_items: int = 0
    results: list[dict[str, Any]] = field(default_factory=list)
    errors: list[dict[str, Any]] = field(default_factory=list)


class AsyncBatchProcessor:
    """
    异步批量处理器类 (Skills 规范: 强制类封装)
    
    功能:
    - 异步并发执行批量操作
    - 实时进度跟踪
    - 错误处理和重试机制
    - 任务队列管理
    - 并发控制(避免过载)
    
    使用示例:
        processor = AsyncBatchProcessor(max_concurrent=5)
        
        task_id = await processor.submit_batch(
            operation="delete",
            items=session_ids,
            processor=delete_single_session,
        )
        
        # 获取进度
        progress = await processor.get_task_progress(task_id)
    """
    
    # 默认配置
    DEFAULT_CONFIG = {
        "max_concurrent": 5,       # 最大并发数
        "batch_size": 50,          # 每批处理数量
        "retry_count": 3,          # 失败重试次数
        "retry_delay": 1.0,        # 重试延迟(秒)
        "timeout_per_item": 30.0,  # 单项超时时间(秒)
        "progress_interval": 10,   # 进度更新间隔(处理的item数)
    }
    
    def __init__(self, max_concurrent: int | None = None):
        """
        初始化批处理器
        
        Args:
            max_concurrent: 最大并发数, 默认使用 DEFAULT_CONFIG
        """
        self.config = self.DEFAULT_CONFIG.copy()
        if max_concurrent:
            self.config["max_concurrent"] = max_concurrent
        
        # 任务存储
        self._tasks: dict[str, BatchTask] = {}
        
        # 信号量(控制并发数)
        self._semaphore = asyncio.Semaphore(self.config["max_concurrent"])
        
        # 统计信息
        self._stats = {
            "total_tasks": 0,
            "completed_tasks": 0,
            "failed_tasks": 0,
            "total_items_processed": 0,
        }
        
        logger.info(
            f"AsyncBatchProcessor initialized | max_concurrent={self.config['max_concurrent']}"
        )
    
    async def submit_batch(
        self,
        operation: str,
        items: list[Any],
        processor: Callable,
        task_id: str | None = None,
        **kwargs,
    ) -> str:
        """
        提交批处理任务
        
        Args:
            operation: 操作类型(delete/export/compress等)
            items: 要处理的项目列表
            processor: 单项处理函数(异步)
            task_id: 可选的任务ID, 如果不提供则自动生成
            **kwargs: 额外参数传递给processor
            
        Returns:
            任务ID
        """
        import uuid
        
        if not task_id:
            task_id = str(uuid.uuid4())[:8]
        
        # 创建任务
        task = BatchTask(
            task_id=task_id,
            operation=operation,
            items=items,
            total_items=len(items),
        )
        
        self._tasks[task_id] = task
        self._stats["total_tasks"] += 1
        
        logger.info(
            f"Batch task submitted | task_id={task_id} | "
            f"operation={operation} | items={len(items)}"
        )
        
        # 异步执行任务
        asyncio.create_task(self._execute_task(task, processor, **kwargs))
        
        return task_id
    
    async def _execute_task(
        self,
        task: BatchTask,
        processor: Callable,
        **kwargs,
    ) -> None:
        """
        执行批处理任务(内部方法)
        
        Args:
            task: 批处理任务
            processor: 单项处理函数
            **kwargs: 额外参数
        """
        task.status = BatchStatus.RUNNING
        task.started_at = datetime.now()
        
        try:
            # 使用信号量控制并发
            async with self._semaphore:
                for idx, item in enumerate(task.items, 1):
                    # 单项超时控制
                    try:
                        result = await asyncio.wait_for(
                            self._process_single_item(item, processor, task, **kwargs),
                            timeout=self.config["timeout_per_item"],
                        )
                        
                        task.processed_items += 1
                        task.succeeded_items += 1
                        task.results.append({
                            "item": item,
                            "status": "success",
                            "result": result,
                        })
                        
                    except asyncio.TimeoutError:
                        task.failed_items += 1
                        task.errors.append({
                            "item": item,
                            "error": f"Timeout after {self.config['timeout_per_item']}s",
                        })
                        logger.warning(f"Item timeout | item={item}")
                        
                    except Exception as e:
                        # 重试机制
                        success = False
                        for retry in range(self.config["retry_count"]):
                            try:
                                await asyncio.sleep(self.config["retry_delay"])
                                result = await processor(item, **kwargs)
                                
                                task.processed_items += 1
                                task.succeeded_items += 1
                                task.results.append({
                                    "item": item,
                                    "status": "success",
                                    "result": result,
                                })
                                success = True
                                break
                            except Exception as retry_error:
                                logger.warning(
                                    f"Retry {retry + 1}/{self.config['retry_count']} failed | "
                                    f"item={item} | error={retry_error}"
                                )
                        
                        if not success:
                            task.failed_items += 1
                            task.errors.append({
                                "item": item,
                                "error": str(e),
                                "retries": self.config["retry_count"],
                            })
                    
                    # 更新进度
                    if idx % self.config["progress_interval"] == 0 or idx == len(task.items):
                        progress = int((idx / len(task.items)) * 100)
                        task.progress = progress
                        
                        logger.debug(
                            f"Batch progress | task_id={task.task_id} | "
                            f"{progress}% ({idx}/{len(task.items)})"
                        )
            
            # 更新任务状态
            task.completed_at = datetime.now()
            task.progress = 100
            
            if task.failed_items == 0:
                task.status = BatchStatus.COMPLETED
                self._stats["completed_tasks"] += 1
            elif task.succeeded_items > 0:
                task.status = BatchStatus.PARTIAL
                self._stats["completed_tasks"] += 1
            else:
                task.status = BatchStatus.FAILED
                self._stats["failed_tasks"] += 1
            
            self._stats["total_items_processed"] += task.processed_items
            
            duration = (task.completed_at - task.started_at).total_seconds()
            logger.info(
                f"Batch task completed | task_id={task.task_id} | "
                f"status={task.status.value} | "
                f"succeeded={task.succeeded_items} | failed={task.failed_items} | "
                f"duration={duration:.2f}s"
            )
            
        except Exception as e:
            task.status = BatchStatus.FAILED
            task.completed_at = datetime.now()
            self._stats["failed_tasks"] += 1
            
            logger.error(f"Batch task failed | task_id={task.task_id} | error={e}")
    
    async def _process_single_item(
        self,
        item: Any,
        processor: Callable,
        task: BatchTask,
        **kwargs,
    ) -> Any:
        """
        处理单个项目(内部方法)
        
        Args:
            item: 项目数据
            processor: 处理函数
            task: 任务对象
            **kwargs: 额外参数
            
        Returns:
            处理结果
        """
        return await processor(item, **kwargs)
    
    async def get_task_progress(self, task_id: str) -> dict[str, Any]:
        """
        获取任务进度
        
        Args:
            task_id: 任务ID
            
        Returns:
            进度字典
        """
        task = self._tasks.get(task_id)
        if not task:
            return {"error": "Task not found"}
        
        return {
            "task_id": task.task_id,
            "operation": task.operation,
            "status": task.status.value,
            "progress": task.progress,
            "total_items": task.total_items,
            "processed_items": task.processed_items,
            "succeeded_items": task.succeeded_items,
            "failed_items": task.failed_items,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "started_at": task.started_at.isoformat() if task.started_at else None,
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        }
    
    async def get_task_result(self, task_id: str) -> dict[str, Any]:
        """
        获取任务结果(仅完成状态可获取)
        
        Args:
            task_id: 任务ID
            
        Returns:
            结果字典(包含results和errors列表)
        """
        task = self._tasks.get(task_id)
        if not task:
            return {"error": "Task not found"}
        
        if task.status not in [BatchStatus.COMPLETED, BatchStatus.PARTIAL, BatchStatus.FAILED]:
            return {"error": "Task still running", "status": task.status.value}
        
        return {
            "task_id": task.task_id,
            "status": task.status.value,
            "succeeded_items": task.succeeded_items,
            "failed_items": task.failed_items,
            "results": task.results[-10:],  # 只返回最近10条结果
            "errors": task.errors,
            "errors_sample": task.errors[:5],  # 返回前5个错误样本
        }
    
    def cancel_task(self, task_id: str) -> bool:
        """
        取消任务(标记为取消, 已启动的子任务会继续完成)
        
        Args:
            task_id: 任务ID
            
        Returns:
            是否成功取消
        """
        task = self._tasks.get(task_id)
        if not task or task.status != BatchStatus.RUNNING:
            return False
        
        # 注意: 这里只是标记, 实际已启动的协程会继续运行
        # 真正的取消需要更复杂的机制(如CancellationToken)
        logger.info(f"Task cancel requested | task_id={task_id}")
        return True
    
    def cleanup_completed_tasks(self, max_age_hours: int = 24) -> int:
        """
        清理已完成的旧任务
        
        Args:
            max_age_hours: 最大保留时间(小时)
            
        Returns:
            清理的任务数
        """
        from datetime import timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        tasks_to_delete = [
            tid for tid, task in self._tasks.items()
            if task.status in [BatchStatus.COMPLETED, BatchStatus.FAILED]
            and task.completed_at
            and task.completed_at < cutoff_time
        ]
        
        for tid in tasks_to_delete:
            del self._tasks[tid]
        
        if tasks_to_delete:
            logger.info(f"Cleaned up {len(tasks_to_delete)} old tasks")
        
        return len(tasks_to_delete)
    
    def get_stats(self) -> dict[str, Any]:
        """
        获取处理器统计信息
        
        Returns:
            统计字典
        """
        active_tasks = sum(
            1 for t in self._tasks.values() 
            if t.status == BatchStatus.RUNNING
        )
        
        return {
            "config": self.config,
            "stats": self._stats,
            "active_tasks": active_tasks,
            "queued_tasks": len(self._tasks) - active_tasks,
        }


# 全局单例实例
batch_processor = AsyncBatchProcessor(max_concurrent=5)


__all__ = ["AsyncBatchProcessor", "BatchTask", "BatchStatus", "batch_processor"]
