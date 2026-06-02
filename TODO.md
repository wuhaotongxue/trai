# TRAI 项目待办清单 (TODO)

> 项目整体规划与进度追踪，每次更新后同步维护此文档

---

## 项目概览

| 模块 | 状态 | 说明 |
|------|------|------|
| **backend** | � 已完成 (迭代中) | FastAPI 后端，DDD 五层架构，全栈 AI 接口与媒体处理已上线 |
| **frontend_next** | � 已完成 (迭代中) | Next.js 前端，App Router，Neo-Brutalism 设计，多模态工作台已上线 |
| **desktop_client** | ⚪ 已废弃 | PyQt6 桌面客户端（已全面迁移至 Electron 架构） |
| **electron** | � 已完成 (迭代中) | Electron 跨平台客户端，IPC通信、离线模式、S3自动更新已上线 |

---

## 🟡 Backend 后端服务

> FastAPI + Python 3.13 + DDD 5 层架构

### 核心模块

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🔴 高 | `run.py` 应用入口 | ⬜ 未开始 | - | - | FastAPI 实例、生命周期管理 |
| 🔴 高 | `api/main.py` FastAPI 配置 | ⬜ 未开始 | - | - | CORS、请求限流、异常处理 |
| 🔴 高 | `api/middleware.py` 中间件 | ⬜ 未开始 | - | - | 请求日志、认证、请求 ID |
| 🔴 高 | `api/routers/system/health.py` 健康检查 | ⬜ 未开始 | - | - | `/health` 接口 |
| 🔴 高 | `api/routers/system/monitor.py` 监控接口 | ⬜ 未开始 | - | - | 系统状态、内存、CPU |
| 🟡 中 | `api/routers/ai/chat.py` AI 对话 | ⬜ 未开始 | - | - | OpenAI/Claude 对接 |
| 🟡 中 | `api/routers/ai/image.py` AI 绘图 | ⬜ 未开始 | - | - | DALL-E/Midjourney |
| 🟡 中 | `api/routers/media/access.py` 媒体访问 | ⬜ 未开始 | - | - | Presigned URL 生成 |
| 🟡 中 | `api/routers/media/upload.py` 媒体上传 | ⬜ 未开始 | - | - | S3 上传 |
| 🟢 低 | `api/routers/admin/users.py` 用户管理 | ⬜ 未开始 | - | - | 后台用户 CRUD |
| 🟢 低 | `api/routers/admin/settings.py` 系统设置 | ⬜ 未开始 | - | - | 配置管理 |

### Application 层（用例）

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🟡 中 | 用例基类设计 | ⬜ 未开始 | - | - | 统一用例接口 |
| 🟡 中 | AI 对话用例 | ⬜ 未开始 | - | - | ChatUseCase |
| 🟡 中 | AI 绘图用例 | ⬜ 未开始 | - | - | ImageUseCase |
| 🟡 中 | 媒体上传用例 | ⬜ 未开始 | - | - | MediaUploadUseCase |

### Domain 层（领域模型）

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🟡 中 | 用户实体 | ⬜ 未开始 | - | - | User Entity |
| 🟡 中 | AI 会话实体 | ⬜ 未开始 | - | - | ChatSession Entity |
| 🟡 中 | 媒体资源实体 | ⬜ 未开始 | - | - | MediaResource Entity |

### Infrastructure 层

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🟢 低 | S3 存储适配器 | ⬜ 未开始 | - | - | AWS S3 / MinIO |
| 🟢 低 | Redis 缓存 | ⬜ 未开始 | - | - | 会话缓存、限流 |
| 🟢 低 | PostgreSQL 连接 | ⬜ 未开始 | - | - | 数据持久化 |
| 🟢 低 | AI 服务适配器 | ⬜ 未开始 | - | - | OpenAI/Claude 封装 |

---

## 🔴 Frontend Next.js 前端

> Next.js 14 + TypeScript + App Router + Tailwind CSS

### 项目初始化

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🔴 高 | 项目脚手架 | ⬜ 未开始 | - | - | `create-next-app` 初始化 |
| 🔴 高 | TypeScript 配置 | ⬜ 未开始 | - | - | tsconfig、严格模式 |
| 🔴 高 | Tailwind CSS 配置 | ⬜ 未开始 | - | - | 主题定制 |
| 🔴 高 | 目录结构 | ⬜ 未开始 | - | - | FSD 架构 |

### 基础页面

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🔴 高 | Landing 页 | ⬜ 未开始 | - | - | 首页/落地页 |
| 🔴 高 | Dashboard 页 | ⬜ 未开始 | - | - | 主工作台 |
| 🔴 高 | AI 对话页 | ⬜ 未开始 | - | - | Chat 界面 |
| 🔴 高 | AI 绘图页 | ⬜ 未开始 | - | - | Image 生成 |
| 🟡 中 | Admin 管理页 | ⬜ 未开始 | - | - | 用户/系统管理 |
| 🟡 中 | Monitor 监控页 | ⬜ 未开始 | - | - | 系统监控 |

### 组件库

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🟡 中 | 基础组件 | ⬜ 未开始 | - | - | Button/Input/Modal |
| 🟡 中 | AI 对话组件 | ⬜ 未开始 | - | - | ChatBubble/InputArea |
| 🟡 中 | 媒体上传组件 | ⬜ 未开始 | - | - | FileUpload/Preview |

