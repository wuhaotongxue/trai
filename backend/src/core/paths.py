#!/usr/bin/env python
# _*_coding: utf_8_*_
# 文件名: paths.py
# 作者: wuhao
# 日期: 2026_06_01_10:00:00
# 描述: 统一管理项目的动态路径，避免硬编码

from pathlib import Path

class ProjectPaths:
    """
    项目路径管理类.

    提供动态计算的项目根目录、后端目录及各种输出目录路径.
    """

    @staticmethod
    def get_backend_root() -> Path:
        """
        获取后端根目录 (backend/).

        Returns:
            Path: 后端根目录路径.
        """
        return Path(__file__).resolve().parents[2]

    @staticmethod
    def get_project_root() -> Path:
        """
        获取项目总根目录 (trai/).

        Returns:
            Path: 项目总根目录路径.
        """
        return Path(__file__).resolve().parents[3]

    @classmethod
    def get_out_root(cls) -> Path:
        """
        获取统一输出根目录 (backend/out/).

        Returns:
            Path: 输出根目录路径.
        """
        path = cls.get_backend_root() / "out"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_output_music_dir(cls) -> Path:
        """
        获取音乐输出目录.

        Returns:
            Path: 音乐输出目录路径.
        """
        path = cls.get_out_root() / "output_music"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_output_video_dir(cls) -> Path:
        """
        获取视频输出目录.

        Returns:
            Path: 视频输出目录路径.
        """
        path = cls.get_out_root() / "output_video"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_digital_human_output_dir(cls) -> Path:
        """
        获取数字人输出目录.

        Returns:
            Path: 数字人输出目录路径.
        """
        path = cls.get_output_video_dir() / "digital_human"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_lipsync_output_dir(cls) -> Path:
        """
        获取口型同步输出目录.

        Returns:
            Path: 口型同步输出目录路径.
        """
        path = cls.get_output_video_dir() / "lipsync"
        path.mkdir(parents=True, exist_ok=True)
        return path
