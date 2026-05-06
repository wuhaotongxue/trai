# TRAI Skills 总结文档

> 最后更新: 2026-04-30
> 基于 `.trae/skills/` 目录下所有 SKILL.md 文件归纳整理

---

## 一、Skills 总览

TRAI 项目共有 **16 个 Skills**, 按功能分为 **5 大类**:

| 分类 | 数量 | Skills |
|------|------|--------|
| 代码审查 | 4 | backend_code_check_wuhao, frontend_next_code_review, electron, desktop_client_code_review |
| 智能体 | 1 | agent_harness_engineering |
| 质量检查 | 2 | ruff_check, jsx-tag-checker |
| 项目管理 | 5 | project_management, git_submit, naming-convention, readme-update, report-generation |
| 工具 | 2 | code-commenter, start-services |

> 此外还有一个 `skill-creator` (Skill 创建器) 属于系统能力, 不特定于本项目.

---

## 二、代码审查类 Skills

### 2.1 backend_code_check_wuhao (后端代码审查)

| 属性 | 内容 |
|------|------|
| **触发场景** | 修改 backend/ 下 Python 代码时 |
| **核心职责** | 强制执行 DDD 五层架构 + 类封装 + 中文标点禁令 |

**子规范索引**:

| 子规范 | 文件 | 用途 |
|--------|------|------|
| Python 规范 | `rules/python.md` | Python 3.13 类型提示、缩进、路径 |
| 数据库规范 | `rules/database.md` | 表命名、主键、必备字段、查询红线 |
| 数据库表总览 | `database_schema.md` | 全部 t_ 开头表结构速查 |
| API 设计规范 | `api_design/routes.md` | POST 业务接口、统一响应格式 |
| S3 存储 | `storage/s3_access.md` | Presigned URL 访问控制 |
| DDD 五层架构 | `architecture/layered.md` | Domain/Application/Infra/API/Scripts |

**核心约束**:

| 约束 | 说明 |
|------|------|
| 中文标点禁令 | 禁止 `, . ! ? :` 全角, 只能用半角 `, . ! ? :` |
| 文件有类 | 每个 `.py` 必须有类, 禁止顶层孤立函数 |
| Domain 纯净 | 禁止引入 SQLAlchemy / FastAPI / Redis |
| 禁止 SELECT * | 必须显式指定列 |
| 禁止裸 except | 必须指明异常类型 |
| 禁止 print | 必须使用 logger |
| 文件头模板 | `#!/usr/bin/env python` + 作者 + 日期 + 描述 |
| Docstring 全覆盖 | 每个 class/def 都须有中文 docstring |

**提交前必须**:
1. 运行 `ruff format src/` + `ruff check src/ --fix`
2. 同步更新 `README.md` 和 `backend/README.md` 的 Changelog
3. 测试文件放 `backend/tests/`, 临时脚本用后删除

---

### 2.2 frontend_next_code_review (前端代码审查)

| 属性 | 内容 |
|------|------|
| **触发场景** | 修改 frontend_next/ 下 Next.js 代码时 |
| **核心职责** | App Router 规范 + 文件头 + 全局标点禁令 |

**技术栈**: Next.js 16 App Router, TypeScript 严格模式, Tailwind CSS 4, shadcn/ui, Zustand

**子规范索引**:

| 子规范 | 文件 | 用途 |
|--------|------|------|
| TypeScript | `rules/typescript.md` | 严格类型, 禁止 any |
| Tailwind CSS | `rules/tailwind.md` | UI 样式规范 |
| i18n | `rules/i18n.md` | 国际化翻译规范 |
| App Router | `architecture/app_router.md` | 页面路由规范 |
| 五层架构 | `design/layered.md` | 前端分层 |
| 组件规范 | `components/overview.md` | 组件开发规范 |
| 认证 | `auth/overview.md` | 权限/登录相关 |
| 页面规范 | `pages/**/overview.md` | 各页面专项规范 |

**核心约束**:

