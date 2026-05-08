#!/usr/bin/env python
# 文件名: init_agent_roles.py
# 作者: wuhao
# 日期: 2026_04_30_11:20:00
# 描述: 初始化 AI 角色数据

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from loguru import logger

from infrastructure.database.database import get_database
from infrastructure.database.models import AgentRoleModel


def init_agent_roles():
    """初始化默认 AI 角色数据"""
    db = get_database()
    session = db.get_session()

    try:
        # 检查是否已有数据
        existing = session.query(AgentRoleModel).first()
        if existing:
            logger.info("Agent roles already initialized, skipping.")
            return

        default_roles = [
            {
                "t_role_name": "爆炸分身",
                "t_role_comment": "本来不想写的呜……啊呀终于发完了！",
                "t_role_keyword": "爆炸",
                "t_style_type": "活泼开朗",
                "t_priority": 10,
            },
            {
                "t_role_name": "小甜心",
                "t_role_comment": "辛苦啦～小甜心觉得超棒的呢！",
                "t_role_keyword": "甜心,甜甜,可爱",
                "t_style_type": "甜美可爱",
                "t_priority": 20,
            },
            {
                "t_role_name": "御姐",
                "t_role_comment": "嗯，做得还行，御姐准了。",
                "t_role_keyword": "御姐,霸道,女王",
                "t_style_type": "御姐型",
                "t_priority": 30,
            },
            {
                "t_role_name": "软萌宝",
                "t_role_comment": "呜...人家觉得好厉害呀！",
                "t_role_keyword": "软萌,撒娇,萌萌",
                "t_style_type": "软萌撒娇",
                "t_priority": 40,
            },
            {
                "t_role_name": "知心姐姐",
                "t_role_comment": "乖，辛苦了，这周做得很好呢。",
                "t_role_keyword": "知心,温柔,姐姐",
                "t_style_type": "知性温柔",
                "t_priority": 50,
            },
            {
                "t_role_name": "开心果",
                "t_role_comment": "哈！搞定啦！开心果出击！",
                "t_role_keyword": "开心果,活泼,开心",
                "t_style_type": "活泼开朗",
                "t_priority": 60,
            },
            {
                "t_role_name": "小泪包",
                "t_role_comment": "呜呜...好累呀...但是完成了呢！",
                "t_role_keyword": "泪包,emo,难过",
                "t_style_type": "软萌撒娇",
                "t_priority": 70,
            },
            {
                "t_role_name": "审查官",
                "t_role_comment": "咳咳，检查通过，勉强合格。",
                "t_role_keyword": "审查,审计,严格",
                "t_style_type": "知性温柔",
                "t_priority": 80,
            },
            {
                "t_role_name": "地理专家",
                "t_role_comment": "说到版本发布呀～这条消息已成功抵达群聊坐标！",
                "t_role_keyword": "地理,专家,经纬度",
                "t_style_type": "知性温柔",
                "t_priority": 90,
            },
        ]

        for role_data in default_roles:
            role = AgentRoleModel(**role_data)
            session.add(role)

        session.commit()
        logger.info(f"Initialized {len(default_roles)} agent roles.")

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to init agent roles: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    # 确保表已创建
    db = get_database()
    db.create_tables()
    init_agent_roles()
