---
name: "trai-skills-index"
description: "TRAI 项目所有 Skills 索引。包含 backend、desktop_client、frontend_next、electron、agent、project 六大领域的代码审查和规范文档。"
---

# TRAI_Skills_索引

TRAI 项目代码审查和规范文档，按领域解耦为六个子目录。

## 快速索引

| 领域 | 目录 | 主入口 | 触发场景 |
|------|------|--------|----------|
| **Backend** | `backend/` | `backend/SKILL.md` | 修改 Python 后端代码时 |
| **Desktop Client** | `desktop_client/` | `desktop_client/SKILL.md` | 修改 PyQt6 桌面客户端时 |
| **Frontend Next** | `frontend_next/` | `frontend_next/SKILL.md` | 修改 Next.js 前端代码时 |
| **Electron** | `electron/` | `electron/SKILL.md` | 开发 Electron 桌面客户端时 |
| **Agent** | `agent/` | `agent/SKILL.md` | 开发 Agent 智能体系统时 |
| **Project** | `project/` | `project/SKILL.md` | 项目管理、Git 提交时 |

---

## 目录结构

```
.trae/skills/
├── SKILL.md                           # 本索引文件
│
├── backend/                           # Python 后端
│   ├── SKILL.md                      # 代码审查主入口
│   ├── rules/
│   │   ├── python.md                # Python 规范
│   │   └── database.md              # 数据库规范
│   ├── api_design/
│   │   └── routes.md                # API 设计规范
│   ├── architecture/
│   │   └── layered.md               # DDD 五层架构
│   └── storage/
│       └── s3_access.md             # S3 存储与访问控制
│
├── desktop_client/                   # PyQt6 桌面客户端
│   ├── SKILL.md                     # 代码审查主入口
│   ├── rules/
│   │   └── pyqt6.md               # PyQt6 规范
│   ├── architecture/
│   │   └── layered.md              # 五层架构
│   ├── threading/
│   │   └── workers.md              # Worker 线程规范
│   └── ui_design/
│       └── fluent.md                # Win11 Fluent UI 规范
│
├── frontend_next/                   # Next.js 前端
│   ├── SKILL.md                   # 代码审查主入口
│   ├── rules/
│   │   ├── typescript.md           # TypeScript 规范
│   │   ├── tailwind.md             # Tailwind CSS 规范
│   │   └── i18n.md                 # i18n 翻译规范
│   ├── architecture/
│   │   ├── overview.md             # 架构总览
│   │   └── app_router.md           # App Router 规范
│   ├── components/
│   │   └── overview.md             # 组件规范
│   ├── auth/
│   │   └── overview.md             # 认证规范
│   ├── design/
│   │   └── layered.md              # 五层架构
│   ├── api/
│   │   └── overview.md             # API 规范
│   ├── fsd/
│   │   └── overview.md             # FSD 规范
│   ├── i18n/
│   │   └── overview.md             # 国际化规范
│   ├── logging/
│   │   └── overview.md             # 日志规范
│   ├── patterns/
│   │   └── overview.md             # 设计模式
│   ├── routing/
│   │   └── overview.md             # 路由规范
│   ├── structure/
│   │   ├── tree.md                 # 目录结构
│   │   └── monorepo.md             # Monorepo 配置
│   └── pages/
│       ├── dashboard/
│       │   ├── overview.md
│       │   ├── components.md
│       │   └── tools.md
│       ├── admin/
│       │   ├── overview.md
│       │   ├── users.md
│       │   └── system.md
│       ├── landing/
│       │   ├── overview.md
│       │   └── components.md
│       └── monitor/
│           └── overview.md
│
├── electron/                        # Electron 桌面客户端
│   ├── SKILL.md                     # 代码审查主入口
│   ├── rules/
│   │   ├── typescript.md           # TypeScript 规范
│   │   └── logging.md              # 日志规范
│   ├── architecture/
│   │   └── layered.md              # 五层架构
│   ├── ipc/
│   │   └── channels.md             # IPC 通道规范
│   └── update/
│       └── s3_upload.md           # S3 上传规范
│
├── agent/                           # Agent 智能体 (Harness Engineering)
│   ├── SKILL.md                    # Agent 工程主入口
│   ├── orchestrator/               # 多 Agent 编排
│   │   ├── overview.md            # 编排器总览
│   │   └── router.md              # 任务分解和路由
│   ├── interface/                   # Agent 接口标准
│   │   └── definition.md          # 输入输出定义
│   ├── protocol/                    # 通信协议
│   │   ├── message.md            # 消息格式
│   │   └── routing.md            # 消息路由
│   ├── collaboration/              # 多 Agent 协作
│   │   └── patterns.md           # 协作模式详解
│   ├── lifecycle/                   # 生命周期管理
│   │   └── management.md         # 注册/健康/热更新
│   ├── context/
│   │   └── engineering.md         # 上下文装配规范
│   ├── tools/
│   │   ├── governance.md          # 工具治理规范
│   │   └── abstraction.md          # 工具抽象层规范
│   ├── security/
│   │   └── rules.md               # 安全与 Rules 规范
│   ├── state/
│   │   └── feedback.md            # 反馈与状态规范
│   ├── entropy/
│   │   └── management.md           # 熵管理规范
│   ├── patterns/
│   │   └── design.md              # Agent 设计模式
│   └── media/
│       ├── image.md               # 图片处理规范
│       ├── audio/                  # 音频处理规范
│       ├── video/                  # 视频处理规范
│       └── chat/                  # 对话处理规范
│
└── project/                         # 项目管理
    ├── SKILL.md                   # 项目管理入口
    ├── naming_convention/SKILL.md  # 命名规范
    ├── git_submit/SKILL.md         # Git 提交
    ├── readme_update/SKILL.md      # README 更新
    ├── report_generation/SKILL.md  # 周报生成
    └── fix_encoding/               # 文件编码修复
        ├── SKILL.md             # 编码修复指南
        ├── check_utf8.py        # 检查 UTF-8 编码
        └── write_utf8.py        # 写入 UTF-8 文件
```

