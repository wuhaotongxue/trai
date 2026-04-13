#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: verify_schema.py
# 作者: wuhao
# 日期: 2026_04_13
# 描述: 验证 database_schema.md 与 Model 源码的一致性

from __future__ import annotations

import argparse
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(REPO_ROOT, "src", "infrastructure", "database")
SKILL_DIR = os.path.join(os.path.dirname(REPO_ROOT), ".cursor", "skills", "backend")
SCHEMA_FILE = os.path.join(SKILL_DIR, "database_schema.md")


def extract_tables_from_models() -> dict[str, set[str]]:
    """从 Model 源码提取表名和字段集合，按 class 分组"""
    tables = {}
    for filename in os.listdir(MODEL_DIR):
        if not filename.endswith(".py"):
            continue
        filepath = os.path.join(MODEL_DIR, filename)
        with open(filepath, encoding="utf-8") as f:
            content = f.read()
        table_pattern = re.compile(
            r'class\s+(\w+Model)\s*\([^)]+\)\s*:.*?__tablename__\s*=\s*"(\w+)"',
            re.DOTALL
        )
        for match in table_pattern.finditer(content):
            table_name = match.group(2)
            class_start = match.start()
            next_class = content.find('\nclass ', class_start + 1)
            block = content[class_start:next_class if next_class != -1 else len(content)]
            field_names = set(re.findall(r'^    (\w+):\s*Mapped', block, re.MULTILINE))
            tables[table_name] = field_names
    return tables


def extract_tables_from_schema() -> dict[str, set[str]]:
    """从 database_schema.md 提取表名和字段集合"""
    if not os.path.exists(SCHEMA_FILE):
        return {}

    with open(SCHEMA_FILE, encoding="utf-8") as f:
        lines = f.readlines()

    tables: dict[str, set[str]] = {}
    i = 0

    while i < len(lines):
        line = lines[i]
        m = re.match(r'^###\s+(\w+)', line.lstrip())
        if not m:
            i += 1
            continue

        table_name = m.group(1)
        fields: set[str] = set()
        state = "searching"  # searching | in_table
        j = i + 1

        while j < len(lines):
            section_line = lines[j]

            # 遇到下一个 ### 标题 → 停止
            if re.match(r'^###\s+', section_line.lstrip()):
                break

            stripped = section_line.lstrip()

            # 检测到 || 表头行，切换到 in_table
            if stripped.startswith('||'):
                state = "in_table"
                j += 1
                continue

            # 跳过 |--- 分隔符
            if '|--' in stripped:
                j += 1
                continue

            # 遇到 ## 二级标题：若已在表体中 → 停止（表体结束）；若在搜索中 → 忽略
            if re.match(r'^##\s', stripped):
                if state == "in_table":
                    break  # 重要：表体遇到 ## 说明表结束了
                j += 1
                continue

            # 跳过无管道的行
            if '|' not in stripped:
                j += 1
                continue

            # 提取第一列单元格
            cell_m = re.match(r'^\|\s*([^|]+)', stripped)
            if not cell_m:
                j += 1
                continue

            cell = cell_m.group(1).strip()

            # 搜索中：检查是否为表头（中文字段名）
            if state == "searching":
                if re.match(r'^字段', cell):
                    state = "in_table"
                j += 1
                continue

            # in_table 状态：提取英文字段名
            field_m = re.match(r'^([a-zA-Z][a-zA-Z0-9_]*)', cell)
            if field_m:
                fields.add(field_m.group(1))

            j += 1

        tables[table_name] = fields
        i = j

    return tables


def debug_extract() -> None:
    """调试：打印 schema 和 model 中解析出的所有表和字段"""
    schema_tables = extract_tables_from_schema()
    model_tables = extract_tables_from_models()
    print("=== Schema ===")
    for table, fields in sorted(schema_tables.items()):
        print(f"[{table}] {len(fields)} fields: {sorted(fields)}")
    print("\n=== Model ===")
    for table, fields in sorted(model_tables.items()):
        print(f"[{table}] {len(fields)} fields: {sorted(fields)}")


def verify() -> None:
    """主验证流程"""
    print("=" * 60)
    print("database_schema.md 与 Model 源码一致性检查")
    print("=" * 60)

    model_tables = extract_tables_from_models()
    schema_tables = extract_tables_from_schema()

    all_ok = True

    for table, fields in sorted(model_tables.items()):
        if table not in schema_tables:
            print(f"[ERROR] {table} 在 Model 中存在但未在 database_schema.md 中定义")
            all_ok = False
            continue

        schema_fields = schema_tables[table]
        missing_in_schema = fields - schema_fields
        extra_in_schema = schema_fields - fields

        if missing_in_schema:
            print(f"[WARN] {table} 字段在 Model 中存在但未写入 database_schema.md:")
            for f in sorted(missing_in_schema):
                print(f"         - {f}")
            all_ok = False

        if extra_in_schema:
            print(f"[WARN] {table} 字段在 database_schema.md 中定义但 Model 中不存在:")
            for f in sorted(extra_in_schema):
                print(f"         - {f}")
            all_ok = False

        if not missing_in_schema and not extra_in_schema:
            print(f"[OK] {table}: {len(fields)} 个字段完全匹配")

    for table in sorted(schema_tables.keys()):
        if table not in model_tables:
            print(f"[WARN] {table} 在 database_schema.md 中定义但 Model 中不存在")
            all_ok = False

    print("=" * 60)
    if all_ok:
        print("全部检查通过，Schema 与 Model 完全一致")
    else:
        print("存在不一致，请修复后再提交")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--debug", action="store_true", help="打印解析结果")
    args = parser.parse_args()
    if args.debug:
        debug_extract()
    else:
        verify()