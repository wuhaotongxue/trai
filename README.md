# trai

一个用于实验与沉淀代码片段的小仓库。

## 环境要求

- **后端 Python 环境**: `trai_31313_20260413` (Conda) / Python 3.13.13

### 使用 Conda 创建后端环境（推荐使用清华源）

```bash
# 1. 创建 conda 虚拟环境
conda create -n trai_31313_20260413 python=3.13.13 -y

# 2. 激活环境
conda activate trai_31313_20260413

# 3. 安装依赖（使用清华源加速）
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .
```

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

### 💻 客户端_2026_04_14_1650
- **新增(client_electron)**: `main` 进程中接入 `electron-updater` 模块，配置自动更新 `UpdateService` 服务并指向后端重定向 API
- **优化(client_electron)**: `package.json` 中的 `electron-updater` 依赖和打包配置已完善，自动更新可绕过 S3 预签名时效性问题

### 🛠️ 后端_2026_04_14_1650
- **新增(backend)**: 新增 `ClientReleaseModel` (PostgreSQL `t_client_releases`)，持久化存储发布的客户端版本及 S3 Key 信息
- **新增(backend)**: `api.routers.admin.client_release` 中新增 POST `/api/admin/client/release` 接口，支持管理员上传 `latest.yml` 与 `exe` 安装包并保存至 S3
- **新增(backend)**: `api.routers.client.update` 中新增 GET `/api/client/update/latest.yml` 和 `/api/client/update/{filename}` 接口，利用后端重定向发放 S3 短期预签名 URL，完美解决时间过期限制问题

### 📚 规范(skills)_2026_04_14_1645
- **新增(docs)**: 补充《TRAI 版本更新与发布指南》(`version_update_guide.md`)，详细说明如何解决 S3 预签名链接时间限制问题并确保客户端稳定获取更新
- **优化(skills)**: 明确 `git_submit` 的根目录与 `md/` 目录清理规范，强调只删除散落的 `.md`，严格保留 `issue_*` 子文件夹及其内容
- **清理(docs)**: 删除 `md/` 目录下散落的旧版文档 (`client_architecture.md`、`electron_architecture.md`、`postgresql_identity.md`)

### 💻 客户端_2026_04_14_1630
- **重构(client_electron)**: 全局移除 "TRAI Desktop" 及 "客户端" 等冗余称呼，统一应用名称为 "TRAI"，包括包名、窗口标题、系统托盘和各 UI 页面显示

### 🎨 前端_2026_04_14_1610
- **新增(roadmap)**: 增加基于 Git 历史的路线图页面, 支持线性时间轴, 关系图谱, 按前端/后端/客户端分组展示当日变更
- **新增(docs)**: 补齐文档中心与子页面路由, 包含 /docs, /docs/api, /docs/sdk, /docs/quickstart, /docs/faq
- **优化(layout)**: 官网多页面统一为更接近全屏的 max-w-7xl 布局, 减少内容区过窄的问题
- **优化(交互)**: 页脚链接统一新标签页打开, 避免打断当前页面操作流
- **规范(rename)**: 前端文件名与导入命名统一 snake_case, 替换 kebab-case 命名

### 📚 规范(skills)_2026_04_14_1610
- **新增(frontend_next)**: 补充页面布局全宽规范, 推荐使用 container + max-w-7xl, 避免过窄 max-w 限制

### 💻 客户端_2026_04_14_1501
- **新增(client_electron)**: Agent 管理页面新增“状态检测”按钮，支持调用后端检测接口验证 Agent 当前的运行状态是否正常，并在 UI 上展示异常 (Error) 状态标签

### 🛠️ 后端_2026_04_14_1501
- **新增(backend)**: `management.py` 中新增 `/api/agent/management/check` 接口，支持检测指定 Agent 的运行状态是否正常（模拟了网络延迟和运行中 20% 概率抛出异常的情况）

### 🛠️ 后端_2026_04_14_1446
- **修复(backend)**: 修复 `main.py` 中遗漏注册 `management`、`music`、`video` 路由，导致 `/api/agent/management/list` 接口报 404 的问题

