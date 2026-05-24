#!/usr/bin/env python
# 文件名: db_sink.py
# 作者: wuhao
# 日期: 2026_05_24_16:25:00
# 描述: Loguru 拦截日志并入库的 Sink

import asyncio

from infrastructure.database.database import get_db_session
from infrastructure.database.extension_models import SystemLogModel


class DBSink:
    """
    Loguru 数据库日志输出目标.
    """

    def __init__(self):
        """初始化"""
        pass

    def write(self, message):
        """
        Loguru 的 sink 写入回调函数

        参数:
            message: loguru 传递的日志对象

        返回:
            None
        """
        record = message.record
        level = record["level"].name

        # 只记录 WARNING 及以上的日志到数据库
        if level not in ["WARNING", "ERROR", "CRITICAL"]:
            return

        module = f"{record['name']}:{record['line']}"
        text = record["message"]
        traceback = record["exception"]
        if traceback:
            traceback_str = str(traceback)
        else:
            traceback_str = None

        # 异步入库
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._async_save_log(level, module, text, traceback_str))
        except RuntimeError:
            # 如果没有 running loop (同步环境)，则直接跳过或另行处理
            pass

    async def _async_save_log(self, level: str, module: str, message: str, traceback: str | None = None) -> None:
        """异步保存日志到数据库"""
        try:
            async for session in get_db_session():
                log = SystemLogModel(
                    level=level,
                    module=module,
                    message=message,
                    traceback=traceback
                )
                session.add(log)
                await session.commit()
                break # 只用一次 session
        except Exception as e:
            # Fallback to sys.stderr to avoid recursive logging errors
            import sys
            sys.stderr.write(f"Failed to save log to DB: {e}\n")

db_sink = DBSink()
