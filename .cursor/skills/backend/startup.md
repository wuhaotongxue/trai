# Backend_服务启动与端口清理规范

## 1. 快速索引

| 文件 | 路径 | 说明 |
|------|------|------|
| 后端启动入口 | `backend/run.py` | 主启动脚本，含端口清理和日志写入 |

---

## 2. 后端启动流程 (`run.py`)

### 2.1 启动模式

`run.py` 支持两种模式:

| 模式 | 命令 | 说明 |
|------|------|------|
| 主进程模式 | `python backend/run.py` | 自动清理端口后启动服务 |
| 子进程模式 | `python backend/run.py --no-cleanup` | 直接启动服务，不清理端口 |

### 2.2 端口检测与清理 (`PortCleaner`)

`run.py` 内置 `PortCleaner` 类，启动时自动检测目标端口是否被占用:

**Windows 检测流程:**
1. 使用 `psutil.net_connections()` 查找 LISTENING 状态的进程
2. 使用 `psutil.Process(pid).kill()` 终止进程
3. 等待 1 秒后再次验证端口是否释放
4. 如果是僵尸进程(AccessDenied)，等待内核自动清理

**跳过自身进程:** 如果占用端口的是当前进程自身，则跳过清理。

**清理失败处理:** 如果清理后端口仍被占用，输出警告但继续尝试启动。

### 2.3 日志记录 (`LogWriter`)

`run.py` 使用 `LogWriter` 类将控制台输出同步写入日志文件:

- 日志文件路径: `backend/logs/backend_<timestamp>.log`
- 日志文件命名格式: `backend_YYYYMMDD_HHMMSS.log`
- 日志内容包含: 启动时间、端口号、调试模式、停止时间

---

## 3. 端口清理命令参考

### Windows PowerShell

```powershell
# 查找占用端口的进程
netstat -ano | findstr :5666

# 终止进程
taskkill /F /PID <pid>
```

### Linux/macOS

```bash
# 查找占用端口的进程
lsof -i :5666

# 终止进程
kill -9 <pid>
```

---

## 4. 常见问题

### 4.1 端口清理失败

如果 `PortCleaner` 无法终止进程，可能原因:
- 进程是系统关键进程，权限不足
- 进程是子进程的父进程，需要先终止子进程
- 进程已经自动退出，只是端口还未释放(僵尸进程)

**解决方案:** 手动使用任务管理器终止相关进程，或等待内核自动释放(通常几秒内)。

### 4.2 日志文件不存在

如果 `logs` 目录不存在，`run.py` 会自动创建。

### 4.3 启动后立即退出

可能原因:
- 端口仍被占用，uvicorn 启动失败
- Python 环境缺少依赖
- 环境变量配置错误

**解决方案:** 检查日志文件或控制台输出。