### 🛠️ 后端_2026_04_14_1444
- **修复(deps)**: 清理 `requirements.txt` 中由于 `pip freeze` 意外导出的本地项目可编辑依赖
- **修复(ruff)**: 修复 `domain` 模块中由于冗余导入导致无法通过 Ruff 检查的语法警告

### 💻 客户端_2026_04_14_1500
- **重构(client_electron)**: 重构工具箱卡片头部 UI，将图标、标题和描述从垂直居中堆叠改为水平流式布局（图标居左，标题与描述在右侧堆叠），有效节省卡片垂直空间并提升横向阅读体验

### 💻 客户端_2026_04_14_1455
- **优化(client_electron)**: 改善工具箱“图片格式转换”卡片中“目标大小(KB)”的展示逻辑。现在仅在选择 JPEG 或 WEBP 格式时动态显示该输入框，避免 PNG/BMP 时灰态不可用带来的视觉困惑

### 🛠️ 后端_2026_04_14_1450
- **新增(backend)**: 引入 `ruff` 工具进行 Python 代码极速格式化与 Lint 检查，并新增自定义技能 `ruff_check`，同时修改 `git_submit` 强制要求后端代码提交前运行此技能

### 💻 客户端_2026_04_14_1445
- **新增(client_electron)**: “图片格式转换”工具也同样加入了“目标文件大小(KB)”的自定义选项，支持将转换和压缩一步到位（仅限 JPEG / WEBP 格式）

### 🛠️ 后端_2026_04_14_1445
- **优化(backend)**: `convert_image` 接口新增 `target_size_kb` 参数，能够在转换格式为 JPEG 或 WEBP 的同时执行二分查找以压缩至目标大小

### 💻 客户端_2026_04_14_1440
- **新增(client_electron)**: “图片压缩”工具卡片新增目标文件大小（KB）设置输入框
- **优化(client_electron)**: “图片压缩”结果现在也能直观显示压缩前后的文件体积对比 (KB/MB)

### 🛠️ 后端_2026_04_14_1440
- **优化(backend)**: `compress_image` 接口增加 `target_size_kb` 参数，当指定目标大小时，通过二分查找动态寻找最接近目标体积的 JPEG 压缩质量，并返回 `original_size` 和 `converted_size`

### 💻 客户端_2026_04_14_1435
- **修复(client_electron)**: 修复工具箱因旧版后端进程未重载导致的新字段 (`original_size`, `converted_size` 等) 无法显示的问题，同时新增 `format_size` 函数，使得结果能够根据体积智能显示为 KB/MB 等格式

### 💻 客户端_2026_04_14_1430
- **修复(client_electron)**: 修复图片转换尺寸输入框在窄屏下 Placeholder 占位符文字被截断溢出的问题，精简了文字并移除了多余的内边距，增加底部提示文字

### 💻 客户端_2026_04_14_1425
- **修复(client_electron)**: 修复工具箱“图片格式转换”卡片中，尺寸输入框因水平布局导致在卡片内溢出的问题，统一调整为上下层叠（Column）布局并优化了 Input 占位符提示

### 💻 客户端_2026_04_14_1420
- **优化(client_electron)**: 图片格式转换工具支持分别指定目标图片的 `宽度` 和 `高度`，并在转换成功后直观显示处理前后的**分辨率尺寸**与**文件大小 (MB)** 对比

### 🛠️ 后端_2026_04_14_1420
- **优化(backend)**: `convert_image` 接口增加 `width` 和 `height` 参数处理，并返回 `original_size`、`converted_size` 及宽高信息供客户端展示

### 💻 客户端_2026_04_14_1410
- **新增(client_electron)**: 图片格式转换工具新增可选的目标尺寸参数，支持用户转为 ICO 格式时多选打包尺寸 (如 16, 32, 64 等)；非 ICO 格式支持指定宽高像素值

### 🛠️ 后端_2026_04_14_1410
- **优化(backend)**: `convert_image` 接口增加 `sizes` 尺寸支持，利用 Pillow 的 `sizes` 参数生成包含多尺寸结构的 ICO 文件

### 💻 客户端_2026_04_14_1400
- **新增(client_electron)**: 工具箱新增“图片格式转换”工具卡片，支持用户自定义目标格式（PNG, JPEG, ICO, WEBP, BMP）

