guojin# trai

一个用于实验与沉淀代码片段的小仓库。

## 环境要求

- **后端 Python 环境**: `trai` (Conda) / Python 3.13.13

### 使用 Conda 创建后端环境（推荐使用清华源）

```bash
# 1. 创建 conda 虚拟环境
conda create -n trai python=3.13.13 -y

# 2. 激活环境
conda activate trai

# 3. 设置默认激活环境 (可选)
# 如果你希望每次打开终端时自动激活该环境，可以执行以下命令：
# 对于 PowerShell:
# Add-Content -Path $PROFILE -Value "`nconda activate trai"
# 对于 CMD:
# reg add "HKCU\Software\Microsoft\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "conda activate trai" /f

# 4. 安装依赖（使用清华源加速）
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
- 如有问题, 请联系邮箱: wuhaotongxue@gmail.com

## 贡献

欢迎提交 Issue / PR。

## 📝 更新日志 (Changelog)

### 🛠️ 客户端_2026_04_24_2356
- **fix(login)**: 修复路由配置，app.tsx 正确导入完整路由（router/index.tsx）
- **fix(auth)**: 退出登录时检测 token 是否已清空，避免重复弹出"登录已过期"弹框
- **fix(logout)**: 添加退出动画效果，内容区域淡出缩小后跳转登录页

### 🛠️ 后端_2026_04_24_1525
- **feat(i18n)**: 新增国际化字符串和系统配置数据库模型与仓储 (I18nRepository)
- **feat(i18n)**: 新增 Admin i18n 管理接口，支持翻译字符串的增删改查
- **feat(i18n)**: 新增公开翻译查询接口，支持 namespace 批量拉取
- **feat(notify)**: 新增飞书 AI 事件通知服务，支持文生图和 AI 对话富文本卡片
- **feat(image)**: 新增图片生成配置接口和客户端工厂，统一管理多模型
- **feat(system)**: 新增系统配置和 Schema 文档管理接口

### 💻 客户端_2026_04_24_0100
- **feat(login)**: 重构登录页面 — 左侧精简品牌区（动态光晕+品牌核心），右侧悬浮表单卡片居中，全方位交互反馈（点击缩放/focus 阴影）

### 💻 客户端_2026_04_24_0040
- **feat(login)**: 重构登录页面 — 左侧功能特性卡片（6大功能+图标+描述+hover动效），右侧紧凑表单，国际化中英双语

### 💻 客户端_2026_04_24_0020
- **feat(chat)**: 增强聊天输入框 — 快速命令建议、字符统计、输入框自适应高度
- **feat(chat)**: 美化空状态引导卡片 — 品牌图标 + 快捷按钮引导
- **feat(register)**: 密码可见切换、强度指示器（三色条）、确认密码实时验证
- **feat(ThreePanelLayout)**: 增强面板展开收起动画 — cubic-bezier 过渡、hover 上浮效果

### 💻 客户端_2026_04_24_0010
- **perf(sidebar)**: 添加导航项活跃指示器条与错落下沉入场动画
- **perf(title_bar)**: 增强按钮悬停效果 — 上浮与阴影过渡
- **perf(app)**: 优化加载页面 — 进度条动画替代圆点指示器

### 💻 客户端_2026_04_23_2355
- **refactor(chat)**: 重构 AgentChat 页面 — 1362 行为 5 个子组件，修复 JSX 嵌套错误
- **feat(i18n)**: 新增 i18n.ts 国际化模块，dashboard/feedback/media 等页面全面接入
- **feat(animation)**: 增强 global.css 动画系统，Google Material Design 风格
- **feat(login)**: 美化 login/register 页面过渡动画
- **fix(media)**: 规范 media/processor.tsx 变量命名

### 🛠️ 系统更新_2026_04_23_2110
- [前端] **规范(skill)**: 执行 frontend_next SKILL 代码审查，修复 dialog.tsx 文件头描述泛化问题
- [前端] **规范(skill)**: 修复 admin 仪表盘 page.tsx 缺少规范文件头的问题

