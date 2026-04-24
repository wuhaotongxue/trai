# TRAI Backend

TRAI 项目后端服务, 基于 FastAPI 框架构建.

## 技术栈

- Python 3.13
- FastAPI
- SQLAlchemy (异步)
- Pydantic
- Uvicorn

## 快速开始

### 1. 环境准备 (Conda)

推荐使用清华源加速:

```bash
conda create -n trai python=3.13.13 -y
conda activate trai
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .
```

### 2. 运行服务

```bash
python run.py
```

服务默认在 `http://127.0.0.1:8000` 启动. 可以访问 `http://127.0.0.1:8000/docs` 查看 Swagger API 文档.

## 开发规范

所有代码遵循 DDD 五层架构, 详见 `.trae/skills/backend_code_check_wuhao/SKILL.md`.

## 📝 更新日志 (Changelog)

### 🛠️ 后端_2026_04_24_1525
- **feat(i18n)**: 新增国际化字符串和系统配置数据库模型与仓储 (I18nRepository)
- **feat(i18n)**: 新增 Admin i18n 管理接口，支持翻译字符串的增删改查
- **feat(i18n)**: 新增公开翻译查询接口 (i18n_public)，支持 namespace 批量拉取
- **feat(i18n)**: 新增 Admin 翻译数据初始化脚本 (seed_i18n.py)
- **feat(notify)**: 新增飞书 AI 事件通知服务（文生图 + AI 对话），支持富文本卡片
- **feat(image)**: 新增图片生成配置接口，支持模型列表和管理
- **feat(image)**: 新增图片客户端工厂 (ImageClientFactory)，统一管理多模型
- **feat(system)**: 新增系统配置和 Schema 文档管理接口
- **feat(geo)**: 新增 IP 地理位置服务

### 🛠️ 后端_2026_04_22_1515
- **feat(session)**: 新增会话重命名接口 `POST /sessions/{session_id}/rename`
- **feat(release)**: 客户端发布支持 EXE 文件上传, 并升级飞书通知为 Interactive 卡片格式
- **fix(storage)**: 优化 S3 访问地址, 支持通过 `S3_PUBLIC_DOMAIN` 进行静态资源代理

### 🛠️ 后端_2026_04_22_1447
- **fix(导入)**: 修复 backup_service.py 中的 S3Storage 导入错误，改为 S3StorageService
- **feat(备份)**: 新增数据库备份服务，支持 pg_dump 备份和 S3 上传
- **feat(发布)**: 新增客户端发布管理功能

### 🛠️ 后端_2026_04_22_0845
- **feat(权限)**: 移除知识库接口中不必要的管理员限制，允许普通企业微信人员创建个人的私有知识库
- **feat(同步)**: 增加提升角色的自动化脚本 `elevate_user_role.py`，支持一键将企业微信用户升级为 admin
- **fix(同步)**: 优化企业微信组织架构同步流程，遇到权限不足 (60011) 报错时自动降级为子部门遍历拉取，并输出详细到人名的拉取进度日志
- **fix(同步)**: 处理并优雅拦截企业微信 IP 不在白名单 (60020) 错误，防止无效轮询导致服务卡死


### 🛠️ 后端_2026_04_21_1941
- **修复(auth)**: 修复 FastAPI 启动时因 wecom_callback 路由参数 Request | None 导致的 Pydantic 解析崩溃
- **新增(auth)**: 新增 sys_users 表数据同步至 t_users 表的脚本，解决企业微信登录未绑定账号问题

### 🛠️ 后端_2026_04_21_1729
- **feat(wecom_sync)**: 新增企业微信用户同步脚本, 支持从根部门同步并落库
- **refactor(user_repo)**: 增加企业微信用户创建或更新方法, 统一落库入口

### 🛠️ 后端_2026_04_21_1649
- **refactor(api)**: 后端路由前缀切换为 /api_trai/v1, 通过 API_PREFIX 统一挂载
- **fix(wecom)**: 企业微信回调地址跟随 API_PREFIX 生成, 避免回调路径不一致
- **refactor(error)**: TraiException 增加结构化日志字段, 全局异常处理中间件统一输出

### 🛠️ 系统更新_2026_04_21_1047
- [安全] 引入 Redis Token 黑名单机制，拦截登出和刷新后的废弃 Token
- [功能] 客户端 (client_electron) 增加 Axios 拦截器，实现并发安全的无感知 Token 刷新
- [功能] 前端 (frontend_next) 增加 Fetch 拦截器，实现并发安全的无感知 Token 刷新