### 🛠️ 后端_2026_04_14_1400
- **新增(backend)**: 增加图片格式互相转换 API 路由 (`/api/tools/convert_image`)，使用 Pillow 处理 RGBA 通道、ICO 缩放等复杂场景并上传 S3

### 💻 客户端_2026_04_14_1350
- **重构(client_electron)**: 重构工具箱 (`Tools`) 页面，使用卡片式网格布局 (`Grid`) 和 Lucide 图标替换原有的简单按钮列表，提升页面美观度与交互体验

### 💻 客户端_2026_04_14_1345
- **新增(client_electron)**: 侧边栏新增“用户反馈”菜单与界面，提供产品建议与 Bug 报告的入口
- **新增(client_electron)**: 实现反馈提交相关的 IPC 通道与 Service 桥接逻辑

### 🛠️ 后端_2026_04_14_1345
- **新增(backend)**: 增加系统反馈 API 路由 (`/api/system/feedback`) 并完善相关模型定义与数据落地模拟

### 💻 客户端_2026_04_14_1310
- **新增(client_electron)**: 聊天界面新增 Agent 选择器，允许用户在当前会话中主动切换并指定进行对话的 Agent
- **优化(client_electron)**: 完善 `management.py` 等后端接口依赖，修复模块导入错误并移除 `ResponseModel` 统一直接返回字典

### 🛠️ 后端_2026_04_14_1310
- **新增(backend)**: 补充文生音乐 (`music.py`) 与文生视频 (`video.py`) 的后端 Mock API 接口，完善 AI 路由体系
- **修复(backend)**: 修复 `run.py` 启动时缺失的 `markdown`、`pdfkit` 与 `pillow` 依赖问题

### 💻 客户端_2026_04_14_1200
- **新增(client_electron)**: 补充文生图、图生图、AI音乐、AI视频的具体UI页面与IPC通信通道
- **重构(client_electron)**: 优化左侧菜单结构，将AI功能与工具分离为折叠组，默认展开AI
- **新增(client_electron)**: 增加助手长回复的折叠/展开功能
- **新增(client_electron)**: 增加用户长文本消息的折叠/展开功能
- **优化(client_electron)**: 增加思考过程中的加载动画状态，优化体验
- **新增(client_electron)**: 增加 react-markdown 渲染，正确显示聊天消息中的 Markdown 格式

### 💻 客户端_2026_04_14_0940
- **新增(client_electron)**: 实现 AI 助手对话的打字机（流式响应）效果，逐字渲染思维链与最终结果
- **优化(client_electron)**: 修复流式数据中 `JSON.parse` 截断导致的粘包报错问题

### 🛠️ 后端_2026_04_14_0940
- **新增(backend)**: 将默认大模型提供商切换为 `deepseek`，接入官方 API 支持 `deepseek-reasoner`
- **修复(backend)**: 修复 DeepSeek 强校验工具名称导致的 `400 Bad Request`，将所有 `.` 替换为 `_`（如 `weather_current`）
- **优化(backend)**: 支持流式请求（`stream=True`）时的思维链和工具调用事件转发

### 💻 客户端_2026_04_14_0855
- **修复(client_electron)**: 移除了第三方 `form-data` 依赖，改用 Node.js 20 内部原生支持的 `FormData` 与 `Blob` 接口，解决 Vite/Rollup 打包时产生的 `[vite]: Rollup failed to resolve import "form-data"` 报错问题

### 🛠️ 后端_2026_04_14_0855
- **修复(backend)**: 修正了 `.env` 中 `MODELSCOPE_API_BASE` 的默认值为 `https://dashscope.aliyuncs.com/compatible-mode/v1`（阿里云百炼兼容端），解决由于旧版域名引发的大模型请求 `[Errno 11001] getaddrinfo failed` DNS 解析错误

### 💻 客户端_2026_04_14_0840
- **新增(client_electron)**: 新增 `AI 对话` 界面，支持与后端 Agent 交互并解析展示思维链（CoT）推理过程
- **新增(client_electron)**: 在主进程服务层实现 `agent_service.ts` 及对应的 `agent:chat` IPC 调用

