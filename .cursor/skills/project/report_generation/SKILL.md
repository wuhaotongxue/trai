---
name: "report-generation"
description: "周报/月报生成模块规范。用于生成结构化工作周报/月报，支持 Git 分析、Excel 导入、AI 生成与导出。"
---

# 周报 / 月报生成模块规范

## 1. 功能概述

用户提供以下输入之一或组合：
- **表格文件**（Excel/CSV）：包含工作项、耗时、状态等字段
- **Git 仓库地址** + **指定路径**（README.md / CHANGELOG.md）
- **自由文本**：用户手动输入工作内容
- **上周/上月周报**：已入库的历史报告，用于对比生成

系统自动：
1. 分析 Git 提交记录、README、CHANGELOG，提取变更内容
2. 与历史报告对比，识别新增/完成/进行中的工作项
3. AI 生成结构化周报/月报（支持编辑）
4. 导出 PDF / Word / Excel，入库 + S3 存储

## 2. 数据库表设计

### reports 表
| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 所属用户 |
| title | VARCHAR(255) | 报告标题 |
| report_type | VARCHAR(20) | `weekly` / `monthly` |
| period_start | DATE | 周期开始日期 |
| period_end | DATE | 周期结束日期 |
| content | JSON | 报告结构化内容 |
| status | VARCHAR(20) | `draft` / `generated` / `submitted` |
| git_url | VARCHAR(500) | Git 仓库地址 |
| git_path | VARCHAR(255) | 文档路径 |
| excel_key | VARCHAR(255) | 原始 Excel 文件 S3 key |
| excel_url | VARCHAR(500) | 原始 Excel 文件 URL |
| generated_by_ai | BOOLEAN | 是否由 AI 生成 |
| created_at | TIMESTAMP(0) | 创建时间 |
| updated_at | TIMESTAMP(0) | 更新时间 |
| is_deleted | BOOLEAN | 软删除标记 |

### report_exports 表
| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| report_id | UUID | 关联报告 ID |
| user_id | UUID | 所属用户 |
| export_format | VARCHAR(20) | `pdf` / `docx` / `xlsx` |
| file_name | VARCHAR(255) | 文件名 |
| file_url | VARCHAR(500) | S3 URL |
| file_key | VARCHAR(255) | S3 key |
| file_size | BIGINT | 文件大小 |
| status | VARCHAR(20) | `pending` / `completed` / `failed` |
| download_count | INT | 下载次数 |
| created_at | TIMESTAMP(0) | 创建时间 |
| updated_at | TIMESTAMP(0) | 更新时间 |
| is_deleted | BOOLEAN | 软删除标记 |

### templates 表
| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| user_id | UUID | 所属用户 |
| name | VARCHAR(100) | 模板名称 |
| template_type | VARCHAR(20) | `weekly` / `monthly` |
| content | JSON | 模板结构（JSON Schema） |
| is_default | BOOLEAN | 是否为默认模板 |
| created_at | TIMESTAMP(0) | 创建时间 |
| updated_at | TIMESTAMP(0) | 更新时间 |
| is_deleted | BOOLEAN | 软删除标记 |

## 3. API 路由设计

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /report/create | 创建空白报告或基于模板创建 |
| POST | /report/update | 更新报告内容 |
| POST | /report/list | 分页获取报告列表 |
| POST | /report/detail | 获取报告详情 |
| POST | /report/delete | 删除报告 |
| POST | /report/submit | 标记为已提交 |
| POST | /report/git_analyze | 分析 Git 仓库 |
| POST | /report/generate | AI 生成报告 |
| POST | /report/export/{format} | 导出报告 |
| POST | /report/export/list | 获取导出历史 |
| POST | /template/create | 创建模板 |
| POST | /template/update | 更新模板 |
| POST | /template/list | 获取模板列表 |
| POST | /template/delete | 删除模板 |
| POST | /template/set_default | 设为默认模板 |

## 4. 前端文件命名（snake_case）

- `report_list_page.tsx` — 报告列表页
- `report_edit_dialog.tsx` — 报告编辑对话框
- `report_detail_view.tsx` — 报告详情视图
- `report_export_dialog.tsx` — 导出对话框
- `git_analyze_dialog.tsx` — Git 分析对话框
- `template_list_page.tsx` — 模板管理页
- `template_edit_dialog.tsx` — 模板编辑对话框
- `report_dashboard_page.tsx` — 周报/月报主入口

## 5. 导出格式

- **PDF**：WeasyPrint（已有依赖）
- **Word**：python-docx（已有依赖）
- **Excel**：openpyxl（需添加到 requirements.txt）

## 6. Git 分析策略

1. 克隆或 `git archive` 下载仓库指定路径文件
2. 解析 README.md / CHANGELOG.md，提取版本变更记录
3. 解析 `git log --since` 日期区间的 commit message
4. 按提交人 / 模块分组汇总
5. 将结果注入 AI 生成流程

## 7. AI 生成流程

```
输入：
  - history_report: 上期报告（JSON content）
  - git_commits: Git 分析结果（list）
  - excel_data: Excel 解析结果（list[dict]）
  - user_text: 用户自由输入
  - template: 当前模板（JSON schema）

Prompt：
  "你是一个周报生成助手。基于以下信息生成结构化周报：
   上周工作：[history_report.content]
   本周 Git 变更：[git_commits]
   Excel 工作项：[excel_data]
   用户补充：[user_text]
   请按 [template] 格式输出 JSON。"

输出：
  {
    "summary": "本周总体工作",
    "completed": ["已完成项列表"],
    "in_progress": ["进行中项列表"],
    "next_week_plan": ["下周计划"],
    "metrics": { "hours": 40, "tasks_done": 5 }
  }
```

## 8. 命名规范

所有标识符使用 `snake_case`，禁止 kebab-case 或 camelCase。