### 🛠️ 系统更新_2026_04_23_2018
- [前端] **工具分类完善**: 重新组织工具分类，格式转换分类包含MD转PDF、Word转PDF、PDF转Word、Excel转换、图片格式转换；新增其他工具分类包含JSON检测
- [前端] **媒体处理页面**: 将添加按钮从右侧移动到左侧，优化用户体验
- [前端] **工具页面**: 调整右侧内容区域宽度，避免内容溢出
- [后端] **工具服务**: 实现Word与PDF互转功能，Excel转换功能
- [后端] **AI对话**: 添加多模态支持，支持文件上传
- [后端] **周报功能**: 实现AI周报生成功能

### �� 客户端_2026_04_23_0906
- **perf(knowledge_base)**: 知识库页面组件优化，使用React.memo和useCallback减少重渲染
- **perf(virtual_list)**: 文件列表实现虚拟滚动，使用react-window库优化长列表渲染性能
- **perf(main_process)**: 主进程启动优化，延迟初始化UpdateService到窗口加载完成后
- **perf(ipc)**: IPC通信优化，实现请求缓存和批处理功能
- **perf(network)**: 网络请求优化，实现请求缓存和节流
- **perf(monitoring)**: 新增性能监控和错误处理模块

### 💻 客户端_2026_04_23_1200
- **feat(media_player)**: 媒体播放器支持文件夹结构显示，实现文件夹展开/折叠功能
- **feat(media_player)**: 优化媒体文件选择逻辑，支持按文件夹层级展示媒体文件
- **feat(media_player)**: 改进播放控制逻辑，支持在文件夹结构中切换媒体文件

### 🛠️ 系统更新_2026_04_22_1515
- [前端] **Agent UI 升级**: 实现了类似 DeepSeek 的左侧会话历史侧边栏, 支持会话切换、重命名与删除
- [前端] **公式渲染**: 修复了对话中的数学公式渲染问题, 支持 KaTeX 标准 LaTeX 语法
- [后端] **会话管理**: 新增会话重命名接口, 优化会话列表排序与删除逻辑
- [后端] **发布管理**: 实现客户端 EXE 上传功能, 修复 S3 下载链接并升级飞书通知为富文本卡片格式

### 🛠️ 后端_2026_04_22_1447
- **fix(导入)**: 修复 backup_service.py 中的 S3Storage 导入错误，改为 S3StorageService
- **feat(备份)**: 新增数据库备份服务，支持 pg_dump 备份和 S3 上传
- **feat(发布)**: 新增客户端发布管理功能
- **fix(前端)**: 修复前端 lint 和类型检查错误
- **feat(界面)**: 优化客户端界面，添加默认测试内容和清空按钮

### 🛠️ 后端_2026_04_22_0845
- **feat(权限)**: 移除知识库接口中不必要的管理员限制，允许普通企业微信人员创建个人的私有知识库
- **feat(同步)**: 增加提升角色的自动化脚本 `elevate_user_role.py`，支持一键将企业微信用户升级为 admin
- **fix(同步)**: 优化企业微信组织架构同步流程，遇到权限不足 (60011) 报错时自动降级为子部门遍历拉取，并输出详细到人名的拉取进度日志
- **fix(同步)**: 处理并优雅拦截企业微信 IP 不在白名单 (60020) 错误，防止无效轮询导致服务卡死


### 💻 客户端_2026_04_21_2006
- **修复(ui)**: 恢复侧边栏用户头像和用户名的显示
- **修复(auth)**: 企业微信扫码登录窗口隐藏系统菜单栏以提升沉浸感

### 💻 客户端_2026_04_21_2001
- **新增(client_electron)**: 集成企业微信扫码登录功能，打通后端 auth_wecom_url 获取和 Token 拦截回调
- **新增(client_electron)**: 登录页增加“保存登录状态(免扫码)”功能，并在应用启动时自动检测并恢复用户状态

### 🛠️ 后端_2026_04_21_1941
- **修复(auth)**: 修复 FastAPI 启动时因 wecom_callback 路由参数 Request | None 导致的 Pydantic 解析崩溃
- **新增(auth)**: 新增 sys_users 表数据同步至 t_users 表的脚本，解决企业微信登录未绑定账号问题

