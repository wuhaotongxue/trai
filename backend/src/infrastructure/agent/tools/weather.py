#!/usr/bin/env python
# 文件名: weather.py
# 作者: wuhao
# 日期: 2026-04-19 02:30:00
# 描述: 天气查询工具 - 使用Open-Meteo免费API，支持任意城市

from __future__ import annotations

from typing import Any

import httpx
from loguru import logger

from infrastructure.agent.tools.base import (
    BaseTool,
    ExecutionContext,
    RiskLevel,
    ToolCallResult,
    ToolCategory,
    ToolDefinition,
    ToolParameter,
)


class WeatherTool(BaseTool):
    """天气查询工具"""

    # 常见城市坐标映射
    CITY_COORDS = {
        "北京": (39.9042, 116.4074),
        "上海": (31.2304, 121.4737),
        "广州": (23.1291, 113.2644),
        "深圳": (22.5431, 114.0579),
        "杭州": (30.2741, 120.1551),
        "成都": (30.5728, 104.0668),
        "重庆": (29.4316, 106.9123),
        "武汉": (30.5928, 114.3055),
        "西安": (34.3416, 108.9398),
        "南京": (32.0603, 118.7969),
        "天津": (39.3434, 117.3616),
        "苏州": (31.3042, 120.6195),
        "长沙": (28.2000, 112.9388),
        "青岛": (36.0671, 120.3826),
        "大连": (38.9140, 121.6147),
        "厦门": (24.4798, 118.0894),
        "昆明": (24.8801, 102.8329),
        "沈阳": (41.8057, 123.4315),
        "哈尔滨": (45.8038, 126.5350),
        "郑州": (34.7466, 113.6254),
        # 拼音支持
        "beijing": (39.9042, 116.4074),
        "shanghai": (31.2304, 121.4737),
        "guangzhou": (23.1291, 113.2644),
        "shenzhen": (22.5431, 114.0579),
        "hangzhou": (30.2741, 120.1551),
    }

    @property
    def definition(self) -> ToolDefinition:
        if self._definition is None:
            self._definition = ToolDefinition(
                id="weather_current",
                name="天气查询",
                description="查询指定城市的当前天气情况,包括温度、湿度、风力、空气质量等",
                category=ToolCategory.UTILITY,
                risk_level=RiskLevel.SAFE,
                parameters=[
                    ToolParameter(
                        name="city",
                        description="城市名称,如:北京、上海、Tokyo、London",
                        type="string",
                        required=True,
                    ),
                    ToolParameter(
                        name="lang",
                        description="返回语言,zh-Hans(简体中文)或 en(英文)",
                        type="string",
                        required=False,
                        default="zh-Hans",
                    ),
                ],
                requires_watermark=False,
                monthly_quota_check=True,
                audit_log=True,
            )
        return self._definition

    async def execute(self, params: dict[str, Any], context: ExecutionContext) -> ToolCallResult:
        city = params.get("city", "")
        _lang = params.get("lang", "zh-Hans")  # noqa: F841

        logger.info(f"天气工具收到参数: {params}")

        # 如果城市为空，默认使用北京
        if not city:
            logger.warning(f"城市参数为空: {params}，默认使用北京")
            city = "北京"

        # 清理城市名
        city = city.strip()
        if not city:
            city = "北京"

        logger.info(f"查询天气 | 城市: {city}")

        try:
            # 步骤1: 先用Open-Meteo的地理编码API搜索城市
            geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=3&language=zh&format=json"
            logger.info(f"调用地理编码API: {geocode_url}")

            async with httpx.AsyncClient(timeout=15) as client:
                geocode_response = await client.get(geocode_url)
                logger.info(f"地理编码API状态码: {geocode_response.status_code}")
                geocode_data = geocode_response.json()

                results = geocode_data.get("results", [])
                logger.info(f"地理编码结果数: {len(results)}")

                if results:
                    # 找到了结果，优先找城市（administration_level >= 2）
                    location = None
                    for result in results:
                        # 优先选城市级别的
                        admin_level = result.get("admin1_id") or result.get("admin2_id")
                        if admin_level:
                            location = result
                            break
                    # 如果没找到合适的，用第一个
                    if not location:
                        location = results[0]

                    lat = location.get("latitude")
                    lon = location.get("longitude")
                    display_name = location.get("name", city)
                    country = location.get("country", "")
                    if country:
                        display_name = f"{display_name}, {country}"
                else:
                    # 没找到，尝试用预设的城市或默认北京
                    if city in self.CITY_COORDS:
                        lat, lon = self.CITY_COORDS[city]
                        display_name = city
                    else:
                        # 尝试一些常见的省份/城市对应
                        province_to_city = {
                            "新疆": "乌鲁木齐",
                            "广东": "广州",
                            "浙江": "杭州",
                            "江苏": "南京",
                            "四川": "成都",
                            "湖北": "武汉",
                            "湖南": "长沙",
                            "山东": "济南",
                            "河南": "郑州",
                            "河北": "石家庄",
                            "山西": "太原",
                            "陕西": "西安",
                            "江西": "南昌",
                            "福建": "福州",
                            "云南": "昆明",
                            "贵州": "贵阳",
                            "广西": "南宁",
                            "海南": "海口",
                            "辽宁": "沈阳",
                            "吉林": "长春",
                            "黑龙江": "哈尔滨",
                            "甘肃": "兰州",
                            "青海": "西宁",
                            "宁夏": "银川",
                            "内蒙古": "呼和浩特",
                            "西藏": "拉萨",
                            "台湾": "台北",
                            "香港": "香港",
                            "澳门": "澳门",
                        }
                        if city in province_to_city:
                            backup_city = province_to_city[city]
                            if backup_city in self.CITY_COORDS:
                                lat, lon = self.CITY_COORDS[backup_city]
                                display_name = f"{backup_city}({city})"
                            else:
                                lat, lon = (39.9042, 116.4074)
                                display_name = f"{backup_city}(默认)"
                        else:
                            lat, lon = (39.9042, 116.4074)
                            display_name = f"{city}(默认北京)"

            logger.info(f"查询天气 | 城市: {display_name} | 坐标: {lat}, {lon}")

            # 步骤2: 查询天气
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto"
            logger.info(f"调用天气API: {weather_url}")

            async with httpx.AsyncClient(timeout=15) as client:
                weather_response = await client.get(weather_url)
                logger.info(f"天气API状态码: {weather_response.status_code}")
                weather_response.raise_for_status()
                data = weather_response.json()

            current = data.get("current", {})
            units = data.get("current_units", {})

            # 天气代码描述
            weather_code = current.get("weather_code", 0)
            weather_desc = self._get_weather_description(weather_code)

            temp = current.get("temperature_2m", "N/A")
            temp_unit = units.get("temperature_2m", "°C")
            feels_like = current.get("apparent_temperature", "N/A")
            humidity = current.get("relative_humidity_2m", "N/A")
            humidity_unit = units.get("relative_humidity_2m", "%")
            wind_speed = current.get("wind_speed_10m", "N/A")
            wind_unit = units.get("wind_speed_10m", "km/h")

            output = (
                f"{display_name}当前天气 (实时数据):\n"
                f"- 🌡️ 温度: {temp}{temp_unit}\n"
                f"- 🤔 体感温度: {feels_like}{temp_unit}\n"
                f"- ☁️ 天气: {weather_desc}\n"
                f"- 💧 湿度: {humidity}{humidity_unit}\n"
                f"- 💨 风速: {wind_speed}{wind_unit}\n"
                f"- 📍 数据来源: Open-Meteo"
            )

            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=True,
                output=output,
            )

        except httpx.HTTPStatusError as e:
            import traceback

            logger.error(f"HTTP错误: {e}")
            logger.error(f"响应内容: {e.response.text}")
            logger.error(f"堆栈:\n{traceback.format_exc()}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"天气查询失败: HTTP {e.response.status_code}",
            )
        except httpx.RequestError as e:
            import traceback

            logger.error(f"请求错误: {type(e).__name__}: {e}")
            logger.error(f"堆栈:\n{traceback.format_exc()}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"天气查询失败: 请求错误 {type(e).__name__}",
            )
        except Exception as e:
            import traceback

            logger.error(f"天气查询异常: {type(e).__name__}: {e}")
            logger.error(f"堆栈:\n{traceback.format_exc()}")
            return ToolCallResult(
                tool_call_id="",
                tool_id=self.definition.id,
                success=False,
                error=f"天气查询失败: {type(e).__name__}: {e}",
            )

    def _get_weather_description(self, code: int) -> str:
        """根据天气代码返回中文描述"""
        weather_codes = {
            0: "晴朗",
            1: "大部晴朗",
            2: "多云",
            3: "阴天",
            45: "雾",
            48: "雾凇",
            51: "轻毛毛雨",
            53: "毛毛雨",
            55: "浓毛毛雨",
            56: "冻毛毛雨",
            57: "浓冻毛毛雨",
            61: "小雨",
            63: "中雨",
            65: "大雨",
            66: "冻雨",
            67: "浓冻雨",
            71: "小雪",
            73: "中雪",
            75: "大雪",
            77: "雪粒",
            80: "小阵雨",
            81: "阵雨",
            82: "大阵雨",
            85: "小阵雪",
            86: "大阵雪",
            95: "雷暴",
            96: "雷暴伴小冰雹",
            99: "雷暴伴大冰雹",
        }
        return weather_codes.get(code, "未知天气")


__all__ = ["WeatherTool"]
