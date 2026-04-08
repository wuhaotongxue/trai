# Desktop_Client_五层架构规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 五层目录结构

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
│   │   ├── sync_service.py         # 同步服务
│   │   └── config_service.py       # 配置服务
│   │
│   ├── comm/                       # 通信层 (Communication)
│   │   ├── http_client.py          # HTTP 客户端
│   │   ├── ws_client.py            # WebSocket 客户端
│   │   └── api_endpoints.py        # API 端点定义
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

---

## 3. 各层职责

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **表示层** | `src/ui/` | PyQt6 控件渲染，用户手势响应 | 禁止写任何业务逻辑 |
| **控制层** | `src/controller/` | UI 事件监听，命令分发，数据校验 | 禁止直接操作数据库 |
| **服务层** | `src/service/` | 业务流程编排，领域对象状态管理 | 禁止直接发起 HTTP 请求 |
| **通信层** | `src/comm/` | HTTP/WebSocket 封装，协议编解码 | 禁止写 UI 控件代码 |
| **基础设施层** | `src/infra/` | 日志、SQLite、配置、加密、硬件指纹 | 禁止写业务判断逻辑 |

---

## 4. 层级调用规则

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

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 反向禁止</strong>: Infrastructure 不得调用 Comm / Service / Controller
</div>

---

## 5. 进程模型

```
┌─────────────────────────────────────┐
│         主控进程 (ClientBootstrap)  │
├─────────────────────────────────────┤
│  UI 渲染主线程                      │
│  (QApplication, 主窗口)             │
├─────────────────────────────────────┤
│  业务工作者池 (QThreadPool)          │
│  - LoginWorker                      │
│  - SyncWorker                       │
│  - HttpWorker                       │
├─────────────────────────────────────┤
│  守护监控线程 (QTimer, 30s 心跳)    │
└─────────────────────────────────────┘
```

---

## 6. 状态机定义

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

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 状态流转规则</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><code>ERROR</code> 状态下禁止执行业务操作</li>
    <li><code>SHUTDOWN</code> 触发后必须安全释放所有资源</li>
  </ul>
</div>

---

## 7. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">反向禁止</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Infra 不调用上层</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">ERROR 禁操作</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">异常状态锁死</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">SHUTDOWN 必释放</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">timer + thread 清理</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">单向调用</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">UI → Ctrl → Svc → Comm</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">QThreadPool</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全局工作池</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">状态机</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">9 个状态定义</div>
  </div>

</div>