# trai

一个用于实验与沉淀代码片段的小仓库。

## 快速开始

```bash
git clone https://github.com/wuhaotongxue/trai.git
cd trai
```

## 镜像仓库

- GitHub：https://github.com/wuhaotongxue/trai
- Gitee（码云）：https://gitee.com/no5689/trai

## 贡献

欢迎提交 Issue / PR。

## 📝 更新日志 (Changelog)

### 💻 客户端_2026_04_13_1723
- **修复(client_electron)**: 使用 `git rm -r --cached` 移除了被错误提交到远程仓库的 `client_electron/node_modules`

### 💻 客户端_2026_04_13_1714
- **新增(client_electron)**: 完成 Electron 五层架构初始化（Main/Preload/Renderer/Services/Platform）
- **新增(client_electron)**: 配置 React + Vite + TypeScript 构建打包环境，通过 `npm run build` 测试

### 💻 客户端_2026_04_13_1607
- **配置(client_electron)**: 在项目根目录的 `.gitignore` 中补充了 `client_electron` 的相关构建产物和依赖忽略规则

### 💻 客户端_2026_04_13_1556
- **重构(client_electron)**: 依据防关键字冲突规范，将 `electron` 目录重命名为 `client_electron`

### 🎨 前端_2026_04_13_1556
- **重构(frontend_next)**: 移除 `frontend_next` 目录下的 `.gitignore`，将忽略规则合并至根目录

### 📚 规范(skills)_2026_04_13_1556
- **新增(skills)**: 全局项目规范新增“禁止子模块单独维护 `.gitignore`”的强制约束
- **新增(skills)**: 全局命名规范新增“禁止使用语言或框架关键字作为顶层目录名称”的强制约束

### 🎨 前端_2026_04_13_1521
- **修复(frontend)**: 修复前端组件（navbar, pricing, settings）中出现的乱码及中文全角标点问题

### 🛠️ 后端_2026_04_13_1521
- **修复(backend)**: 补齐后端缺失依赖（redis, opentelemetry），修正 `UserModel` 导入路径，确保后端服务成功启动

### 📚 docs(skills)_2026_04_13_1521
- **新增(skills)**: 将 `.cursor/skills` 下的所有规范配置文件平滑迁移至 `.trae/skills`，完成 Trae Agent 的技能装配

### 📚 docs(project)_2026_04_13_1155
- **重构(database)**: 所有表改用 `t_` 前缀（t_users/t_chat_sessions/t_messages 等），防止与 SQL 关键字冲突
- **新增(database)**: 所有表新增 `created_by`/`updated_by`/`deleted_by` 审计字段，完善数据血缘追踪
- **新增(rules)**: `rules/database.md` 补充表命名 `t_` 前缀规范，替代旧的复数命名规则

### 📚 docs(project)_2026_04_13_1115
- **新增(tools)**: 新增 `backend/verify_schema.py` 自动化脚本，验证 `database_schema.md` 与 Model 源码字段一致性（8 张表全部通过）
- **增强(rules)**: `rules/database.md` 新增主表文档强制维护规范，规定每次提交前必须运行验证脚本
- **增强(schema)**: `database_schema.md` 重写表定义，与 Model 源码字段严格对齐，通过自动化验证

### 📚 docs(project)_2026_04_10_1613
- **新增(skills)**: 新增期数文档技能 `issue_index/SKILL.md`，规范 `md/issue_NN/index.md` 写作（锚点/git log/分段/内联色块）
- **新增(docs)**: 新增第 3 期文档 `md/issue_03/index.md`（Agent 工具与工作流落地），配样式 `md/issue_docs.css`
- **增强(project)**: `project/SKILL.md` 索引表补充期数文档入口

### 🛠️ 后端_2026_04_10_0847
- **增强(session)**: 新增发送消息联动 AI（普通/流式）
- **新增(core)**: OpenTelemetry 可观测性模块
- **新增(middleware)**: 速率限制中间件
- **新增(middleware)**: 审计日志中间件
- **增强(main)**: 中间件注册顺序优化

### 🛠️ 后端_2026_04_10_0831
- **增强(system)**: 健康检查接口（存活探针/就绪探针/依赖检查）
- **增强(system)**: 监控接口（数据库统计/服务状态/Prometheus 格式指标）
- **新增(system)**: 通知管理接口（发送通知/测试通知/配置列表）

### 🛠️ 后端_2026_04_10_0820
- **新增(auth)**: 新增认证路由模块（登录/注册/登出/刷新令牌/当前用户）
- **新增(api)**: 认证接口支持 Token 验证、角色权限控制与依赖注入
- **新增(deps)**: 补充 FastAPI HTTPBearer 安全依赖

### 🛠️ 后端_2026_04_09_2042
- **新增(domain)**: 新增领域仓储接口定义（IUserRepository/ISessionRepository/IMessageRepository）
- **新增(security)**: 新增安全模块（PasswordService 密码哈希/JWTService 令牌认证）
- **新增(api)**: 新增 API 依赖注入模块（deps.py），支持 Token 验证与角色权限控制
- **补充(deps)**: 补充 pyproject.toml 依赖（jose/argon2）

### 🛠️ 后端_2026_04_09_2021
- **重构(backend)**: 重构代码目录结构，从 `backend/src/trai/` 迁移到 `backend/src/`，优化 DDD 五层架构路径
- **新增(core)**: 新增统一异常定义模块（exceptions.py）与日志模块（logger.py）
- **新增(domain)**: 新增用户（User）、会话（ChatSession）、消息（Message）等领域实体
- **新增(api)**: 新增 FastAPI 主应用配置、路由注册与中间件（请求ID/日志/错误处理）
- **新增(ai)**: 新增 AI 对话与绘图接口路由
- **新增(infrastructure)**: 新增 AI 客户端（S3 存储/消息通知）基础设施实现

### 🛠️ 项目_2026_04_09_1620
- **新增(规范)**: .gitignore 新增前端依赖目录 frontend_next/node_modules/ 忽略规则

### 🛠️ 项目_2026_04_09_1230
- **新增(规划)**: 创建 TODO.md 项目待办清单，梳理 backend/frontend/客户端的整体规划与进度追踪

### 🛠️ 项目_2026_04_09_1215
- **优化(规范)**: git_submit 技能补充 Windows PowerShell heredoc 兼容性说明，Linux/Mac 可用 heredoc，Windows 必须用单行 -m 格式

### 🛠️ 项目_2026_04_09_1155
- **新增(规范)**: 创建 .gitignore 忽略敏感配置与环境文件，仅保留 .env.example 作为模板

### 🛠️ 后端_2026_04_09_1135
- **新增(release)**: 补充 API 版本管理、密钥轮换、防爬虫、数据导出导入、CDN、连接池监控、国际化、Celery 死信队列等 8 大配置模块

### 🛠️ 项目_2026_04_09_0911
- **补充(公众号)**: 完善第2期文章，补充 Trae + git_submit 一键提交推送说明与截图

### 🛠️ 项目_2026_04_09_0855
- **补充(仓库)**: README 增加 Gitee（码云）镜像仓库地址

### 🛠️ 项目_2026_04_08_1952
- **重构(skills)**: 统一 .trae/.cursor 下 Skills 与 Rules 的目录结构与索引
- **补齐(agent)**: 完善 agent 能力域文档（媒体/安全/审计/反馈/熵管理等）

### 🛠️ 项目_2026_04_08_1500
- 更新项目结构和配置

## 作者

wuhaotongxue <wuhaotongxue@gmail.com>
