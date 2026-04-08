---
name: "project_management"
description: "项目管理规范索引。包含 Git 提交、命名规范、README 更新、周报生成等项目管理相关的规范文档。"
---

# Project_项目管理规范

TRAI 项目管理相关规范的统一入口。

## 快速索引

|| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| 命名规范 | `naming_convention/SKILL.md` | 创建/修改任何代码文件时 |
| Git 提交 | `git_submit/SKILL.md` | 提交代码时 |
| README 更新 | `readme_update/SKILL.md` | 更新文档时 |
| 周报生成 | `report_generation/SKILL.md` | 生成工作周报/月报时 |

---

## 统一规则

### 1. 中文标点禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 所有文档、注释、提交信息中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

### 2. 命名规范核心

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 强制要求</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>所有标识符必须使用 <code>snake_case</code>（纯小写+下划线）</li>
    <li><strong>禁止 kebab-case</strong>（中间横杠如 <code>add-num</code>）</li>
  </ul>
</div>

| 类型 | 正确 | 禁止 |
|------|------|------|
| 文件名 | `meeting_export_service.py` | `meeting-export-service.py` |
| 变量名 | `total_records` | `totalRecords` |
| 函数名 | `get_meeting_detail()` | `getMeetingDetail()` |
| 类名 | `MeetingExport` (PascalCase) | `meetingExport` |

---

## 版本历史

|| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2026-04-08 | 初版发布 |