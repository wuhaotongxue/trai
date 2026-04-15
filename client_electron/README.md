# TRAI Client

基于 Electron, React 19 和 Vite 的桌面客户端, 采用 Win11 Fluent Design 风格.

## 技术栈

- Electron 29
- React 19
- Vite 5
- TypeScript 5
- Zustand (状态管理)
- React Router DOM (路由)

## 快速开始

### 1. 安装依赖

推荐使用 pnpm 并配置淘宝镜像源加速:

```bash
cd client_electron
pnpm install --registry=https://registry.npmmirror.com
```

### 2. 启动开发模式

```bash
pnpm dev
```

此时会启动 Vite 本地服务器, 并拉起 Electron 窗口加载页面.

### 3. 构建与打包

```bash
pnpm build
```

打包产物位于 `release/` 目录下.

## 架构说明

客户端严格遵循五层架构:
1. `src/renderer/` - React 组件渲染, 用户交互 (UI Layer)
2. `src/preload/` - 桥接 Renderer 与 Main, 安全上下文 (Controller Layer)
3. `src/main/services/` - 业务流程编排 (Service Layer)
4. `src/main/ipc/` - IPC 通道注册与处理 (IPC Layer)
5. `src/main/platform/` - Node.js 原生 API 封装 (Platform Layer)

## 📝 更新日志 (Changelog)

### 💻 客户端_2026_04_14_1716
- **新增(client_electron)**: `Settings` 系统设置页面新增“个人账号设置”标签页，与原有的系统常规设置拆分，集成显示用户信息、头像上传预览以及修改密码的基础 UI 组件交互

### 💻 客户端_2026_04_14_1653
- **新增(client_electron)**: `Settings` 系统设置页面新增“检查更新”与“立即重启并安装”按钮，用户可直观地查看当前应用版本并手动触发 OTA 自动更新流程
- **优化(client_electron)**: 暴露 `app_check_update`、`app_install_update`、`app_get_version` IPC 通道以供渲染进程调用自动更新模块

### 💻 客户端_2026_04_14_1650
- **新增(client_electron)**: `main` 进程中接入 `electron-updater` 模块，配置自动更新 `UpdateService` 服务并指向后端重定向 API
- **优化(client_electron)**: 配合后端解决 S3 预签名 URL 时效限制问题，确保自动下载无缝衔接

### 💻 客户端_2026_04_14_1630
- **重构(client_electron)**: 全局移除 "TRAI Desktop" 及 "客户端" 等冗余称呼，统一应用名称为 "TRAI"，包括包名、窗口标题、系统托盘和各 UI 页面显示

### 💻 客户端_2026_04_14_1500
- **重构(client_electron)**: 重构工具箱卡片头部 UI，将图标、标题和描述从垂直居中堆叠改为水平流式布局（图标居左，标题与描述在右侧堆叠），有效节省卡片垂直空间并提升横向阅读体验

### 💻 客户端_2026_04_14_1455
- **优化(client_electron)**: 改善工具箱“图片格式转换”卡片中“目标大小(KB)”的展示逻辑。现在仅在选择 JPEG 或 WEBP 格式时动态显示该输入框，避免 PNG/BMP 时灰态不可用带来的视觉困惑

### 💻 客户端_2026_04_14_1445
- **新增(client_electron)**: “图片格式转换”工具也同样加入了“目标文件大小(KB)”的自定义选项，支持将转换和压缩一步到位（仅限 JPEG / WEBP 格式）

### 💻 客户端_2026_04_14_1440
- **新增(client_electron)**: “图片压缩”工具卡片新增目标文件大小（KB）设置输入框
- **优化(client_electron)**: “图片压缩”结果现在也能直观显示压缩前后的文件体积对比 (KB/MB)

### 💻 客户端_2026_04_14_1435
- **修复(client_electron)**: 修复工具箱因旧版后端进程未重载导致的新字段 (`original_size`, `converted_size` 等) 无法显示的问题，同时新增 `format_size` 函数，使得结果能够根据体积智能显示为 KB/MB 等格式

