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
| 期数文档 | `issue_index/SKILL.md` | 撰写 `md/issue_NN/index.md`，按上期锚点与 git log 归纳 |

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

### 3. 全局配置文件与依赖管理 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 强制要求</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>只允许在项目根目录存在一个 <code>.gitignore</code> 文件</strong></li>
    <li>禁止在各子模块（如 <code>frontend_next</code>、<code>backend</code>、<code>client_electron</code> 等）中单独创建 <code>.gitignore</code></li>
    <li>子模块的忽略规则必须统一提升并合并到根目录的 <code>.gitignore</code> 中，并使用对应的前缀进行约束（如 <code>frontend_next/node_modules/</code>）</li>
    <li><strong>绝对禁止上传任何依赖包或构建产物</strong>：无论是前端（node_modules）、后端（.venv, __pycache__）还是客户端（dist, release），在提交代码前必须确认这些目录已被 <code>.gitignore</code> 正确忽略。</li>
  </ul>
</div>

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.1 | 2026-04-13 17:31:12 | 新增全局配置文件与依赖管理（.gitignore 与禁止上传依赖/产物）规范 |
| v1.0 | 2026-04-08 | 初版发布 |