| 约束 | 说明 |
|------|------|
| 紫色禁令 | 禁止 purple/violet/#9333EA 等紫色色系 (Indigo 主色允许) |
| 中文标点禁令 | 禁止全角标点, 统一半角 |
| 禁止 any | 必须显式类型注解 |
| 文件头强制 | 每个 .tsx/.ts 必须有中文文件头 |
| 组件行数 | ≤200 行, 超限拆分 |
| 文件名 snake_case | `chat_panel.tsx` ✅, `chat-panel.tsx` ❌ |
| 组件名 PascalCase | `ChatPanel` |
| 变量名 camelCase | `isLoading` |

**提交前必须**:
1. `pnpm run lint:fix` (自动修复)
2. `pnpm run lint -- --max-warnings 0` (零警告)
3. `pnpm run type-check` (TypeScript 无报错)

---

### 2.3 electron (Electron 桌面客户端审查)

| 属性 | 内容 |
|------|------|
| **触发场景** | 修改 client_electron/ 下代码时 |
| **核心职责** | TypeScript 规范 + 五层架构 + IPC 通道 + 窗口管理 + 自动更新 |

**技术栈**: Node.js 20 LTS, pnpm, TypeScript 严格模式

**五层架构**:

| 层级 | 目录 | 职责 |
|------|------|------|
| UI Layer | `src/renderer/` | React 组件渲染 |
| Controller | `src/preload/` | 安全桥接 |
| Service | `src/main/services/` | 业务流程编排 |
| IPC | `src/main/ipc/` | 通道注册 |
| Platform | `src/main/platform/` | Node.js API 封装 |

**核心约束**:

| 约束 | 说明 |
|------|------|
| 紫色禁令 | 同前端, 禁止紫色 |
| 中文标点禁令 | 禁止全角标点 |
| IPC 通道命名 | `domain:action` 格式 |
| 主进程日志 | 必须用 electron-log, 禁止 console.log |
| 上下文隔离 | `contextIsolation: true` |
| 禁用 Node 集成 | `nodeIntegration: false` |
| S3 自动更新 | 版本号严格 Semver |

**提交前必须**: 同前端 (pnpm lint + type-check)

---

### 2.4 desktop_client_code_review (PyQt6 桌面客户端 - 已废弃)

| 属性 | 内容 |
|------|------|
| **状态** | ⚠️ **已废弃**, 桌面端已统一迁移到 Electron |
| **触发场景** | 当用户提及 PyQt6 客户端时, 提示重定向到 `electron/SKILL.md` |

**废弃前的历史约束** (仅供参考): 五层架构, 防卡死 (禁止阻塞主线程), 信号槽 (禁止跨线程操作 UI), Win11 Fluent UI, 资源释放与防僵尸线程

---

## 三、Agent 智能体 Skill

### 3.1 agent_harness_engineering (Agent 工程规范)

| 属性 | 内容 |
|------|------|
| **触发场景** | 开发 Agent 智能体系统时 |
| **核心职责** | 强制执行 Harness 五层架构 |

**Harness 五层架构**:

| 层级 | 核心问题 | TRAI 落地 |
|------|---------|----------|
| 上下文装配 | 给模型什么信息? | 会议/对话/音频/视频上下文分层注入 |
| 工具治理 | 工具如何暴露/拦截? | 转录/翻译/生成/审核/录制 |
| 工具抽象层 | 工具如何解耦? | 三端 Adapter / Registry / 权限代理 |
| 安全与规则 | Agent 能做什么? | RBAC / VIP 特权 / 水印规则 |
| 反馈与状态 | Agent 如何持续做事? | 工具执行结果回流, 状态持久化 |
| 熵管理 | 如何防止系统腐烂? | Rules/Skills 定期清理 |

**三条闭环**: 执行闭环 → 治理闭环 → 评测闭环

**六大管控维度**: 能力边界, 执行环境, 上下文与状态, 策略与审批, 遥测与可观测性, 评测与回放

**RBAC 角色**: Guest → User → VIP → Admin (四级权限)

**子规范索引** (77+ 文件):