### 🎨 前端_2026_04_21_1941
- **配置(build)**: Next.js 开启 output: 'export' 以支持纯静态部署
- **修复(nginx)**: 重写 Nginx 配置文件以支持纯静态托管并修复 try_files 循环重定向及 404 问题

### 🛠️ 后端_2026_04_21_1729
- **feat(wecom_sync)**: 新增企业微信用户同步脚本, 支持从根部门同步并落库
- **refactor(user_repo)**: 增加企业微信用户创建或更新方法, 统一落库入口

### 🛠️ 后端_2026_04_21_1649
- **refactor(api)**: 后端路由前缀切换为 /api_trai/v1, 通过 API_PREFIX 统一挂载
- **fix(wecom)**: 企业微信回调地址跟随 API_PREFIX 生成, 避免回调路径不一致
- **refactor(error)**: TraiException 增加结构化日志字段, 全局异常处理中间件统一输出

### 🎨 前端_2026_04_21_1649
- **refactor(api_base)**: 默认 API Base 切换为 /api_trai/v1, 登录页与 SSE 流式请求同步更新

### 💻 客户端_2026_04_21_1649
- **refactor(api)**: 桌面端接口路径表统一切换为 /api_trai/v1 前缀

### 🛠️ 系统更新_2026_04_21_1138
- [交互] 恢复右下角 AI 助手为当前页弹窗模式，支持右上角一键在新标签页中展开
- [模型] AI 对话助手默认对接后台 DeepSeek 模型，并默认使用空知识库状态

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

### � 规范(skills)_2026_04_20_1646
- **chore(skills)**: 更新后端开发规范, 完善 Python 文件头模板与 Docstring 要求

### �🛠️ 后端_2026_04_20_1147
- **feat(login)**: 优化登录接口错误处理, 添加详细的超时和连接错误提示
- **fix(database)**: 修复数据库连接配置, 支持 PostgreSQL 和 SQLite 自动回退
- **refactor(tools)**: 简化 PDF 生成器, 移除 WeasyPrint 和 pdfkit 依赖, 仅保留 Playwright
- **chore(deps)**: 更新 requirements.txt, 移除 weasyprint 和 pdfkit
- 全局替换 src/api/routers 中对 Depends(get_session) 的调用为 Depends(get_db_session)
- 新增 docs/postgresql_lock_issue.md 指南文档，提供锁死排查方法和僵尸进程清理 SQL

### 💻 客户端_2026_04_19_2241
- **feat(theme)**: 顶栏新增浅色/深色切换(太阳/月亮), 并持久化保存
- **feat(tools)**: MD 转 PDF 支持 Markdown 预览与转换结果 PDF 预览
- **feat(ai)**: 图生图支持本地图片上传, 自动转 data URL 并预览
- **feat(dashboard)**: 性能折线图刷新间隔调整为 2s, 新增 GPU 名称展示
- **refactor(ui)**: 抽取 should_ellipsis/to_fixed_chars 工具并统一四字风格文案

### 🛠️ 后端_2026_04_19_2241
- **feat(ai)**: 新增 /api/ai/image_to_image 图生图接口, 支持接收 image_url 或 data URL

### 💻 客户端_2026_04_19_2159
- **feat(platform)**: 新增系统信息获取接口 get_system_info 和系统指标监控 get_system_metrics
- **feat(ipc)**: 注册 system:get_info 和 system:get_metrics IPC 处理器
- **feat(tools)**: 工具箱页面支持 Markdown 转 PDF 功能
- **优化(layout)**: 优化三栏布局组件和侧边栏组件
- **优化(ui)**: 优化 AI 创作页面布局（文生图、图生图、音乐、视频）
- **优化(dashboard)**: 优化仪表盘页面布局
- **优化(feedback)**: 优化反馈页面布局

