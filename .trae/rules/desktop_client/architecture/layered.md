# Desktop_Client_五层架构规范

## 1. 五层目录结构

```
desktop_client/
├── src/
│   ├── ui/                        # 表示层 (Presentation)
│   │   ├── main_window.py         # 主窗口
│   │   ├── widgets/               # 自定义控件
│   │   ├── dialogs/               # 弹窗对话框
│   │   └── styles/                # 样式资源
│   │
│   ├── controller/                 # 控制层 (Controller)
│   │   ├── main_controller.py     # 主控制器
│   │   ├── login_controller.py    # 登录控制器
│   │   └── workers/              # Worker 线程
│   │       ├── login_worker.py
│   │       └── http_worker.py
│   │
│   ├── service/                    # 服务层 (Service)
│   │   ├── auth_service.py        # 认证服务
│   │   ├── sync_service.py        # 同步服务
│   │   └── config_service.py      # 配置服务
│   │
│   ├── comm/                       # 通信层 (Communication)
│   │   ├── http_client.py         # HTTP 客户端
│   │   ├── ws_client.py           # WebSocket 客户端
│   │   └── api_endpoints.py       # API 端点定义
│   │
│   └── infra/                      # 基础设施层 (Infrastructure)
│       ├── logging/                # 日志模块
│       ├── storage/                # 存储模块
│       ├── config/                 # 配置模块
│       ├── crypto/                 # 加密模块
│       └── hardware/              # 硬件指纹
│
├── run.py                          # 启动入口
└── requirements.txt
```

## 2. 各层职责

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **表示层** | `src/ui/` | PyQt6 控件渲染，用户手势响应 | 禁止写任何业务逻辑 |
| **控制层** | `src/controller/` | UI 事件监听，命令分发，数据校验 | 禁止直接操作数据库 |
| **服务层** | `src/service/` | 业务流程编排，领域对象状态管理 | 禁止直接发起 HTTP 请求 |
| **通信层** | `src/comm/` | HTTP/WebSocket 封装，协议编解码 | 禁止写 UI 控件代码 |
| **基础设施层** | `src/infra/` | 日志、SQLite、配置、加密、硬件指纹 | 禁止写业务判断逻辑 |

## 3. 层级调用规则

```
UI (控件渲染)
    ↓ 信号槽
Controller (事件处理，调度 Worker)
    ↓ 调用
Service (业务逻辑)
    ↓ 调用
Comm (HTTP/WebSocket)
    ↓ 调用
Infrastructure (日志/存储/配置)
```

**反向禁止**: Infrastructure 不得调用 Comm/Service/Controller。

## 4. 进程模型

```
┌─────────────────────────────────────┐
│         主控进程 (ClientBootstrap) │
├─────────────────────────────────────┤
│  UI 渲染主线程                      │
│  (QApplication, 主窗口)             │
├─────────────────────────────────────┤
│  业务工作者池 (QThreadPool)          │
│  - LoginWorker                      │
│  - SyncWorker                       │
│  - HttpWorker                       │
├─────────────────────────────────────┤
│  守护监控线程 (QTimer, 30s 心跳)     │
└─────────────────────────────────────┘
```

## 5. 状态机定义

| 状态名 | 含义 | 允许的下一状态 |
|--------|------|----------------|
| INIT | 初始化阶段 | LOADING / ERROR |
| LOADING | 资源加载中 | READY / ERROR / SHUTDOWN |
| AUTHENTICATING | 身份验证中 | READY / ERROR / SHUTDOWN |
| READY | 就绪可用 | IDLE / SYNCING / ERROR / SHUTDOWN |
| IDLE | 空闲待命 | SYNCING / READY / ERROR / SHUTDOWN |
| SYNCING | 数据同步中 | READY / ERROR / SHUTDOWN |
| ERROR | 异常状态 | RECOVERING / SHUTDOWN |
| RECOVERING | 灾备恢复中 | READY / ERROR / SHUTDOWN |
| SHUTDOWN | 安全退出 | (终止) |