| 分类 | 涵盖内容 |
|------|---------|
| 多 Agent 协作 | 编排器, 路由, 协作模式, 接口定义, 通信协议, 生命周期 |
| 核心能力 | 思考链, 纠错机制, 用户反馈, 设计模式 |
| 基础设施 | 监控指标, 部署规范, 通知告警, 配额管理, 速率限制, 审计日志 |
| 媒体处理 | 音频 (合成/转录/录制/流), 视频 (生成/截图/录制/流), 对话, 图片 |

**推荐基础设施**: Langfuse (tracing), Phoenix (evals), OpenTelemetry (可观测性)

**核心禁止事项**:
- 禁止安全边界寄托在提示词上
- 禁止工具没有治理
- 禁止 AI 生成内容不经审核/水印直接展示
- 禁止 Agent 输出不透明 (必须有 trace_id)
- 禁止长任务无 checkpoint
- 禁止 Rules/Skills 无限膨胀
- 禁止无月度配额/速率限制
- 禁止生产环境无 OpenTelemetry

---

## 四、质量检查类 Skills

### 4.1 ruff_check (Python 代码格式化和 Lint)

| 属性 | 内容 |
|------|------|
| **触发场景** | 提交 backend 代码前, 或用户要求格式化 |
| **工具** | Ruff (astral) |

**执行步骤**:
1. 确保 backend 环境已安装 ruff
2. `ruff format src/` (格式化)
3. `ruff check src/ --fix` (检查 + 自动修复)
4. 如有无法自动修复的错误, 手动修改直到通过

---

### 4.2 jsx-tag-checker (JSX 标签检查)

| 属性 | 内容 |
|------|------|
| **触发场景** | 启动前端/客户端服务前, 或编辑 JSX/TSX 文件后 |
| **检查范围** | frontend_next/ 和 client_electron/ 下所有 .tsx/.jsx |

**检查内容**: 未闭合标签, 标签不匹配, 非法嵌套等

---

## 五、项目管理类 Skills

### 5.1 project_management (项目管理规范索引)

| 属性 | 内容 |
|------|------|
| **触发场景** | 项目管理相关操作的统一入口 |
| **子规范** | 命名规范, Git 提交, README 更新, 周报生成, 期数文档 |

**核心统一规则**:
- **snake_case 强制**: 所有标识符, 文件名, 目录名
- **禁止 kebab-case**: `add-num` 这种用横杠连接的形式绝对禁止
- **全局 .gitignore**: 只允许在项目根目录存在一个, 子模块规则统一提升
- **禁止上传依赖包/构建产物**: node_modules, .venv, __pycache__, dist, release
- **前端/客户端强制 pnpm**: 禁止 npm/yarn
- **国内镜像源**: `--registry=https://registry.npmmirror.com`
- **禁止上传 >500MB 文件**

---

### 5.2 git_submit (自动提交推送)

| 属性 | 内容 |
|------|------|
| **触发场景** | 用户说提交/推送/保存代码时 |

**执行流程**:

| 步骤 | 内容 |
|------|------|
| 1. 状态检查 | `git status`, 清理临时脚本 |
| 2. 规范检查 | 按修改目录调用对应代码审查 Skill + ruff_check |
| 3. Changelog | 检查 README 更新, 未更新则调用 readme-update |
| 4. 暂存 | `git add .` |
| 5. 提交 | 中文 + Angular 规范前缀 (`feat:`, `fix:`, `chore:`) |
| 6. 推送 | 先 `git pull --rebase` 再推送, 网络问题最少重试 3 次 |

**强制约束**: 严禁绕过本 Skill 直接推送.

---

### 5.3 naming-convention (命名规范)

| 属性 | 内容 |
|------|------|
| **触发场景** | 创建/修改任何代码文件时 |
| **适用范围** | client_electron/src/ 和 frontend_next/src/ |

**命名对照表**:

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件/目录名 | snake_case | `text_to_image` |
| 路由路径 | snake_case | `/ai/text_to_image` |
| 组件/类型名 | PascalCase | `TextToImage` |
| 变量/函数名 | camelCase | `textToImage` |

---

