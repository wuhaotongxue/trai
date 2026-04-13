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

```bash
cd client_electron
npm install
```

### 2. 启动开发模式

```bash
npm run dev
```

此时会启动 Vite 本地服务器, 并拉起 Electron 窗口加载页面.

### 3. 构建与打包

```bash
npm run build
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

### 💻 客户端_2026_04_13_2015
- **重构(client_electron)**: 将桌面客户端默认主题从深色模式修改为 Win11 亮色主题，应用全白背景与微边框设计
- **新增(client_electron)**: 使用 `kity.svg` 替换默认应用图标与顶栏图标

### 💻 客户端_2026_04_13_1955
- **新增(client_electron)**: 初始化 Electron 客户端的 README.md 说明文档