### 🛠️ 后端_2026_04_19_2132
- **fix(ruff)**: 修复 tools.py 条件导入 Playwright/WeasyPrint/pdfkit 的未使用警告，添加 noqa 标记
- **fix(ruff)**: 修复 weather.py 未使用变量 lang，添加 noqa 标记

### 💻 客户端_2026_04_19_1109
- **fix(layout)**: 统一所有页面左侧栏折叠按钮图标为PanelLeftClose
- **fix(layout)**: 在中间栏标题栏添加左侧栏展开按钮，保持三个标题栏高度一致
- **fix(settings)**: 修复设置页面右侧标题栏高度问题，移除justifyContent: 'space-between'
- **fix(agent)**: 添加PanelLeftClose导入，修复未定义错误
- **fix(tools)**: 添加PanelLeftClose导入，修复未定义错误

### 💻 客户端_2026_04_19_1019
- **feat(text_to_image)**: 添加左侧风格分类栏（动物/城市/风景/人物），使用不同图标
- **feat(image_to_image)**: 添加左侧风格分类栏（科幻/艺术），使用不同图标
- **feat(music)**: 添加左侧音乐分类栏（现代/古典），使用不同图标
- **feat(video)**: 添加左侧视频分类栏（城市/自然），使用不同图标
- **优化(ai)**: 所有AI页面点击左侧分类时自动填充该分类的第一个模板到右侧输入框
- **优化(ai)**: 所有AI页面添加右侧标题栏标题

### 💻 客户端_2026_04_19_0940
- **优化(knowledge)**: 统一知识库三个标题栏按钮样式、padding和图标大小
- **优化(knowledge)**: 调整搜索框高度至28px，与按钮高度一致
- **优化(knowledge)**: 调整上传文件按钮padding，适配标题栏高度
- **优化(knowledge)**: 统一底部按钮区域padding，与右侧分页区域对齐
- **fix(chat)**: 修复工具调用步骤状态显示，当tool_result返回后更新tool_start状态为已完成
- **fix(chat)**: 修复工具调用图标显示逻辑，已完成状态不再显示转圈

### 💻 客户端_2026_04_19_0812
- **优化(agent)**: Agent管理页面新建按钮样式改为虚线边框，与AI对话页面保持一致
- **优化(agent)**: Agent列表图标支持Settings和Code选项
- **优化(agent)**: Agent管理页面布局改为与AI对话一致，按钮移至列表下方
- **优化(layout)**: 统一所有页面顶部标题栏样式，标题栏横跨整个宽度，与AI对话页面保持一致
- **优化(icon)**: AI对话页面Agent列表图标根据名称显示不同图标（代码/计算器/天气/默认）
- **优化(menu)**: 侧边栏导航菜单结构调整，修复工具箱重复问题，为仪表盘和知识库添加子目录
- **优化(ui)**: 移除设置与退出之间的分割线，退出按钮移至菜单底部
- **优化(ui)**: 所有页面按钮和面板宽度改为百分比，提升自适应能力
- **优化(chat)**: 会话标题重命名功能，限制4个字符，禁止特殊符号和标点
- **优化(knowledge)**: 修复知识库重复默认分类问题，按钮名称简化为"分类"和"知识库"
- **优化(ui)**: 整体界面底部添加版权信息栏和分割线
- **优化(ui)**: 注释掉侧边栏用户名和头像显示
- **优化(ui)**: 导航菜单和右侧标题栏保持水平对齐
- **优化(knowledge)**: 知识库创建时间改为鼠标悬浮显示

### 💻 客户端_2026_04_19_0439
- **优化(ui)**: 优化 AI 视频生成、AI 周报生成、Dashboard 页面布局，统一设计风格与其他 AI 创作页面保持一致

### 💻 客户端_2026_04_19_0427
- **优化(ui)**: 优化 AI 创作页面（文生图、图生图、AI音乐、ComfyUI、周报、视频）布局，增加内容宽度、高度和元素间距，提升用户体验
- **修复(merge)**: 修复合并问题，恢复 AI 对话页面、Agent 管理页面的正确代码
- **修复(api_url)**: 修复 api_url.ts 中的正则表达式错误
- **优化(naming)**: 文件和路径命名统一 snake_case，移除 kebab-case

