---
name: "project_management"
description: "TRAI项目管理规范索引，包含Git提交、命名规范、README更新、周报生成等。"
---

# Project_项目管理规范

TRAI项目管理相关规范的统一入口。

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| 命名规范 | `naming_convention/SKILL.md` | 创建/修改任何代码文件时 |
| 临时文件 | `temp_files/SKILL.md` | 管理fix_/check_临时文件 |
| Git提交 | `git_submit/SKILL.md` | 提交代码时 |
| README更新 | `readme_update/SKILL.md` | 更新文档时 |
| 周报生成 | `report_generation/SKILL.md` | 生成工作周报/月报时 |
| 期数文档 | `issue_index/SKILL.md` | 撰写md/issue_NN/index.md |
| 编码修复 | `fix_encoding/SKILL.md` | 代码文件出现中文乱码时 |

## 统一规则

### 1. 中文标点禁令

禁止在所有文档、注释、提交信息中使用中文全角标点(，。！？：)

### 2. 命名规范

- 所有标识符必须使用snake_case
- 禁止kebab-case（中间横杠）

| 类型 | 正确 | 禁止 |
|------|------|------|
| 文件名 | meeting_export_service.py | meeting-export-service.py |
| 变量名 | total_records | totalRecords |

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.1 | 2026-04-24 | 新增编码修复规范 |
| v1.0 | 2026-04-08 | 初版发布 |