---

## 使用说明

### 修改代码后调用

| 修改目录 | 调用入口 |
|----------|----------|
| `backend/` | `backend/SKILL.md` |
| `desktop_client/` | `desktop_client/SKILL.md` |
| `frontend_next/` | `frontend_next/SKILL.md` |
| `electron/` | `electron/SKILL.md` |
| `agent/` | `agent/SKILL.md` |

### 提交代码时调用

| 场景 | 调用入口 |
|------|----------|
| Git 提交 | `project/git_submit/SKILL.md` |
| README 更新 | `project/readme_update/SKILL.md` |
| 命名规范检查 | `project/naming_convention/SKILL.md` |

---

## 统一规范 (所有领域)

### 1. 中文标点符号禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

### 2. 文件头模板

**Python (backend/desktop_client)**

```python
#!/usr/bin/env python
# _*_coding:_utf_8_*_
# 文件名:_{实际文件名}
# 作者:_wuhao
# 日期:_{YYYY_MM_DD_HH:MM:SS}
# 描述:_{该文件的用途/功能简述，一句话概括}
```

**TypeScript (frontend_next/electron)**

```typescript
/**
 * 文件名: {文件名}
 * 作者: wuhao
 * 日期: {YYYY-MM-DD HH:MM:SS}
 * 描述: {该文件的用途/功能简述，一句话概括}
 */
```

### 3. 命名规范 (全项目强制)

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件名 | snake_case | `meeting_analytics.tsx` |
| 类名 | PascalCase | `MeetingAnalytics` |
| 函数/方法名 | snake_case | `def get_meeting_detail()` |
| 变量名 | snake_case | `total_records` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| ❌ 禁止 | kebab-case | `meeting-analytics` |
| ❌ 禁止 | camelCase | `totalRecords` |

### 4. Docstring 全覆盖

- 每一个 `class`、每一个 `def`/`async def` 必须有中文 docstring
- 私有方法、`__init__`、`@staticmethod` 同等强制
- 内容: 用途概述 + 参数 + 返回值 + 异常

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v3.2 | 2026-04-08 | 新增 Frontend Next 主入口，重构 project 主入口，更新索引路径 |
| v3.1 | 2026-04-08 | 扩展 Agent 模块，新增编排器、协作模式、生命周期管理文档 |
| v2.0 | 2026-04-08 | 重构所有文档，删除代码示例，统一使用表格和 HTML 卡片 |
| v1.0 | 2026-04-01 | 初版发布 |
