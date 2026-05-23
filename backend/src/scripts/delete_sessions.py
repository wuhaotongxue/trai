#!/usr/bin/env python
# 文件名: delete_sessions.py
# 作者: wuhao
# 日期: 2026_05_20
# 描述: 批量删除对话会话脚本，支持按标题/时间/消息数/用户等条件筛选
# 用法:
#   python -m scripts.delete_sessions --dry-run                              # 预览要删除的会话（不实际删除）
#   python -m scripts.delete_sessions --title "新对话"                        # 删除所有标题为"新对话"的会话
#   python -m scripts.delete_sessions --title-prefix "新对话"                  # 删除所有标题以"新对话"开头的会话
#   python -m scripts.delete_sessions --older-than-days 7                    # 删除 7 天前创建的会话
#   python -m scripts.delete_sessions --empty                               # 删除空会话（消息数为 0）
#   python -m scripts.delete_sessions --user-id "xxx"                        # 删除指定用户的所有会话
#   python -m scripts.delete_sessions --confirm                             # 确认删除（必须加此参数才会实际删除）


from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from infrastructure.database.database import get_database
from infrastructure.database.models import ChatSessionModel, MessageModel


def get_session_count_filter(
    db_session: Session,
    session_ids: list[str],
) -> dict[str, int]:
    """获取每个会话的消息数量

    Args:
        db_session: 数据库会话
        session_ids: 会话 ID 列表

    Returns:
        dict[str, int]: {session_id: message_count}
    """
    if not session_ids:
        return {}

    result = db_session.execute(
        select(
            MessageModel.t_session_id,
            func.count(MessageModel.t_id).label("msg_count"),
        )
        .where(MessageModel.t_session_id.in_(session_ids))
        .group_by(MessageModel.t_session_id)
    )
    return {row.t_session_id: row.msg_count for row in result}


def query_sessions(
    db_session: Session,
    title: str | None = None,
    title_prefix: str | None = None,
    older_than_days: int | None = None,
    empty_only: bool = False,
    user_id: str | None = None,
) -> list[dict]:
    """查询符合条件的会话

    Returns:
        list[dict]: 会话信息列表
    """
    conditions = [ChatSessionModel.t_deleted_at.is_(None)]

    if title:
        conditions.append(ChatSessionModel.t_title == title)
    elif title_prefix:
        conditions.append(ChatSessionModel.t_title.like(f"{title_prefix}%"))
    elif older_than_days:
        cutoff = datetime.now() - timedelta(days=older_than_days)
        conditions.append(ChatSessionModel.t_created_at < cutoff)
    elif user_id:
        conditions.append(ChatSessionModel.t_user_id == user_id)

    stmt = select(ChatSessionModel).where(*conditions).order_by(ChatSessionModel.t_created_at.desc())
    result = db_session.execute(stmt)
    sessions = result.scalars().all()

    # 获取消息数量
    session_ids = [s.t_session_id for s in sessions]
    msg_counts = get_session_count_filter(db_session, session_ids)

    return [
        {
            "session_id": s.t_session_id,
            "title": s.t_title,
            "user_id": s.t_user_id,
            "username": s.t_username,
            "message_count": msg_counts.get(s.t_session_id, 0),
            "created_at": s.t_created_at,
            "updated_at": s.t_updated_at,
        }
        for s in sessions
    ]


def delete_sessions_batch(
    db_session: Session,
    session_ids: list[str],
    operator_id: str = "script",
    operator_name: str = "delete_sessions.py",
) -> int:
    """批量软删除会话及其消息

    Args:
        db_session: 数据库会话
        session_ids: 要删除的会话 ID 列表
        operator_id: 操作人 ID
        operator_name: 操作人名称

    Returns:
        int: 实际删除的会话数量
    """
    if not session_ids:
        return 0

    now = datetime.now()

    # 软删除会话
    stmt = select(ChatSessionModel).where(
        ChatSessionModel.t_session_id.in_(session_ids),
        ChatSessionModel.t_deleted_at.is_(None),
    )
    result = db_session.execute(stmt)
    models = result.scalars().all()

    for model in models:
        model.t_deleted_at = now
        model.t_deleted_by = operator_id
        model.t_deleted_by_name = operator_name

    db_session.commit()
    return len(models)


