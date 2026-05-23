#!/usr/bin/env python
# 文件名: data_archive.py
# 作者: wuhao
# 日期: 2026_05_04_16:45:00
# 描述: 数据备份和归档工具 (Skills合规: 类封装)

from __future__ import annotations

import json
import os
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

# 添加项目路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from loguru import logger
from sqlalchemy import text

from infrastructure.database.database import get_db_engine


class DataArchiver:
    """
    数据归档器类 (Skills 规范: 强制类封装)

    功能:
    - 数据库表导出(JSON/CSV格式)
    - 自动归档旧数据(超过N天的数据)
    - 增量备份(只备份变更数据)
    - 备份文件管理(压缩,清理)
    - 归档统计报告

    使用示例:
        archiver = DataArchiver()

        # 全量备份
        archiver.backup_all_tables()

        # 归档90天前的会话
        archiver.archive_old_sessions(days=90)
    """

    # 配置常量
    DEFAULT_CONFIG = {
        "backup_dir": "backups",  # 备份目录
        "archive_dir": "archives",  # 归档目录
        "retention_days": 30,  # 备份保留天数
        "compress_backups": True,  # 是否压缩备份
        "tables_to_backup": [  # 需要备份的表
            "t_chat_sessions",
            "t_messages",
            "t_user_quota_usage",
        ],
    }

    def __init__(self, config: dict[str, Any] | None = None):
        """
        初始化数据归档器

        Args:
            config: 自定义配置(可选)
        """
        self.config = self.DEFAULT_CONFIG.copy()
        if config:
            self.config.update(config)

        # 确保目录存在
        backup_path = project_root / self.config["backup_dir"]
        archive_path = project_root / self.config["archive_dir"]

        backup_path.mkdir(parents=True, exist_ok=True)
        archive_path.mkdir(parents=True, exist_ok=True)

        self._engine = get_db_engine()

        # 统计信息
        self._stats = {
            "total_backups": 0,
            "total_archived_rows": 0,
            "last_backup_time": None,
        }

        logger.info("DataArchiver initialized")

    def _generate_filename(self, prefix: str, extension: str = "json") -> str:
        """生成备份文件名"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}.{extension}"

    def _export_table_to_json(
        self,
        table_name: str,
        output_path: Path,
        where_clause: str | None = None,
        limit: int | None = None,
    ) -> int:
        """
        导出单个表到JSON文件

        Args:
            table_name: 表名
            output_path: 输出文件路径
            where_clause: 可选的WHERE条件
            limit: 可选的行数限制

        Returns:
            导出的行数
        """
        query = f"SELECT * FROM {table_name}"

        if where_clause:
            query += f" WHERE {where_clause}"

        if limit:
            query += f" LIMIT {limit}"

        with self._engine.connect() as conn:
            result = conn.execute(text(query))

            # 转换为字典列表
            rows = []
            columns = result.keys()

            for row in result:
                row_dict = {}
                for idx, col in enumerate(columns):
                    value = row[idx]
                    # 处理日期时间类型
                    if hasattr(value, "isoformat"):
                        value = value.isoformat()
                    row_dict[col] = value

                rows.append(row_dict)

            # 写入JSON文件
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "table": table_name,
                        "exported_at": datetime.now().isoformat(),
                        "row_count": len(rows),
                        "data": rows,
                    },
                    f,
                    ensure_ascii=False,
                    indent=2,
                )

            return len(rows)

    def backup_all_tables(self) -> dict[str, Any]:
        """
        备份所有配置的表 (全量备份)

        Returns:
            备份结果字典
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_subdir = Path(self.config["backup_dir"]) / f"full_{timestamp}"
        backup_subdir.mkdir(parents=True, exist_ok=True)

        results = {
            "backup_id": timestamp,
            "started_at": datetime.now().isoformat(),
            "tables": {},
            "total_rows": 0,
            "status": "running",
        }

        try:
            for table in self.config["tables_to_backup"]:
                output_file = backup_subdir / self._generate_filename(table)

                row_count = self._export_table_to_json(
                    table_name=table,
                    output_path=output_file,
                )

                results["tables"][table] = {
                    "file": output_file.name,
                    "rows": row_count,
                    "size_bytes": output_file.stat().st_size if output_file.exists() else 0,
                }

                results["total_rows"] += row_count
                logger.info(f"Backed up {table}: {row_count} rows")

            results["status"] = "completed"
            results["completed_at"] = datetime.now().isoformat()

            # 更新统计
            self._stats["total_backups"] += 1
            self._stats["last_backup_time"] = datetime.now()

            # 压缩备份(如果启用)
            if self.config.get("compress_backups"):
                self._compress_directory(backup_subdir)

            logger.info(f"Backup completed | total_rows={results['total_rows']}")

        except Exception as e:
            results["status"] = "failed"
            results["error"] = str(e)
            logger.error(f"Backup failed | error={e}")
            raise

        return results

    def archive_old_sessions(self, days: int = 90) -> dict[str, Any]:
        """
        归档旧的会话数据(超过指定天数的数据)

        Args:
            days: 保留最近N天的数据

        Returns:
            归档结果字典
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_str = cutoff_date.strftime("%Y-%m-%d %H:%M:%S")

        archive_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = Path(self.config["archive_dir"]) / f"sessions_{archive_timestamp}"
        archive_path.mkdir(parents=True, exist_ok=True)

        results = {
            "archive_id": archive_timestamp,
            "cutoff_date": cutoff_str,
            "started_at": datetime.now().isoformat(),
            "archived_tables": {},
            "total_rows": 0,
            "status": "running",
        }

        try:
            with self._engine.begin() as conn:
                # 1. 归档会话表
                sessions_file = archive_path / self._generate_filename("sessions")
                sessions_count = self._export_table_to_json(
                    table_name="t_chat_sessions",
                    output_path=sessions_file,
                    where_clause=f"t_created_at < '{cutoff_str}' AND t_deleted_at IS NULL",
                )

                results["archived_tables"]["t_chat_sessions"] = {
                    "file": sessions_file.name,
                    "rows": sessions_count,
                }

                results["total_rows"] += sessions_count

                # 2. 归档消息表
                messages_file = archive_path / self._generate_filename("messages")
                messages_count = self._export_table_to_json(
                    table_name="t_messages",
                    output_path=messages_file,
                    where_clause=f"t_created_at < '{cutoff_str}'",
                )

                results["archived_tables"]["t_messages"] = {
                    "file": messages_file.name,
                    "rows": messages_count,
                }

                results["total_rows"] += messages_count

                # 3. 软删除已归档的会话(可选, 取消注释以启用)
                # if sessions_count > 0:
                #     conn.execute(text(
                #         f"UPDATE t_chat_sessions SET t_deleted_at = NOW() "
                #         f"WHERE t_created_at < '{cutoff_str}' AND t_deleted_at IS NULL"
                #     ))
                #     logger.info(f"Soft deleted {sessions_count} old sessions")

            results["status"] = "completed"
            results["completed_at"] = datetime.now().isoformat()

            # 更新统计
            self._stats["total_archived_rows"] += results["total_rows"]

            # 压缩归档
            if self.config.get("compress_backups"):
                self._compress_directory(archive_path)

            logger.info(
                f"Archive completed | sessions={sessions_count} | messages={messages_count} | older_than={days}days"
            )

        except Exception as e:
            results["status"] = "failed"
            results["error"] = str(e)
            logger.error(f"Archive failed | error={e}")
            raise

        return results

    def incremental_backup(self, since: datetime | None = None) -> dict[str, Any]:
        """
        增量备份(只备份指定时间之后的数据)

        Args:
            since: 起始时间, 默认为上次备份时间

        Returns:
            备份结果字典
        """
        if not since:
            since = self._stats.get("last_backup_time") or (datetime.now() - timedelta(days=1))

        since_str = since.strftime("%Y-%m-%d %H:%M:%S")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = Path(self.config["backup_dir"]) / f"incremental_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)

        results = {
            "backup_type": "incremental",
            "since": since_str,
            "started_at": datetime.now().isoformat(),
            "tables": {},
            "total_rows": 0,
        }

        for table in self.config["tables_to_backup"]:
            output_file = backup_path / self._generate_filename(table)

            row_count = self._export_table_to_json(
                table_name=table,
                output_path=output_file,
                where_clause=(f"t_updated_at >= '{since_str}' OR t_created_at >= '{since_str}'"),
            )

            results["tables"][table] = {
                "file": output_file.name,
                "new_or_updated_rows": row_count,
            }

            results["total_rows"] += row_count

        results["completed_at"] = datetime.now().isoformat()
        self._stats["last_backup_time"] = datetime.now()

        logger.info(f"Incremental backup completed | new_rows={results['total_rows']}")

        return results

    def cleanup_old_backups(self, days: int | None = None) -> dict[str, Any]:
        """
        清理过期的备份文件

        Args:
            days: 保留天数, 默认使用配置值

        Returns:
            清理结果字典
        """
        retention_days = days or self.config["retention_days"]
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        cleaned_files = []
        freed_space = 0

        # 清理备份目录
        backup_dir = Path(self.config["backup_dir"])
        if backup_dir.exists():
            for item in backup_dir.iterdir():
                if item.is_dir() and item.stat().st_mtime < cutoff_date.timestamp():
                    size = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
                    shutil.rmtree(item)
                    cleaned_files.append(str(item))
                    freed_space += size

        # 清理归档目录
        archive_dir = Path(self.config["archive_dir"])
        if archive_dir.exists():
            for item in archive_dir.iterdir():
                if item.is_dir() and item.stat().st_mtime < cutoff_date.timestamp():
                    size = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
                    shutil.rmtree(item)
                    cleaned_files.append(str(item))
                    freed_space += size

        result = {
            "cleaned_files": len(cleaned_files),
            "freed_space_mb": round(freed_space / (1024 * 1024), 2),
            "retention_days": retention_days,
        }

        logger.info(f"Cleanup completed | files={result['cleaned_files']} | freed={result['freed_space_mb']}MB")

        return result

    def _compress_directory(self, dir_path: Path) -> str:
        """
        压缩目录为zip文件

        Args:
            dir_path: 要压缩的目录路径

        Returns:
            zip文件路径
        """
        import zipfile

        zip_path = dir_path.with_suffix(".zip")

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file_path in dir_path.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(dir_path)
                    zipf.write(file_path, arcname)

        # 删除原始目录
        shutil.rmtree(dir_path)

        logger.info(f"Compressed to {zip_path.name}")

        return str(zip_path)

    def get_stats(self) -> dict[str, Any]:
        """
        获取归档统计信息

        Returns:
            统计字典
        """
        backup_dir = Path(self.config["backup_dir"])
        archive_dir = Path(self.config["archive_dir"])

        backup_count = len(list(backup_dir.glob("*"))) if backup_dir.exists() else 0
        archive_count = len(list(archive_dir.glob("*"))) if archive_dir.exists() else 0

        total_size = 0
        for d in [backup_dir, archive_dir]:
            if d.exists():
                for f in d.rglob("*"):
                    if f.is_file():
                        total_size += f.stat().st_size

        return {
            **self._stats,
            "backup_count": backup_count,
            "archive_count": archive_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
        }


def main():
    """命令行入口"""
    import argparse

    parser = argparse.ArgumentParser(description="Data Backup and Archive Tool")
    parser.add_argument(
        "--action",
        choices=["backup", "archive", "incremental", "cleanup", "stats"],
        required=True,
        help="Action to perform",
    )
    parser.add_argument("--days", type=int, default=90, help="Days threshold for archive/cleanup")
    parser.add_argument("--config", type=str, help="Path to config JSON file")

    args = parser.parse_args()

    # 加载配置(如果有)
    config = None
    if args.config and os.path.exists(args.config):
        with open(args.config, encoding="utf-8") as f:
            config = json.load(f)

    archiver = DataArchiver(config=config)

    if args.action == "backup":
        result = archiver.backup_all_tables()
    elif args.action == "archive":
        result = archiver.archive_old_sessions(days=args.days)
    elif args.action == "incremental":
        result = archiver.incremental_backup()
    elif args.action == "cleanup":
        result = archiver.cleanup_old_backups(days=args.days)
    elif args.action == "stats":
        result = archiver.get_stats()

    logger.info(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()


__all__ = ["DataArchiver"]
