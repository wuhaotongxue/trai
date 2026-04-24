---
name: "file-organization"
description: "TRAI 项目文件组织规范。目录内文件超过8个必须考虑合并子目录；单个文件不得超过700行，超出必须拆分模块。适用于 backend、frontend_next、client_electron 全部代码目录。"
---

# TRAI_项目文件组织规范

## 核心规则

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 强制要求</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>目录文件数限制</strong>：单个目录内 .py/.ts/.tsx 文件超过 8 个时，必须考虑合并或新建子目录分类存储</li>
    <li><strong>目录文件数最佳实践</strong>：3-5 个文件较合理，超过 8 个必须重组</li>
    <li><strong>文件行数限制</strong>：单个文件不得超过 700 行，超出必须按功能模块拆分</li>
    <li><strong>适用于</strong>：backend、frontend_next、client_electron 全部代码目录</li>
  </ul>
</div>

---

## 目录重组规则

### 判断标准

| 条件 | 操作 |
|------|------|
| 目录内文件数 > 8 | 必须新建子目录或合并 |
| 目录内文件数 5-8 | 考虑重组，保持整洁 |
| 目录内文件数 <= 4 | 保持当前结构 |

### 重组策略

```
# 原始结构 (违规示例)
src/infrastructure/database/
├── models.py (316 lines)
├── user_model.py (64 lines)
├── department_model.py (47 lines)
├── i18n_model.py (50 lines)
├── feedback_type_model.py (46 lines)
├── backup_service.py (96 lines)
├── database.py (247 lines)
├── __init__.py (3 lines)
# 共 8 个 .py 文件，超过 3 个

# 重组后 (合规)
src/infrastructure/database/
├── __init__.py
├── models.py                          # 主模型文件，DDD exports
├── _core/
│   ├── database.py                    # 数据库连接配置
│   └── __init__.py
├── _models/
│   ├── user_model.py
│   ├── department_model.py
│   ├── i18n_model.py
│   ├── feedback_type_model.py
│   └── __init__.py
└── _services/
    ├── backup_service.py
    └── __init__.py
```

---

## 文件拆分规则

### 判断标准

| 文件行数 | 操作 |
|----------|------|
| <= 700 行 | 合规，无需操作 |
| > 700 行 | 必须拆分 |

### 拆分策略

#### 1. 按功能模块拆分

```
# 原始文件 (1000+ 行，违规)
api/routers/admin/knowledge_base.py

# 拆分后 (合规)
api/routers/admin/knowledge_base/
├── __init__.py                       # 导出所有 router
├── router.py                         # (~150 行) 主路由注册
├── categories.py                     # (~200 行) 分类管理 API
├── indices.py                       # (~250 行) 知识库索引 API
├── files.py                          # (~200 行) 文件管理 API
├── search.py                         # (~150 行) 搜索 API
└── schemas.py                        # (~100 行) Pydantic 模型
```

#### 2. 按职责分层拆分

```
# 原始文件 (800 行，违规)
application/usecases/session.py

# 拆分后 (合规)
application/usecases/session/
├── __init__.py
├── create.py                         # 创建会话
├── send_message.py                  # 发送消息
├── get_history.py                   # 获取历史
├── delete.py                        # 删除会话
└── schemas.py                      # 请求/响应模型
```

---

## 当前审核结果

### Backend 需要拆分的文件

| 文件路径 | 当前行数 | 建议 |
|----------|----------|------|
| `api/routers/admin/knowledge_base.py` | 1253 | 拆分为 categories/indices/files/search 模块 |
| `api/routers/tools.py` | 908 | 拆分为 pdf_tools/image_tools 等子模块 |
| `api/routers/session/session.py` | 605 | 接近限制，考虑拆分 |

### Backend 需要重组的目录

| 目录路径 | 当前文件数 | 建议 |
|----------|------------|------|
| `infrastructure/database/` | 8 | 重组为 _core/_models/_services |

### Client 需要关注的文件

| 文件路径 | 当前行数 | 建议 |
|----------|----------|------|
| `pages/agent/management.tsx` | 656 | 接近 700，考虑拆分 agent_form_modal |
| `pages/knowledge_base/index.tsx` | 623 | 接近 700，已有 components 目录 |
| `pages/settings/index.tsx` | 613 | 接近 700，考虑拆分 |

---

## 检查清单

<div style="background:#F5F5F5;border-radius:8px;padding:12px 16px;margin:12px 0;">

创建或移动文件时检查：

- [ ] 目标目录现有文件数是多少？
- [ ] 移动后目录文件数是否会超过 3 个？
- [ ] 如果超过 3 个，是否需要新建子目录？

修改文件时检查：

- [ ] 当前文件行数是多少？
- [ ] 是否超过 700 行？
- [ ] 如果超过 700 行，按什么方式拆分？
  - [ ] 按功能模块拆分？
  - [ ] 按职责分层拆分？
  - [ ] 提取公共代码到新文件？

</div>

---

## 命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 子目录 | `_子目录名/` 或按功能命名 | `_models/`, `categories/` |
| 模块文件 | snake_case | `user_repository.py` |
| 组件文件 | snake_case.tsx | `file_panel.tsx` |
| 类型文件 | `types.ts` 或 `*_types.ts` | `types.ts`, `chat_types.ts` |

---

## 适用目录

| 目录 | 说明 |
|------|------|
| `backend/src/` | Python 后端代码 |
| `frontend_next/src/` | Next.js 前端代码 |
| `client_electron/src/` | Electron 桌面客户端代码 |

---

## 立即执行清单

<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">目录文件数</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">超过 3 个必须重组</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">单文件行数</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">超过 700 行必须拆分</div>
  </div>

</div>
