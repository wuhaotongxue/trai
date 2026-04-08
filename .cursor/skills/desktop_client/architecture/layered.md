# Desktop Client - 五层架构规范

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
│   │   ├── settings_controller.py # 设置控制器
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
│       │   └── logger.py
│       ├── storage/                # 存储模块
│       │   └── encrypted_storage.py
│       ├── config/                 # 配置模块
│       │   └── app_config.py
│       ├── crypto/                 # 加密模块
│       └── hardware/              # 硬件指纹
│
├── run.py                          # 启动入口
└── requirements.txt
```

## 2. 各层职责详解

### 表示层 (Presentation) - `src/ui/`
**职责**: PyQt6 控件渲染，用户手势响应
**包含**: `QMainWindow`/`QWidget` 子类、对话框、样式表

**禁止**:
- 禁止写任何业务逻辑（API 调用、数据处理）
- 禁止直接操作数据库
- 禁止在 UI 类中写 `requests.get/post`

### 控制层 (Controller) - `src/controller/`
**职责**: UI 事件监听，命令分发，数据校验
**包含**: `QObject` 子类、信号槽连接、Worker 调度

**禁止**:
- 禁止直接操作数据库
- 禁止写复杂的业务算法
- 禁止写网络请求（委托给 Service/Comm 层）

### 服务层 (Service) - `src/service/`
**职责**: 业务流程编排，领域对象状态管理
**包含**: 业务逻辑、状态机、流程编排

**禁止**:
- 禁止直接发起 HTTP 请求（委托给 Comm 层）
- 禁止直接操作数据库（委托给 Infrastructure 层）

### 通信层 (Communication) - `src/comm/`
**职责**: HTTP/WebSocket 封装，协议编解码
**包含**: HTTP 客户端、WebSocket 客户端、API 端点定义

**禁止**:
- 禁止写 UI 控件代码
- 禁止写业务逻辑

### 基础设施层 (Infrastructure) - `src/infra/`
**职责**: 日志、SQLite、配置、加密、硬件指纹
**包含**: logger、storage、config、crypto、hardware

**禁止**:
- 禁止写业务判断逻辑
- 禁止写 UI 控件代码

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

**反向禁止**: Infrastructure 不得调用 Comm/Service/Controller；Comm 不得调用 Service/Controller。

## 4. 文件头模板

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际相对路径文件名}
# 作者: {作者姓名}
# 日期: {YYYY-MM-DD HH:MM:SS}
# 描述: {该文件的用途/功能简述，一句话概括}

from __future__ import annotations

from PyQt6.QtCore import QObject

from src.infra.logging import get_logger

logger = get_logger()


class ExampleController(QObject):
    """
    示例控制器，协调 UI 和 Worker.

    参数:
        无.

    异常:
        无可预期业务异常.
    """
```

## 5. 类封装规则

```python
# ❌ 禁止: 文件无类
def helper_function():
    return True

# ❌ 禁止: 孤立函数
def validate_token(token: str) -> bool:
    return len(token) > 0

# ✅ 正确: 封装在类中
class TokenValidator:
    @staticmethod
    def validate(token: str) -> bool:
        return len(token) > 0
```

## 6. 进程模型

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
│  守护监控线程 (QTimer, 30s 心跳)     │
└─────────────────────────────────────┘
```

## 7. 状态机定义

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

---

## 8. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止跨层调用</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">下层不得调用上层</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">文件必须有类</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止顶层孤立函数</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">层级单向</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">UI → Controller → Service</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">五层职责</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">UI/Controller/Service/Comm/Infra</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">状态机</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">9 个状态循环</div>
  </div>

</div>
