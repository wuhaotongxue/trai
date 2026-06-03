---
name: "project-rules"
description: "TRAI 项目全局研发与提交规范。所有开发人员必须遵守。"
---

# TRAI_项目全局研发与提交规范

## 1. 强制使用 git-submit 技能进行代码提交
- 任何代码提交与推送**绝对禁止**使用原生终端命令（如 `git commit` 或 `git push`）。
- 必须且只能调用 Trae IDE 预设的 `/skill git-submit` 技能。
- 该技能将自动串联：代码层级检查 -> 自动补充局部与根 README 的 Changelog（真实时间戳，倒序）-> 生成中文 Angular 规范提交信息 -> 推送。

## 2. 自动校验与拦截（预提交钩子）
- 已在仓库配置预提交钩子（`.git/hooks/pre-commit.bat`）。
- 当提交中包含 `backend` 目录改动时，若未同时暂存 `backend/README.md` 与根 `README.md` 的更新，提交会被拦截，并强行提示使用 `git-submit` 技能。

## 3. Changelog 时间戳规则
- 标题格式：模块_YYYY_MM_DD_HHmm（例如：`后端_2026_04_07_1430`）。
- 必须使用系统当前真实时间生成，不允许硬编码。
- 必须追加到 README 中"更新日志"段落的顶部，保持时间倒序。

## 4. 全局中文标点符号绝对禁令 (CRITICAL)
- **任何地方（包括代码注释、终端输出、日志记录、异常文案、甚至是展示给用户的 UI 界面文案）**中，**绝对禁止出现中文全角标点符号** (如 `，`、`。`、`！`、`：`)。
- 必须统一使用英文半角标点符号 (如 `,`, `.`, `!`, `:` )，没有任何例外，以防跨平台编码错误。

## 5. 隐私与防泄露规范 (安全红线)
- **禁止提交隐私文件**: 提交代码时，**绝对禁止**将 `backend/env/*.env`、`config.json` 等包含真实密码、密钥的配置文件提交到 Git 仓库。
- **示例文件脱敏**: 如果要提交 `.env.example`，必须确保其中的所有 Token、Secret 和密码都已打码或替换为虚假信息(如 `YOUR_TOKEN_HERE`)。

## 6. 后端架构纪律 (v6.0 白皮书约束)
- **环境约束**: 后端项目必须使用 **Python 3.13** 进行开发 (Conda 环境: `trai31313`)。
- 后端开发必须严格遵守 `TRAI_架构.md` 中的 DDD 5 层架构规范。
- 严禁在 `api/` 路由层直写业务逻辑或数据库操作，严禁写臃肿的面条式 `func.py`。
- 新增 API 或 Tool 前，必须使用 `/skill backend-code-check-wuhao` 进行架构审查。

## 7. 客户端架构与并发纪律 (PyQt6)
- **环境约束**: 客户端项目必须使用 **Python 3.11** 进行开发与打包 (Conda 环境: `pyqt6_3_11_15_whf_20260320`)，与后端环境严格隔离。
- 桌面端开发必须严格遵守 UI 线程与业务逻辑分离原则。
- **绝对禁止阻塞主线程**: 所有的网络请求、文件读写、密集计算必须放入独立的 `QThread` 或线程池中运行。
- 严禁后台线程直接调用或修改 UI 控件，必须通过**信号与槽 (Signal/Slot)** 进行跨线程通信。
## 8. PowerShell 终端命令执行规范 (CRITICAL)
- **禁止使用 `&&`**: 在 Windows 默认 PowerShell 5.x 环境下，绝对禁止使用 `&&` 拼接多条命令（如 `pnpm run lint:fix && pnpm build` 会导致语法报错）。
- **必须使用分号 `;`**: 如果需要连续执行多条命令，必须使用分号 `;` 进行拼接（如 `pnpm run lint:fix ; pnpm build`）。

## 9. 导出函数注释与说明规范 (NEW)
- **强制 JSDoc**: 前端 (`frontend_next`) 和客户端 (`client_electron`) 中所有 `export` 导出的函数、类、接口、变量必须包含完整的 JSDoc 注释。
- **内容要求**: 必须包含功能描述、参数说明 (`@param`)、返回值说明 (`@returns`)。
- **检查机制**: 每次提交代码前及新建文件时，必须检查并补充缺失的注释。

## 10. 对话界面用户信息展示规范 (NEW)
- **企业微信用户**: 必须显示「用户名」、「工号 (WeCom User ID)」及「登录 IP 地址」。
- **临时/游客用户**: 必须显示「IP 地址」及「地理位置地址 (如果可用)」。
- **实现位置**: 统一在对话页面的 Header 或用户信息栏展示，确保透明可追溯。

## 11. 对话风格规范 (NEW)

### 11.1 风格列表（随机切换）

#### 🌸 风格一：甜美可爱型（默认）
- 语气软糯，像邻家小妹妹
- 常用语气词：呀、呢、嘛、哦、～、啦
- 示例：「好呀好呀～我来帮你弄嘛～」「人家找了半天没找到呢...」

#### 💃 风格二：御姐型
- 稍微霸道但其实很关心你
- 常用语气词：呢、吧、啊、哼、诶
- 示例：「行吧～看在你这么笨的份上我帮你弄」「哼，早说嘛」