### 🛠️ 系统更新_2026_04_21_1013
- [安全] 修复 AES_KEY 与 AES_IV 缺失导致服务启动失败的问题
- [安全] 修复 JWT 弱密钥检测策略及数据库会话连接泄露风险
- [安全] 完善前端 Token 存储方式为 js-cookie 及新增全栈中文标点自动修复
- [功能] 完善管理后台前端页面 (知识库管理、组织架构、客户端发布)
- [规范] 升级前后端与客户端 Skills 规范，加入严格安全红线检查



### 🛠️ 后端_2026_04_20_1434
- **security(audit)**: 完成代码安全审核, 修复 scripts 目录中的 print 语句违规问题
- **refactor(enum)**: 统一使用 Python 3.11+ 内置 StrEnum, 替换自定义兼容实现
- **fix(tools)**: 清理 PDFGenerator 冗余代码, 仅保留 Playwright 后端
- **chore(lint)**: 通过 Ruff linter 检查, 修复所有代码风格问题

### 📚 规范(skills)_2026_04_20_1646
- **chore(skills)**: 更新后端开发规范, 完善 Python 文件头模板与 Docstring 要求

### 🛠️ 后端_2026_04_20_1147
- **feat(login)**: 优化登录接口错误处理, 添加详细的超时和连接错误提示
- **fix(database)**: 修复数据库连接配置, 支持 PostgreSQL 和 SQLite 自动回退
- **refactor(tools)**: 简化 PDF 生成器, 移除 WeasyPrint 和 pdfkit 依赖, 仅保留 Playwright
- **chore(deps)**: 更新 requirements.txt, 移除 weasyprint 和 pdfkit

### 🛠️ 后端_2026_04_19_2241
- **feat(ai)**: 新增 /api/ai/image_to_image 图生图接口, 支持接收 image_url 或 data URL

### 🛠️ 后端_2026_04_19_2132
- **fix(ruff)**: 修复 tools.py 条件导入 Playwright/WeasyPrint/pdfkit 的未使用警告，添加 noqa 标记
- **fix(ruff)**: 修复 weather.py 未使用变量 lang，添加 noqa 标记

### 🛠️ 后端_2026_04_19_0210
- **修复(tool_calls)**: 修复流式工具调用中 tool_name 可能为空的问题，在任何 tool_call chunk 中发现有 function.name 时都更新 tool_name
- **修复(tool_calls)**: 修复同 tool_call_id 可能被重复添加到 tool_calls 数组的问题，并增加替换逻辑，优先保留非空参数或内容更长的版本
- **修复(weather)**: 天气工具集成 Open-Meteo 地理编码 API，支持任意城市（中文/英文/拼音），移除预设城市列表的限制
- **修复(weather)**: 改进天气工具参数解析，即使参数为空也有合理的默认城市处理
- **优化(logging)**: 在 openai_client.py 和 executor.py 中增加详细的 tool_call 相关日志，便于调试问题

### 🛠️ 后端_2026_04_19_0030
- **功能(agent)**: 新增计算器Agent（agent-calculator）和天气助手Agent（agent-weather），默认运行
- **功能(search)**: 集成DuckDuckGo免费搜索，无需API Key
- **优化(weather)**: 移除天气工具mock fallback，直接使用wttr.in免费接口
- **修复(knowledge_base)**: 简化知识库权限检查，允许非超级管理员访问所有知识库
- **优化(dependencies)**: 新增duckduckgo-search依赖

### 🛠️ 后端_2026_04_19_0020
- **功能(agent)**: 新增默认 Agent（agent-default），全能型助手
- **功能(agent)**: 新增 `/api/agent/management/update` 接口，支持更新 Agent 信息
- **优化(agent)**: Agent 数据结构新增 `icon` 和 `system_prompt` 字段
- **优化(agent)**: 注册和更新接口支持保存图标和系统提示词

### 🛠️ 后端_2026_04_17_2257
- **新增(user)**: 管理后台新增创建用户接口, 支持创建多账号登录
- **修复(password)**: 修复修改密码接口无法更新密码哈希导致 500 的问题
- **隔离(knowledge_base)**: 非超级管理员仅可访问自己前缀知识库, 避免跨账号查看