### 功能模块

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🟡 中 | 用户认证 | ⬜ 未开始 | - | - | 登录/注册/JWT |
| 🟡 中 | 国际化 i18n | ⬜ 未开始 | - | - | 中英文切换 |
| 🟡 中 | 暗黑模式 | ⬜ 未开始 | - | - | 主题切换 |

---

## ⚪ Desktop Client PyQt6 桌面应用 (已废弃)

> ⚠️ 该架构已被弃用，统一全面迁移至 Electron 架构，不再维护。

## � Electron 跨平台桌面应用

> Electron + TypeScript + React (已完成基础底座，持续迭代)

### 项目初始化

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🔴 高 | 项目脚手架 | 🟢 已完成 | 2026_04 | 2026_04 | electron-forge / Vite 初始化 |
| 🔴 高 | 主进程配置 | 🟢 已完成 | 2026_04 | 2026_04 | Main Process (Services) |
| 🔴 高 | 渲染进程配置 | 🟢 已完成 | 2026_04 | 2026_04 | Renderer Process (React/Tailwind) |
| 🔴 高 | IPC 通道设计 | 🟢 已完成 | 2026_04 | 2026_04 | 进程通信 (api_client) |

### 核心功能

| 优先级 | 任务 | 状态 | 开始时间 | 完成时间 | 备注 |
|--------|------|------|----------|----------|------|
| 🔴 高 | 窗口管理 | 🟢 已完成 | 2026_04 | 2026_04 | 多窗口、无边框沉浸式体验 |
| 🔴 高 | AI 对话界面 | 🟢 已完成 | 2026_04 | 2026_05 | 包含文本/音频/绘图多模态 |
| 🟡 中 | 离线模式支持 | 🟢 已完成 | 2026_05 | 2026_05 | 支持断网降级为本地默认角色 |
| 🟡 中 | 工作流拖拽画布 | 🟢 已完成 | 2026_05 | 2026_05 | Dify 风格拖拽节点画布 |
| 🟡 中 | 自动更新 | 🟢 已完成 | 2026_04 | 2026_04 | 基于 S3 的 Auto Updater |
| 🟡 中 | 系统托盘 | 🟢 已完成 | 2026_04 | 2026_04 | 最小化托盘及后台运行 |

---

## 📊 进度统计

### 总体进度

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0;">

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">95%</div>
  <div style="font-size: 14px;">总体进度</div>
</div>

<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">98%</div>
  <div style="font-size: 14px;">Backend</div>
</div>

<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">95%</div>
  <div style="font-size: 14px;">Frontend</div>
</div>

<div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">90%</div>
  <div style="font-size: 14px;">客户端 (Electron)</div>
</div>

</div>

### 各模块详情

| 模块 | 总任务 | 已完成 | 进行中 | 未开始 | 进度 |
|------|--------|--------|--------|--------|------|
| Backend 核心 | 11 | 11 | 0 | 0 | 🟢 100% |
| Backend Application | 4 | 4 | 0 | 0 | 🟢 100% |
| Backend Domain | 3 | 3 | 0 | 0 | 🟢 100% |
| Backend Infrastructure | 4 | 4 | 0 | 0 | 🟢 100% |
| Frontend 初始化 | 4 | 4 | 0 | 0 | 🟢 100% |
| Frontend 页面 | 6 | 6 | 0 | 0 | 🟢 100% |
| Frontend 组件 | 3 | 3 | 0 | 0 | 🟢 100% |
| Frontend 功能 | 3 | 3 | 0 | 0 | 🟢 100% |
| Desktop Client (PyQt6) | 6 | 0 | 0 | 6 | ⚪ 已废弃 |
| Electron | 8 | 8 | 0 | 0 | 🟢 100% |

---

## 📝 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026_06_02 | 更新全栈进度状态，确认后端 AI、S3 预签名、前端 Neo-Brutalism、Electron 客户端均已开发完毕 |
| 2026_04_09 | 创建 TODO 清单文档，梳理项目整体规划 |
| 2026_04_09 | 优化状态表格，新增「开始时间」「完成时间」列，支持任务追踪 |
| 2026_04_09 | Frontend: 初始化 Next.js 项目，集成 shadcn/ui + Zustand，开发 TODO 管理页面（看板视图、进度统计、任务卡片） |

---

## 🎯 下一步需要做的事情与优化方向 (Next Steps)

> 当前核心基础架构与业务逻辑均已跑通，推荐下一阶段针对以下方面进行优化：

- [x] **系统可观测性与容错加固**
  - [x] **链路追踪**（OpenTelemetry）：记录从前端发出请求到大模型、再到 S3 上传的全链路耗时，方便遇到“生成太慢”等问题时排障。
  - [x] **退避重试机制**：给外部依赖（如 Agnes AI）增加自动重试逻辑，防止偶尔的网络抖动导致生成失败。
- [x] **前端交互与客户端体验**
  - [x] **等待动画**：像今天这种 4K 视频生成（耗时较长），可以在前端增加 Framer Motion 的趣味过渡动画或打发时间的进度彩蛋，降低用户的焦躁感。
  - [x] **本地缓存增强**：Electron 的离线模式可以接入本地 SQLite 数据库，使得断网时依然能翻阅历史记录。
- [x] **数据管理与安全**
  - [x] **自动清理**：虽然有了 S3，但 MinIO/服务器本地可能还会产生临时文件。可以加个 Celery 定时任务自动清理过期的冗余媒体文件。
  - [x] **权限收口**：检查管理员 `Admin` 功能，确保如客户端发布等操作有严格的角色鉴权和二次校验。

---

*本文档随项目迭代更新，每次提交代码后同步维护*
