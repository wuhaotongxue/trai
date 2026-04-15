---
name: "start-services"
description: "启动 TRAI 的前端 (Next.js) 和后端 (Python FastAPI) 服务。当用户要求启动或重启前后端服务时调用。"
---

# 启动前后端服务 (Start Services)

此技能用于快速启动 TRAI 项目的前后端服务。

## 1. 启动后端服务
后端使用 Python FastAPI，依赖 Conda 虚拟环境 `trai_31313_20260413`。

在一个新的终端执行以下命令：
```bash
conda activate trai_31313_20260413
cd backend
python run.py
```

## 2. 启动前端服务
前端使用 Next.js 和 pnpm 进行包管理。

在另一个新的终端执行以下命令：
```bash
cd frontend_next
pnpm dev
```

## 3. 验证服务
- 后端 API 默认地址：http://localhost:5666
- 前端默认地址：http://localhost:3000