### 🛠️ 后端_2026_04_19_0302
- **修复(weather)**: 天气工具完全恢复到 commit 9ae0c25 版本，确保使用 Open-Meteo 免费 API，优化异常处理和详细日志
- **修复(merge)**: 修复合并问题，恢复之前提交的正确代码，包括流式工具调用、Agent 系统提示词等功能

### 💻 客户端_2026_04_19_0302
- **修复(utils)**: 修复 `api_url.ts` 中的正则表达式错误，从 `/$+/` 修正为 `/\/+$/`
- **规范(naming)**: 统一文件和目录命名为 snake_case，禁止 kebab-case
- **修复(router)**: 更新路由配置和侧边栏导航，路径从 `text-to-image` 改为 `text_to_image`
- **新增(skills)**: 创建命名规范 skill（naming-convention），规范文件和目录命名
- **新增(skills)**: 创建代码注释自动添加 skill（code-commenter），规范代码注释

### 🎨 前端_2026_04_19_0210
- **优化(naming)**: 文件和路径命名统一 snake_case，移除 kebab-case
- **优化(comments)**: 为 Todo Store、Agent Store、API Client 等核心文件添加详细的 JSDoc 注释

### 🛠️ 后端_2026_04_19_0210
- **修复(tool_calls)**: 修复流式工具调用中 tool_name 可能为空的问题，在任何 tool_call chunk 中发现有 function.name 时都更新 tool_name
- **修复(tool_calls)**: 修复同 tool_call_id 可能被重复添加到 tool_calls 数组的问题，并增加替换逻辑，优先保留非空参数或内容更长的版本
- **修复(weather)**: 天气工具集成 Open-Meteo 地理编码 API，支持任意城市（中文/英文/拼音），移除预设城市列表的限制
- **修复(weather)**: 改进天气工具参数解析，即使参数为空也有合理的默认城市处理
- **优化(logging)**: 在 openai_client.py 和 executor.py 中增加详细的 tool_call 相关日志，便于调试问题

### 💻 客户端_2026_04_19_0210
- **优化(tools)**: 优化工具调用步骤展示，过滤空内容和重复步骤，提升用户体验
- **修复(tool_execution)**: 修复工具执行状态显示问题，确保执行中、成功、失败状态正确切换

### ️ 后端_2026_04_19_0040
- **修复(agent)**: AgentExecutor 现在会根据 context.agent_id 自动添加对应的系统提示词
- **优化(agent)**: 天气助手系统提示词优化，更明确地要求使用 weather_current 工具并正确传递参数

### 💻 客户端_2026_04_19_0030
- **优化(chat)**: AI对话页面只显示运行中的Agent（stopped状态不显示）
- **优化(knowledge_base)**: 知识库下拉框宽度优化，选项高度调整
- **修复(upload)**: 修复文件上传失败问题，支持PDF/Word/Excel等二进制文件
- **优化(tools)**: 优化工具调用步骤展示，根据success状态显示不同颜色

### 🛠️ 后端_2026_04_19_0030
- **功能(agent)**: 新增计算器Agent（agent-calculator）和天气助手Agent（agent-weather），默认运行
- **功能(search)**: 集成DuckDuckGo免费搜索，无需API Key
- **优化(weather)**: 移除天气工具mock fallback，直接使用wttr.in免费接口
- **修复(knowledge_base)**: 简化知识库权限检查，允许非超级管理员访问所有知识库
- **优化(dependencies)**: 新增duckduckgo-search依赖

### 💻 客户端_2026_04_19_0020
- **功能(agent)**: 新增默认 Agent，AI 对话打开时自动选择默认 Agent
- **优化(agent)**: AI 对话左侧显示所有可用 Agent（包括 stopped 状态），并显示状态指示器
- **功能(agent)**: Agent 管理页面添加编辑功能，支持修改名称、描述、模型、系统提示词和图标
- **优化(agent)**: 为默认 Agent 添加系统提示词，让 AI 角色更明确
- **优化(tools)**: 工具箱页面默认选择第一个工具，切换分类时自动选择该分类的第一个工具

