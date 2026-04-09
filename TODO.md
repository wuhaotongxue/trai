# TRAI 项目待办清单 (TODO)

> 项目整体规划与进度追踪，每次更新后同步维护此文档

---

## 项目概览

| 模块 | 状态 | 说明 |
|------|------|------|
| **backend** | 🟡 进行中 | FastAPI 后端，基础框架已完成 |
| **frontend_next** | 🔴 未开始 | Next.js 前端，只有规范文档 |
| **desktop_client** | 🔴 未开始 | PyQt6 桌面客户端，只有规范文档 |
| **electron** | 🔴 未开始 | Electron 跨平台，只有规范文档 |

---

## 🟡 Backend 后端服务

> FastAPI + Python 3.13 + DDD 5 层架构

### 核心模块

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | `run.py` 应用入口 | ⬜ 未开始 | FastAPI 实例、生命周期管理 |
| 🔴 高 | `api/main.py` FastAPI 配置 | ⬜ 未开始 | CORS、请求限流、异常处理 |
| 🔴 高 | `api/middleware.py` 中间件 | ⬜ 未开始 | 请求日志、认证、请求 ID |
| 🔴 高 | `api/routers/system/health.py` 健康检查 | ⬜ 未开始 | `/health` 接口 |
| 🔴 高 | `api/routers/system/monitor.py` 监控接口 | ⬜ 未开始 | 系统状态、内存、CPU |
| 🟡 中 | `api/routers/ai/chat.py` AI 对话 | ⬜ 未开始 | OpenAI/Claude 对接 |
| 🟡 中 | `api/routers/ai/image.py` AI 绘图 | ⬜ 未开始 | DALL-E/Midjourney |
| 🟡 中 | `api/routers/media/access.py` 媒体访问 | ⬜ 未开始 | Presigned URL 生成 |
| 🟡 中 | `api/routers/media/upload.py` 媒体上传 | ⬜ 未开始 | S3 上传 |
| 🟢 低 | `api/routers/admin/users.py` 用户管理 | ⬜ 未开始 | 后台用户 CRUD |
| 🟢 低 | `api/routers/admin/settings.py` 系统设置 | ⬜ 未开始 | 配置管理 |

### Application 层（用例）

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🟡 中 | 用例基类设计 | ⬜ 未开始 | 统一用例接口 |
| 🟡 中 | AI 对话用例 | ⬜ 未开始 | ChatUseCase |
| 🟡 中 | AI 绘图用例 | ⬜ 未开始 | ImageUseCase |
| 🟡 中 | 媒体上传用例 | ⬜ 未开始 | MediaUploadUseCase |

### Domain 层（领域模型）

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🟡 中 | 用户实体 | ⬜ 未开始 | User Entity |
| 🟡 中 | AI 会话实体 | ⬜ 未开始 | ChatSession Entity |
| 🟡 中 | 媒体资源实体 | ⬜ 未开始 | MediaResource Entity |

### Infrastructure 层

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🟢 低 | S3 存储适配器 | ⬜ 未开始 | AWS S3 / MinIO |
| 🟢 低 | Redis 缓存 | ⬜ 未开始 | 会话缓存、限流 |
| 🟢 低 | PostgreSQL 连接 | ⬜ 未开始 | 数据持久化 |
| 🟢 低 | AI 服务适配器 | ⬜ 未开始 | OpenAI/Claude 封装 |

---

## 🔴 Frontend Next.js 前端

> Next.js 14 + TypeScript + App Router + Tailwind CSS

### 项目初始化

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | 项目脚手架 | ⬜ 未开始 | `create-next-app` 初始化 |
| 🔴 高 | TypeScript 配置 | ⬜ 未开始 | tsconfig、严格模式 |
| 🔴 高 | Tailwind CSS 配置 | ⬜ 未开始 | 主题定制 |
| 🔴 高 | 目录结构 | ⬜ 未开始 | FSD 架构 |

### 基础页面

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | Landing 页 | ⬜ 未开始 | 首页/落地页 |
| 🔴 高 | Dashboard 页 | ⬜ 未开始 | 主工作台 |
| 🔴 高 | AI 对话页 | ⬜ 未开始 | Chat 界面 |
| 🔴 高 | AI 绘图页 | ⬜ 未开始 | Image 生成 |
| 🟡 中 | Admin 管理页 | ⬜ 未开始 | 用户/系统管理 |
| 🟡 中 | Monitor 监控页 | ⬜ 未开始 | 系统监控 |