### 💻 客户端_2026_04_14_1430
- **修复(client_electron)**: 修复图片转换尺寸输入框在窄屏下 Placeholder 占位符文字被截断溢出的问题，精简了文字并移除了多余的内边距，增加底部提示文字

### 💻 客户端_2026_04_14_1425
- **修复(client_electron)**: 修复工具箱“图片格式转换”卡片中，尺寸输入框因水平布局导致在卡片内溢出的问题，统一调整为上下层叠（Column）布局并优化了 Input 占位符提示

### 💻 客户端_2026_04_14_1420
- **优化(client_electron)**: 图片格式转换工具支持分别指定目标图片的 `宽度` 和 `高度`，并在转换成功后直观显示处理前后的**分辨率尺寸**与**文件大小 (MB)** 对比

### 💻 客户端_2026_04_14_1410
- **新增(client_electron)**: 图片格式转换工具新增可选的目标尺寸参数，支持用户转为 ICO 格式时多选打包尺寸 (如 16, 32, 64 等)；非 ICO 格式支持指定宽高像素值

### 💻 客户端_2026_04_14_1400
- **新增(client_electron)**: 工具箱新增“图片格式转换”工具卡片，支持用户自定义目标格式（PNG, JPEG, ICO, WEBP, BMP）

### 💻 客户端_2026_04_14_1350
- **重构(client_electron)**: 重构工具箱 (`Tools`) 页面，使用卡片式网格布局 (`Grid`) 和 Lucide 图标替换原有的简单按钮列表，提升页面美观度与交互体验

### 💻 客户端_2026_04_14_1345
- **新增(client_electron)**: 侧边栏新增“用户反馈”菜单与界面，提供产品建议与 Bug 报告的入口
- **新增(client_electron)**: 实现反馈提交相关的 IPC 通道与 Service 桥接逻辑

### 💻 客户端_2026_04_14_1310
- **新增(client_electron)**: 聊天界面新增 Agent 选择器，允许用户在当前会话中主动切换并指定进行对话的 Agent
- **优化(client_electron)**: 完善 `management.py` 等后端接口依赖，修复模块导入错误并移除 `ResponseModel` 统一直接返回字典

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

### 💻 客户端_2026_04_14_0855
- **修复(client_electron)**: 移除了第三方 `form-data` 依赖，改用 Node.js 20 内部原生支持的 `FormData` 与 `Blob` 接口，解决 Vite/Rollup 打包时产生的 `[vite]: Rollup failed to resolve import "form-data"` 报错问题

### 💻 客户端_2026_04_14_0840
- **新增(client_electron)**: 新增 `AI 对话` 界面，支持与后端 Agent 交互并解析展示思维链（CoT）推理过程
- **新增(client_electron)**: 在主进程服务层实现 `agent_service.ts` 及对应的 `agent:chat` IPC 调用

### 💻 客户端_2026_04_14_0831
- **修复(client_electron)**: `tools.ts` 中请求路由变更为 `snake_case` 下划线命名风格，与后端一致
- **修复(client_electron)**: `router/index.tsx` 补充缺少的 `Navigate` 导入，修复 `pnpm dev` 时的构建错误

### 💻 客户端_2026_04_14_0812
- **新增(client_electron)**: `tools.ts` 服务层增加文件转换和压缩等相关接口请求，在 IPC 和 `preload` 层注册对应事件
- **新增(client_electron)**: `Sidebar` 增加 `工具箱` 入口页面，前端实现与后端的交互：Markdown 转 PDF、多文件 ZIP 压缩、图片压缩的上传测试入口

### 💻 客户端_2026_04_13_2140
- **增强(client_electron)**: `auth.ts` 服务层增加 Token 持久化与 Axios 请求拦截器，实现自动携带 `Authorization` 头，方便后续受保护接口调用
- **新增(client_electron)**: `auth.ts` 增加 `logout` 方法并在 IPC 暴露 `auth:logout` 通道，在侧边栏实现完整的登出功能（清理服务端状态与本地 Token）

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

### 💻 客户端_2026_04_13_1955
- **新增(client_electron)**: 初始化 Electron 客户端的 README.md 说明文档
