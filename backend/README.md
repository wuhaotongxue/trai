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
conda create -n trai31313 python=3.13.13 -y
conda activate trai31313
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

### 🛠️ 后端_2026_05_28_1920
- **优化**: 进一步调优 `LocalImageEditClient` 推理参数, 将 `guidance_scale` 提升至 `7.5`, `true_cfg_scale` 提升至 `5.0`. 显著增强模型对 "合并" 等跨图指令的遵循能力, 并更好地保留原图特征. 
- **质量**: 强化 `negative_prompt`, 引入人体解剖、画质细节等负向提示词, 减少生成结果中的扭曲与模糊. 

### 🛠️ 后端_2026_05_28_1910

### 🛠️ 后端_2026_05_28_1855
- **加固**: 为 `LocalImageEditClient` 子进程新增 `limit=50MB` 缓冲区设置. 彻底解决因模型输出超大 Base64 字符串导致的 `Separator is not found, and chunk exceed the limit` 错误. 

### 🛠️ 后端_2026_05_28_1740
- **修复**: 解决 `LocalImageEditClient` 读取子进程 `stdout` 时因 Base64 字符串过长导致的缓冲区溢出错误 (`Separator is not found, and chunk exceed the limit`). 将 `readline()` 替换为 `read()` 以完整接收大尺寸图片数据. 

### 🛠️ 后端_2026_05_28_1730
- **重构**: 将图片编辑接口 `/ai/image/edit` 改为异步模式, 引入 `ImageTaskStore` 维护实时任务状态. 
- **增强**: 实现图片编辑任务状态查询接口 `/ai/image/status/{task_id}`, 支持前端轮询真实进度. 
- **优化**: 改进 `LocalImageEditClient` 子进程日志读取, 实现 `stderr` 实时流式输出, 解决终端日志卡顿问题. 
- **功能**: 子进程推理脚本现在支持通过 `progress_callback` 回传模型加载与推理的阶段性进度. 

### 🛠️ 后端_2026_05_28_1705
- **优化**: local_image_edit_client 引入全局 `Semaphore(1)` 强制任务排队, 彻底防止多任务并发导致的 CUDA OOM. 
- **增强**: 优化 GPU 自动切换逻辑, 优先选择显存充足 (>20GB) 的卡, 若无则选显存空闲最高的卡. 
- **加固**: 改进推理脚本加载逻辑, 引入 `low_cpu_mem_usage=True` 和 `device_map="cpu"`, 确保 50GB 模型能在 44GB GPU 上通过 Model CPU Offload 成功加载并运行. 

### 🛠️ 后端_2026_05_28_1620
- **修复**: local_image_edit_client 子进程 CUDA OOM. 针对 Qwen-Image-Edit-2511 模型 (~55GB) 显存需求超过单卡 (44GB) 的问题, 启用了 `enable_model_cpu_offload()`. 
- **优化**: local_image_edit_client 子进程新增 `CUDA_VISIBLE_DEVICES` 隔离与 `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` 显存优化. 
- **规范**: 全量清理 local_image_edit_client.py 中的中文标点, 符合 backend 开发规范. 

### 🛠️ 后端_2026_05_28_1532
- **修正(image_edit_size)**: 本地图像编辑模型执行前新增尺寸自动对齐, 会把宽高规范到最接近的 16 倍数, 避免原图尺寸如 `5972x3987` 直接触发推理报错.

