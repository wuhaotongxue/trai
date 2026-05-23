---
name: "trae-rules-index"
description: "TRAI 项目所有 Rules 索引。包含 backend、desktop_client、project 三大领域的开发规范文档。"
---

# TRAI_Rules_索引

TRAI 项目开发规范文档，按领域解耦为四个子目录。

## 快速索引

| 领域 | 目录 | 说明 |
|------|------|------|
| **Backend** | `backend/` | Python 后端 DDD 5 层架构规范 |
| **Desktop_Client** | `desktop_client/` | PyQt6 桌面客户端开发规范 |
| **Project** | `project/` | 全局研发规范、Git 提交、命名规范 |

## 目录结构

```
.trae/rules/
├── SKILL.md                           # 本索引文件
│
├── backend/                           # Python 后端规范
│   └── SKILL.md                      # 后端开发规范主入口
│   ├── rules/
│   │   ├── python.md                # Python 规范
│   │   └── database.md              # 数据库规范
│   ├── api_design/
│   │   └── routes.md                # API 设计规范
│   └── architecture/
│       └── layered.md               # DDD 五层架构
│
├── desktop_client/                   # PyQt6 桌面客户端规范
│   └── SKILL.md                      # 客户端开发规范主入口
│   ├── rules/
│   │   └── pyqt6.md                 # PyQt6 规范
│   ├── threading/
│   │   └── workers.md               # Worker 线程规范
│   ├── ui_design/
│   │   └── fluent.md                 # Win11 Fluent UI 规范
│   └── architecture/
│       └── layered.md               # 五层架构
│
└── project/                          # 项目规范
    └── SKILL.md                      # 全局研发规范
        ├── naming.md                 # 命名规范（snake_case 强制）
        ├── git_workflow.md           # Git 提交规范
        └── changelog.md              # Changelog 规范
```

## 全局强制规范 (所有领域)

### 1. 强制使用 git_submit 技能
- **禁止**使用原生终端命令 (`git commit`/`git push`)
- **必须**使用 `/skill git_submit` 技能
- 该技能自动串联：代码层级检查 → Changelog 更新 → 生成提交信息 → 推送

### 2. 预提交钩子拦截
- 已在仓库配置预提交钩子 (`.git/hooks/pre_commit.bat`)
- 当提交 `backend` 目录时，若未同时更新 `backend/README.md` 与根 `README.md`，提交会被拦截

### 3. Changelog 时间戳规则
- 格式：`模块_YYYY_MM_DD_HHmm`（如 `后端_2026_04_07_1430`）
- 必须使用系统当前真实时间
- 追加到 README 顶部，保持倒序

### 4. 中文标点符号禁令 (CRITICAL)
- **绝对禁止**在任何地方出现中文全角标点 (`，`、`。`、`！`、`：`)
- 必须使用英文半角标点 (`,`, `.`, `!`, `:`)

### 5. 隐私与安全
- **禁止**提交 `backend/env/*.env`、`config.json` 等包含真实密码的配置文件
- `.env.example` 必须脱敏（Token 替换为 `YOUR_TOKEN_HERE`）