### 🛠️ 后端_2026_04_19_0020
- **功能(agent)**: 新增默认 Agent（agent-default），全能型助手
- **功能(agent)**: 新增 `/api/agent/management/update` 接口，支持更新 Agent 信息
- **优化(agent)**: Agent 数据结构新增 `icon` 和 `system_prompt` 字段
- **优化(agent)**: 注册和更新接口支持保存图标和系统提示词

### 💻 客户端_2026_04_18_1630
- **优化(knowledge_base)**: 知识库名称统一去除用户名前缀显示，前缀仅用于后台权限区分
- **优化(knowledge_base)**: 重命名和删除操作增加确认弹框，防止误操作
- **优化(knowledge_base)**: 右侧主区域增加移动按钮，位于重命名左侧

### 💻 客户端_2026_04_18_1600
- **功能(login)**: 登录界面美化，账号默认显示 `wuhao`，密码从后台数据库获取并自动填充
- **功能(log)**: 新增全局日志按钮，支持弹出卡片查看系统日志，包含刷新、清除、关闭操作
- **优化(title_bar)**: 标题栏支持窗口拖拽，刷新和日志按钮位于左侧
- **优化(knowledge_base)**: 知识库支持移动到不同分类，重命名和删除增加确认弹框
- **修复(typescript)**: 修复 `WebkitAppRegion` 类型错误，改用 CSS 类名方式实现拖拽

### 💻 客户端_2026_04_18_1530
- **功能(login)**: 密码字段默认显示为 `***************`，用户点击输入框或显示密码时自动切换

### 💻 客户端_2026_04_18_1450
- **安全(security)**: demo 账号改为从后台接口获取 AES 加密密码，客户端解密后自动填充

### 🛠️ 后端_2026_04_18_1450
- **安全(security)**: 新增 `/api/auth/demo` 接口返回 demo 账号加密密码

### 💻 客户端_2026_04_18_1045
- **安全(security)**: 移除客户端硬编码默认密码，用户必须手动输入密码

### 🛠️ 后端_2026_04_18_1045
- **安全(security)**: init_db.py 移除硬编码密码，改为从环境变量 ADMIN_PASSWORD 读取

### 💻 客户端_2026_04_18_1000
- **优化(knowledge_base)**: 移除知识库名称中的用户名前缀，使界面更加整洁
- **优化(layout)**: 调整侧边栏宽度设置，确保在窗口缩小时能够自动调整
- **优化(responsive)**: 添加弹性布局和溢出处理，确保所有内容都能正常显示
- **修复(typescript)**: 修复所有类型错误，确保代码的类型安全

### 🔐 账号_2026_04_17_2257
- **新增(admin_user)**: 管理后台新增创建用户接口, 支持创建 `wuhao` 等账号用于登录
- **修复(password)**: 修复修改密码接口无法更新密码哈希导致 500 的问题
- **隔离(knowledge_base)**: 非超级管理员仅可访问自己前缀知识库, 避免跨账号查看

### 🎨 前端_2026_04_17_2215
- **规范(a11y)**: 后台通知与设置页补齐按钮与表单控件可访问名称, 避免 Microsoft Edge Tools/axe 报错

### 💻 客户端_2026_04_17_2154
- **优化(knowledge_base)**: 分页栏固定不滚动, 文件列表区域支持独立滚动
- **修复(knowledge_base)**: 分页每页数量切换立即生效, 支持跳转页码与加载态遮罩
- **规范(a11y)**: 补齐表单控件可访问名称, 统一 button type, 并减少部分内联样式告警

### 🛠️ 后端_2026_04_17_2154
- **修复(knowledge_base)**: 文件分页支持 page_size 大于 10, 自动多页拉取并切片返回
- **规范(docstring)**: 知识库路由与服务补齐 class/def docstring, 便于维护与交付

### 📚 规范(skills)_2026_04_17_2154
- **规范(changelog)**: 后端与客户端提交前强制更新对应 README Changelog
- **规范(a11y)**: 前端与客户端增加 Microsoft Edge Tools/axe 可访问性自检条目

