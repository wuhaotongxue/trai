#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: check_comments.py
# 作者: wuhao
# 日期: 2026_04_13
# 描述: 检查数据库中各表和字段的 COMMENT 是否有说明

import psycopg2

conn = psycopg2.connect(
    host="192.168.100.119",
    port=35433,
    user="itzx",
    password="Tuoren@2026...",
    database="trai"
)
cur = conn.cursor()

tables = ["t_users", "t_chat_sessions", "t_messages", "t_quota_plans",
          "t_user_quota_usage", "t_quota_transaction_log",
          "t_image_generations", "t_upload_tasks"]

for tname in tables:
    cur.execute("""
        SELECT a.attname, col_description(a.attrelid, a.attnum) as comment
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = %s
        AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
    """, (tname,))
    rows = cur.fetchall()
    missing = [r for r in rows if not r[1]]
    if missing:
        print(f"[MISSING] {tname}: {[r[0] for r in missing]}")
    else:
        print(f"[OK] {tname}: {len(rows)} fields all have comments")

conn.close()
