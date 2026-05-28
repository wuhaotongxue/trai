# trai

简体中文说明文档

## 环境

- **Python 环境**: trai31313 (Conda) / Python 3.13.13

### Conda 环境配置指南

```bash
# 1. 创建 conda 环境
conda create -n trai31313 python=3.13.13 -y

# 2. 激活环境
conda activate trai31313

# 3. 永久激活（推荐）
# 永久设置默认进入 trai 环境
# Windows PowerShell:
# Add-Content -Path $PROFILE -Value "conda activate trai31313"
# CMD:
# reg add "HKCU\Software\Microsoft\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "conda activate trai31313" /f

# 4. 安装后端依赖
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .
```

## 快速开始

```bash
git clone https://github.com/wuhaotongxue/trai.git
cd trai
```

## 相关链接

- GitHub: https://github.com/wuhaotongxue/trai
- Gitee: https://gitee.com/no5689/trai
- 谷歌邮箱, 问题: wuhaotongxue@gmail.com

## 问题

提交 Issue / PR?

## 🏗️ 整体架构 (Architecture)

本项目采用全栈微服务架构，基于 Domain-Driven Design (DDD) 设计理念，包含以下核心模块与五层架构：

### 五层架构 (Backend)
1. **Domain (领域层)**：纯 Python 实体和接口定义，如 `interfaces.py`、`entities.py`，绝对禁止引入第三方框架。
2. **Application (应用层)**：用例编排、Service 层（如 `api_key_service.py`），负责业务流程与大屏数据聚合。
3. **Infrastructure (基础设施层)**：数据库 ORM (`database/`)、AI 客户端 (`ai/`)、S3 存储 (`storage/`)、日志拦截 (`logging/`)。
4. **API (接口层)**：FastAPI 路由组 (`routers/`)，负责 HTTP 协议转换与 Pydantic 校验。
5. **Scripts (运维脚本)**：数据修复、本地测试等。

### 客户端结构 (Electron)
采用 `UI -> Preload (Controller) -> Main (Service) -> Platform` 结构。
- 引入了 Framer Motion 与 Tailwind 进行全局玻璃拟态动画。
- 内置插件市场 (`PluginMarketplace`) 与 Dify 风格拖拽工作流画布 (`WorkflowEditor`)。
- 支持企业微信 OAuth 登录与本地离线角色降级策略。

### 前端结构 (Next.js)
基于 App Router 的 React 19 服务端组件体系，提供管理后台 (Admin) 功能。

### 部署体系
统一由根目录的 `docker-compose.yml` 驱动，一键编排 `FastAPI` + `Next.js` + `Postgres` + `Redis` + `Milvus` + `MinIO`。

## 📝 更新日志 (Changelog)

### 🧩 前端_2026_05_28_1800
- **修复(undefined_error)**: 修复 `chat_panel.tsx` 中 `editingImagePreview` 和 `editPrompt` 未定义导致的渲染崩溃问题.
- **重构(state_cleanup)**: 从 `agent.store.ts` 中彻底移除已弃用的 legacy 变量 (`editingImagePreview`, `editPrompt`), 统一使用 `editingSourceImage` 和 `imageEditPrompt`.
- **规范(punctuation)**: 全量修复 `chat_panel.tsx`, `agent.store.ts` 和 `subtitle_panel.tsx` 中的中文全角标点, 确保 100% 符合前端代码审查规范.
- **修复(import)**: 修复 `subtitle_panel.tsx` 缺少 `AnimatePresence` 导入导致的类型检查失败.

### 🧩 前后端_2026_05_28_1730
- **后端 (图片编辑实时进度)**: 将图片编辑接口 `/ai/image/edit` 重构为后台异步执行模式, 并新增 `/ai/image/status/{task_id}` 接口. 改进了 `LocalImageEditClient` 子进程日志读取, 允许通过回调实时上报推理进度.
- **前端 (编辑进度轮询)**: 前端 Agent Store 的 `editImage` 方法接入真实轮询, 根据后端返回的 `progress` 与 `progress_message` 动态更新 UI. 解决了用户点击"编辑"后一直卡在"分析原图"阶段毫无真实进展的问题.

### 🧩 前后端_2026_05_28_1605
- **优化(image_edit_progress)**: `/agent` 图像编辑区新增与图片生成一致的进度条、阶段文案和取消后的状态收口, 编辑期间可以持续感知任务仍在处理中.
- **修复(migration_env)**: `migrate_add_media_history_tables.py` 现已优先读取 `backend/env/*.env`, 同时兼容 `POSTGRES_*` 与 `DB_*` 数据库变量, 避免后续再手工补媒体历史表.

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

### 🛠️ Agent_全功能重构与测试_2026_05_28
- **前端**: 完成了"新粗野主义"风格对 Agent 智能体(音乐/图片/视频)页面的历史画廊渲染。
- **后端**: 重构大模型异步执行任务队列与状态轮询 API，解决 500 死锁超时问题。
- **测试**: 全面通过了包含文本、视频、图片、数字人、字幕处理等 8 大核心路由的交互与渲染测试。


