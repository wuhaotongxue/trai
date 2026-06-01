#!/usr/bin/env python
# _*_coding: utf_8_*_
# 文件名: festivals.py
# 作者: wuhao
# 日期: 2026_06_01_10:15:00
# 描述: 统一管理节假日文案配置，增加系统仪式感

from datetime import datetime


class FestivalManager:
    """
    节假日文案管理类.

    存储中国传统节日及国际重要节日的文案，并提供自动匹配功能.
    """

    # 静态节日配置 (月-日)
    FIXED_FESTIVALS: dict[str, dict[str, str]] = {
        "01-01": {
            "name": "元旦",
            "title": "🎉 2026 新年快乐！新征程开启！🚀",
            "message": "万象更新，AI 与您一起开启充满希望的一年！新的一年，愿您的灵感如泉涌，代码无 BUG！",
            "footer": "“初岁元旦，吉日惟良。”",
        },
        "03-08": {
            "name": "女神节",
            "title": "💐 致敬巾帼力量，女神节快乐！✨",
            "message": "世界因您而美丽，智慧与温柔并存。愿每一位女性开发者都能在科技的世界里闪耀光芒！",
            "footer": "“芳华自在，笑靥如花。”",
        },
        "05-01": {
            "name": "劳动节",
            "title": "🛠️ 致敬每一位奋斗者，五一快乐！",
            "message": "代码的每一个字符都是劳动的结晶。辛苦啦，在这属于奋斗者的节日里，给心灵放个假吧！",
            "footer": "“民生在勤，勤则不匮。”",
        },
        "06-01": {
            "name": "儿童节",
            "title": "🎉 儿童节快乐！永葆童心，代码无忧！🎈",
            "message": "大朋友！今天我们要开开心心地宣布，城堡又变漂亮啦！愿你保持好奇心，像孩子一样去探索 AI 的奇妙世界！🍭",
            "footer": "“童心未泯，所见皆甜。”",
        },
        "10-01": {
            "name": "国庆节",
            "title": "🇨🇳 盛世华诞，锦绣中华！国庆快乐！",
            "message": "神州大地繁花似锦，科技创新砥柱中流。祝愿祖国繁荣昌盛，也祝您假期愉快！",
            "footer": "“山河无恙，烟火寻常。”",
        },
        "10-24": {
            "name": "程序员节",
            "title": "💻 1024 程序员节！你是世界的架构师！",
            "message": "用 0 和 1 构建世界，用逻辑改变未来。你是最棒的，愿你指尖有火，眼中有关，头发茂密！",
            "footer": "“Hello World, Hello Future.”",
        },
        "12-25": {
            "name": "圣诞节",
            "title": "🎄 圣诞快乐！平安喜乐，灵感常在！🎁",
            "message": "铃儿响叮当，好运在身旁。愿圣诞老人把最棒的灵感装进你的袜子里！",
            "footer": "“Merry Christmas & Happy Coding.”",
        },
    }

    # 农历节日或变动节日 (需要每年更新或通过库计算，此处先预留 2026 年关键节点)
    DYNAMIC_FESTIVALS_2026: dict[str, dict[str, str]] = {
        "02-17": {
            "name": "春节",
            "title": "🧨 恭贺新禧，金虎送福！新春快乐！🧧",
            "message": "岁更序幕，共度新春。愿您在新的一年里，事业红红火火，生活顺顺利利，AI 助力每一个梦想！",
            "footer": "“千门万户曈曈日，总把新桃换旧符。”",
        },
        "06-19": {
            "name": "端午节",
            "title": "🍃 岁岁端阳，粽享安康！端午快乐！",
            "message": "仲夏登高，顺阳在上。愿这份 AI 生成的作品像端午的粽子一样，有棱有角，香甜入心！",
            "footer": "“路漫漫其修远兮，吾将上下而求索。”",
        },
        "09-25": {
            "name": "中秋节",
            "title": "🌕 月满中秋，情系中华！中秋快乐！",
            "message": "但愿人长久，千里共婵娟。愿您的每一个创意都能如明月般圆满夺目！",
            "footer": "“海上生明月，天涯共此时。”",
        },
    }

    @classmethod
    def get_today_festival(cls) -> dict[str, str] | None:
        """
        获取今天的节日配置.
        """
        today = datetime.now().strftime("%m-%d")

        # 优先匹配静态节日
        if today in cls.FIXED_FESTIVALS:
            return cls.FIXED_FESTIVALS[today]

        # 匹配 2026 动态节日
        if today in cls.DYNAMIC_FESTIVALS_2026:
            return cls.DYNAMIC_FESTIVALS_2026[today]

        return None
