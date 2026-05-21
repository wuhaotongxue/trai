---
name: "dev_start"
description: "启动 TRAI 项目的前后端和客户端服务，包含后端、前端、客户端三个服务的启动命令和环境配置。"
---

# 启动开发服务_(dev_start)

当用户要求「启动前后端和客户端」或「启动开发服务」时，执行本技能。

## 强制规则（优先级最高）

### 1. 三步分开写，分三个 Shell 调用

- 调用 1：`cd /home/qyjgylc_whf/code/trai/backend`
- 调用 2：`conda activate trai31313`
- 调用 3：`python run.py`
- **禁止**用 `&&`、`;`、`&` 任何符号把命令拼成一行
- **禁止**用分号串起来

### 2. 不开沙盒，不用 powershell.exe

直接用默认 Shell 执行。

### 3. 严格控制进程数量

- 最多同时启动 3 个后台进程（后端 + 前端 + 客户端）
- 启动前先检查 terminals 文件夹，确认没在跑就不再启动
- 禁止在启动过程中执行多次试探性命令

### 4. 启动后不主动轮询

- 服务启动后，告诉用户各服务的端口和地址即可
- 除非用户明确要求，不要反复读取 terminal 文件检查状态

### 5. 禁止使用 nohup 和 2>&1

- **禁止**使用 `nohup ... &` 方式启动
- **禁止**使用 `> /tmp/xxx.log 2>&1` 重定向
- 使用 Cursor Shell 的 `block_until_ms: 0` 参数后台运行

## 服务启动命令

### 后端（conda env: trai31313，端口: 5666）

**标准三步启动（三个 Shell 调用）：**

调用 1（切换目录）：
```bash
cd /home/qyjgylc_whf/code/trai/backend
```

调用 2（激活环境）：
```bash
conda activate trai31313
```

调用 3（启动服务）：
```bash
python run.py
```

**后台运行方式：**
使用 `block_until_ms: 0` 参数让服务后台运行。

### 前端（端口: 3000）

```bash
cd /home/qyjgylc_whf/code/trai/frontend_next
pnpm dev
```

### 客户端（端口: 由应用自行管理）

```bash
cd /home/qyjgylc_whf/code/trai/client_electron
pnpm dev
```

## 执行流程

1. 检查是否有已经在运行的终端（读取 terminals 文件夹）
2. 如果服务已经在运行，直接告知用户「已在运行」
3. 如果需要启动：
   - 后端分三个 Shell 调用（cd → activate → python）
   - 前端和客户端各一个 Shell 调用
4. 使用 `block_until_ms: 0` 参数让服务后台运行
5. 启动后告诉用户：
   - 后端地址：http://localhost:5666
   - 前端地址：http://localhost:3000
   - 客户端：Electron 窗口

## 测试命令格式

测试或验证后端时，也使用同样的三步格式：

调用 1：`cd /home/qyjgylc_whf/code/trai/backend`
调用 2：`conda activate trai31313`
调用 3：`python run.py`

## 已知问题与规避

### conda activate 卡住

- **原因**：`&&` / `;` / `&` 等符号在 PowerShell 中触发语法解析导致挂起
- **规避**：分三个 Shell 调用写，先 cd，再 activate，确认后再 python

### 启动后出现 ConnectionResetError

- 这是 Windows 上常见的无害警告，客户端提前关闭连接导致
- 不影响服务正常运行，无需处理

### www 用户占用端口

- 如果 `www` 用户的旧进程占用端口，先用 `fuser -k 5666/tcp` 释放端口
- 然后再启动新进程