### 📚 文档_2026_04_17_1709
- **新增(md)**: 新增第5期文档 `md/issue_05/index.md`, 记录管理后台, 环境部署与知识库能力闭环

### 💻 客户端_2026_04_17_1702
- **修复(knowledge_base)**: 文件列表改为服务端分页并修复翻页状态
- **优化(login)**: 登录页默认配置与错误提示文案优化, 支持密码显隐
- **优化(ux)**: 新建知识库增加创建中加载提示, AI 周报入口临时屏蔽

### 🛠️ 后端_2026_04_17_1702
- **修复(knowledge_base)**: 分页接口返回正确 total, 支持稳定翻页

### 🎨 前端_2026_04_17_1702
- **修复(admin)**: 修复下拉菜单分组 Label 组件上下文报错

### 📚 规范(skills)_2026_04_17_1702
- **整理(docs)**: 将版本发布指南与打包流程迁移到 skills 文档, 清理仓库内临时脚本

### 💻 客户端_2026_04_16_1433
- **新增(knowledge_base)**: 接入阿里云百炼知识库列表、重命名、删除与文件上传(文本)接口
- **优化(knowledge_base)**: 无分类知识库自动归入“默认类目”，兼容百炼首字母大写字段解析

### 🛠️ 后端_2026_04_16_1433
- **新增(knowledge_base)**: 新增百炼知识库增删改查全套接口，支持分类拉取(失败降级)、知识库列表、重命名、删库删文件与文本上传解析
- **修复(knowledge_base)**: 修复百炼返回结果首字母大写导致的解析为空问题，增强字段兼容性
- **新增(test)**: 增加 Python 直连与工作流自测脚本，确保核心知识库操作脱离客户端也可独立验证

### 🛠️ 后端_2026_04_16_0934
- **修复(db)**: 数据库配置同时兼容 `POSTGRES_*` 与 `.env` 的 `DB_*`，并在连接失败时打印隐藏密码后的错误日志
- **修复(sqlite)**: 兼容 SQLite 自增主键写入，避免初始化默认 admin 时登录接口返回 500
- **新增(test)**: 增加 PostgreSQL 账号密码直连验证测试用例，便于快速排查连接问题

### 🎨 前端_2026_04_16_0934
- **修复(api_base)**: 未配置 `NEXT_PUBLIC_API_BASE` 时，自动使用当前页面 hostname 推导后端地址，支持局域网访问
- **修复(hydration)**: 修复管理后台下拉菜单触发器按钮嵌套导致的 hydration error
- **优化(lint)**: 清理未使用变量与 `<img>` 规则告警，并补齐流式接口的 API Base 推导逻辑

### 🛠️ 后端_2026_04_15_2112
- **新增(knowledge_base)**: 新增百炼知识库 Demo 创建接口 `/api/admin/knowledge_base/demo_create`，返回 IndexId/FileId/JobId 并轮询任务状态
- **新增(env)**: `.env.example` 补齐百炼知识库 OpenAPI 的环境变量说明与示例占位
- **优化(db)**: 启动时数据库连不上 PostgreSQL 自动回退本地 SQLite，并补齐用户表字段避免登录 500

### 🛠️ 后端_2026_04_15_1641
- **新增(wecom)**: 增加企业微信组织架构同步用例，补齐部门实体、接口与仓储实现
- **新增(api)**: 增加组织管理与企业微信登录相关路由，完善用户模型与 JWT 逻辑
- **修复(ruff)**: 修复同步与企业微信工具模块的 Lint 问题并统一格式

### 🎨 前端_2026_04_15_1641
- **新增(wecom)**: 增加企业微信登录回调页面与路由，补齐登录链路与页面结构
- **优化(lint)**: 执行 eslint --fix 统一格式并清理可自动修复的问题

