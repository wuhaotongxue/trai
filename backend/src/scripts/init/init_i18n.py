#!/usr/bin/env python
# 文件名: init_i18n.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 初始化国际化翻译数据_主入口, 调用前端和客户端初始化脚本

from __future__ import annotations

import os
import sys

from loguru import logger

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from infrastructure.database import get_database
from scripts.init.init_i18n_client import ClientI18nInit
from scripts.init.init_i18n_frontend import FrontendI18nInit


class I18nInitScript:
    """国际化初始化脚本_主入口"""

    @classmethod
    def init_database(cls) -> None:
        """初始化数据库表"""
        logger.info("=" * 60)
        logger.info("初始化国际化数据库表")
        logger.info("=" * 60)

        try:
            db = get_database()
            db.create_tables()
            logger.info("[OK] 数据库表创建成功")
        except Exception as e:
            logger.error(f"[ERROR] 数据库初始化失败: {e}")
            raise

    @classmethod
    def run(cls) -> None:
        """运行所有初始化"""
        cls.init_database()
        FrontendI18nInit.run()
        ClientI18nInit.run()
        logger.info("=" * 60)
        logger.info("[OK] 国际化初始化完成")
        logger.info("=" * 60)


if __name__ == "__main__":
    I18nInitScript.run()
