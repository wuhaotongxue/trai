#!/usr/bin/env python
# 文件名: env_loader.py
# 作者: wuhao
# 日期: 2026_05_24_15:10:00
# 描述: 自动加载和校验所有的 env 配置文件

from pathlib import Path

from dotenv import load_dotenv
from loguru import logger


class EnvLoader:
    """
    环境配置加载器.

    参数:
        无

    返回:
        None

    异常:
        无
    """

    @staticmethod
    def load_all_envs() -> None:
        """
        加载 backend/env 目录下的所有 .env 文件.

        参数:
            无

        返回:
            None

        异常:
            无
        """
        env_dir = Path(__file__).parent.parent.parent.parent / "env"

        if not env_dir.exists():
            logger.warning(f"环境配置目录不存在: {env_dir}")
            return

        env_files = list(env_dir.glob("*.env"))
        logger.info(f"正在加载 {len(env_files)} 个环境配置文件...")

        for env_file in env_files:
            try:
                load_dotenv(dotenv_path=env_file, override=True)
                logger.debug(f"已加载配置文件: {env_file.name}")
            except Exception as e:
                logger.error(f"加载配置文件 {env_file.name} 失败: {e}")

        logger.info("所有环境配置文件加载完毕")
