#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: create_tables.py
# 描述: 手动触发数据库建表脚本

import os
import sys
from pathlib import Path

# 添加 src 目录到 sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from infrastructure.database.database import get_database, Base
from infrastructure.database.models import * # 确保所有模型都被加载

def main():
    db = get_database()
    engine = db._engine
    print("正在创建所有缺失的数据库表...")
    Base.metadata.create_all(engine)
    print("建表完成!")

if __name__ == "__main__":
    main()