### 🛠️ 后端_2026_04_17_2154
- **修复(knowledge_base)**: 文件分页支持 page_size 大于 10, 自动多页拉取并切片返回
- **规范(docstring)**: 知识库路由与服务补齐 class/def docstring, 便于维护与交付

### 🛠️ 后端_2026_04_17_1702
- **修复(knowledge_base)**: 分页接口返回正确 total, 支持稳定翻页

### 🛠️ 后端_2026_04_16_1433
- **新增(knowledge_base)**: 新增百炼知识库增删改查全套接口，支持分类拉取(失败降级)、知识库列表、重命名、删库删文件与文本上传解析
- **修复(knowledge_base)**: 修复百炼返回结果首字母大写导致的解析为空问题，增强字段兼容性
- **新增(test)**: 增加 Python 直连与工作流自测脚本，确保核心知识库操作脱离客户端也可独立验证

### 🛠️ 后端_2026_04_16_0934
- **修复(db)**: 数据库配置同时兼容 `POSTGRES_*` 与 `.env` 的 `DB_*`，并在连接失败时打印隐藏密码后的错误日志
- **修复(sqlite)**: 兼容 SQLite 自增主键写入，避免初始化默认 admin 时登录接口返回 500
- **新增(test)**: 增加 PostgreSQL 账号密码直连验证测试用例，便于快速排查连接问题

### 🛠️ 后端_2026_04_15_2112
- **新增(knowledge_base)**: 新增百炼知识库 Demo 创建接口 `/api/admin/knowledge_base/demo_create`，返回 IndexId/FileId/JobId 并轮询任务状态
- **新增(env)**: `.env.example` 补齐百炼知识库 OpenAPI 的环境变量说明与示例占位
- **优化(db)**: 启动时数据库连不上 PostgreSQL 自动回退本地 SQLite，并补齐用户表字段避免登录 500

### 🛠️ 后端_2026_04_15_1641
- **新增(wecom)**: 增加企业微信组织架构同步用例，补齐部门实体、接口与仓储实现
- **新增(api)**: 增加组织管理与企业微信登录相关路由，完善用户模型与 JWT 逻辑
- **修复(ruff)**: 修复同步与企业微信工具模块的 Lint 问题并统一格式

### 🛠️ 后端_2026_04_15_0940
- **修复(backend)**: 修复 `run.py` 环境变量导入路径及 `api` 模块无法找到的问题
- **修复(backend)**: 修复 `client_release.py` 和 `update.py` 中异步 Session 导入及使用的错误
- **修复(backend)**: 修复 `ruff check` 报告的类型注解等格式规范问题
- **修复(backend)**: 修改依赖 `requirements.txt` 以补充缺少的 redis 等环境
- **规范(backend)**: 增加 `conda activate` 必须先执行的强制启动规范记忆

### 🛠️ 后端_2026_04_14_1650
- **新增(backend)**: 新增 `ClientReleaseModel` (PostgreSQL `t_client_releases`)，持久化存储发布的客户端版本及 S3 Key 信息
- **新增(backend)**: `api.routers.admin.client_release` 中新增 POST `/api/admin/client/release` 接口，支持管理员上传 `latest.yml` 与 `exe` 安装包并保存至 S3
- **新增(backend)**: `api.routers.client.update` 中新增 GET `/api/client/update/latest.yml` 和 `/api/client/update/{filename}` 接口，利用后端重定向发放 S3 短期预签名 URL，完美解决时间过期限制问题

### 🛠️ 后端_2026_04_14_1501
- **新增(backend)**: `management.py` 中新增 `/api/agent/management/check` 接口，支持检测指定 Agent 的运行状态是否正常（模拟了网络延迟和运行中 20% 概率抛出异常的情况）

### 🛠️ 后端_2026_04_14_1446
- **修复(backend)**: 修复 `main.py` 中遗漏注册 `management`、`music`、`video` 路由，导致 `/api/agent/management/list` 接口报 404 的问题

### 🛠️ 后端_2026_04_14_1444
- **修复(deps)**: 清理 `requirements.txt` 中由于 `pip freeze` 意外导出的本地项目可编辑依赖
- **修复(ruff)**: 修复 `domain` 模块中由于冗余导入导致无法通过 Ruff 检查的语法警告

### 🛠️ 后端_2026_04_14_1450
- **新增(backend)**: 引入 `ruff` 工具进行 Python 代码极速格式化与 Lint 检查，并新增自定义技能 `ruff_check`，同时修改 `git_submit` 强制要求后端代码提交前运行此技能

