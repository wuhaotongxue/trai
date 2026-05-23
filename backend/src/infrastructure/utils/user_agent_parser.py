#!/usr/bin/env python
# 文件名: user_agent_parser.py
# 作者: wuhao
# 日期: 2026_05_15_15:30:00
# 描述: User-Agent 解析工具类

from __future__ import annotations

import re
from typing import Any


class UserAgentParser:
    """User-Agent 解析器"""

    @staticmethod
    def parse(user_agent: str | None) -> dict[str, Any]:
        """
        解析 User-Agent 字符串，提取设备类型、浏览器和操作系统信息

        Args:
            user_agent: User-Agent 字符串

        Returns:
            包含 device_type, browser, os 的字典
        """
        if not user_agent:
            return {"device_type": None, "browser": None, "os": None}

        result: dict[str, Any] = {
            "device_type": None,
            "browser": None,
            "os": None,
        }

        # 解析操作系统
        os_info = UserAgentParser._parse_os(user_agent)
        result["os"] = os_info

        # 解析浏览器
        browser_info = UserAgentParser._parse_browser(user_agent)
        result["browser"] = browser_info

        # 解析设备类型
        device_type = UserAgentParser._parse_device_type(user_agent)
        result["device_type"] = device_type

        return result

    @staticmethod
    def _parse_os(user_agent: str) -> str | None:
        """解析操作系统"""
        os_patterns = [
            (r"Windows NT 10\.0", "Windows 10"),
            (r"Windows NT 11\.0", "Windows 11"),
            (r"Windows NT 6\.3", "Windows 8.1"),
            (r"Windows NT 6\.2", "Windows 8"),
            (r"Windows NT 6\.1", "Windows 7"),
            (r"Windows NT 6\.0", "Windows Vista"),
            (r"Windows NT 5\.1", "Windows XP"),
            (r"Mac OS X (\d+)[._](\d+)", "macOS"),
            (r"Linux", "Linux"),
            (r"Android (\d+)\.(\d+)", "Android"),
            (r"iOS (\d+)[._](\d+)", "iOS"),
            (r"Windows Phone", "Windows Phone"),
            (r"BlackBerry", "BlackBerry"),
        ]

        for pattern, os_name in os_patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return os_name

        return None

    @staticmethod
    def _parse_browser(user_agent: str) -> str | None:
        """解析浏览器"""
        browser_patterns = [
            (r"Edg/", "Microsoft Edge"),
            (r"Chrome/", "Google Chrome"),
            (r"Chromium/", "Chromium"),
            (r"Firefox/", "Mozilla Firefox"),
            (r"Safari/", "Safari"),
            (r"Opera|OPR/", "Opera"),
            (r"Brave/", "Brave"),
            (r"Vivaldi/", "Vivaldi"),
            (r"QQBrowser/", "QQ浏览器"),
            (r"UCBrowser/", "UC浏览器"),
            (r"360SE/", "360安全浏览器"),
            (r"360EE/", "360极速浏览器"),
            (r"Maxthon/", "傲游浏览器"),
        ]

        for pattern, browser_name in browser_patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return browser_name

        return None

    @staticmethod
    def _parse_device_type(user_agent: str) -> str | None:
        """解析设备类型"""
        device_patterns = [
            (r"Mobile|Android.*Mobile|iPhone|iPad|iPod", "Mobile"),
            (r"Tablet|iPad|Android.*Tablet", "Tablet"),
            (r"Desktop|Windows NT|Mac OS X.*Intel", "Desktop"),
            (r"SmartWatch|Watch", "Smartwatch"),
            (r"TV|SmartTV|GoogleTV|AppleTV", "TV"),
        ]

        for pattern, device_type in device_patterns:
            if re.search(pattern, user_agent, re.IGNORECASE):
                return device_type

        # 默认返回 Desktop
        return "Desktop"


__all__ = ["UserAgentParser"]
