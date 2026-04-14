# TRAI Backend

TRAI 项目后端服务, 基于 FastAPI 框架构建.

## 技术栈

- Python 3.13
- FastAPI
- SQLAlchemy (异步)
- Pydantic
- Uvicorn

## 快速开始

### 1. 环境准备 (Conda)

推荐使用清华源加速:

```bash
conda create -n trai_31313_20260413 python=3.13.13 -y
conda activate trai_31313_20260413
cd backend
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -e .
```

### 2. 运行服务

```bash
python run.py
```

服务默认在 `http://127.0.0.1:8000` 启动. 可以访问 `http://127.0.0.1:8000/docs` 查看 Swagger API 文档.

## 开发规范

所有代码遵循 DDD 五层架构, 详见 `.trae/skills/backend_code_check_wuhao/SKILL.md`.

## 📝 更新日志 (Changelog)

### 🛠️ 后端_2026_04_14_0940
- **新增(backend)**: 将默认大模型提供商切换为 `deepseek`，接入官方 API 支持 `deepseek-reasoner`
- **修复(backend)**: 修复 DeepSeek 强校验工具名称导致的 `400 Bad Request`，将所有 `.` 替换为 `_`（如 `weather_current`）
- **优化(backend)**: 支持流式请求（`stream=True`）时的思维链和工具调用事件转发

### 🛠️ 后端_2026_04_14_0855
- **修复(backend)**: 修正了 `.env` 中 `MODELSCOPE_API_BASE` 的默认值为 `https://dashscope.aliyuncs.com/compatible-mode/v1`（阿里云百炼兼容端），解决由于旧版域名引发的大模型请求 `[Errno 11001] getaddrinfo failed` DNS 解析错误

### 🛠️ 后端_2026_04_14_0840
- **新增(backend)**: `.env.example` 中增加 `Qwen/Qwen3.5-0.8B` 作为默认魔塔社区测试模型
- **优化(backend)**: 优化 `openai_client.py` 逻辑，支持配置读取区分 `openai` 与 `modelscope` 并兼容解析模型返回的 `reasoning_content`
- **优化(backend)**: 优化 `executor.py` 和 `agent.py`，支持捕获多轮工具调用中的思维链并返回给前端展示

### 🛠️ 后端_2026_04_14_0831
- **修复(backend)**: 修复 `tools.py` 等文件中不符合项目 `snake_case` 命名规范的 API 路由，将 `-`（中划线）彻底替换为 `_`（下划线）
- **修复(backend)**: 修复了 `tools.py` 路由依赖注入导致 `Depends in Annotated` 的 AssertionError
- **修复(backend)**: 更新了 `README.md` 中对于服务运行 `python run.py` 的脚本路径说明

### 🛠️ 后端_2026_04_14_0812
- **新增(tools)**: 增加 `ToolsAPI` 类，实现 `md-to-pdf`、`compress-image` 和 `compress-zip` 的逻辑，并注册到 `/api/tools/` 路由
- **增强(tools)**: 工具接口实现处理结果自动上传至 S3 服务，并利用 S3 预签名机制，生成仅 5 分钟有效的访问链接返回给前端

### 🛠️ 后端_2026_04_13_2135
- **修复(auth)**: 修复 `login.py` 中由于数据库模型更新导致 `user` 实体错误调用 `t_` 前缀属性而引起的 `AttributeError` 异常

### 🛠️ 后端_2026_04_13_1955
- **新增(backend)**: 初始化后端模块的 README.md 说明文档
