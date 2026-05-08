#!/usr/bin/env python
# 文件名: init_i18n_client.py
# 作者: wuhao
# 日期: 2026_04_25_172102
# 描述: 初始化客户端(Electron)国际化翻译数据

from __future__ import annotations

import os
import sys

from loguru import logger

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# 加载 .env 环境变量
from pathlib import Path

base_dir = Path(__file__).resolve().parent.parent.parent
env_file = base_dir / ".env"
if env_file.exists():
    content = env_file.read_text(encoding="utf-8")
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)

from infrastructure.database import get_database
from infrastructure.database.i18n_model import I18nStringModel

CLIENT_TRANSLATIONS = {
    "zh": {
        # ===== 客户端通用 =====
        "client.app.title": "TRAI",
        "client.app.loading": "加载中...",
        "client.app.error": "发生错误",
        # ===== 窗口标题 =====
        "client.window.main": "TRAI _ AI 助手",
        "client.window.settings": "设置",
        "client.window.about": "关于",
        # ===== 菜单 =====
        "client.menu.file": "文件",
        "client.menu.edit": "编辑",
        "client.menu.view": "视图",
        "client.menu.help": "帮助",
        "client.menu.settings": "设置",
        "client.menu.about": "关于 TRAI",
        "client.menu.quit": "退出",
        "client.menu.cut": "剪切",
        "client.menu.copy": "复制",
        "client.menu.paste": "粘贴",
        "client.menu.select_all": "全选",
        "client.menu.reload": "重新加载",
        "client.menu.toggle_devtools": "开发者工具",
        "client.menu.fullscreen": "全屏",
        # ===== 托盘 =====
        "client.tray.show": "显示主窗口",
        "client.tray.hide": "隐藏主窗口",
        "client.tray.settings": "设置",
        "client.tray.quit": "退出",
        # ===== 设置 =====
        "client.settings.title": "设置",
        "client.settings.general": "通用",
        "client.settings.appearance": "外观",
        "client.settings.language": "语言",
        "client.settings.theme": "主题",
        "client.settings.theme_light": "浅色",
        "client.settings.theme_dark": "深色",
        "client.settings.theme_system": "跟随系统",
        "client.settings.auto_start": "开机自启",
        "client.settings.minimize_to_tray": "最小化到托盘",
        "client.settings.close_to_tray": "关闭时最小化到托盘",
        "client.settings.save": "保存",
        "client.settings.saved": "设置已保存",
        # ===== 更新 =====
        "client.update.title": "软件更新",
        "client.update.checking": "正在检查更新...",
        "client.update.available": "发现新版本",
        "client.update.not_available": "已是最新版本",
        "client.update.downloading": "正在下载更新...",
        "client.update.downloaded": "更新已下载",
        "client.update.install": "立即安装",
        "client.update.later": "稍后提醒",
        "client.update.error": "更新检查失败",
        # ===== 关于 =====
        "client.about.title": "关于 TRAI",
        "client.about.version": "版本",
        "client.about.copyright": "版权所有",
        "client.about.website": "官方网站",
        # ===== 通知 =====
        "client.notification.title": "TRAI 通知",
        "client.notification.new_message": "新消息",
        # ===== 错误 =====
        "client.error.network": "网络连接失败",
        "client.error.server": "服务器错误",
        "client.error.unknown": "未知错误",
    },
    "en": {
        # ===== Client Common =====
        "client.app.title": "TRAI",
        "client.app.loading": "Loading...",
        "client.app.error": "An error occurred",
        # ===== Window Titles =====
        "client.window.main": "TRAI _ AI Assistant",
        "client.window.settings": "Settings",
        "client.window.about": "About",
        # ===== Menu =====
        "client.menu.file": "File",
        "client.menu.edit": "Edit",
        "client.menu.view": "View",
        "client.menu.help": "Help",
        "client.menu.settings": "Settings",
        "client.menu.about": "About TRAI",
        "client.menu.quit": "Quit",
        "client.menu.cut": "Cut",
        "client.menu.copy": "Copy",
        "client.menu.paste": "Paste",
        "client.menu.select_all": "Select All",
        "client.menu.reload": "Reload",
        "client.menu.toggle_devtools": "Developer Tools",
        "client.menu.fullscreen": "Fullscreen",
        # ===== Tray =====
        "client.tray.show": "Show Main Window",
        "client.tray.hide": "Hide Main Window",
        "client.tray.settings": "Settings",
        "client.tray.quit": "Quit",
        # ===== Settings =====
        "client.settings.title": "Settings",
        "client.settings.general": "General",
        "client.settings.appearance": "Appearance",
        "client.settings.language": "Language",
        "client.settings.theme": "Theme",
        "client.settings.theme_light": "Light",
        "client.settings.theme_dark": "Dark",
        "client.settings.theme_system": "System",
        "client.settings.auto_start": "Launch at startup",
        "client.settings.minimize_to_tray": "Minimize to tray",
        "client.settings.close_to_tray": "Close to tray",
        "client.settings.save": "Save",
        "client.settings.saved": "Settings saved",
        # ===== Update =====
        "client.update.title": "Software Update",
        "client.update.checking": "Checking for updates...",
        "client.update.available": "New version available",
        "client.update.not_available": "You're up to date",
        "client.update.downloading": "Downloading update...",
        "client.update.downloaded": "Update downloaded",
        "client.update.install": "Install Now",
        "client.update.later": "Later",
        "client.update.error": "Update check failed",
        # ===== About =====
        "client.about.title": "About TRAI",
        "client.about.version": "Version",
        "client.about.copyright": "Copyright",
        "client.about.website": "Website",
        # ===== Notification =====
        "client.notification.title": "TRAI Notification",
        "client.notification.new_message": "New message",
        # ===== Error =====
        "client.error.network": "Network connection failed",
        "client.error.server": "Server error",
        "client.error.unknown": "Unknown error",
    },
}


class ClientI18nInit:
    """客户端国际化初始化"""

    @classmethod
    def run(cls) -> None:
        logger.info("=" * 60)
        logger.info("初始化客户端国际化翻译数据")
        logger.info("=" * 60)

        db = get_database()
        session = db.get_session()
        try:
            saved_count = 0
            for locale, translations in CLIENT_TRANSLATIONS.items():
                for key, value in translations.items():
                    # 从 key 中解析 namespace（格式为 "client.something"）
                    if key.startswith("client."):
                        namespace = "client"
                        db_key = key[len("client.") :]
                    else:
                        namespace = "client"
                        db_key = key
                    existing = (
                        session.query(I18nStringModel)
                        .filter_by(t_locale=locale, t_namespace=namespace, t_key=db_key)
                        .first()
                    )
                    if existing:
                        existing.t_value = value
                    else:
                        model = I18nStringModel(
                            t_locale=locale,
                            t_namespace=namespace,
                            t_key=db_key,
                            t_value=value,
                        )
                        session.add(model)
                        saved_count += 1

            session.commit()
            logger.info(f"[OK] 客户端翻译数据初始化完成, 共保存 {saved_count} 条记录")

        except Exception as e:
            session.rollback()
            logger.error(f"[ERROR] 客户端翻译初始化失败: {e}")
            raise
        finally:
            session.close()


if __name__ == "__main__":
    ClientI18nInit.run()
