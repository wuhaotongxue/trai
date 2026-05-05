# ============================================
# Trai Backend - Dockerfile
# 基于 Python 3.13 + Miniconda
# 多阶段构建 (优化镜像大小)
# ============================================

# ====================
# 阶段1: 基础镜像 (Miniconda + Python 3.13)
# ====================
FROM continuumio/miniconda3:latest AS base

WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHON_VERSION=3.13 \
    CONDA_ENV_NAME=trai \
    TZ=Asia/Shanghai

# 创建 Conda 环境 (Python 3.13)
RUN conda update -n base -c defaults conda && \
    conda create -n ${CONDA_ENV_NAME} python=${PYTHON_VERSION} -y && \
    conda clean -afy

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 激活conda环境的脚本
SHELL ["conda", "run", "-n", "trai", "/bin/bash", "-c"]

# ====================
# 阶段2: 依赖安装
# ====================
FROM base AS dependencies

COPY requirements.txt .

# 使用 Conda 和 Pip 安装依赖
RUN conda run -n ${CONDA_ENV_NAME} pip install --no-cache-dir --upgrade pip && \
    conda run -n ${CONDA_ENV_NAME} pip install --no-cache-dir -r requirements.txt && \
    conda clean -afy

# ====================
# 阶段3: 生产环境
# ====================
FROM base AS production

# 从dependencies阶段复制conda环境
COPY --from=dependencies /opt/conda/envs/${CONDA_ENV_NAME} /opt/conda/envs/${CONDA_ENV_NAME}

# 复制应用代码
COPY src/ ./src/
COPY scripts/ ./scripts/

# 创建必要目录
RUN mkdir -p logs backups archives data && \
    chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 5666

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5666/health || exit 1

# 启动命令 (使用conda环境)
CMD ["conda", "run", "-n", "trai", "python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5666", "--workers", "4"]

# ====================
# 阶段4: 开发环境
# ====================
FROM base AS development

# 从dependencies阶段复制conda环境
COPY --from=dependencies /opt/conda/envs/${CONDA_ENV_NAME} /opt/conda/envs/${CONDA_ENV_NAME}

# 复制应用代码和配置
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tests/ ./tests/
COPY .env.example .env

# 创建必要目录
RUN mkdir -p logs backups archives data

# 开发工具安装
RUN conda run -n ${CONDA_ENV_NAME} pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    isort \
    flake8 \
    mypy \
    pre-commit

# 开发模式启动 (热重载 + 单worker)
CMD ["conda", "run", "-n", "trai", "python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5666", "--reload"]

# ====================
# 阶段5: 测试环境
# ====================
FROM development AS testing

# 复制测试配置
COPY pytest.ini .
COPY .coveragerc .

# 运行测试
CMD ["conda", "run", "-n", "trai", "pytest", "tests/", "-v", "--cov=src", "--cov-report=html"]

# ====================
# 元数据标签
# ====================
LABEL maintainer="wuhao"
LABEL version="2.0.0"
LABEL description="Trai Backend - Multi-Agent AI Platform with Python 3.13"
LABEL python.version="3.13"
LABEL conda.environment="trai"