### 🛠️ 2026_05_26_2230
- **深度规范治理**: 彻底修复了 [downloader.py](file:///home/qyjgylc_whf/code/trai/backend/src/api/routers/tools/downloader.py) 等 20+ 核心 Python 文件的入参返回值类型提示（Type Hints）。
- **强制 Docstring**: 补齐了所有类和函数的中文文档，详细说明了参数含义、返回值及异常情况。
- **目录结构重构**: 按领域（Domain）对后端代码进行了重组织，建立了 `api/routers/system`、`api/routers/tools` 等规范化文件夹。
- **命名规范统一**: 全面清理了不符合 snake_case 的变量和文件名，系统架构更加清晰。

### 🛠️ 后端_2026_05_28_1525
- **修正(image_edit)**: `LocalImageEditClient` 不再错误降级到文生图模型, 现在改为真正走 `Qwen-Image-Edit-2511` 本地图像编辑推理链路.
- **修正(image_edit_ui)**: `/agent` 图像编辑区按钮语义更明确, 空闲态支持一键重置, 运行态支持明确取消任务.

### 🛠️ 后端_2026_05_26_1728
- **新增(subtitle)**: video_to_audio 视频转音频接口增加 SRT 字幕提取功能, 使用本地 FunASR 模型自动生成字幕
- **修复(subtitle)**: 修复 delete_subtitle 接口中 object_prefix 未定义的问题
- **修复(subtitle)**: 修复 video_to_audio 接口中未使用变量的 lint 问题

### 🛠️ 后端_2026_05_26_1402
- **修复(audio_transcribe)**: 使用 fpdf2 库生成真正的 PDF 格式，解决 PDF 文件损坏无法打开的问题
- **修复(s3_storage)**: 修改 `get_file_url` 方法，优先使用 `S3_PRESIGNED_PUBLIC_BASE` 配置，确保返回正确的 S3 公共域名 URL

### 🛠️ 后端_2026_05_23_1024
- **重构(subtitle)**: 移除OpenAI的STT依赖，首选魔塔社区API，并支持降级至本地FunASR模型。
- **优化(s3_storage)**: 启用boto3的分片并发上传，解决大文件（视频）上传超时卡死的问题。

### 🛠️ 后端_2026_05_20_1642
- **新增**: 双图联动编辑（image_edit_dual），image.py 支持同时传入两张图片融合生成
- **新增**: local_image_edit_client 生成双图联动推理脚本（QwenImageEditPlusPipeline image=[img1,img2] 列表模式）
- **新增**: /ai/video/generate Wan2.1-T2V-1.3B 文生视频 API（S3 存储 + 域名/IP 双 URL + 飞书+企微通知）
- **新增**: local_video_client.py Wan2.1 本地视频生成客户端（推理耗时统计 + 分辨率/帧数支持）
- **新增**: delete_sessions.py 会话批量删除脚本（按标题/时间/用户等条件，支持 dry-run）
- **新增**: 数据库迁移脚本 migrate_add_image_edit_dual_fields（新增字段 source_image_url_2 等）
- **优化**: uvicorn 新增 timeout_keep_alive=300 / limit_concurrency=50 / limit_max_requests=1000
- **优化**: FastAPI startup 事件初始化数据库单例，触发自动建表
- **优化**: image.py 文生图返回 S3 object_key + public_url
- **优化**: image_edit 支持 task_id 外部传入，保持 ID 一致性

### 🛠️ 后端_2026_05_20_1644
- **修复**: local_image_edit_client 子进程 CUDA OOM（enable_model_cpu_offload 前未显式 set_device(0)，模型偷偷加载到被占用的 GPU 0）
- **修复**: local_video_client 同步保留 `torch.cuda.set_device(0)`
- **新增**: test_image_edit.py 独立测试脚本（子进程 vs 主进程双模式）
- **新增**: image_generation.py 视频生成用例（frame 生成 + 字幕烧录 + S3 上传 + 多端通知）
- **新增**: feishu_ai_notify 支持视频生成通知（卡片含 S3 视频预览）
- **优化**: image_edit/image_edit_dual 统一日志异常，video.py 进度流式推送

### 🛠️ 后端_2026_05_20_0839
- **新增**: t_image_records 表统一存储文生图/图生图/图片编辑记录，含 IP 追溯、游客标识、飞书通知状态
- **新增**: ImageRecordModel + ImageRecordRepository，支持完整 CRUD 和管理后台多条件查询
- **新增**: image_records.py 管理后台接口（列表/详情/删除/批量删除/统计）
- **新增**: image_record.py Entity + Interface（ImageRecordType/ImageRecordStatus）
- **新增**: 飞书图片编辑通知（ImageEditedEvent + S3 图片下载 + 飞书 image_key 上传）
- **新增**: notify_robot.env 新增 NOTIFY_FEISHU_IMAGE_WEBHOOK 和启用开关
- **优化**: image.py 文生图/编辑成功后自动写入数据库，后台触发飞书卡片通知

### 🛠️ 后端_2026_05_15_1703
- **新增**: infrastructure/utils/ 本地图片生成和视觉推理基础设施

### 🛠️ 后端_2026_05_15_1506
- **新增**: 登录日志管理功能（LoginLogModel、LoginLogRepository、login_logs.py）
- **新增**: 本地图片生成客户端（LocalImageClient），支持 Tongyi-MAI/Z-Image-Turbo 模型
- **优化**: session.py 支持图片消息，自动路由到本地视觉模型
- **优化**: nginx 反向代理配置更新

### 🛠️ 后端_2026_05_14_1937
- **新增**: 本地视觉模型支持，使用 Qwen2-VL-7B-Instruct 分析图片
- **新增**: vision_client.py 提供本地 GPU 视觉推理能力（懒加载 + idle 释放）
- **新增**: session.py 支持图片消息，自动路由到本地视觉模型
- **修复**: 前端图片上传 base64 格式兼容性问题

### 🛠️ 后端_2026_05_14_1634
- **重构**: 拆分 .env 为模块化目录（env/），敏感信息分离为 env_example/ 示例
- **fix**: 修正 .gitignore 规则，正确忽略 backend/env/ 敏感目录

### 🛠️ 代码质量_2026_05_08_2221
- **优化**: Ruff 格式化全部后端代码（63个文件），修复 242 个 Lint 问题，提升代码规范

### 🛠️ 规范_2026_05_06_2139
- **优化**: 后台环境统一为 trai31313 / Python 3.13.13，修改 backend/README.md、skills、rules 等所有配置文件

### 🛠️ 后端_2026_05_06_1449
- **优化**: i18n.py 和 feishu.py 完善国际化翻译和飞书通知功能

### 🛠️ 后端_2026_04_25_1721
- **fix(i18n)**: FrontendI18nInit 和 ClientI18nInit 初始化脚本修复 namespace 解析逻辑，从 key 中正确提取 namespace 存储到数据库，解决翻译不对应问题

### 🛠️ 系统更新_2026_04_24_2355
- **feat(skills)**: 优化 git_submit 技能，推送完成后自动切换回 wuhao 分支；强制要求获取当前真实时间作为时间戳

### 🛠️ 后端_2026_04_24_2215
- **fix(i18n)**: 修复前后端翻译键不匹配问题, get_translations_by_locale 直接返回 key 而非 namespace.key
- **feat(i18n)**: 新增国际化翻译管理接口 (admin/i18n) 和公开接口 (i18n/{locale})
- **feat(i18n)**: 拆分前端和客户端翻译初始化脚本, 分离 FRONTEND_TRANSLATIONS 和 CLIENT_TRANSLATIONS

### 🛠️ 后端_2026_04_24_1525
- **feat(i18n)**: 新增国际化字符串和系统配置数据库模型与仓储 (I18nRepository)
- **feat(i18n)**: 新增 Admin i18n 管理接口，支持翻译字符串的增删改查
- **feat(i18n)**: 新增公开翻译查询接口，支持 namespace 批量拉取
- **feat(notify)**: 新增飞书 AI 事件通知服务，支持文生图和 AI 对话富文本卡片
- **feat(image)**: 新增图片生成配置接口和客户端工厂，统一管理多模型
- **feat(system)**: 新增系统配置和 Schema 文档管理接口

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

## 📝 更新日志 (Changelog)

### 🛠️ 后端_2026_05_28_1605
- **修复(migration_env)**: `migrate_add_media_history_tables.py` 现已自动加载 `backend/env/*.env`, 并同时兼容 `POSTGRES_*` 与 `DB_*` 数据库配置变量, 避免再次因为脚本漏读环境导致手工补表.

### 🛠️ 后端_2026_05_28_1435
- **优化(audit)**: 新增 `agent_audit_log_service.py`, 为媒体历史、音乐生成、视频生成和图片通知链路统一写入 `t_audit_logs`, 支持 `info/warning/error` 分级。
- **优化(media_history)**: `/ai/media/history/list` 新增 `include_deleted` 参数并返回 `deleted_at`, 软删除记录可继续用于后台排查和审计。
- **优化(notify)**: `git_push_notify.py` 与 `media_notify.py` 新增 `河南地理专家` persona, 可按河南地理风格发送企微和飞书通知。
- **规范(models)**: 为 `MusicRecordModel` 和 `VideoRecordModel` 补齐字段级注释, 对齐数据库模型注释规范。

### 🛠️ 后端_2026_05_28_1415
- **新增(media_history)**: 新增 `/ai/media/history/list`、`/ai/media/history/delete`、`/ai/media/history/batch_delete` 接口, 统一返回图片、音乐、视频历史并支持用户侧删除。
- **新增(migration)**: 补充 `migrate_add_media_history_tables.py`, 用于创建 `t_music_records` 与 `t_video_records`, 让音乐和视频历史真正落库可恢复。
- **修复(image)**: 修复 `image_to_image` 链路没有沿用同一 `task_id` 写入记录的问题, 避免历史查询、删除与结果回填错位。

### 🛠️ 后端_2026_05_28_1352
- **功能(视频进度)**: 为 `/ai/video/generate` 和新增的 `/ai/video/status/{task_id}` 接口增加任务状态存储, 支持返回 `stage`、`progress_message`、`current_step`、`total_steps`、`queue_position` 等实时进度字段。
- **优化(video)**: 将本地视频生成链路调整为后台异步任务模式, 前端可轮询看到 `加载模型`、`推理中`、`上传 S3`、`发送通知` 等完整阶段, 不再只能看到长时间无反馈的等待状态。

### 🛠️ 后端_2026_05_28_1202
- **修复(视频生成)**: 修复 `/ai/video/generate` 只返回 `queued` 而不执行真实任务的问题, 接入 `LocalVideoClient` 本地视频生成链路, 生成完成后立即上传 S3 并直接返回 `video_url/public_url` 给前端 `/agent` 页面使用。
- **测试(video)**: 已通过 mock 本地视频生成与 S3 上传流程完成接口验证, 确认接口会直接返回 `completed` 状态与视频地址。

### 🛠️ 后端_2026_05_28_1130
- **修复(音乐生成)**: 将生成的音乐访问链接由直接返回 S3 静态路径改为走 `/api_trai/v1/ai/music/download?filename=...` 后端代理下载，完美绕过外部 Nginx 代理对于 `.wav` 等媒体文件的拦截，彻底解决了外网企业微信打不开生成音频的问题。
- **功能(媒体推送)**: 为飞书和企业微信的推送通知接入了 DeepSeek 大模型动态文案生成。现在起，“地理专家”口吻会随机选取不同的欧洲国家及其地貌特征进行生动形象的比喻，告别了千篇一律的“拿骚”文案。

### 🛠️ 后端_2026_05_28_1120
- **修复(图像编辑)**: 修复 `LocalImageEditClient` 缺少 `edit` 方法导致的 502 Bad Gateway 问题，添加了对降级文本生成的保护性回退，确保流程闭环。
- **修复(音乐生成)**: 修复生成的音频文件仅返回本地文件系统路径的问题，已支持异步上传到 S3 并返回标准外网可访问链接。
- **功能(通知推送)**: 为所有图像生成和图像编辑操作打通了 `media_notifier.notify()` 统一推送，彻底解决了图片结果无法推送到飞书与企业微信的问题。

### 🛠️ 后端_2026_05_28_1040
- **修复(音乐生成)**: 修复 ACE-Step 音乐模型无法纯本地断网加载导致的 HuggingFace 连接超时问题，强制使用 ModelScope 本地离线权重缓存。
- **优化(日志)**: 移除了 `ace_step_music_runner.py` 中的 `print` 语句，统一收口至 `loguru`，遵循规范。
- **重构(通知推送)**: 重构了 `git_push_notify.py`，加入 argparse 支持通过命令行动态切换不同的通报角色口吻 ("地理专家" vs "小甜心")，并通过分离方法提升代码结构。
