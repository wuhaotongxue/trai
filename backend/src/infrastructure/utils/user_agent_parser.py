#!/usr/bin/env python
# 文件名: user_agent_parser.py
# 作者: wuhao
# 日期: 2026_05_15_14:55:00
# 描述: User-Agent 解析工具类

from __future__ import annotations

from typing import Any


class UserAgentParser:
    """User-Agent 解析工具类"""

    @staticmethod
    def parse(user_agent: str | None) -> dict[str, Any]:
        """解析 User-Agent 字符串

        Args:
            user_agent: User-Agent 字符串

        Returns:
            dict[str, Any]: 包含 device_type, browser, os 的字典
        """
        if not user_agent:
            return {
                "device_type": None,
                "browser": None,
                "os": None,
            }

        ua = user_agent.lower()

        # 解析设备类型
        device_type = UserAgentParser._parse_device_type(ua)

        # 解析浏览器
        browser = UserAgentParser._parse_browser(ua)

        # 解析操作系统
        os = UserAgentParser._parse_os(ua)

        return {
            "device_type": device_type,
            "browser": browser,
            "os": os,
        }

    @staticmethod
    def _parse_device_type(ua: str) -> str | None:
        """解析设备类型"""
        if "mobile" in ua or "android" in ua or "iphone" in ua or "ipod" in ua:
            return "mobile"
        elif "tablet" in ua or "ipad" in ua:
            return "tablet"
        elif "windows" in ua or "macintosh" in ua or "linux" in ua:
            return "desktop"
        return None

    @staticmethod
    def _parse_browser(ua: str) -> str | None:
        """解析浏览器"""
        browsers = [
            ("edg", "Edge"),
            ("chrome", "Chrome"),
            ("safari", "Safari"),
            ("firefox", "Firefox"),
            ("opera", "Opera"),
            ("msie", "IE"),
            ("trident", "IE"),
        ]

        for pattern, name in browsers:
            if pattern in ua:
                return name

        return None

    @staticmethod
    def _parse_os(ua: str) -> str | None:
        """解析操作系统"""
        os_list = [
            ("windows nt 10.0", "Windows 10"),
            ("windows nt 6.3", "Windows 8.1"),
            ("windows nt 6.2", "Windows 8"),
            ("windows nt 6.1", "Windows 7"),
            ("windows nt 6.0", "Windows Vista"),
            ("windows nt 5.1", "Windows XP"),
            ("windows", "Windows"),
            ("mac os x", "macOS"),
            ("iphone os", "iOS"),
            ("android", "Android"),
            ("linux", "Linux"),
        ]

        for pattern, name in os_list:
            if pattern in ua:
                return name

        return None


__all__ = ["UserAgentParser"]