### 🛠️ 后端_2026_04_14_0840
- **新增(backend)**: `.env.example` 中增加 `Qwen/Qwen3.5-0.8B` 作为默认魔塔社区测试模型
- **优化(backend)**: 优化 `openai_client.py` 逻辑，支持配置读取区分 `openai` 与 `modelscope` 并兼容解析模型返回的 `reasoning_content`
- **优化(backend)**: 优化 `executor.py` 和 `agent.py`，支持捕获多轮工具调用中的思维链并返回给前端展示

### 🛠️ 后端_2026_04_14_0831
- **修复(backend)**: 修复 `tools.py` 等文件中不符合项目 `snake_case` 命名规范的 API 路由，将 `-`（中划线）彻底替换为 `_`（下划线）
- **修复(backend)**: 修复了 `tools.py` 路由依赖注入导致 `Depends in Annotated` 的 AssertionError

### 💻 客户端_2026_04_14_0812
- **新增(client_electron)**: `tools.ts` 服务层增加文件转换和压缩等相关接口请求，在 IPC 和 `preload` 层注册对应事件
- **新增(client_electron)**: `Sidebar` 增加 `工具箱` 入口页面，前端实现与后端的交互：Markdown 转 PDF、多文件 ZIP 压缩、图片压缩的上传测试入口

### 🛠️ 后端_2026_04_14_0812
- **新增(tools)**: 增加 `ToolsAPI` 类，实现 `md-to-pdf`、`compress-image` 和 `compress-zip` 的逻辑，并注册到 `/api/tools/` 路由
- **增强(tools)**: 工具接口实现处理结果自动上传至 S3 服务，并利用 S3 预签名机制，生成仅 5 分钟有效的访问链接返回给前端

### 💻 客户端_2026_04_13_2140
- **增强(client_electron)**: `auth.ts` 服务层增加 Token 持久化与 Axios 请求拦截器，实现自动携带 `Authorization` 头，方便后续受保护接口调用
- **新增(client_electron)**: `auth.ts` 增加 `logout` 方法并在 IPC 暴露 `auth:logout` 通道，在侧边栏实现完整的登出功能（清理服务端状态与本地 Token）

### 🛠️ 后端_2026_04_13_2135
- **修复(auth)**: 修复 `login.py` 中由于数据库模型更新导致 `user` 实体错误调用 `t_` 前缀属性而引起的 `AttributeError` 异常

### 💻 客户端_2026_04_13_2125
- **修复(client_electron)**: 修复由于未创建默认管理员导致登录出现 401 `用户名或密码错误` 的问题，并在后端执行 `init_db.py --create-admin` 初始化数据
- **优化(client_electron)**: 解决 `env.d.ts` 与 `app.tsx` 的类型冲突问题，使 `pnpm build` 能够顺利通过编译并完成打包
- **优化(client_electron)**: 将默认管理员账号 `admin` 与密码 `admin123` 直接固化至登录界面的初始状态中，方便开发测试

### 💻 客户端_2026_04_13_2113
- **重构(client_electron)**: 完善 `Login` 与 `Register` 页面组件，接入真实的 IPC 接口 `auth_login` 与 `auth_register`，并处理后端 API 错误提示
- **新增(client_electron)**: 注册表单新增 `email` 字段以适配后端接口要求，并更新 `use_auth_store` 状态保存逻辑
- **修复(client_electron)**: 更新 `auth.ts` 服务层与 `Settings` 页面的默认后端 API 端口为真实的 `5666`

### 💻 客户端_2026_04_13_2105
- **新增(client_electron)**: 实现系统托盘双击呼出主窗口的功能
- **新增(client_electron)**: 新增 `Platform` 层的 `ConfigStore` 配置服务，用于基于本地 JSON 文件持久化存储应用设置
- **新增(client_electron)**: 完善 `Settings` 系统设置页面，接入 `config:get` 与 `config:set` IPC 接口，实现后端 API 服务器地址的本地存储

### 💻 客户端_2026_04_13_2055
- **新增(client_electron)**: 配置 nsis 打包规则，补充开始菜单快捷方式生成以及完善的 Windows 卸载程序配置
- **修复(client_electron)**: 修复打包后自定义 TitleBar 上的图片图标由于绝对路径 `/kity.svg` 导致的加载失败碎图问题

