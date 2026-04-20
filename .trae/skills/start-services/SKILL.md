---
name: "start-services"
description: "启动 TRAI 的前端 (Next.js) 和后端 (Python FastAPI) 服务。当用户要求启动或重启前后端服务时调用。"
---

# 启动前后端服务 (Start Services)

此技能用于快速启动 TRAI 项目的前后端服务。

## 1. 启动后端服务
后端使用 Python FastAPI，依赖 Conda 虚拟环境 `trai`。

在一个新的终端执行以下命令：
```bash
conda activate trai
cd backend
python run.py
```

## 2. 启动前端与客户端服务
前端与 Electron 客户端使用 Next.js 和 pnpm 进行包管理。

**注意：每次启动前必须先进行代码类型审核。**

在前端终端执行以下命令：
```bash
cd frontend_next
pnpm run type-check
pnpm dev
```

在客户端终端执行以下命令：
```bash
cd client_electron
pnpm run type-check
pnpm dev
```

## 3. 验证服务
- 后端 API 默认地址：http://localhost:5666
- 前端默认地址：http://localhost:3000
