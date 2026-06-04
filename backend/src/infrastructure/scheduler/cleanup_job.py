import shutil
import tempfile
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

from infrastructure.storage.s3_storage import get_s3_storage

_scheduler = AsyncIOScheduler()


class CleanupService:
    @staticmethod
    async def clean_local_temp_files():
        """清理本地过期临时文件(1天前)"""
        logger.info("开始清理本地临时文件...")
        temp_dir = Path(tempfile.gettempdir())
        now = time.time()
        one_day_ago = now - 24 * 3600

        deleted_count = 0
        prefixes = ("video_", "trai_", "separate_", "subtitle_", "video_to_en_")

        try:
            for item in temp_dir.iterdir():
                if not item.name.startswith(prefixes):
                    continue

                try:
                    stats = item.stat()
                    if stats.st_mtime < one_day_ago:
                        if item.is_dir():
                            shutil.rmtree(item)
                        else:
                            item.unlink()
                        deleted_count += 1
                        logger.debug(f"已清理本地过期临时文件: {item.name}")
                except Exception as e:
                    logger.warning(f"清理临时文件失败 {item.name}: {e}")

        except Exception as e:
            logger.error(f"清理本地临时文件发生错误: {e}")

        logger.info(f"本地临时文件清理完成，共清理 {deleted_count} 个过期文件/目录。")

    @staticmethod
    async def clean_s3_temp_files():
        """清理 S3 中过期的 AI 生成内容(超过7天)"""
        logger.info("开始清理 S3 历史 AI 生成文件(>7天)...")
        try:
            storage = get_s3_storage()
            # 扫描所有 ai_generated 目录
            prefix = "private/tenants/"
            objects = storage.list_objects(prefix=prefix)

            now_utc = datetime.now(UTC)
            seven_days_ago = now_utc - timedelta(days=7)

            keys_to_delete = []
            for obj in objects:
                key = obj.get("Key", "")
                if "/ai_generated/" not in key:
                    continue

                last_modified = obj.get("LastModified")
                if last_modified and last_modified < seven_days_ago:
                    keys_to_delete.append(key)

            if keys_to_delete:
                success = storage.delete_objects(keys_to_delete)
                if success:
                    logger.info(f"成功清理 {len(keys_to_delete)} 个过期的 S3 生成文件。")
                else:
                    logger.error("批量清理 S3 过期文件失败。")
            else:
                logger.info("没有需要清理的过期 S3 生成文件。")

        except Exception as e:
            logger.error(f"清理 S3 历史文件发生错误: {e}")

    @staticmethod
    async def run_all_cleanup_tasks():
        """执行所有清理任务"""
        logger.info("=== 触发定时清理任务 ===")
        await CleanupService.clean_local_temp_files()
        await CleanupService.clean_s3_temp_files()
        logger.info("=== 定时清理任务执行完毕 ===")


def start_scheduler():
    """启动后台调度器"""
    if _scheduler.running:
        return

    # 每天凌晨 3:00 执行清理任务
    _scheduler.add_job(
        CleanupService.run_all_cleanup_tasks, "cron", hour=3, minute=0, id="daily_cleanup_job", replace_existing=True
    )

    _scheduler.start()
    logger.info("定时清理任务调度器已启动 (Cron: 每天 03:00).")


def stop_scheduler():
    """停止调度器"""
    if _scheduler.running:
        _scheduler.shutdown()
        logger.info("定时清理任务调度器已停止.")
