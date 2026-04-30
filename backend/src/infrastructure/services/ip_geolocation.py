#!/usr/bin/env python
# 文件名: ip_geolocation.py
# 作者: wuhao
# 日期: 2026_04_23
# 描述: IP 地理位置查询服务

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class GeoLocation:
    """地理位置信息"""

    country: str = ""
    province: str = ""
    city: str = ""
    isp: str = ""
    ip: str = ""
    source: str = ""

    def to_display(self) -> str:
        """转换为可读地址字符串"""
        parts = []
        if self.country:
            parts.append(self.country)
        if self.province and self.province not in self.country:
            parts.append(self.province)
        if self.city and self.city not in self.province:
            parts.append(self.city)
        if self.isp:
            parts.append(self.isp)
        return " ".join(parts) if parts else self.ip


class IPGeolocationService:
    """IP 地理位置查询服务

    支持多个数据源, 按优先级尝试:
    1. ip-api.com (免费, 有频率限制)
    2. ipinfo.io (需 API Key)
    3. 太平洋网络 (备用)
    """

    def __init__(self) -> None:
        self._ipinfo_token = os.getenv("IPINFO_TOKEN", "")
        self._cache: dict[str, GeoLocation] = {}

    def locate(self, ip: str) -> GeoLocation:
        """查询 IP 对应的地理位置

        Args:
            ip: IP 地址

        Returns:
            GeoLocation: 地理位置信息
        """
        if not ip or ip in ("unknown", "127.0.0.1", "::1", "localhost"):
            return GeoLocation(ip=ip, source="local")

        # 内部 IP 直接返回
        if ip.startswith(("10.", "172.16.", "172.17.", "172.18.", "172.19.",
                          "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
                          "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
                          "172.30.", "172.31.", "192.168.", "169.254.")):
            return GeoLocation(
                ip=ip,
                country="内网",
                province="",
                city="",
                isp="",
                source="internal",
            )

        # 优先使用缓存
        if ip in self._cache:
            return self._cache[ip]

        result = self._query_ipapi(ip)
        self._cache[ip] = result
        return result

    def _query_ipapi(self, ip: str) -> GeoLocation:
        """使用 ip-api.com 查询

        Args:
            ip: IP 地址

        Returns:
            GeoLocation: 地理位置信息
        """
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"http://ip-api.com/json/{ip}")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        return GeoLocation(
                            country=data.get("country", ""),
                            province=data.get("regionName", ""),
                            city=data.get("city", ""),
                            isp=data.get("isp", ""),
                            ip=ip,
                            source="ip-api",
                        )
        except Exception:
            pass

        # 备用: ipinfo.io
        if self._ipinfo_token:
            try:
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(
                        f"https://ipinfo.io/{ip}/json",
                        headers={"Authorization": f"Bearer {self._ipinfo_token}"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        loc = data.get("loc", "")
                        city = data.get("city", "")
                        region = data.get("region", "")
                        country = data.get("country", "")
                        org = data.get("org", "")
                        return GeoLocation(
                            country=country,
                            province=region,
                            city=city,
                            isp=org,
                            ip=ip,
                            source="ipinfo",
                        )
            except Exception:
                pass

        # 全部失败时返回空结果
        return GeoLocation(ip=ip, source="unknown")


_geolocation_service: IPGeolocationService | None = None


def get_geolocation_service() -> IPGeolocationService:
    """获取地理位置服务单例"""
    global _geolocation_service
    if _geolocation_service is None:
        _geolocation_service = IPGeolocationService()
    return _geolocation_service