def main() -> None:
    """主函数"""
    parser = argparse.ArgumentParser(
        description="TRAI 批量删除对话会话脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 预览所有"新对话"会话（不删除）
  python -m scripts.delete_sessions --title "新对话"

  # 删除所有空会话（无消息的会话）
  python -m scripts.delete_sessions --empty

  # 删除 7 天前的所有会话
  python -m scripts.delete_sessions --older-than-days 7

  # 删除指定用户的所有会话
  python -m scripts.delete_sessions --user-id "user-xxx"

  # 确认删除（加上 --confirm 才真正删除）
  python -m scripts.delete_sessions --title "新对话" --confirm
        """,
    )

    parser.add_argument(
        "--title",
        type=str,
        default=None,
        help="删除标题完全匹配的会话（精确匹配）",
    )
    parser.add_argument(
        "--title-prefix",
        type=str,
        default=None,
        help="删除标题以指定前缀开头的会话（模糊匹配）",
    )
    parser.add_argument(
        "--older-than-days",
        type=int,
        default=None,
        help="删除 N 天前创建的会话",
    )
    parser.add_argument(
        "--empty",
        action="store_true",
        help="删除所有空会话（消息数为 0）",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        default=None,
        help="删除指定用户的所有会话",
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="确认删除（必须加此参数才会实际删除，否则只预览）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="预览模式，不实际删除（默认行为）",
    )

    args = parser.parse_args()

    # 配置日志
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{message}</level>",
        level="INFO",
    )

    # 默认行为是 dry-run，只有 --confirm 才真正删除
    is_dry_run = not args.confirm

    # 验证参数
    conditions_count = sum(
        [
            bool(args.title),
            bool(args.title_prefix),
            args.older_than_days is not None,
            bool(args.empty),
            bool(args.user_id),
        ]
    )

    if conditions_count == 0:
        logger.error("请至少指定一个筛选条件（--title / --title-prefix / --older-than-days / --empty / --user-id）")
        parser.print_help()
        sys.exit(1)

    if conditions_count > 1:
        logger.warning("指定了多个条件，将同时满足所有条件")
        logger.warning("建议只使用一个条件，避免误删")

    # 连接数据库
    db = get_database()
    session = db.get_session()

    try:
        # 查询符合条件的会话
        sessions = query_sessions(
            db_session=session,
            title=args.title,
            title_prefix=args.title_prefix,
            older_than_days=args.older_than_days,
            empty_only=args.empty,
            user_id=args.user_id,
        )

        # 空会话筛选
        if args.empty:
            sessions = [s for s in sessions if s["message_count"] == 0]

        if not sessions:
            logger.info("没有找到符合条件的会话")
            return

        # 统计摘要
        total = len(sessions)
        empty_count = sum(1 for s in sessions if s["message_count"] == 0)
        users = set(s["user_id"] or "anonymous" for s in sessions)
        oldest = min(s["created_at"] for s in sessions) if sessions else None
        newest = max(s["created_at"] for s in sessions) if sessions else None

        print(f"\n{'=' * 60}")
        print("查询结果预览")
        print(f"{'=' * 60}")
        print(f"  符合条件的会话: {total} 个")
        print(f"  其中空会话: {empty_count} 个")
        print(f"  涉及用户: {len(users)} 个")
        if oldest:
            print(f"  最早创建: {oldest.strftime('%Y-%m-%d %H:%M:%S')}")
        if newest:
            print(f"  最新创建: {newest.strftime('%Y-%m-%d %H:%M:%S')}")

        # 显示前 20 条
        print(f"\n前 {min(20, total)} 条会话:")
        print(f"  {'会话ID':<40} | {'标题':<20} | {'消息数':>5} | {'用户':<15} | {'创建时间'}")
        print(f"  {'-' * 40} | {'-' * 20} | {'-' * 5} | {'-' * 15} | {'-' * 20}")
        for s in sessions[:20]:
            title = (s["title"] or "（无标题）")[:18]
            uid = (s["user_id"] or "anonymous")[:13]
            created = s["created_at"].strftime("%Y-%m-%d %H:%M") if s["created_at"] else "—"
            print(f"  {s['session_id']:<40} | {title:<20} | {s['message_count']:>5} | {uid:<15} | {created}")

        if total > 20:
            print(f"  ... 还有 {total - 20} 条")

        print(f"{'=' * 60}")

        if is_dry_run:
            print(f"\n[预览模式] 以上 {total} 个会话将被删除")
            print("[预览模式] 添加 --confirm 参数以确认删除")
            print("[预览模式] 示例: python -m scripts.delete_sessions --title '新对话' --confirm")
        else:
            print(f"\n[确认删除] 即将删除 {total} 个会话...")
            session_ids = [s["session_id"] for s in sessions]
            deleted_count = delete_sessions_batch(
                db_session=session,
                session_ids=session_ids,
            )
            logger.info(f"删除完成，共删除 {deleted_count} 个会话")

    finally:
        session.close()


if __name__ == "__main__":
    main()