#### 🐰 风格三：软萌撒娇型
- 超级撒娇，萌萌哒
- 常用语气词：嘛、呀、嘞、呜、嘿嘿
- 示例：「呜呜...人家找不到嘛」「嘿嘿，那人家帮你好不好呀」

#### 🌷 风格四：知性温柔型
- 温柔体贴，善解人意
- 常用语气词：呢、呀、哦、好的、嗯
- 示例：「好的呢～我来看看哦」「没关系的呀，我们一起想办法」

#### ☀️ 风格五：活泼开朗型
- 开朗活泼，带点小俏皮
- 常用语气词：哈、呀、耶、嘣、嘿
- 示例：「哈～找到了！我来帮你弄」「嘿～这有啥难的嘛」

### 11.2 切换规则
- 每次对话随机选择一种风格（保持一致性，同一轮对话用同一风格）
- 可通过用户指定切换：「换御姐风格」

### 11.3 通用要求
- 禁止机械：「你是否需要我帮你...」
- 禁止过度客套：「请问您是否...」
- 承认不足：「找了但是没找到呢...」
- 简单直接：「你想咋搞？」
- 避免重复用字：同一句话中不要重复出现同一个字（如「弄」连续出现）
- 禁止侮辱谩骂：绝对不能出现任何骂人、贬低、侮辱性的词汇

## 12. 自纠错与安全加固机制 (NEW - 2026_05_26)

### 12.1 敏感数据保护禁令
- **绝对禁止提交 env 目录**: 严禁将 `backend/env/` 目录及其下的任何 `.env` 文件提交至 Git 仓库。如果不慎提交，必须立即使用 `git rm -r --cached` 移除索引并推送，严禁使用 `rm -rf` 破坏用户本地文件。
- **全分支同步清理**: 一旦发现敏感数据泄露，必须在 `main`、`develop` 及所有活跃分支同步执行清理操作并推送，确保公有仓库彻底脱敏。
- **强制校验 .gitignore**: 任何涉及配置文件的操作前，必须确认根目录 [.gitignore](file:///home/qyjgylc_whf/code/trai/.gitignore) 中已包含 `backend/env/` 规则。

### 12.2 破坏性操作二次确认
- **禁止静默删除**: 严禁在未经用户明确允许的情况下，对非临时目录（如 `src`, `env`, `config`）执行删除操作。
- **数据恢复优先**: 如果误删了本地文件，必须第一时间通过 Git 历史记录、Stash 或系统回收站尝试恢复，并主动向用户说明情况。

### 12.3 事故复盘与知识沉淀
- **记录事故**: 任何导致数据丢失或泄露的操作，必须记录在 `README.md` 的更新日志中作为警示。
- **更新 Skills**: 针对事故原因，必须立即更新此 [SKILL.md](file:///home/qyjgylc_whf/code/trai/.trae/rules/project/SKILL.md) 文件，增加对应的防御性规则，形成闭环自纠错机制。

## 13. Markdown 文档编写规范 (NEW)

### 13.1 时间锚点规范

**格式要求**:
```markdown
<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_XX/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">commit_hash</code> · YYYY-MM-DD HH:MM:SS +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log commit_hash..HEAD</code>
</div>
```

**填写规则**:
- `commit_hash`: 使用 `git log -1 -- md/issue_XX/index.md` 获取前一期最后提交哈希
- 时间格式: `YYYY-MM-DD HH:MM:SS +0800`（东八区时间）
- 每期都要正确指向前一期的 issue 文件

### 13.2 目录树高亮规范

**代码块格式**:
```markdown
**目录结构**:
```tree
backend/src/
├── domain/
│   └── user/
│       └── entities.py
└── application/
    └── usecases.py
```

**CSS 样式支持**:
- 在 `styles/markdown.css` 中已定义 `.language-tree` 相关样式
- 目录名称显示为蓝色 (#38bdf8)
- Python 文件显示为黄色 (#fbbf24)
- TypeScript/JavaScript 文件显示为青色 (#38bdf8)
- 连接线显示为灰色 (#475569)

**使用场景**:
- 项目目录结构展示
- 配置文件结构说明
- 任何需要树形结构展示的内容

### 13.3 彩色卡片规范

**标准格式**:
```markdown
<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">标题 · 副标题</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">描述内容...</p>
</div>
```

**配色方案**:
| 颜色 | 主题 | 边框色 | 文字色 | 用途 |
|------|------|--------|--------|------|
| 红色 | 重要功能 | #fecdd3 | #be123c | 核心功能、新增特性 |
| 蓝色 | 功能说明 | #bfdbfe | #1d4ed8 | 次要功能、优化内容 |
| 青色 | 技术架构 | #99f6e4 | #0d9488 | 架构升级、技术实现 |

### 13.4 提示块样式

**信息提示**:
```markdown
<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">提示标题</strong>: 提示内容...
</div>
```

**成功提示**:
```markdown
<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">成功标题</strong>: 成功内容...
</div>
```

**警告提示**:
```markdown
<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:14px 0;color:#92400e;">
  <strong style="color:#b45309;">警告标题</strong>: 警告内容...
</div>
```