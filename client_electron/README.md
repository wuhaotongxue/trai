# TRAI Desktop Client

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