### 🎨 前端_2026_05_27_1155
- **重构(UI)**: 修复 Dark Mode 适配问题，重构官网 Features 页面以适配新粗野主义，并增加 Framer Motion 的 Reveal 视差动画。
- **优化(Panel)**: 将字幕面板重构为平行双屏结构，增加文件上传进度的动态进度条与加载状态反馈动画，彻底解决大面积突兀的黄色背景问题。

### 🎨 前端_2026_05_27_1033
- **重构(UI)**: 将所有主要前端页面（Homepage, Navbar, Footer, Login, Register, Agent Panels, Sidebar）重构为统一的 Neo-Brutalism（新粗野主义）设计风格，并增加完善的中文空白页填充（Empty States）。

### ✨ 后端重构与规范闭环_2026_05_26_2240
- **架构升级**: 按照领域驱动设计（DDD）重构了后端目录结构，新增了 `api/routers/system`、`api/routers/tools` 等分类文件夹。
- **类型提示补完**: 全面修复了所有核心函数的 `入参` 和 `返回值` 类型提示，确保 100% 符合 Python 3.13 规范。
- **文档全覆盖**: 强制要求并完成了 20+ 核心 Python 文件的中文 Docstring 补全，详细标注了每一个参数的业务含义。
- **命名治理**: 统一了全系统的命名规范，移除了所有 CamelCase 变量名，确保符合 snake_case 约定。
- **严重事故(security)**: 发现 [backend/env](file:///home/qyjgylc_whf/code/trai/backend/env) 敏感配置目录被误提交至公有仓库（Gitee/GitHub）
- **错误操作(destruction)**: Agent 在尝试修复泄露时，错误使用了 `rm -rf` 指令，导致用户本地未追踪的配置文件丢失
- **修复措施(fix)**:
  - 紧急执行 `git rm -r --cached backend/env` 从 Git 索引中移除敏感目录，保留本地文件
  - 通过 Git 历史对象成功恢复了本地丢失的所有 36 个配置文件
  - 更新 [.gitignore](file:///home/qyjgylc_whf/code/trai/.gitignore) 确保 `backend/env/` 被严格忽略
  - 更新 [.trae/rules/project/SKILL.md](file:///home/qyjgylc_whf/code/trai/.trae/rules/project/SKILL.md) 增加 Section 12「自纠错与安全加固机制」，永久禁止此类破坏性操作

### 🛠️ 后端_2026_05_26_1728
- **新增(subtitle)**: video_to_audio 视频转音频接口增加 SRT 字幕提取功能, 使用本地 FunASR 模型自动生成字幕
- **修复(subtitle)**: 修复 delete_subtitle 接口中 object_prefix 未定义的问题

### 🛠️ 后端_2026_05_28_1202
- **修复(video)**: 修复 `/ai/video/generate` 接口只返回 `queued` 而不执行真实任务的问题, 接入本地 `LocalVideoClient` 视频生成链路, 生成成功后直接上传 S3 并返回 `video_url/public_url`, 让 `/agent` 页面无需轮询即可直接展示视频结果。
- **测试(video)**: 已通过 mock 视频生成与 S3 上传流程完成接口验证, 确认接口返回 `completed` 状态。

### 🧩 前后端_2026_05_28_1532
- **修正(image_edit_size)**: 本地图像编辑链路新增宽高自动对齐逻辑, 会把输入尺寸规范到最接近的 16 倍数, 避免 `Height must be divisible by 16` 这类 502 错误.

### 🎨 前后端_2026_05_28_1525
- **修正(image_edit)**: 图像编辑区补强取消/重置交互, 同时后端去掉错误的文生图降级桩, 改为真正走本地图像编辑模型 `Qwen-Image-Edit-2511` 推理链路。

### 🎨 前端_2026_05_28_1512
- **优化(agent_detail)**: 统一 `/agent` 主要子面板的空态文案、英文副标题、分页标题和微动画节奏, 进一步减少面板之间的语气与留白割裂感。

### 🎨 前端_2026_05_28_1505
- **优化(agent_ui)**: 继续统一数字人面板、旧版右侧画廊容器、图片视频画廊和音乐廊的标题条、分页、卡片边框与操作按钮风格, `/agent` 剩余子面板基本收成同一套视觉系统。

### 🎨 前端_2026_05_28_1450
- **优化(agent_ui)**: 继续统一 `/agent` 内下载器、字幕面板、右侧历史栏和音乐结果区的边框、标题条、按钮与状态动画风格, 让不同工具看起来像同一套系统。

### 🛠️ 后端_2026_05_28_1435
- **优化(audit)**: Agent 媒体历史、音乐生成、视频生成与图片通知链路新增数据库审计日志写入, 可按 `info/warning/error` 和动作类型区分查看。
- **优化(media_history)**: 媒体历史查询新增 `include_deleted` 能力, 软删除记录仍可在后台查询, 同时保留 `deleted_at/deleted_by/deleted_ip` 追踪信息。
- **优化(notify)**: Git 推送通知与媒体通知新增 `河南地理专家` persona, 后续推送可直接按河南地理风格发送到企微和飞书。

### 🎨 前端_2026_05_28_1435
- **修正(agent)**: `/agent` 的账号密码入口已移动到左侧栏左下方, 不再悬浮在主画布里, 整体布局更统一。
- **优化(agent_ui)**: 侧栏与认证入口的边框、底色和强调色进一步统一, 降低同页不同面板的割裂感。

### 🛠️ 后端_2026_05_28_1415
- **新增(media_history)**: 为图片、音乐、视频统一补齐媒体历史查询、单删、批量删除能力, 并新增音乐/视频历史表迁移脚本, 刷新后可从数据库恢复画廊记录。
- **修复(image)**: 修复 `image_to_image` 分支历史记录 `task_id` 可能不一致的问题, 避免前端删除历史或刷新恢复时出现记录错位。

### 🎨 前端_2026_05_28_1415
- **优化(agent)**: `/agent` 页面已移除顶部官网导航, 登录/注册入口改到左下角, 主工作区可视面积更大。
- **新增(gallery)**: 图片廊、视频廊、音乐廊统一支持复制链接、单条删除、多选批量删除和更强的右侧加载动画反馈。

### 🛠️ 后端_2026_05_28_1352
- **功能(video)**: 视频生成接口新增任务进度状态存储与 `/ai/video/status/{task_id}` 查询能力, 可返回阶段、步骤、排队位置、耗时等实时字段。

### 🎨 前端_2026_05_28_1352
- **新增(video)**: `/agent` 视频生成面板接入轮询进度展示, 现在可实时看到 `排队中`、`加载模型`、`推理中`、`上传到 S3`、`发送通知` 等阶段, 同时展示帧数、分辨率和耗时。

### 🎨 前端_2026_05_26_1728
- **新增(subtitle)**: 视频转音频任务增加提取字幕 (SRT) 下载按钮

### 🛠️ 后端_2026_05_26_1402
- **修复(audio_transcribe)**: 使用 fpdf2 库生成真正的 PDF 格式，解决 PDF 文件损坏无法打开的问题
- **修复(s3_storage)**: 修改 `get_file_url` 方法，优先使用 `S3_PRESIGNED_PUBLIC_BASE` 配置，确保返回正确的 S3 公共域名 URL

### 🛠️ 全栈架构与客户端升级_2026_05_24_1356
- **架构升级**：在项目根目录新增统一的 `docker-compose.yml`，支持一键拉起后端 API、Next.js 前端、PostgreSQL、Redis、Milvus、MinIO 等全量服务。
- **配置优化**：确认并优化 `backend/env/` 下所有零散 `.env` 配置文件的自动化装载链路。
- **客户端能力**：在 Electron 客户端中增加了基于类似 Dify 体验的拖拽式“工作流编排画布”骨架，支持大模型、知识检索与代码执行节点的拖拽编排。
- **后台接口补齐**：补齐并巩固了针对企业微信用户创建自定义智能体和知识库的隔离溯源能力，确保调用和记录均可追溯。

### 📚 规范(skills)_2026_05_23_1651
- **新增(project)**: 增设「文档保护红线」，强制要求在任何清理操作中绝对禁止删除 `.md` 文件夹和 `README.md` 等核心说明文档。
- **新增(project)**: 增设「Agent 行为规范与 Skills 强制检查」，要求在操作前强制查阅技能上下文，并规范化错误日志格式及图片附件的归档与重命名。
- **优化(repo)**: 全面清理项目根目录散落的历史遗留测试图片、临时输出结果以及无用测试脚本（如 `test_image.png`, `ascii.py` 等）。
- **优化(error_logs)**: 合并、重构 `md/error_logs/2026_W22` 目录下的复盘日志，确保格式与同级历史文档严格对齐。

### 🛠️ 后端_2026_05_23_1024
- **重构(subtitle)**: 移除OpenAI的STT依赖，首选魔塔社区API，并支持降级至本地FunASR模型。
- **优化(s3_storage)**: 启用boto3的分片并发上传，解决大文件（视频）上传超时卡死的问题。

### 🎨 前端_2026_05_23_1024
- **重构(ui)**: 影音工作室重构为三段式布局（左侧表单、中间大屏预览、右侧可折叠画廊）。
- **新增(gallery)**: 影音长廊支持按页展示（每页10条）。
- **优化(upload)**: 多模态上传组件支持视频文件格式(.mp4, .mov, .webm)。

### 🛠️ 功能（技能）_2026_05_21_0821
- **新增（技能）**: local_image_edit_client 子进程 stderr drain 修复（proc.poll 后加最终 os.read）
- **新增（技能）**: 修脚本模板中 {{torch.cuda.device_count()}} 双括号字面量问题
- **新增（技能）**: 修 seed=None 时脚本内 str(seed) 报 NameError，改为 _seed 本地变量
- **新增（技能）**: 修脚本缺少 try/except 兜底，静默 crash 问题
- **新增（技能）**: 修 proc.poll() 返回 None 被误处理为 0 的问题
- **新增（技能）**: 修 QwenImageEditPlusPipeline 不支持 progress_callback 参数
- **优化（前端）**: 改 h-screen 为 min-h-screen 适配浏览器缩放，侧边栏/主内容区加 min-h-0
- **优化（前端）**: 新增 viewport.tsx 确保浏览器正确缩放，加 -webkit-text-size-adjust 兜底
- **优化（项目）**: .gitignore 新增大模型文件过滤（*.safetensors / backend/models/ / src/models/）

### 🛠️ 后端_2026_05_20_1644
- **修复**: local_image_edit_client 子进程推理 post-processing 阶段 CUDA OOM（enable_model_cpu_offload 未显式 set_device，模型偷偷加载到 GPU 0 而非目标卡）
- **修复**: local_video_client 复制模式同步保留 `torch.cuda.set_device(0)`
- **新增**: test_image_edit.py 独立测试脚本（子进程推理 vs 主进程直接推理双模式）
- **新增**: image_generation.py 视频生成用例（frame 生成 + 字幕烧录 + S3 上传 + 多端通知）
- **新增**: feishu_ai_notify 支持视频生成飞书通知（卡片含 S3 视频预览）
- **优化**: image_edit/image_edit_dual 统一日志和异常处理，video.py 生成进度流式推送

### 🛠️ 前端_2026_05_20_1642
- **界面（前端）**: 图片编辑模式支持双图联动，上传两张图片融合生成新图
- **界面（前端）**: 编辑表单改为左右分栏，右侧原图+结果对比展示
- **界面（前端）**: 新增双图快捷指令（合成/拼接/风格迁移/全景合成）
- **新增（前端）**: ToastItem 接口导出，chat_panel.tsx 依赖此类型
- **优化（前端）**: agent.store editImage 支持 sourceImage2 参数，压缩后发送到后端
- **优化（前端）**: agent.store generateVideo 参数对齐后端（frames 替代 duration）
- **优化（前端）**: api_client generateVideo 路由改为 /ai/video/generate

### 🛠️ 后端_2026_05_20_1642
- **新增（后端）**: 双图联动编辑（image_edit_dual），支持同时传入两张图片融合生成
- **新增（后端）**: local_image_edit_client 生成双图联动推理脚本（QwenImageEditPlusPipeline image 列表模式）
- **新增（后端）**: /ai/video/generate Wan2.1-T2V-1.3B 文生视频 API（S3 存储 + 域名/IP 双 URL + 飞书+企微通知）
- **新增（后端）**: local_video_client.py Wan2.1 本地视频生成客户端（推理耗时统计 + 分辨率/帧数支持）
- **新增（后端）**: delete_sessions.py 会话批量删除脚本（按标题/时间/用户等条件）
- **新增（后端）**: 数据库迁移脚本 migrate_add_image_edit_dual_fields（新增字段 source_image_url_2 等）
- **优化（后端）**: uvicorn 新增 timeout_keep_alive=300 / limit_concurrency=50 / limit_max_requests=1000
- **优化（后端）**: FastAPI startup 事件初始化数据库单例，触发自动建表

### 🛠️ 前端_2026_05_20_0857
- **界面（前端）**: 绘图/图片编辑模式改为左右分栏布局，表单靠左，结果图显示在右侧面板
- **界面（前端）**: 右侧图片廊合并显示当前生成结果（generatedImageUrl + editedImageUrl）和历史记录
- **界面（前端）**: 会话列表标题改为显示第一条用户消息，过长省略+悬停预览
- **优化（前端）**: editImage 成功后自动添加到图片廊

### 🛠️ 后端_2026_05_20_0839
- **新增（后端）**: t_image_records 表统一存储文生图/图生图/图片编辑记录，含 IP 追溯、游客标识、飞书通知状态
- **新增（后端）**: ImageRecordModel + ImageRecordRepository + image_records.py 管理后台接口（列表/详情/删除/批量删除/统计）
- **新增（后端）**: 飞书图片编辑通知（ImageEditedEvent + S3 下载 + 飞书 image_key 上传，图片直接在卡片内预览）
- **新增（后端）**: notify_robot.env 新增 NOTIFY_FEISHU_IMAGE_WEBHOOK 和启用开关
- **优化（后端）**: image.py 文生图/编辑成功后自动写入数据库，后台触发飞书卡片通知

### 🛠️ 后端_2026_05_15_1703
- **新增（文档）**: 新增第10期总结文档（md/issue_10/index.md）
- **新增（后端）**: infrastructure/utils/ 本地图片生成和视觉推理基础设施
- **新增（前端）**: 登录日志管理页面（/admin/login_logs）

### 🛠️ 后端_2026_05_15_1506
- **新增（后端）**: 登录日志管理功能（LoginLogModel、LoginLogRepository、login_logs.py）
- **新增（后端）**: 本地图片生成客户端（LocalImageClient），支持 Tongyi-MAI/Z-Image-Turbo 模型
- **优化（后端）**: session.py 支持图片消息，自动路由到本地视觉模型
- **优化（前端）**: ChatPanel 和 Navbar 组件优化，增强用户体验
- **配置**: nginx 反向代理配置更新

### 🛠️ 后端_2026_05_14_1937
- **新增**: 本地视觉模型支持，使用 Qwen2-VL-7B-Instruct 分析图片
- **新增**: vision_client.py 提供本地 GPU 视觉推理能力（懒加载 + idle 释放）
- **新增**: session.py 支持图片消息，自动路由到本地视觉模型
- **修复**: 前端图片上传 base64 格式兼容性问题

### 🛠️ 后端_2026_05_14_1634
- **重构**: 拆分 .env 为模块化目录（env/），敏感信息分离为 env_example/ 示例
- **fix**: 修正 .gitignore 规则，正确忽略 backend/env/ 敏感目录

### 🛠️ 前端_2026_05_14_1630
- **修复（前端）**: 修复消息列表自动滚动问题，确保新消息显示在底部
- **修复（前端）**: 修复打字机效果，确保逐字显示 AI 回复
- **修复（前端）**: 添加右侧滚动条，消息列表支持滚动
- **新增（前端）**: 思考过程显示功能，支持折叠/展开
- **修复（后端）**: 添加 reasoning 事件转发，支持 DeepSeek 思考过程 API
- **优化（前端）**: ScrollArea 组件支持 ref 传递
- **优化（配置）**: 更新 Redis 连接配置，设置正确密码

### 🛠️ 前端_2026_05_13_1926
- **新增（前端）**: 新增独立备份页面，支持多 Docker 卷和多数据库备份配置
- **优化（前端）**: 备份页面路径改为可编辑，从系统设置中移除

### 🛠️ 代码质量_2026_05_08_2221
- **优化（后端）**: Ruff 格式化全部后端代码（63个文件），修复 242 个 Lint 问题
- **优化（前端）**: 更新 package-lock.json 和国际化翻译文件

### 🛠️ 客户端_2026_05_07_0921
- **修复（客户端）**: 侧边栏退出登录后重新自动登录的循环问题
- **新增（客户端）**: 离线模式下点击登录按钮直接进入离线模式（不校验密码）
- **新增（客户端）**: 标题栏添加离线模式指示器（橙色标签）
- **优化（客户端）**: git_submit/notify_push 技能文档完善

### 🛠️ 更新_2026_05_06_2139
- **优化（项目）**: 后台环境统一为 trai31313 / Python 3.13.13，修改 README、skills、rules 等所有配置文件

### 🛠️ 技能_2026_05_06_1510
- **优化（技能）**: git_submit/SKILL.md 添加通知配置说明（企微/飞书 webhook 环境变量）
- **优化（技能）**: 搜索 .env 大文件禁止只用 Grep，必须用 Shell + Select-String 交叉验证
- **新增（文档）**: 错误日志记录 Grep 工具搜索 .env 大文件失败的错误
- **优化（文档）**: W17 错误日志补充 8 个遗漏错误，共 10 个错误完整归档

### 🛠️ 客户端_2026_05_06_1449
- **新增（客户端）**: 客户端添加离线模式，无法连接后台时自动使用默认角色登录
- **新增（客户端）**: 新增默认离线角色，无需后台即可打开客户端使用

### 🛠️ 同步_2026_05_05_1222
- **同步（仓库）**: 从 GitHub 同步最新代码，添加 github 远程仓库源
- **新增（技能）**: project/SKILL.md 新增对话风格规范，支持 10+ 角色自动切换（地理专家、小泪包、御姐、审查官等）
- **新增（后端）**: 多模态 Agent 路由、会话管理、WebSocket 支持
- **新增（后端）**: Docker 部署配置（Dockerfile、docker-compose.yml）
- **新增（后端）**: 监控模块、日志系统、中间件、性能索引脚本
- **新增（后端）**: 异步批处理器、聊天历史服务、查询缓存服务
- **新增（前端）**: Electron 集成、多模态上传组件、虚拟列表
- **新增（前端）**: 移动端组件、Memo 组件、WebSocket 状态显示
- **优化（前端）**: 国际化翻译文件完善（admin/client/public）
- **修复（冲突）**: 解决 16 个文件的合并冲突，保留本地版本

### 🛠️ 功能_2026_04_30_1127
- **新增（后端）**: t_agent_roles 表存储 AI 角色，支持角色名称、评论、关键词、风格类型管理
- **新增（后端）**: agent_role.py CRUD API，支持增删改查操作
- **新增（后端）**: release_client.py 从数据库读取角色评论，支持动态配置
- **新增（后端）**: init_agent_roles.py 初始化脚本，预置 9 个默认角色
- **新增（前端）**: /admin/agent_roles 管理页面，支持角色增删改查和启用/禁用
- **新增（技能）**: release_notify/SKILL.md 客户端发布通知规范
- **新增（前端）**: 客户端发布页添加 AI 角色选择下拉框，发布时可选择角色发送通知
- **新增（前端/后端）**: 客户端发布页支持选择企微通知群（wuhao/wudu），可同时推送到多个群

### 🛠️ 技能_2026_04_26_2242
- **优化（技能）**: git_submit/SKILL.md 更新企业微信通知格式，使用正确变量名 `$env:WECOM_CHAT_WEBHOOK_URL`
- **优化（技能）**: git_submit/SKILL.md 更新飞书和企业微信通知格式，commit 信息跟在推送人后面，增加时间戳
- **优化（技能）**: git_submit/SKILL.md 通知失败不中断流程，仅打印警告日志

### 🛠️ 技能_2026_04_26_2222
- **新增（对话）**: 新增爆炸分身角色，躺平逃班型风格，附带中国34省市隐藏玩法与世界小众秘境地理知识库
- **优化（对话）**: 每个角色增加周一到周日不同状态的差异化表达
- **优化（对话）**: 角色「爆炸吧」更名为「爆炸分身」，四个字更易区分
- **新增（对话）**: 新增 agent_startup.mdc 角色启动规范文件

### 🛠️ 技能_2026_04_26_2138
- **新增（对话）**: 新增地理专家角色风格，附带完整地理知识库
- **优化（对话）**: 添加角色风格一致性规则，禁止风格混用
- **修复（对话）**: git_submit/skills 变更时自动标注角色代号

### 🛠️ 技能_2026_04_26_2133
- **功能（前端）**: 重构国际化架构，api_client 重命名为 api_client.ts，统一导入路径
- **新增（前端）**: 所有管理后台页面支持中英文切换
- **优化（前端）**: 重构 admin_i18n_context 和 i18n_context 上下文

### 🛠️ 更新_2026_04_26_1955
- **功能（后端）**: 集成企业微信和飞书通知，联系表单提交后自动发送通知
- **功能（后端）**: 添加 IP 地址和地理位置信息到通知中
- **功能（后端）**: 优化邮件通知格式，使用【】格式显示字段
- **修复（后端）**: 修复企业微信通知 JSON 格式问题
- **修复（后端）**: 修复飞书通知内容显示问题

### 🛠️ 更新_2026_04_26_1635
- **修复（客户端）**: 修复 Electron 国际化 TypeScript 重复键名和 Locale 类型未导入问题
- **优化（客户端）**: 知识库页面添加调试日志，优化 API 响应数据解析逻辑
- **修复（前端）**: 修复 changelog 页面 JSX 语法错误和 i18n 文件重复键名问题

### 更新_2026_04_26_1512
- **新增（客户端）**: Electron 客户端国际化支持，新增 zh.ts 和 en.ts 本地翻译模块
- **修复（客户端）**: 修复 i18n 翻译文件中 console.info 在变量定义前导致的 ReferenceError 问题

### 更新_2026_04_26_1421
- **新增（前端）**: FloatingWidget 悬浮 AI 助手组件，支持最小化/最大化/新窗口打开
- **优化（前端）**: 优化 admin/analytics 和 admin/database 页面布局
- **新增（前端）**: 补充 admin/en.ts 和 admin/zh.ts 翻译文件

### 更新_2026_04_25_2247
- **界面（前端）**: 为 admin/ai、admin/quotas、admin/users/new 页面补充完整的中英文翻译 keys，修复页面内硬编码文本

### 更新_2026_04_25_1737
- **修复（前端）**: 确认翻译脚本 init_i18n_frontend.py 包含所有 key（admin.dashboard.greeting.afternoon、admin.dashboard.admin 等），数据库已同步 564 条翻译记录
- **优化（项目）**: 优化后台启动脚本 start_backend.py，添加实时日志输出到终端和日志文件，便于排查卡住问题

### 更新_2026_04_25_1717
- **修复（前端）**: 修复管理后台中英文切换无效问题，admin_i18n_context.tsx 中 loadNamespace 存储 key 格式从 `key` 改为 `namespace.key` 与 translate 调用格式对齐

### 更新_2026_04_25_1721
- **修复（前端）**: 修复 admin_i18n_context.tsx 中 loadNamespace 存储 key 格式从 key 改为 namespace.key，与 translate 调用格式对齐
- **修复（后端）**: FrontendI18nInit 和 ClientI18nInit 初始化脚本修复 namespace 解析逻辑，从 key 中正确提取 namespace 存储到数据库，解决中英文翻译不对应的问题
- **修复（前端）**: 为所有管理后台页面添加 loadNamespace('admin') 调用，确保每个页面都能正确加载翻译数据

### 更新_2026_04_25_0409
- **docs(git_submit)**: 新增编码检查规范，提交前必须检查文件是否乱码
- **docs(skills)**: 增强命名规范禁止单字母变量名和命名冲突
- **文档（技能）**: 更新命名规范，禁止使用单字母变量 t，必须使用 translate
- **修复（前端）**: 修复 t() 函数参数不匹配和 testimonials 属性缺失；文档（Electron）新增编译打包流程规范
- **文档（项目）**: 记录退出登录报错和翻译文件移除的错误日志
- **修复（客户端）**: 退出登录报错并移除本地翻译文件，全部从后端 API 获取

### 更新_2026_04_25_0350
- **docs(skills)**: 增强 naming_convention/frontend_next/backend 模块命名规范
- **docs(skills)**: 增强命名规范 e/t/i 模块对应 `event`/`translate`/`index` 缩写
- **docs(skills)**: 增强命名规范 `now`/`Date`/`time` 等禁止使用必须用全名
- **docs(skills)**: 增强 replace_all 替换范围限制 `talk` -> `transformalk` 命名规范

### 更新_2026_04_25_0312
- **fix(logout)**: 修复退出登录 TypeError 报错添加 try-catch 捕获
- **fix(i18n)**: 修复简体中文说明文档 API 无法获取翻译问题

### 更新_2026_04_25_0140
- **优化（Electron）**: 优化简体中文说明文档 `--ui_bg`/`--ui_panel_alt` 命令行参数说明
- **优化（项目）**: 优化错误日志 `md/error_logs/` 目录增加 Agent 错误分析
- **优化（项目）**: 优化 git_submit 提交规范 20 秒内最多 20 条 commit 限制 7 条新提交
- **优化（项目）**: 优化错误日志模块文档格式

### 更新_2026_04_24_2355
### 更新_2026_04_24_2355
- **feat(skills)**: 新增 git_submit 规范文档简体中文说明文档新增 wuhao 分支自动推送说明

### 更新_2026_04_24_2356
- **fix(login)**: 修复简体中文说明文档 app.tsx 配置问题修正路由 router/index.tsx
- **fix(auth)**: 修复简体中文说明文档 token 过期问题修正过期后显示"请登录"提示
- **fix(logout)**: 修复简体中文说明文档退出登录流程

### 更新_2026_04_24_2215
- **fix(i18n)**: 修复简体中文说明文档翻译回退问题 get_translations_by_locale 返回值修正为 key 对应 namespace.key
- **feat(i18n)**: 新增简体中文说明文档翻译回退机制中文翻译缺失自动回退英文翻译

### 更新_2026_04_24_2215
- **fix(i18n)**: 修复 admin_i18n_context 缺少 item.key 属性问题修正 API 响应解析

### 更新_2026_04_24_2127
- **fix(i18n)**: 修复 axios 拦截器添加 API 请求/响应日志
- **fix(css)**: 修复 `animate-spin` 类名改为 `anim_spin` snake_case 命名规范
- **fix(i18n)**: 修复 `current_locale_store` 变量名改为 `use_locale`

### 更新_2026_04_24_0100
- **feat(login)**: 新增简体中文说明文档简体中文说明文档登录页增强功能+简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档/focus 焦点处理

### 更新_2026_04_24_0040
- **feat(login)**: 新增简体中文说明文档简体中文说明文档登录页样式增强6简体中文说明文档+简体中文说明文档+简体中文说明文档+hover简体中文说明文档

### 更新_2026_04_24_0020
- **feat(chat)**: 新增简体中文说明文档简体中文说明文档聊天输入框简体中文说明文档简体中文说明文档
- **feat(chat)**: 新增简体中文说明文档简体中文说明文档功能增强简体中文说明文档简体中文说明文档+简体中文说明文档
- **feat(register)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **feat(ThreePanelLayout)**: 简体中文说明文档简体中文说明文档简体中文说明文档 cubic-bezier 简体中文说明文档 hover 简体中文说明文档

### 更新_2026_04_24_0010
- **perf(sidebar)**: 简体中文说明文档简体中文说明文档
- **perf(title_bar)**: 简体中文说明文档简体中文说明文档简体中文说明文档
- **perf(app)**: 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_23_2355
- **refactor(chat)**: 重构 AgentChat 页面简体中文说明文档 1362 行精简为 5 个子组件修复 JSX 嵌套错误
- **feat(i18n)**: 新增 i18n.ts 简体中文说明文档 dashboard/feedback/media 模块翻译
- **feat(animation)**: 新增 global.css 简体中文说明文档 Google Material Design 简体中文说明文档
- **feat(login)**: 新增 login/register 简体中文说明文档简体中文说明文档
- **fix(media)**: 修复 media/processor.tsx 简体中文说明文档

### 更新_2026_04_23_2110
- [优化] **优化（skill）**: 优化 frontend_next SKILL 简体中文说明文档 dialog.tsx 简体中文说明文档
- [优化] **优化（skill）**: 优化 admin 简体中文说明文档 page.tsx 简体中文说明文档

### 更新_2026_04_23_2018
- [优化] **简体中文说明文档**: 简体中文说明文档简体中文说明文档MD简体中文说明文档PDF简体中文说明文档Word简体中文说明文档PDF简体中文说明文档PDF简体中文说明文档Word简体中文说明文档Excel简体中文说明文档简体中文说明文档简体中文说明文档JSON
- [优化] **简体中文说明文档**: 简体中文说明文档简体中文说明文档
- [优化] **简体中文说明文档**: 简体中文说明文档简体中文说明文档
- [优化] **简体中文说明文档**: 简体中文说明文档Word简体中文说明文档PDF简体中文说明文档Excel简体中文说明文档
- [优化] **AI简体中文说明文档**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- [优化] **简体中文说明文档**: 简体中文说明文档AI简体中文说明文档

### 更新_2026_04_23_0906
- **perf(knowledge_base)**: 简体中文说明文档简体中文说明文档简体中文说明文档React.memo简体中文说明文档useCallback简体中文说明文档
- **perf(virtual_list)**: 简体中文说明文档简体中文说明文档简体中文说明文档react-window简体中文说明文档
- **perf(main_process)**: 简体中文说明文档简体中文说明文档简体中文说明文档UpdateService简体中文说明文档
- **perf(ipc)**: IPC简体中文说明文档简体中文说明文档
- **perf(network)**: 简体中文说明文档简体中文说明文档简体中文说明文档
- **perf(monitoring)**: 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_23_1200
- **feat(media_player)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档/简体中文说明文档
- **feat(media_player)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **feat(media_player)**: 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_22_1515
- [简体中文说明文档] **Agent UI简体中文说明文档**: 简体中文说明文档 DeepSeek 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- [简体中文说明文档] **简体中文说明文档**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档 KaTeX 简体中文说明文档 LaTeX
- [简体中文说明文档] **简体中文说明文档**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- [简体中文说明文档] **简体中文说明文档**: 简体中文说明文档 EXE 简体中文说明文档简体中文说明文档简体中文说明文档 S3 简体中文说明文档

### 更新_2026_04_22_1447
- **fix(简体中文说明文档)**: 简体中文说明文档 backup_service.py 简体中文说明文档 S3Storage 简体中文说明文档 S3StorageService
- **feat(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档 pg_dump 简体中文说明文档 S3
- **feat(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档
- **fix(简体中文说明文档)**: 简体中文说明文档 lint 简体中文说明文档
- **feat(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_22_0845
- **feat(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **feat(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档 `elevate_user_role.py`简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档 admin
- **fix(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档 (60011) 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **fix(简体中文说明文档)**: 简体中文说明文档简体中文说明文档简体中文说明文档 IP 简体中文说明文档 (60020) 简体中文说明文档简体中文说明文档简体中文说明文档


### 更新_2026_04_21_2006
- **优化（ui）**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **优化（auth）**: 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_21_2001
- **优化（client_electron）**: 简体中文说明文档简体中文说明文档简体中文说明文档 auth_wecom_url 简体中文说明文档 Token 简体中文说明文档
- **优化（简体中文说明文档）**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_21_1941
- **优化（auth）**: 简体中文说明文档 FastAPI 简体中文说明文档 wecom_callback 简体中文说明文档 Request | None 简体中文说明文档 Pydantic 简体中文说明文档
- **优化（auth）**: 简体中文说明文档 sys_users 简体中文说明文档 t_users 简体中文说明文档简体中文说明文档

### 更新_2026_04_21_1941
- **优化（build）**: Next.js 简体中文说明文档 output: 'export' 简体中文说明文档
- **优化（nginx）**: 简体中文说明文档 Nginx 简体中文说明文档简体中文说明文档简体中文说明文档 try_files 简体中文说明文档 404 简体中文说明文档

### 更新_2026_04_21_1729
- **feat(wecom_sync)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- **refactor(user_repo)**: 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_21_1649
- **refactor(api)**: 简体中文说明文档简体中文说明文档 /api_trai/v1 简体中文说明文档简体中文说明文档 API_PREFIX 简体中文说明文档
- **fix(wecom)**: 简体中文说明文档简体中文说明文档 API_PREFIX 简体中文说明文档简体中文说明文档简体中文说明文档
- **refactor(error)**: TraiException 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_21_1649
- **refactor(api_base)**: 简体中文说明文档 API Base 简体中文说明文档 /api_trai/v1 简体中文说明文档简体中文说明文档 SSE 简体中文说明文档

### 更新_2026_04_21_1649
- **refactor(api)**: 简体中文说明文档简体中文说明文档简体中文说明文档 /api_trai/v1

### 更新_2026_04_21_1138
- [简体中文说明文档] 简体中文说明文档 AI 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- [简体中文说明文档] AI 简体中文说明文档简体中文说明文档 DeepSeek 简体中文说明文档简体中文说明文档简体中文说明文档

### 更新_2026_04_21_1047
- [简体中文说明文档] 简体中文说明文档 Redis Token 简体中文说明文档 Token
- [简体中文说明文档] 简体中文说明文档 (client_electron) 简体中文说明文档 Axios 简体中文说明文档简体中文说明文档简体中文说明文档 Token 简体中文说明文档
- [简体中文说明文档] 简体中文说明文档 (frontend_next) 简体中文说明文档 Fetch 简体中文说明文档简体中文说明文档简体中文说明文档 Token 简体中文说明文档

### 更新_2026_04_21_1013
- [简体中文说明文档] 简体中文说明文档 AES_KEY 简体中文说明文档 AES_IV 简体中文说明文档简体中文说明文档
- [简体中文说明文档] 简体中文说明文档 JWT 简体中文说明文档简体中文说明文档
- [简体中文说明文档] 简体中文说明文档 Token 简体中文说明文档简体中文说明文档 js-cookie 简体中文说明文档简体中文说明文档
- [简体中文说明文档] 简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档简体中文说明文档
- [简体中文说明文档] 简体中文说明文档简体中文说明文档 Skills 简体中文说明文档简体中文说明文档

## 问题

wuhaotongxue <wuhaotongxue@gmail.com>