### 💻 客户端_2026_04_13_2045
- **修复(client_electron)**: 配置 `kity_16.ico` 专门用于系统托盘图标，配置 `kity_256.ico` 用于应用主窗口图标及 electron-builder 打包图标

### 💻 客户端_2026_04_13_2040
- **新增(client_electron)**: 实现左侧边栏 (Sidebar) 的折叠与展开功能，自适应隐藏文字保留图标
- **修复(client_electron)**: 修复由于 V8 垃圾回收导致的系统托盘 (Tray) 图标消失问题，并成功加载 `kity.png` 作为真实托盘图标

### 💻 客户端_2026_04_13_2030
- **新增(client_electron)**: 配置 `app.requestSingleInstanceLock()` 保证应用单例运行，重复打开时弹窗提示并聚焦主窗口
- **修复(client_electron)**: 禁用 GPU 磁盘缓存 (`disable-gpu-shader-disk-cache`) 以修复开发环境下 `cache_util_win.cc(20)` 报错
- **重构(client_electron)**: 迁移包管理器至 pnpm，删除 `package-lock.json` 并配置淘宝镜像源

### 💻 客户端_2026_04_13_2015
- **重构(client_electron)**: 将桌面客户端默认主题从深色模式修改为 Win11 亮色主题，应用全白背景与微边框设计
- **新增(client_electron)**: 使用 `kity.svg` 替换默认应用图标与顶栏图标

### 🎨 前端_2026_04_13_2015
- **新增(frontend_next)**: 使用 `kity.svg` 作为默认图标配置

### 📚 规范(skills)_2026_04_13_2015
- **新增(skills)**: 补充“测试文件应写到测试文件夹下, 临时验证脚本使用后必须立即删除”的项目规范

### 📚 规范(skills)_2026_04_13_2005
- **新增(skills)**: 增加绝对禁止上传测试脚本 (如 `check_comments.py`) 及大于 500MB 文件的强制约束, 更新全局 `.gitignore`

### 📚 docs(project)_2026_04_13_1955
- **新增(docs)**: 补充 backend, frontend_next, client_electron 各子模块的 README 文档, 并更新根目录 README
- **修复(frontend_next)**: 修复 frontend_next 被错误识别为子模块的问题, 并将其代码提交推送至 wuhao 分支

### 💻 客户端_2026_04_13_1945
- **新增(client_electron)**: 在主进程 `main/index.ts` 中集成系统托盘 (Tray) 并在窗口配置中启用无边框样式 (`titleBarStyle: 'hidden'`)
- **重构(client_electron)**: 按照 Win11 Fluent Design 风格全面重构 UI，使用暗色 Mica 背景 (`#202020`) 与蓝色主题色，并增加自定义可拖拽顶栏 (`TitleBar`)

### 💻 客户端_2026_04_13_1932
- **修复(client_electron)**: 修复打包后应用出现白屏的问题，修正 Vite 生产环境相对路径 (`base: './'`) 及 Main 进程 HTML 加载路径

### 💻 客户端_2026_04_13_1814
- **新增(client_electron)**: 引入 `react-router-dom`、`zustand` 和 `lucide-react`，完成前端模块化路由与全局状态配置
- **新增(client_electron)**: 封装 `MainLayout` 与 `Sidebar`（包含仪表盘、设置与登出菜单）
- **新增(client_electron)**: 完成注册与登录页面的搭建，并实现状态保持与路由拦截

### 📚 docs(project)_2026_04_13_1803
- **新增(project)**: README 补充 Conda 后端环境创建指南，新增 `pip install -i https://pypi.tuna.tsinghua.edu.cn/simple` 清华源加速说明

### � 客户端_2026_04_13_1754
- **重构(client_electron)**: 删除冗余的 `desktop_client` 目录，统一桌面端架构为基于 Electron 的 `client_electron` 模块
- **重构(skills)**: 修改 `desktop_client` 审查规范为重定向通知，引导使用者使用 `electron` 的开发规范

### 📚 规范(skills)_2026_04_13_1730
- **新增(skills)**: 全局项目配置规范中追加“绝对禁止上传任何依赖包或构建产物（如 node_modules, .venv 等）”的强约束

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