### 🛠️ 后端_2026_04_14_1445
- **优化(backend)**: `convert_image` 接口新增 `target_size_kb` 参数，能够在转换格式为 JPEG 或 WEBP 的同时执行二分查找以压缩至目标大小

### 🛠️ 后端_2026_04_14_1440
- **优化(backend)**: `compress_image` 接口增加 `target_size_kb` 参数，当指定目标大小时，通过二分查找动态寻找最接近目标体积的 JPEG 压缩质量，并返回 `original_size` 和 `converted_size`

### 🛠️ 后端_2026_04_14_1420
- **优化(backend)**: `convert_image` 接口增加 `width` 和 `height` 参数处理，并返回 `original_size`、`converted_size` 及宽高信息供客户端展示

### 🛠️ 后端_2026_04_14_1410
- **优化(backend)**: `convert_image` 接口增加 `sizes` 尺寸支持，利用 Pillow 的 `sizes` 参数生成包含多尺寸结构的 ICO 文件

### 🛠️ 后端_2026_04_14_1400
- **新增(backend)**: 增加图片格式互相转换 API 路由 (`/api/tools/convert_image`)，使用 Pillow 处理 RGBA 通道、ICO 缩放等复杂场景并上传 S3

### 🛠️ 后端_2026_04_14_1345
- **新增(backend)**: 增加系统反馈 API 路由 (`/api/system/feedback`) 并完善相关模型定义与数据落地模拟

### 🛠️ 后端_2026_04_14_1310
- **新增(backend)**: 补充文生音乐 (`music.py`) 与文生视频 (`video.py`) 的后端 Mock API 接口，完善 AI 路由体系
- **修复(backend)**: 修复 `run.py` 启动时缺失的 `markdown`、`pdfkit` 与 `pillow` 依赖问题

### 🛠️ 后端_2026_04_14_0940
- **新增(backend)**: 将默认大模型提供商切换为 `deepseek`，接入官方 API 支持 `deepseek-reasoner`
- **修复(backend)**: 修复 DeepSeek 强校验工具名称导致的 `400 Bad Request`，将所有 `.` 替换为 `_`（如 `weather_current`）
- **优化(backend)**: 支持流式请求（`stream=True`）时的思维链和工具调用事件转发

### 🛠️ 后端_2026_04_14_0855
- **修复(backend)**: 修正了 `.env` 中 `MODELSCOPE_API_BASE` 的默认值为 `https://dashscope.aliyuncs.com/compatible-mode/v1`（阿里云百炼兼容端），解决由于旧版域名引发的大模型请求 `[Errno 11001] getaddrinfo failed` DNS 解析错误

### 🛠️ 后端_2026_04_14_0840
- **新增(backend)**: `.env.example` 中增加 `Qwen/Qwen3.5-0.8B` 作为默认魔塔社区测试模型
- **优化(backend)**: 优化 `openai_client.py` 逻辑，支持配置读取区分 `openai` 与 `modelscope` 并兼容解析模型返回的 `reasoning_content`
- **优化(backend)**: 优化 `executor.py` 和 `agent.py`，支持捕获多轮工具调用中的思维链并返回给前端展示

### 🛠️ 后端_2026_04_14_0831
- **修复(backend)**: 修复 `tools.py` 等文件中不符合项目 `snake_case` 命名规范的 API 路由，将 `-`（中划线）彻底替换为 `_`（下划线）
- **修复(backend)**: 修复了 `tools.py` 路由依赖注入导致 `Depends in Annotated` 的 AssertionError
- **修复(backend)**: 更新了 `README.md` 中对于服务运行 `python run.py` 的脚本路径说明

### 🛠️ 后端_2026_04_14_0812
- **新增(tools)**: 增加 `ToolsAPI` 类，实现 `md-to-pdf`、`compress-image` 和 `compress-zip` 的逻辑，并注册到 `/api/tools/` 路由
- **增强(tools)**: 工具接口实现处理结果自动上传至 S3 服务，并利用 S3 预签名机制，生成仅 5 分钟有效的访问链接返回给前端

### 🛠️ 后端_2026_04_13_2135
- **修复(auth)**: 修复 `login.py` 中由于数据库模型更新导致 `user` 实体错误调用 `t_` 前缀属性而引起的 `AttributeError` 异常

### 🛠️ 后端_2026_04_13_1955
- **新增(backend)**: 初始化后端模块的 README.md 说明文档
