# TRAI 项目 (TRAI Project)

> **项目创建时间**: 2026-01-29 16:36:17

TRAI 全栈项目仓库，包含后端 (FastAPI+AI)、前端 (Vue3+TS) 及客户端 (PyQt5)。

## 🚀 快速启动 (Quick Start)

### 后端 (Backend)
详细文档请参考 [backend/README.md](backend/README.md)

当前推荐开发环境：
- **Python**: 3.13.12
- **Conda**: zz_trai_3_13_12_dev_20260311

首次创建：

```bash
conda create -n zz_trai_3_13_12_dev_20260311 python=3.13.12
```

激活并启动：

```bash
conda activate zz_trai_3_13_12_dev_20260311
pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
python backend/run.py --host 0.0.0.0
```

也支持使用 `uv` 管理 `pyproject.toml + uv.lock`（默认创建 `backend/.venv`）：

```bash
python -m pip install -U uv -i https://pypi.tuna.tsinghua.edu.cn/simple
export UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
uv python install 3.13.12
uv python find 3.13.12 --show-version
PY31312="$(uv python find 3.13.12)"
"$PY31312" -V
cd backend
uv venv .venv_zz_trai_3_13_12_dev_20260311_py31312 -p "$PY31312"
uv lock -p "$PY31312"
uv sync -p "$PY31312"
uv run python run.py --host 0.0.0.0
```

如果你本机已能提供 Python 3.13.12（例如已激活 conda 环境），可以跳过 `uv python install 3.13.12`。

> **说明**：`backend/pyproject.toml + backend/uv.lock` 当前用于“基础后端依赖”的可复现安装；AI/GPU 相关依赖请以 `backend/requirements.txt` 为准。

### 前端 (Frontend)
详细文档请参考 [frontend/README.md](frontend/README.md)

### 桌面客户端 (Client App)
详细文档请参考 [backend/client_app/README.md](backend/client_app/README.md)