### 组件库

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🟡 中 | 基础组件 | ⬜ 未开始 | Button/Input/Modal |
| 🟡 中 | AI 对话组件 | ⬜ 未开始 | ChatBubble/InputArea |
| 🟡 中 | 媒体上传组件 | ⬜ 未开始 | FileUpload/Preview |

### 功能模块

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🟡 中 | 用户认证 | ⬜ 未开始 | 登录/注册/JWT |
| 🟡 中 | 国际化 i18n | ⬜ 未开始 | 中英文切换 |
| 🟡 中 | 暗黑模式 | ⬜ 未开始 | 主题切换 |

---

## 🔴 Desktop Client PyQt6 桌面应用

> PyQt6 + Python + DDD 5 层架构

### 项目初始化

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | 项目脚手架 | ⬜ 未开始 | PyQt6 安装配置 |
| 🔴 高 | 主窗口设计 | ⬜ 未开始 | Win11 Fluent UI 风格 |
| 🔴 高 | 目录结构 | ⬜ 未开始 | DDD 5 层架构 |

### 核心功能

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | AI 对话界面 | ⬜ 未开始 | 本地 Chat 界面 |
| 🔴 高 | 本地模型调用 | ⬜ 未开始 | Ollama/Copilot |
| 🟡 中 | 文件管理 | ⬜ 未开始 | 本地文件操作 |
| 🟡 中 | 系统托盘 | ⬜ 未开始 | 最小化到托盘 |

---

## 🔴 Electron 跨平台桌面应用

> Electron + TypeScript + React

### 项目初始化

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | 项目脚手架 | ⬜ 未开始 | electron-forge 初始化 |
| 🔴 高 | 主进程配置 | ⬜ 未开始 | Main Process |
| 🔴 高 | 渲染进程配置 | ⬜ 未开始 | Renderer Process |
| 🔴 高 | IPC 通道设计 | ⬜ 未开始 | 进程通信 |

### 核心功能

| 优先级 | 任务 | 状态 | 备注 |
|--------|------|------|------|
| 🔴 高 | 窗口管理 | ⬜ 未开始 | 多窗口、最大化 |
| 🔴 高 | AI 对话界面 | ⬜ 未开始 | Web 端 Chat |
| 🟡 中 | 自动更新 | ⬜ 未开始 | S3 发布更新 |
| 🟡 中 | 系统托盘 | ⬜ 未开始 | 最小化托盘 |

---

## 📊 进度统计

### 总体进度

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0;">

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">0%</div>
  <div style="font-size: 14px;">总体进度</div>
</div>

<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">15%</div>
  <div style="font-size: 14px;">Backend</div>
</div>

<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">0%</div>
  <div style="font-size: 14px;">Frontend</div>
</div>

<div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 20px; text-align: center; color: white;">
  <div style="font-size: 32px; font-weight: bold;">0%</div>
  <div style="font-size: 14px;">客户端</div>
</div>

</div>

### 各模块详情

| 模块 | 总任务 | 已完成 | 进行中 | 未开始 | 进度 |
|------|--------|--------|--------|--------|------|
| Backend 核心 | 11 | 1 | 1 | 9 | 🟡 18% |
| Backend Application | 4 | 0 | 0 | 4 | ⬜ 0% |
| Backend Domain | 3 | 0 | 0 | 3 | ⬜ 0% |
| Backend Infrastructure | 4 | 1 | 0 | 3 | 🟢 25% |
| Frontend 初始化 | 4 | 0 | 0 | 4 | ⬜ 0% |
| Frontend 页面 | 6 | 0 | 0 | 6 | ⬜ 0% |
| Frontend 组件 | 3 | 0 | 0 | 3 | ⬜ 0% |
| Frontend 功能 | 3 | 0 | 0 | 3 | ⬜ 0% |
| Desktop Client | 6 | 0 | 0 | 6 | ⬜ 0% |
| Electron | 7 | 0 | 0 | 7 | ⬜ 0% |

---

## 📝 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026_04_09 | 创建 TODO 清单文档，梳理项目整体规划 |

---

## 🎯 下一步行动

> 根据优先级推荐下一步任务

### 推荐 1：Backend `run.py` 入口

```bash
# 创建应用入口文件
backend/run.py
backend/src/trai/api/main.py
backend/src/trai/api/middleware.py
```

### 推荐 2：Backend 健康检查 API

```bash
# 创建健康检查路由
backend/src/trai/api/routers/system/health.py
backend/src/trai/api/routers/system/monitor.py
```

---

*本文档随项目迭代更新，每次提交代码后同步维护*
