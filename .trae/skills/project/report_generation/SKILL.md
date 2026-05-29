---
name: "report-generation"
description: "周报/月报生成模块规范。用于生成结构化工作周报/月报，支持 Git 分析、Excel 导入、AI 生成与导出。"
---

# 周报_/_月报生成模块规范

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
| created_at | TIMESTAMP(0) | 创建时间 |
| updated_at | TIMESTAMP(0) | 更新时间 |
| is_deleted | BOOLEAN | 软删除标记 |

### report_exports 表
| 字段 | 类型 | 说明 |
|---|---|---|
| id | UUID | 主键 |
| report_id | UUID | 关联报告 ID |
| export_format | VARCHAR(20) | `pdf` / `docx` / `xlsx` |
| file_name | VARCHAR(255) | 文件名 |
| file_url | VARCHAR(500) | S3 URL |
| status | VARCHAR(20) | `pending` / `completed` / `failed` |
| created_at | TIMESTAMP(0) | 创建时间 |
| is_deleted | BOOLEAN | 软删除标记 |

## 3. API 路由设计

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /report/create | 创建空白报告或基于模板创建 |
| POST | /report/update | 更新报告内容 |
| POST | /report/list | 分页获取报告列表 |
| POST | /report/detail | 获取报告详情 |
| POST | /report/delete | 删除报告 |
| POST | /report/generate | AI 生成报告 |
| POST | /report/export/{format} | 导出报告 |
| POST | /template/create | 创建模板 |
| POST | /template/list | 获取模板列表 |

## 4. 命名规范

所有标识符使用 `snake_case`，禁止 kebab-case 或 camelCase。

## 5. 月报生成规范

### 5.1 时间触发规则
- **触发时间**: 每月最后一周的周五开始汇总月报
- **生成周期**: 每月 1 日至月末最后一天
- **提交截止**: 每月最后一周周五 18:00 前完成初稿

### 5.2 文件命名规范
```
md/monthly_report_{YYYY_MM}.md
例如: md/monthly_report_2026_05.md
```

### 5.3 月报格式模板

```markdown
# {年}{月}月报工作总结及下月计划

## 📋 月度工作汇总

| 序号 | 本月完成工作（进展、成果、数据量化） | 未完成事项及原因 | 下月计划 | 需协调事项 |
|------|-----------------------------------|-----------------|---------|-----------|
| 1 | 1、xxx<br>2、xxx | 无/原因说明 | 1、xxx<br>2、xxx | 无/需协调事项 |

## 📊 数据量化

| 指标 | 数值 |
|------|------|
| Git 提交次数 | N |
| 修复 Bug 数 | N |
| 新增功能模块 | N |
| 代码审查通过率 | N% |
| 服务可用性 | N% |

## 🔮 下月计划 ({年}年{月+1}月)

| 序号 | 工作内容 | 预期成果 |
|------|---------|---------|
| 1 | xxx | xxx |

## 📅 需协调事项

| 序号 | 事项 | 协调方 | 优先级 |
|------|------|-------|--------|
| 1 | xxx | xxx | 高/中/低 |

*报告生成时间: {YYYY-MM-DD}*
```

### 5.4 提交规范
1. 月报文件保存至 `md/monthly_report_{YYYY_MM}.md`
2. 同步更新项目根目录 README.md 的 Changelog
3. 通过 `git_submit` 技能提交并推送至所有相关分支
4. 自动触发企微/飞书群通知