### 5.4 readme-update (README 更新)

| 属性 | 内容 |
|------|------|
| **触发场景** | 提交前更新 Changelog 时 |

**执行流程**:
1. 确认变更的模块 (backend/frontend/desktop/electron/skills)
2. 用真实时间戳生成标题: `模块_YYYY_MM_DD_HHmm`
3. 归纳变更要点 (中文短句)
4. 同步追加到两处 README 顶部: 根 README + 模块 README
5. 禁止使用 `综合` / `项目` 等模糊标签

---

### 5.5 report-generation (周报/月报生成)

| 属性 | 内容 |
|------|------|
| **触发场景** | 用户要求写周报/月报时 |
| **输入来源** | Excel/CSV, Git 仓库, 自由文本, 历史报告 |

**功能**: 分析 Git 提交记录 → 与历史对比 → AI 生成结构化报告 → 导出 PDF/Word/Excel → S3 存储

**数据库**: `reports` 表 + `report_exports` 表

---

## 六、工具类 Skills

### 6.1 code-commenter (代码注释自动添加)

| 属性 | 内容 |
|------|------|
| **触发场景** | 需要批量添加注释时 |
| **适用范围** | client_electron/src/ 和 frontend_next/src/ 下所有 .ts/.tsx |

**注释规则**:
- 文件头: `文件名` + `作者: wuhao` + `日期` + `描述`
- 导出函数: JSDoc (`@param`, `@returns`)
- 接口类型: `@property` 注解
- 类: 类描述 + 每个方法/属性注释
- React 组件: 功能描述 + Props 说明

---

### 6.2 start-services (启动前后端服务)

| 属性 | 内容 |
|------|------|
| **触发场景** | 用户要求启动/重启前后端服务时 |

**启动命令**:

| 服务 | 命令 |
|------|------|
| 后端 | `conda activate trai31313` → `cd backend` → `python run.py` |
| 前端 | `cd frontend_next` → `pnpm run type-check` → `pnpm dev` |
| 客户端 | `cd client_electron` → `pnpm run type-check` → `pnpm dev` |

**默认地址**: 后端 `http://localhost:5666`, 前端 `http://localhost:3000`

---

## 七、Skills 触发关系图

```
git_submit (提交代码)
├── 修改 backend/ → backend_code_check_wuhao → ruff_check → readme-update
├── 修改 frontend_next/ → frontend_next_code_review → readme-update
├── 修改 client_electron/ → electron → readme-update
├── 修改 desktop_client/ → desktop_client_code_review (废弃, 重定向)
├── 修改 .trae/skills/ → readme-update
└── 任意修改 → naming-convention (自动适用)

start-services (启动服务)
├── 启动前端 → jsx-tag-checker → pnpm run type-check
└── 启动客户端 → jsx-tag-checker → pnpm run type-check

code-commenter (添加注释)
├── frontend_next/src/**/*.tsx
└── client_electron/src/**/*.tsx

report-generation (生成周报)
└── project_management (入口) → report_generation/SKILL.md

agent_harness_engineering (Agent 开发)
└── 独立体系, 包含 77+ 子规范文档
```

---

## 八、全局红线 (所有 Skill 共用)

以下规则在所有 Skill 中都强制要求:

| # | 规则 | 说明 |
|---|------|------|
| 1 | **中文标点禁令** | 禁止 `, . ! ? :` 全角, 统一 `, . ! ? :` 半角 |
| 2 | **snake_case 命名** | 文件, 目录, 路由, 禁止 kebab-case |
| 3 | **紫色禁令** | 前端/客户端 UI 禁止 purple/violet 色系 |
| 4 | **禁止 any 类型** | TypeScript 必须显式类型注解 |
| 5 | **文件头强制** | 每个文件必须有作者/日期/描述头注释 |
| 6 | **Changelog 同步** | 修改代码后必须更新两处 README |
| 7 | **pnpm 强制** | 前端/客户端必须用 pnpm, 禁止 npm/yarn |
| 8 | **禁止上传依赖** | node_modules/.venv/dist 等不上传 Git |