### 🎨 前端_2026_04_15_1000
- **修复(frontend_next)**: 修复登录页表单提交导致的客户端路由问题，优化表单体验，并根据角色不同(`admin` 或 `user`) 登录后分别跳转后台或工作台
- **修复(frontend_next)**: 修复 Next.js WebSocket 及热更新在局域网下的 `403 Forbidden` 问题，通过配置 `allowedDevOrigins` 支持内网 IP 访问

### 💻 客户端_2026_04_15_0950
- **新增(knowledge-base)**: 新增知识库管理页面，并在文件列表增加“重命名/移动”专属列与按钮对齐样式
- **重构(client_electron)**: 批量更新客户端侧边栏及多个 AI、工具、设置页面的 UI 组件与布局
- **重构(skills)**: 更新 `electron` 与 `start-services` 技能配置

### 🛠️ 后端_2026_04_15_0940
- **修复(backend)**: 修复 `run.py` 环境变量导入路径及 `api` 模块无法找到的问题
- **修复(backend)**: 修复 `client_release.py` 和 `update.py` 中异步 Session 导入及使用的错误
- **修复(backend)**: 修复 `ruff check` 报告的类型注解等格式规范问题
- **修复(backend)**: 修改依赖 `requirements.txt` 以补充缺少的 redis 等环境
- **规范(backend)**: 增加 `conda activate` 必须先执行的强制启动规范记忆

### 🎨 前端_2026_04_15_0940
- **修复(frontend_next)**: 执行 `eslint --fix` 修复无用变量等 Lint 警告

### 🎨 前端_2026_04_14_1750
- **新增(changelog)**: 将 `/changelog` 占位页重构为真实的更新日志页面，采用左侧时间轴设计，按版本 (v0.1.0 ~ v0.4.0) 展示所有迭代与功能进化，并增加多彩的类型标签 (feat/fix/refactor/docs)

### 💻 客户端_2026_04_14_1728
- **新增(client_electron)**: 新增 "AI 周报生成" 功能页面，支持用户上传历史周报模板（Markdown/TXT/DOCX），输入当周工作描述，AI 自动基于模板格式生成新周报，并支持在线修改和下载保存

### 💻 客户端_2026_04_14_1723
- **新增(client_electron)**: 用户反馈页面新增附件上传功能，支持选择最多 3 个文件（如图片、文档等），单文件限制 5MB，并可直观地预览和移除选中的附件

### 🎨 前端_2026_04_14_1717
- **新增(docs)**: 补充 `/docs/api` (API 接口文档) 页面，采用全宽视觉布局，展示核心 API (如登录、对话、工具调用等) 概览，并嵌入后端 Swagger 交互文档链接与 Shell 调用示例

### 💻 客户端_2026_04_14_1716
- **新增(client_electron)**: `Settings` 系统设置页面新增“个人账号设置”标签页，与原有的系统常规设置拆分，集成显示用户信息、头像上传预览以及修改密码的基础 UI 组件交互

### 💻 客户端_2026_04_14_1653
- **新增(client_electron)**: `Settings` 系统设置页面新增“检查更新”与“立即重启并安装”按钮，用户可直观地查看当前应用版本并手动触发 OTA 自动更新流程
- **优化(client_electron)**: 暴露 `app_check_update`、`app_install_update`、`app_get_version` IPC 通道以供渲染进程调用自动更新模块

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

### 📚 项目(docs)_2026_04_14_1634
- **新增(md)**: 新增 `md/issue_04/index.md`，总结本期 Electron 架构重生、思维链落地、官网全宽重构与后台动态关系图谱等核心内容

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

### 🛠️ 后端_2026_04_21_1941
- **修复(auth)**: 修复 FastAPI 启动时因 wecom_callback 路由参数 Request | None 导致的 Pydantic 解析崩溃
- **新增(auth)**: 新增 sys_users 表数据同步至 t_users 表的脚本，解决企业微信登录未绑定账号问题

### 🎨 前端_2026_04_21_1941
- **配置(build)**: Next.js 开启 output: 'export' 以支持纯静态部署
- **修复(nginx)**: 重写 Nginx 配置文件以支持纯静态托管并修复 try_files 循环重定向及 404 问题

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

### 💻 客户端_2026_04_13_1754
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