## 🏢 企业微信集成 (WeCom Integration)
请参考 [backend/README.md#企业微信与离职管理-wecom--hr](backend/README.md#企业微信与离职管理-wecom--hr)

客户端企业微信登录（含头像渲染与配置项）请参考 [desktop_client/README.md](desktop_client/README.md)

## 📹 AI 视频生成 (Wan2.1)
请参考 [backend/README.md](backend/README.md#ai-视频生成-wan21)

## 🎵 AI 音乐生成 (ACE-Step)
请参考 [backend/README.md](backend/README.md#ai-音乐生成-ace-step)

## 🕷️ 网络爬虫 (Crawler)
请参考 [backend/README.md](backend/README.md#网络爬虫-crawler)

## 📚 接口文档 (API Docs)
请参考 [backend/README.md](backend/README.md#接口文档-api-docs)

## 🔧 环境依赖 (GPU 版)
请参考 [backend/README.md](backend/README.md#环境依赖-gpu-版)

GPU/CUDA 快速切换（固定使用某张卡）：

```bash
export CUDA_VISIBLE_DEVICES=2
python backend/run.py --host 0.0.0.0
```

当前服务器版本基线（zz_trai_3_13_12_dev_20260311）：
- **GPU**: NVIDIA L20 x4 (46068 MiB)
- **NVIDIA Driver**: 590.44.01
- **CUDA (NVIDIA-SMI)**: 13.1
- **CUDA Toolkit (nvcc)**: 12.3.107
- **PyTorch**: 2.10.0+cu130（torch.version.cuda=13.0）

一键查看：

```bash
nvidia-smi
nvcc --version
python -c "import torch; print(torch.__version__, torch.version.cuda)"
```


## 📚 开发规范
请务必阅读 `.trae/rules` 下对应目录获取完整的开发规范索引。

- [后端规范索引 (Wuhao)](.trae/rules/backend_skills_wuhao/README.md)
- [前端规范索引 (ZCL)](.trae/rules/frontend_zcl.md)

## 📝 更新日志 (Changelog)

### 🛠️ 后端_2026_03_30_1702
- **重构(exception)**: 全面规范异常捕获为“except ... as e”，清理静默 `pass`，统一使用 logger 记录
- **重构(run.py)**: 增加 BackendRunner 类封装启动流程（解析参数/解析环境/DB 初始化/服务启动）
- **修复(video_dubbing)**: 修正 qwen_tts/torchaudio/whisperx 等 ImportError 分支日志与语法
- **修复(router/middlewares)**: 路由/中间件统一补充错误处理与临时文件清理的异常日志

### 🛠️ 后端_2026_03_30_1534
- **文档(TRAI开发手册)**: Week 1 环境标准化调整为“无需 UV（已完成）”，补充基于 requirements 的安装与验收标准
- **技能(git-submit)**: 修复 git-submit 技能 frontmatter 解析问题，确保可正常加载使用

### 🛠️ 后端_2026_03_30_1508
- **推送(wuhao)**: 后台代码按技能链路推送（先检查、再补齐 README、提交并推送）
- **技能(readme-update)**: 注册并启用 README 自动更新技能，保障 Changelog 顶部按真实时间戳追加
- **规范(git-submit)**: 强化说明“未更新 README 必须调用 readme-update”，后续推送严格走技能

### 💻 客户端_2026_03_30_0830
- **修复(yunxuetang)**: 修复云学堂自动学习功能中因新标签页 (`MixTab`) 缺少 `quit` 属性导致的报错，替换为更安全的浏览器实例关闭逻辑。
- **发布(release)**: 升级客户端版本，更新 version.json 及相关打包产物。

### 💻 客户端_2026_03_28_1816
- **修复(core)**: 修复 `ExceptionUtils.get_error_info` 中由于循环调用导致的 `RecursionError`，解决应用在捕获普通异常并记录日志时发生静默闪退的问题。
- **功能(core)**: 在 `run.py` 增加全局未捕获异常处理钩子 (`sys.excepthook`)，防止打包后的 `noconsole` 模式下发生静默崩溃并提供错误弹窗提示。

### 💻 客户端_2026_03_28_1807
- **重构(style)**: 全局执行客户端代码格式化 (black & autopep8)，规范化代码风格，并修复部分文件头部注释规范。
- **规范(docs)**: 更新代码检查规则，强调主动拆分过长代码，避免过度依赖格式化工具造成的强制折行。
- **发布(release)**: 打包并升级客户端版本至 202603281807，更新 version.json 及相关产物。

### 🛠️ 后端_2026_03_28_1801
- **后端(core)**: 优化异常处理逻辑，格式化后端代码
- **文档**: 更新 git-workflow 规范，强调使用 git-submit 技能

### �💻 客户端_2026_03_28_1734
- **重构(refactor)**: 彻底清理客户端代码中的违规异常捕获。将所有粗糙的 `logger.error(f"... {e}")` 批量替换为标准的 `ExceptionUtils.get_error_info(e)`，实现全局异常堆栈的统一记录。

### 🛠️ 后端_2026_03_28_1734
- **修复(fix)**: 修复 `backend/run.py` 启动时 `ModuleNotFoundError: No module named 'backend'` 的导包错误.

### 🛠️ 后端_2026_03_28_1530
- **风格(style)**: 全局将后台代码和规则文档中的中文全角标点替换为英文半角标点.
- **规范(docs)**: 更新 `core-workflow`，强制要求每次提交前必须同步更新局部与根目录的 README 日志.

### 💻 客户端_2026_03_28_1530
- **修复(fix)**: 修复因为 `autopep8` 和 `black` 导致的 f-string 换行引发的 `SyntaxError`.
- **规范(style)**: 全面梳理客户端的规则和技能, 将 `灵感广场` 的文案统一修改为 `工具箱`.

### 💻 客户端_2026_03_25_1520
- **重构(ui)**: 重构系统设置页面，将配置项拆分为“服务器配置”、“企业微信配置”、“系统行为配置”三个折叠面板，默认收起，提升界面整洁度。
- **优化(wecom)**: 优化企微配置，限制自定义企微最多为两个，并将文案修改为“自定义企微”。
- **优化(ui)**: 支持更新日志弹窗的最大化与最小化。
- **优化(update)**: 完善左侧用户菜单中的更新按钮版本显示逻辑；优化自动更新检测策略（如每 5 分钟检查），更新并自动重启后版本号即时刷新，防止死循环下载更新。

### 💻 客户端_2026_03_25_1436
- **优化(update)**: 取消了静默下载更新完成后的“确认重启”弹窗，实现后台完全静默下载并自动替换旧版，提供无缝更新体验。
- **优化(ui)**: 在关闭主窗口时新增了“记住选择”的功能，用户可以设置默认是“最小化至托盘”还是“直接退出”，并在“系统设置”页面中支持随时修改该行为。
- **修复(build)**: 修复打包发布的死循环更新问题。现在打包前会动态将最新的时间戳版本号写入 `CURRENT_VERSION`，避免打包出的程序版本号陈旧导致重复更新。
- **修复(ui)**: 修复因从配置中读取纯数字（如账号、时间间隔）直接传给 `setText()` 导致的参数类型错误 (`argument 1 has unexpected type 'int'`) 引起的启动闪退问题。

### 💻 客户端_2026_03_25_1215
- **功能(build)**: 新增 `release_utils.py` 一键打包发布脚本，将原有的 `build_utils.py` 和 `publish_utils.py` 整合为自动化连贯工作流。

### 💻 客户端_2026_03_25_1205
- **功能(docs)**: 更新了打包发布流程规范，要求必须先编写 README.md 更新日志后再进行打包，以确保自动抓取的内容不遗漏。
- **优化(test)**: 测试动态抓取最新 README 日志并推送到企微/飞书的功能是否正常生效。

### 💻 客户端_2026_03_25_1150
- **功能(build)**: 引入语义化版本号（如 v0.0.1）机制，与时间戳版本号并存，在 `version.json`、数据库 `client_versions` 表和企微/飞书推送中同时展示两种版本号，便于版本追踪。
- **功能(build)**: 将打包脚本中的更新日志改为动态从 `desktop_client/README.md` 中提取最新版本的更新内容。
- **修复(yunxuetang)**: 修复防挂机弹窗被频繁点击但未消失导致的死循环问题，连续点击无效后将自动触发重启机制刷新重试。
- **修复(utils)**: 修复打包和发布脚本中更新日志换行符 `/n` 为 `\n` 的问题，确保企微和飞书推送消息换行显示正常。
- **功能(utils)**: 丰富 ExceptionUtils 工具类，新增结构化异常、JSON格式化、HTML富文本格式化及安全执行装饰器等功能。

### 💻 客户端_2026_03_25_1140
- **规范(client)**: 批量为缺失文件头的 Python 文件补充文件头（包含文件名、作者、日期、描述）。
- **重构(utils)**: 重命名 `publish_release.py` -> `publish_utils.py` 和 `build_exe.py` -> `build_utils.py`。将各文件中的孤立函数封装至静态工具类。
- **优化(db)**: 数据库更新发布记录表 `client_versions` 创建时，新增表注释与字段注释。
- **清理(imports)**: 更新开发规范，要求清理未使用到的 import 以提升性能。

### 💻 客户端_2026_03_25_0935
- **修复(yunxuetang)**: 学习未完成时严格不跳转侧栏与“下一个”，遵循剩余时间完成本节学习；避免误跳页。
- **优化(yunxuetang)**: 以 SVG `fill-rule` 判断完成状态（`evenodd` 为已完成），仅定位未完成项；过滤“返回/收起/展开/目录/上一节/返回上一级”等非课程项；跳过当前激活项与当前播放同名标题；加入 2 分钟去重与“激活项下方优先”策略。
- **优化(yunxuetang)**: 无痕模式启动后强制清理缓存、Local/Session Storage 和 Cookies，解决换账号串号问题。
- **修复(backend)**: Excel 账号导入脚本补充 `platform`、`url` 可选列校验，缺失时以空值填充，避免后续使用报错。[backend/app/yibaocode/scripts/import_accounts.py](backend/app/yibaocode/scripts/import_accounts.py)

### 💻 客户端_2026_03_24_1145
- **重构(tools)**: 解耦云学堂刷课核心逻辑至 `utils/yunxuetang_utils.py`，并将 `YunXueTangWorker` 拆分为基础类、指定URL任务类和自动寻找任务类，以提高代码可读性和可维护性。
- **配置(config)**: 提取所有硬编码 XPath 至集中配置 `config/yunxuetang_config.py`。
- **构建(build)**: 新增自动化打包脚本 `app/utils/build_exe.py`，支持打包后自动清理 `build` 临时目录；修复打包环境依赖问题，避免打包引入多余的包（如 `torch` 等），将生成的 EXE 名称更改为英文 `Gouqi` 以避免可能出现的编码与路径错误。

### 🚀 全栈更新_2026_03_24_1000
- **功能(auth)**: Next.js 前端支持企业微信扫码登录及个人微信开放平台扫码登录。
- **优化(frontend_next)**: 解决前端与后端在本地开发环境下的 CORS 跨域与代理 500 报错问题，实现动态 `redirect_uri`。
- **安全(backend)**: 清理 `backend/.env.example` 中的敏感测试数据，在后端规范库中增加 `security` 密码防泄漏规则。
- **配置(backend)**: 后端接口 `wechat-config` 返回个人微信开放平台 `app_id`，修复前端配置未加载报错问题。

### 💻 客户端_2026_03_24_1000
- **重构(tools)**: 解耦云学堂刷课核心逻辑至 `utils/yunxuetang_utils.py`，提取硬编码 XPath 至集中配置 `config/yunxuetang_config.py`。
- **修复(ui)**: 彻底解决点击“停止”按钮时的界面卡顿问题，引入后台线程强制结束浏览器进程。
- **优化(logic)**: 修复左侧未完成课程检测死循环，支持灰色的未开始与半角的进行中状态；增加用户手动跳转检测，防误点。
- **优化(log)**: 日志界面支持富文本 HTML，增加图标与颜色高亮显示 (info, success, warning, error)，并重点高亮剩余时间。
- **构建(build)**: 新增自动化打包脚本 `build_exe.py`，支持打包后自动清理 `build` 临时目录。

### 💻 客户端_2026_03_23_1700
- **新增(tools)**: 集成云学堂自动学习功能，支持后台静默挂机、自动过防挂机弹窗及状态刷新。
- **优化(auth)**: 新增应用启动时基于本地存储凭证的自动登录与免密跳转逻辑。
- **优化(ui)**: 增强系统设置页对企业微信机器人 Webhook 的配置管理能力。

### �🛠️ 后端_2026_03_23_1800
- **构建(chore)**: 将未使用的 `.zip` 压缩包（如 `hallo-main.zip`）添加到根目录的 `.gitignore` 中，保持代码仓库整洁。

### 🛠️ 后端_2026_03_23_1730
- **功能(auth)**: 后端增加基于 OAuth2.0 的企业微信扫码/静默登录集成。
- **功能(auth)**: 新增 `GET /auth_web/wecom_config` 接口提供前端所需的 `corp_id` 和 `agent_id`。
- **功能(auth)**: 新增 `POST /auth_web/wecom_login` 接口接收授权 `code` 并签发 JWT Token。
- **功能(auth)**: 新增客户端轮询接口 `GET /auth_exe/exe_wecom_status` 以及回调接口 `GET /auth_exe/exe_wecom_callback`。
- **文档(docs)**: 更新 README 补充了通过 Nginx 代理将接口文档和相关服务挂载到业务域名 (如 `ai.tuoren.com`) 的配置方案。

### 🛠️ 后端_2026_03_20_1758
- **功能(subtitle)**: 视频配音、字幕生成、双语字幕功能优化，支持流式读写处理大文件避免内存溢出。
- **修补(upload)**: 修复 S3 大文件分片上传时因 Payload 签名策略导致 `XAmzContentSHA256Mismatch` 的 500 报错。
- **重构(utils)**: 提取独立的 `DeepSeekUtils` 并增加对全文上下文的支持以提升歌词翻译连贯性。

### 💻 客户端_2026_03_20_1615
- **重构(desktop_client)**: 删除不需要的代码，更新应用名称为“枸杞子”，并更新了应用Logo及相关UI文案。
- **规范(docs)**: 增加中文注释规范技能要求。

### 🛠️ 后端_2026_03_23_1625
- **优化(auth)**: 企业微信登录核心流程重构，采用 `httpx` 替换 `requests` 实现全异步并发，防止阻塞主事件循环。
- **优化(auth)**: 引入 `Redis` 实现集中式 `access_token` 缓存，完美解决多进程部署下的 Token 竞争与企业微信接口流控问题。
- **功能(auth)**: 升级企业微信登录接口至新版 `cgi-bin/auth/getuserinfo`，并向下兼容旧版返回值格式。
- **修复(auth)**: 细化网络异常状态码处理，区分业务拦截 (400/401) 与网络超时 (500)。
- **文档(docs)**: 暂缓上传企业微信文档目录，保留后续补充。

### 🛠️ 后端_2026_03_20_1430
- **功能(subtitle)**: 根据视频分辨率动态计算字幕大小与边距，彻底解决竖屏视频字幕溢出画面的问题。
- **功能(subtitle)**: 视频生成字幕、双语翻译以及最终输出的文件名采用 `pypinyin` 转换为拼音拼装（如 `wuhaoceshi_subtitle.mp4`），提高程序和 URL 兼容性。
- **修补(subtitle)**: 修复了新版 `Qwen-ASR/Qwen2-Audio` 在处理 VAD 语音片段时因 `attention_mask` 参数异常导致的转写失败问题。
- **修补(subtitle)**: 修复了因字幕字体名称 (`Noto Sans CJK SC`) 包含空格导致的 FFmpeg 烧录字幕失败问题。

### 💻 客户端_2026_03_20_1110
- **重构(client)**: 优化 `pages` 目录结构，将各页面组件按功能划分子包（`auth`, `chat`, `ai`, `tools`, `system`）。
- **重构(client)**: 移除页面文件名的 `_page` 后缀，简化命名（如 `doc_tools_page.py` -> `doc_tools.py`）。
- **配置(config)**: 将 `config.json` 和 `config.json.example` 从 `pages` 目录上移至 `desktop_client` 根目录，调整配置加载路径逻辑。
- **日志(log)**: 全局替换默认 `print` 和标准 `logging`，统一使用 `utils.logger_utils` 中封装的 loguru 日志器。

### ️ 后端_2026_03_19_1430
- **依赖修复(deps)**: 
  - 针对 Python 3.13 移除了标准音频库的问题，补充安装了 `standard-aifc` 和 `standard-sunau`，修复了视频配音流程中音频文件解析失败导致的 "No module named 'aifc/sunau'" 报错。
  - 补充安装了缺失的 `librosa` 和 `qwen-tts`，并处理了与 `transformers` 的版本冲突。
  - 补充安装了 `demucs` 库，修复了背景音分离步骤跳过的错误。
- **功能修复(subtitle)**: 
  - 修复了 `torchaudio.list_audio_backends` 属性缺失导致的字幕路由注册失败（404 Not Found）问题，通过注入兼容补丁解决。
  - 修复了 `Qwen3TTSModel` 克隆配音时 `Unsupported languages: ['Ko']` 报错，增加了语言缩写（如 'ko'）到语言全称（如 'korean'）的映射转换。
  - 修复了因参考音频生成失败导致 TTS 降级使用默认音色的问题，恢复了原声克隆效果。

### �🚀 全栈更新_2026_03_19_0950
- **新增(client)**: 桌面客户端集成企业微信工具箱，支持离职报告自动化生成与下载。
- **优化(client)**: 视频字幕与企业微信模块的文件操作体验优化 (打开文件/文件夹)。
- **同步(backend)**: 后端接口路由兼容性更新，解决合并冲突。
- **文档(docs)**: 更新 `desktop_client` 和 `backend` 的开发文档与规范。

### 💻 客户端_2026_03_18_1215
- **规范(skills)**: 建立 `desktop_client_skills_liuhd` 客户端专属开发规范体系，涵盖核心工作流、UI设计（强制QThread异步）、基础设施（优先Conda虚拟环境）及文档规范。

###  客户端_2026_03_18_1100
- **重构(client)**: 将 `backend/pyqt_app` 整个客户端目录移出后端，作为独立的 `desktop_client` 项目目录与 `backend` 平级。
- **构建(client)**: 更新打包脚本 `build_onefile.py` 和日志模块 `logger_utils.py` 中的相对路径，确保在独立目录下能正确读取 `.env` 并输出日志。
- **文档(docs)**: 同步更新客户端 README.md 与发布指南，统一目录名称描述。

### �🛠️ 后端_2026_03_18_1800
- **环境升级(env)**: 将 Conda `base` 环境升级至 **Python 3.13**，并解决了一系列深层兼容性问题。
- **依赖修复(deps)**: 
    - 修复了 PyTorch 2.6.0+ 与 NVIDIA 驱动 (`libnvJitLink.so.12`) 的符号冲突。
    - 解决了 Numba 与 NumPy 2.4+ 的版本不兼容问题（降级至 NumPy < 2.3）。
    - 修复了 `PaddleOCR` 和 `ModelScope` 的模块缺失及 `pkg_resources` 导入错误。
- **重构(subtitle)**: 
    - **日志标准化**: 全面重构 `video_dubbing_utils.py`，将所有 `print()` 替换为结构化 `logger` (info/success/warning/error)，显著提升生产环境监控能力。
    - **中文注释**: 将 `video_dubbing_utils.py` 中的所有代码注释和技术路径说明翻译为中文。
    - **配置解耦**: 将视频配音相关的硬编码模型 ID 全部迁移至 `.env` 环境变量，实现配置与代码分离。
- **同步(merge)**: 完成与 `develop` 分支的深度同步，整合了最新的前端设计规范 (frontend_next_skills) 和 PyQt 客户端交互优化。

### 🎨 前端_next_2026_03_18_1530
- **初始化(init)**: 项目初始化，基于 Next.js 14+ App Router 架构。
- **配置(env)**: 配置 `pnpm` 为包管理器，并设置国内镜像源。
- **修复(deps)**: 修复 `sharp` 依赖构建问题。
- **功能(login)**: 优化登录页面体验，默认填充测试账号 `A6666` / `123456`。
- **规范(skills)**: 引入 `frontend_next_skills` 高级设计规范，涵盖核心架构、视觉美学、重构指南及交付标准。
- **重构(utils)**: 补充缺失的 `lib/api.ts` 和 `lib/utils.ts` 工具库。

### 💻 客户端_2026_03_18_1030
- **DLL 冲突修复**: 解决了在 Anaconda 环境下 `QtMultimedia` DLL 加载失败的问题。通过在 `run.py` 中强制指定 PyQt6 的 `bin` 目录到 `PATH` 环境变量，确保优先加载 pip 安装的 PyQt6 DLL，避免与 Anaconda base 环境中的 Qt 版本冲突。
- **侧边栏体验升级**:
  - **折叠模式优化**: 折叠时自动隐藏所有文本，仅保留图标，界面更清爽。
  - **智能展开**: 在折叠状态下点击分组图标（如"效率工具箱"），侧边栏会自动展开并展示分组内容，无需手动切换。
  - **悬停提示**: 为折叠状态下的图标添加了 Tooltip，鼠标悬停即可查看功能名称。

### � 客户端_2026_03_17_1759
- **新功能(subtitle)**: 视频字幕页面新增 **“高级视频配音 (V2)”** 模式，支持调用后端高级流水线实现指定语言配音与双语字幕生成。
- **配置(config)**: 更新 `config.json`，新增 `dubbing_v2_url` 接口地址配置。

### �🛠️ 后端_2026_03_17_1743
- **优化(subtitle)**: 修复视频配音中的 "check_model_inputs" 报错，优化 `llm_model.generate` 调用参数 (explicit pad_token_id)。
- **修复(subtitle)**: 修复 LLM 文本纠错功能，优化 Prompt 以支持医学、生物、历史等专业领域的智能纠错。
- **修复(subtitle)**: 修复人声分离模块 `demucs` 缺失问题，确保背景音 (BGM) 能够正确分离和保留。
- **优化(subtitle)**: 增强混音逻辑的健壮性，确保多说话人配音与背景音的正确叠加。
- **文档(docs)**: 更新 README，记录视频配音与纠错相关优化。

### 💻 客户端_2026_03_17_1658
- **构建(client)**: 修复 `requirements_pyqt.txt` 文件编码 (UTF-16 -> UTF-8)，解决 Git 识别异常。
- **依赖(client)**: 新增 `nuitka`, `zstandard`, `paramiko` 等依赖，优化打包体积与 SSH 连接支持。
- **同步(merge)**: 合并 `develop` 分支最新代码，解决 `video_dubbing_utils.py` 冲突。

### 🛠️ 后端_2026_03_17_1616
- **新功能(wecom)**: 新增企业微信人员变动报告功能 (`/report/resignation`)，支持统计当日/本周/本月的**入职**与**离职**人员。
- **优化(wecom)**: 优化报告生成逻辑，按工号排序入职人员，并生成包含 6 个 Sheet 页的详细 Excel 报表（含部门、手机号、邮箱等完整信息）。
- **修补(wecom)**: 修复飞书群通知发送失败的问题，新增 `FEISHU_WECOM_SYNC_WEBHOOK_TOKEN` 环境变量以支持推送到指定群。
- **文档(docs)**: 更新 README，记录企业微信同步与报告生成相关变更。

### 🛠️ 后端_2026_03_17_1516
- **新功能(subtitle)**: 新增高级视频配音 (`video_dubbing_v2`) 接口，支持指定语言自动翻译与克隆配音。
- **重构(subtitle)**: 将独立测试脚本中的 `AudioDiarizationPipeline` 完整合并至后端 `video_dubbing_utils.py`，支持动态多语言文件夹结构。
- **优化(ai)**: 解耦 `ACE-Step` 文生音乐的本地模型权重，改为从 ModelScope 缓存或环境变量读取路径，避免提交超大权重文件。
- **修补(ai)**: 修复 `transformers` (4.57+) 升级导致的 `check_model_inputs` 签名不兼容问题，保障后端顺利启动。
- **修补(ai)**: 修复 `ACE-Step` 模型运行时 `AttributeError` 问题并恢复项目自有的 `ACE-Step-1.5-main` 运行代码。
- **构建(chore)**: 清理冗余测试视频 (`*.mp4`)、旧版音视频压缩包、未使用的测试脚本及临时输出文件，保持工作区干净。

### 🛠️ 后端_2026_03_14_1734
- **功能(subtitle)**: 视频配音支持多 GPU 并行加速 (CUDA)
- **修补(subtitle)**: 修复双语字幕烧录失败问题 (FFmpeg 路径转义)
- **修补(subtitle)**: 修复多进程下模型加载导致的 BrokenPipeError

### 🛠️ 后端_2026_03_14_1559
- **修补(subtitle)**: 修复 VAD 格式化字符串错误导致的 500 异常
- **修补(subtitle)**: 优化静音视频处理逻辑，返回友好的 400 提示
- **修补(log)**: 修复 loguru 在记录包含大括号的错误信息时崩溃的问题
### 💻 客户端_2026_03_14_1529
- **修补(build)**: 修复 PyInstaller 打包时 Qt DLL 缺失问题
- **依赖(env)**: 迁移构建环境至 Python 3.11 以解决 PyQt6 兼容性问题
- **配置(req)**: 更新 requirements_pyqt.txt 明确 PyQt6-Fluent-Widgets 依赖

### 💻 客户端_2026_03_14_0114
- **文档(client)**: 同步根目录客户端更新日志与最新版本提交
- **修补(log)**: 修正更新日志时间戳与格式规范

### 🛠️ 后端_2026_03_13_2256
- **修补(subtitle)**: 优化字幕生成逻辑与注释标点规范
- **配置(ignore)**: 统一 .gitignore 注释为中文
- **配置(ignore)**: 忽略本地测试音视频文件 (*.mp3/mp4)
- **新功能(subtitle)**: 添加视频配音和声音克隆接口 (S3/DB/Feishu集成)
- **新功能(subtitle)**: 新增视频配音全流程工具与代码清理
- **新功能(subtitle)**: 客户端新增双语字幕翻译功能与界面
- **docs**: 调整更新日志位置至Changelog顶部
- **chore**: 清理无用测试文件与临时产物
- **优化(subtitle)**: 升级翻译模型为 NLLB-200，支持中间结果分层存储

### 💻 客户端_2026_03_13_2231
- **文档(client)**: 同步根目录客户端更新日志
- **重构(client)**: 优化主界面布局与交互逻辑
- **重构(gui)**: 优化侧边栏布局与配色, 迁移配置至config.json

### � 客户端_2026_03_13_2210
- **交互(ui)**: 顶部导航栏集成登录/用户信息组件，移除侧边栏冗余入口，实现登录状态的即时切换与界面重置。
- **布局(menu)**: 优化侧边栏结构，归纳 "ModelScope" 至工具箱，精简 AI 菜单项，提升菜单层级清晰度。
- **修复(logic)**: 修复退出登录后页面未跳转回表单状态的逻辑缺陷。

### �️ 后端_2026_03_12_1531
- **feat**: add agent tools and video generation
- **fix**: update dependencies and run script
- **重构(subtitle)**: 规范化字幕路由文件名与引用
- **新功能(subtitle)**: 添加视频字幕生成路由与工具, 绕过系统FFmpeg依赖
- **修补(backend)**: 完善.gitignore配置并清理生成的静态文件
- **修复**: 解决启动日志重复问题并优化模型加载检查
- **文档(env)**: 同步环境配置模版与实际环境一致, 补充YOLO/飞书/ModelScope等缺失项
- **文档(docs)**: 更新3.13.12大版本日志与依赖说明, 涵盖环境升级/AI优化/视频生成/系统修复
- **修补(backend)**: 修复日志重复与标点问题, 移除冗余依赖与测试代码

### 💻 客户端_2026_03_12_1704
- **优化(client)**: 重构配置管理与字幕功能增强

### 🛠️ 后端_2026_03_11_1933
- **docs**: 更新zz_trai_3_13_12_dev_20260311与GPU/CUDA版本说明
- **新功能(ai)**: 支持MODELSCOPE_MOON模型下载开关
- **文档(backend)**: 更新README，新增模型选择开关说明

### 🛠️ 后端_2026_03_10_1435
- **feat(backend)**: 重构会议模块,统一用户标识并增强接口功能

### 🎨 前端_2026_03_10_1435
- **feat(frontend)**: 重构会议详情UI与编辑交互,增强用户体验
- **文档(frontend)**: 调整更新日志结构，优化阅读体验

### 🛠️ 后端_2026_03_07_1242
- **修补(speech)**: 修复WebSocket重复关闭导致的RuntimeError
- **新功能(meeting)**: 添加会议记录模块
- **新功能(speech)**: 重构实时语音并实现说话人分离显示

### 🛠️ 后端_2026_03_06_1128
- 医保码推送新增 河南驼人三瑞医疗器械有限公司账号密码
- **feat**: speech

### 🎨 前端_2026_03_06_1051
- **feat**: frontend

### 🎨 前端_2026_03_05_1101
- **修补(frontend)**: 更新CHANGELOG.md，添加前后端变更日志

### 🛠️ 后端_2026_03_04_1733
- optimize
- **新功能(speech)**: 新增语音识别技术选型文档与本地化实时方案

### 🛠️ 后端_2026_03_02_1637
- 更新pyqt_app/README.md
- fix

### 🛠️ 后端_2026_02_28_1718
- **文档**: 更新客户端媒体工具优化日志
- **修复(ai)**: 修复文生图接口权限校验逻辑并更新文档
- 优化AI 文生视频模块的视频展示；新增媒体工具箱模块，包含视频转GIF功能；基于API接口完善功能并优化；优化其他模块的页面布局
- **修复(media)**: 修复视频转GIF功能并更新文档
- **修补(backend)**: 修复图像生成依赖与GPU配置，优化模型加载
- **文档**: 修复根目录 README 更新日志的时间排序问题
- **文档**: 聚合同步后端与客户端的更新日志至根目录
- **新功能(crawler)**: 新增Dotown像素风爬虫用于文生图测试

### 💻 客户端_2026_02_28_1716
- **修复(client)**: 优化媒体工具页面文件句柄管理与异常处理

### 🛠️ 后端_2026_02_27_1720
- 新增AI 文生音乐服务；基于API接口实现功能并优化体验（ACE-Step/Ace-Step1.5）；优化AI 文生视频的缓存机制；优化AI 文生图的页面布局。
- 新增AI 文生视频模块；基于API接口实现功能并优化体验（Wan2.1-T2V-1.3B）

### 🛠️ 后端_2026_02_26_1730
- **安全(patch)**: 缓解 python-future CVE-2025-50817 漏洞 (屏蔽 test 模块导入)
- **安全(deps)**: 升级 tqdm>=4.66.3, langchain>=0.3.27 修复多个高危漏洞 (CVE-2024-34062, CVE-2025-6984)
- 新增语音服务模块，包括语音服务健康检查和音频转文字功能；基于API接口，实现上述功能并优化；实现复制转换结果功能。
- **安全(deps)**: 升级 langchain 组件修复多个高危漏洞 (CVE-2024-10940, CVE-2025-6985)
- **安全(deps)**: 升级 langchain>=0.2.9 修复 SSRF 漏洞 (CVE-2024-3095)
- **安全(audit)**: 核查 PyTorch 版本 (2.10.0) 确认不受 CVE-2025-2953 影响
- **安全(deps)**: 升级 xhtml2pdf>=0.2.17 修复 ReDoS 漏洞 (CVE-2024-25885)
- **新功能(speech)**: 验证并优化语音转写接口，实现模型启动预加载; 补充依赖与文档
- **文档(wan)**: 优化视频生成模块健壮性并完成核心代码中文文档化

### 💻 客户端_2026_02_26_1726
- 更新exe版本
- 系统设置模块，将当前版本的格式修改为与最新版本相同的时间戳格式，避免了语义化版本号（如 1.3.0 ）与时间戳版本号（如 202602251730）混用导致的比较逻辑复杂逻辑判断的问题，同时优化版本比较逻辑。 优化exe打包脚本的版本自动匹配settings_page.py中的CURRENT_VERSION，确保了 代码中定义的版本 与 构建发布后的版本 始终保持一致。 解决图片工具箱加载源图片时，部分图片无法加载的问题。

### 🛠️ 后端_2026_02_25_1730
- **修补(backend)**: 修复图片压缩错误及优化视频模块路径
- 更新.gitignore
- 优化图片工具箱模块的布局；基于API接口，完善各项功能（图片格式转换、图片转 ICO、图片尺寸调整已完成，图片压缩到指定大小API接口存在问题）
- **修正(backend)**: 恢复误删的版本文件
- **修补(backend)**: 修复安全漏洞与性能问题 (PR Review)
- **文档(readme)**: 修复更新日志排序问题，按时间倒序排列
- **docs**: update and sort root README.md changelog
- **refactor(llm)**: move training/inference scripts to llm_study and clean up root dir

### 🛠️ 后端_2026_02_24_1731
- **优化文档工具箱的布局；新增图像工具箱模块，当前功能包括**: 图片格式转换、图片转 ICO、图片压缩到指定大小、图片尺寸调整；优化图片工具箱模块的布局

### 🛠️ 后端_2026_02_13_1536
- [后端] 修复 ACE-Step 音乐生成 NaN 问题并优化推理配置

### 🛠️ 后端_2026_02_12_2004
- **文档(doc)**: 更新项目文档与日志, 增加 ACE-Step 1.5 集成说明
- **新功能(ai)**: 集成ACE-Step1.5音乐生成模型
- **构建(前端)**: 移除构建产物并更新忽略规则
- **构建(ops)**: 清理冗余文件与更新依赖
- **安全(media/upload)**: 修复RCE与SSRF漏洞
- **新功能(media)**: 完善视频转GIF功能, 增加数据库记录与飞书卡片预览通知

### 🎨 前端_2026_02_12_1350
- **修补(frontend)**: 优化会议记录实时语音识别体验

### 🛠️ 后端_2026_02_11_1750
- **修补(doc)**: 优化Excel转PDF布局支持横向拉伸与自适应宽度
- **chore**: 将 .gitkeep 添加到 .gitignore
- **chore**: 移除 static 下的 .gitkeep，改为应用启动时自动创建目录
- **docs**: 同步更新根目录 README Changelog (image2ico)
- **docs**: 更新 Changelog (image2ico 功能及优化)
- **docs**: 更新 README，添加 Image Tools 说明
- **refactor**: 优化 image_to_ico 异步性能，修复空尺寸逻辑，统一日志风格
- **fix**: 修复 image2ico 临时文件路径问题，避免路径重复及文件残留
- **chore**: 提交 static 目录结构 (.gitkeep)，忽略具体文件
- **feat**: 添加 image2ico 路由，集成飞书预览图，完善文件清理逻辑
- **feat**: 修复飞书通知 Token 配置及 image_utils 逻辑，添加 static 目录
- 更新README.md，新增config.json.example
- **优化**: 调整路由配置
- **fix(deps)**: 解决requirements冲突并同步xhtml2pdf依赖
- **安全(doc)**: 完善文档工具安全校验与字体兼容性修复
- **安全(doc)**: 修复文档工具路径穿越与资源泄漏漏洞, 优化CSS变量解析与字体兼容性
- **文档(backend)**: 修正文档结构
- **文档(rules)**: 优化文档更新规范，明确日志插入位置
- **新功能(doc)**: 升级 HTML 转 PDF 引擎为 Playwright，解决中文乱码与样式丢失问题
- **重构(doc_utils)**: 移除废弃的xhtml2pdf依赖及相关代码
- **优化(image)**: 使用asyncio.to_thread异步处理图像任务
- **安全(image/deps)**: 修复图片上传漏洞并升级依赖, 优化爬虫配置
- **修补(doc)**: 优化Excel转PDF排版逻辑并清理冗余文件

### 🎨 前端_2026_02_11_1650
- **修补(frontend)**: 移除自动生成类型声明文件的版本控制
- **修补(frontend)**: 聊天输入与图片消息布局优化
- **修补(frontend)**: 图像生成弹窗与历史记录优化
- **重构(frontend)**: 整理Home组件目录结构，分离PC/Mobile组件
- **重构(frontend)**: Home页逻辑聚合与Sidebar组件抽离
- **修补(frontend)**: 修复用户Store构建错误
- **格式(frontend)**: 样式规范统一，px替换为rem
- **修补(frontend)**: 优化会话体验与登录过期处理

### 💻 客户端_2026_02_11_1727
- 优化检查更新功能；打包时，自动将exe文件上传至服务器，自动更新version.json
- 优化exe文件可以同时打开多个的问题；优化修改配置文件需要重启的问题；优化配置修改展示，只展示IP和端口，取消重置选项
- 增加系统设置，可以手动更改API配置；优化文档转换工具，转换成功后，可以选择直接打开文件或跳转至文件保存路径；优化关闭程序逻辑，直接退出程序或最小化至系统托盘；优化exe打包脚本；优化使用exe文件启动程序时，modelscope工具模块有其他模块日志输出的问题。

### 🛠️ 后端_2026_02_10_1706
- **新增打包exe脚本**: build_onedir.py和build_onefile.py
- 基于API接口，优化并调试文档工具箱的各项功能
- **文档(readme)**: 优化日志格式, 增加模块 Emoji 前缀以区分不同端
- **文档(readme)**: 更新日志格式为 '模块_时间戳' 并同步修改文档规范
- **文档(rules)**: 拆分工作流规范, 提取文档规则至 07_backend_doc_whf.md
- **文档(readme)**: 更新根目录日志聚合规则并同步全量日志
- **文档(readme)**: 将后端更新日志同步至 backend/README.md
- **文档(readme)**: 重构项目文档结构并拆分模块; 新功能(image): 新增图片处理工具类与路由
- 新增pyqt_app路径下的README.md；新增文档工具模块
- **重构(crawler)**: 将xiaomi_crawler重构为news_crawler并支持动态关键词
- **功能(crawler)**: 增加关键词与翻页逻辑, 大幅提升数据抓取量
- **文档(readme)**: 新增 2026_02_10_0812 前端日志，技能改为发票识别

### 🎨 前端_2026_02_10_1707
- **新功能(frontend)**: 新增文档工具弹窗与登录拦截; 集成PC/Mobile; 技能替换与占位; 接口封装; 类型检查与构建通过
- **文档(frontend)**: 更新前端规范索引(强制日志与规则)
- **文档(frontend)**: 新增前端日志文件并更新规范，日志放置于 frontend/CHANGELOG.md；新增 2026_02_10_0812 记录
- **修补(frontend)**: 技能AI 播客改为发票识别，更新图标与占位文案

### 🛠️ 后端_2026_02_09_1704
- **功能(crawler)**: 升级小米新闻爬虫支持多平台(Sina/Baidu)及CSV导出
- **新功能(crawler)**: 增加小米新闻爬虫(Scrapy)与CSV导出
- **构建(deps)**: 更新后端依赖包(doc转换相关)
- **修补(doc)**: 修复安全风险与逻辑缺陷(updated_at/pikepdf/uuid)
- **新功能(ai)**: 增加多模态上下文支持与优化GPU温度显示
- 更新README.md
- **更改pyqt_app的图标为**: tr_mascot_local.ico；新增系统监控模块。
- **文档(readme)**: 修正更新日志时间戳
- **新功能(doc)**: 添加Word转PDF支持与路由, 集成S3/DB记录 (Fix: 修复LaTeX中文下划线报错, 清理冗余提交)
- **重构(doc)**: 规范化文档工具命名与路由, 优化通知逻辑

### 🛠️ 后端_2026_02_06_1735
- **后端(upload)**: 修复S3上传与Blob拦截; 文档: 更新日志
- 解决冲突
- **文档(README)**: 更新日志; 后端(cleanup): 清理冗余文件并忽略模型文件
- 更新README.md
- 将各模块的敏感信息统一到config.json管理

### 🛠️ 后端_2026_02_05_1730
- **修补(doc)**: 修复README日志格式
- **pyqt_app项目新增**: deepseek模块，图片解析模块，图片生成模块，人人都是品牌官模块。
- **新功能(lingbot)**: 集成Wan2.1视频生成引擎核心代码 (解决冲突)
- **新功能(lingbot)**: 集成Wan2.1视频生成引擎核心代码
- **前端(视图)**: 更新 PC/Mobile 首页交互与样式
- **前端(store)**: 聊天状态管理修订与功能增强
- **前端(composables)**: 更新文件上传组合式逻辑
- **前端(组件)**: 更新 MessageList 展示与交互
- **前端(api)**: 更新接口封装 (common/dify)
- **文档(readme)**: 按功能拆分提交通知 (API/组件/组合式/Store/视图)
- **文档(readme)**: 更新日志，前端同步至 zcl 分支
- 合并 develop 到 zcl 分支
- 合并远端 develop 分支
- **文档(readme)**: 合并 zcl 更新日志, 按时间整理
- **文档(rules)**: 明确README日志必须倒序排列并修正历史顺序
- **后端**: 新增分片上传与飞书通知优化; 更新环境文档
- **修补(backend)**: 修复依赖版本冲突(numpy/opencv/paddleocr),更新文档

### 🎨 前端_2026_02_05_1713
- **修补(frontend)**: 更新忽略规则并移除自动生成文件
- **修补(frontend/store)**: 导出clearAllConversations并修复只读messages修改; 更新README日志
- **构建(frontend)**: 新增目录索引文件并更新README日志，排除nignx与自动生成d.ts
- **重构(frontend/constants)**: 抽离图像生成参数与文案常量, 新增技能常量
- **文档(frontend)**: 更新README日志，记录前端常量抽离与占位文案改造

### 🛠️ 后端_2026_02_04_1729
- 新增pyqt_app项目
- 合并自zcl
- 生成文件删除
- 文生图接口
- 删除生成文件
- **文档(root)**: 细化2026_02_04更新日志
- **文档(root)**: 更新2026_02_04变更日志
- **修补(backend)**: 修正YOLO模型路径
- **功能(ai)**: 支持Qwen3-VL流式对话并完善Dify管理接口
- **修补(ai)**: 修复Qwen3-VL推理问题并完善Dify集成
- **修补(user/ai)**: 修复用户序列化问题及更新文生图默认模型
- **文档**: 更新更新日志
- **修补(chat)**: 修复图片预览全屏遮罩与文件上传进度问题
- **新功能(auth)**: 实现企业微信链接自动登录
- 优化结构目录，调整modelscopetool的位置
- **构建(env)**: 更新后端标准环境名称为 trai_31014_whf_trai_pro_20260202

### 🎨 前端_2026_02_04_1730
- **修补(frontend)**: 修复类型错误 TS2339/TS7006/TS18048 并完善 store 导出
- **构建(frontend)**: 更新项目配置与通用组件
- **新功能(frontend)**: 增加会话重命名与删除功能
- **新功能(frontend)**: 新增图片识别技能与流式对话支持
- **重构(frontend)**: 优化登录交互与状态同步

### 🛠️ 后端_2026_02_03_1724
- **文档(doc)**: 更新更新日志与忽略脚本
- **feat**: 统一API前缀/返回值, 调整Token过期时间, 更新端口为8001
- 更新modelscope_tool_gui.py至v.20260203.02
- **新增pyqt项目**: modelscope
- **ignore**: 添加前端环境文件到 .gitignore
- **fix**: 修复联系接口类型错误和环境配置
- **feat**: 新增会议记录组件及语音识别功能
- **修补(auth/ai)**: 修复登录500错误与文生图支持
- **fix(contact)**: fix file header author; sync env.example; update readme
- **feat(contact)**: add lead submission with multi-email & feishu sync; fix db insert
- **新功能(contact)**: 添加客户留资接口与数据库表
- **构建(backend)**: 更新 backend/requirements.txt (含 funasr/modelscope/transformers)
- **修补(backend)**: 修复 ModelScopeUtils 导入警告 (改为 transformers 加载)
- **构建(backend)**: 添加 qwen_vl_utils 依赖
- **构建(backend)**: 添加语音模块依赖 (funasr, modelscope)

### 🎨 前端_2026_02_03_1725
- **重构(frontend)**: 优化聊天逻辑与错误处理

### 💻 客户端_2026_02_03_1625
- 优化modelscope_tool_gui.py，解决打包为exe之后日志报错的问题。

### 🛠️ 后端_2026_02_02_1733
- **构建(backend)**: 更新GPU环境依赖列表 (PaddleOCR 2.6.1 + PaddlePaddle 2.5.2)
- **修补(backend)**: 修复OCR GPU兼容性与文档参数显示
- **重构(api)**: 完善API文档与状态码, 修复PaddleOCR初始化
- **重构(backend)**: 优化上传监控与工具函数
- **新功能(ai)**: 集成Qwen3-VL支持多模态
- **修补(config)**: 修复YOLO模型路径配置
- **文档(root)**: 更新忽略规则与日志

### 🛠️ 后端_2026_01_30_1718
- aiconfig修改注释
- **重构(models)**: 修复 Qwen 模型路径结构与默认配置, 修正 README 更新日志顺序
- **重构(models)**: 优化模型目录结构与路径配置
- **修复(构建)**: 解决TS类型报错、Sass警告并更新Nginx配置
- **功能(接口)**: 新增允许匿名访问的官网对话接口
- **功能(前端)**: 增加企业微信登录支持并优化用户状态逻辑
- **功能(后端)**: 实现企业微信静默登录与认证增强
- **新功能(speech)**: 启用GPU加速与S3权限修复
- **新功能(speech)**: 添加FunASR语音识别支持,优化模型管理与S3集成
- **配置(gitignore)**: 忽略模型目录但保留heart_like
- **重构(backend)**: 优化目录结构与模型加载逻辑
- develop
- 特殊2
- test2
- 测试
- 789
- 987
- env环境更改
- 回退测试
- 1
- 回退
- Revert "211"
- 测试推送1
- 测试推送
- 测试12345
- 测试123
- 211
- 321
- 123
- 3
- 2
- 111

### 🛠️ 后端_2026_01_29_1738
- **文档(readme)**: 更新日志, 记录端口自动清理与NetUtils优化
- **优化(net_utils)**: 统一中文注释并移除.env文件版本控制
- **配置(git)**: 更新gitignore
- **文档(rules)**: 更新后端启动说明，注明支持自动清理端口
- **新功能(backend)**: 添加启动时自动清理端口功能 (支持Windows/Linux/MacOS) 与配置更新
- 更新.gitignore
- 更新下后台
- 更新readme
- 更新规则

### 🎨 前端_2026_01_29_1639
- 更新下前端
