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

### 🛠️ 后端_2026_04_10_0820
- **完善(session)**: 会话管理接口集成数据库和认证
- **完善(ai)**: Chat 接口增加流式响应、Image 接口增加认证
- **完善(media)**: 媒体上传接口增加批量上传/预签名 URL/删除功能
- **新增(scripts)**: 数据库初始化脚本（建表/创建管理员/重置）

### 🛠️ 后端_2026_04_10_0813
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
