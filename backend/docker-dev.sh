#!/bin/bash
# ============================================
# Trai Backend - Docker 开发环境脚本
# 作者: wuhao
# 日期: 2026_05_04
# 描述: 快速启动开发环境 (一键部署)
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Trai Backend - Docker Development Env     ${NC}"
echo -e "${BLUE}============================================${NC}"

# ====================
# 帮助信息
# ====================
show_help() {
    echo ""
    echo "Usage: ./docker-dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up          Start development environment"
    echo "  down        Stop all services"
    echo "  restart     Restart services"
    echo "  build       Build Docker images"
    echo "  logs        View service logs"
    echo "  shell       Enter backend container shell"
    echo "  db          Enter PostgreSQL psql"
    echo "  redis       Enter Redis CLI"
    echo "  test        Run tests in container"
    echo "  lint        Run code linter"
    echo "  format      Format code with black/isort"
    echo "  status      Show all services status"
    echo "  clean       Remove volumes and clean up"
    echo "  help        Show this help message"
    echo ""
}

# ====================
# 启动开发环境
# ====================
dev_up() {
    echo -e "${GREEN}[+] Starting development environment...${NC}"
    
    # 创建必要目录
    mkdir -p logs backups archives data uploads monitoring/{prometheus,grafana/provisioning}
    
    # 复制 .env 文件(如果不存在)
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${YELLOW}[!] Created .env from .env.example${NC}"
        fi
    fi
    
    # 使用 development target 构建
    docker compose \
        --env-file .env \
        --profile dev \
        up -d --build \
        postgres redis minio \
        backend
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  ✅ Development environment is ready!      ${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Services:"
    echo -e "  Backend API:     ${BLUE}http://localhost:5666${NC}"
    echo -e "  Health Check:    ${BLUE}http://localhost:5666/health${NC}"
    echo -e "  PostgreSQL:      ${BLUE}localhost:5432${NC}"
    echo -e "  Redis:           ${BLUE}localhost:6379${NC}"
    echo -e "  MinIO Console:   ${BLUE}http://localhost:9001${NC}"
    echo -e "  Grafana:         ${BLUE}http://localhost:3000${NC}"
    echo -e "  Prometheus:      ${BLUE}http://localhost:9090${NC}"
    echo ""
    echo -e "API Docs: ${BLUE}http://localhost:5666/docs${NC}"
    echo ""
}

# ====================
# 停止服务
# ====================
dev_down() {
    echo -e "${RED}[-] Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# ====================
# 重启服务
# ====================
dev_restart() {
    dev_down
    sleep 2
    dev_up
}

# ====================
# 构建镜像
# ====================
dev_build() {
    echo -e "${YELLOW}[~] Building Docker images...${NC}"
    docker compose build \
        --build-arg BUILD_TARGET=development \
        backend
    echo -e "${GREEN}✅ Build complete${NC}"
}

# ====================
# 查看日志
# ====================
dev_logs() {
    local service="${1:-backend}"
    local follow="${2:-true}"
    
    if [ "$follow" = "true" ]; then
        docker compose logs -f "$service"
    else
        docker compose logs --tail=100 "$service"
    fi
}

# ====================
# 进入容器Shell
# ====================
dev_shell() {
    echo -e "${GREEN}[+] Entering backend container...${NC}"
    docker compose exec backend /bin/bash
}

# ====================
# 进入PostgreSQL
# ====================
dev_db() {
    echo -e "${GREEN}[+] Connecting to PostgreSQL...${NC}"
    docker compose exec postgres psql -U ${POSTGRES_USER:-trai} -d ${POSTGRES_DB:-trai}
}

# ====================
# 进入Redis CLI
# ====================
dev_redis() {
    echo -e "${GREEN}[+] Connecting to Redis...${NC}"
    docker compose exec redis redis-cli -a ${REDIS_PASSWORD:-}
}

# ====================
# 运行测试
# ====================
dev_test() {
    echo -e "${YELLOW}[~] Running tests...${NC}"
    docker compose exec backend conda run -n trai pytest tests/ -v --cov=src
}

# ====================
# 代码检查
# ====================
dev_lint() {
    echo -e "${YELLOW}[~] Running code linter...${NC}"
    docker compose exec backend conda run -n trai ruff check src/
}

# ====================
# 格式化代码
# ====================
dev_format() {
    echo -e "${YELLOW}[~] Formatting code...${NC}"
    docker compose exec backend bash -c "conda run -n trai isort src/ && conda run -n trai black src/"
    echo -e "${GREEN}✅ Code formatted${NC}"
}

# ====================
# 服务状态
# ====================
dev_status() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}   Service Status                            ${NC}"
    echo -e "${BLUE}============================================${NC}"
    docker compose ps
    echo ""
    
    # 检查健康状态
    echo -e "Health Checks:"
    for svc in postgres redis backend; do
        status=$(docker compose ps $svc --format "{{.Status}}" 2>/dev/null || echo "not running")
        if [[ "$status" == *"healthy"* ]] || [[ "$status" == *"running"* ]]; then
            echo -e "  $svc: ${GREEN}✓ $status${NC}"
        else
            echo -e "  $svc: ${RED}✗ $status${NC}"
        fi
    done
}

# ====================
# 清理环境
# ====================
dev_clean() {
    echo -e "${RED}[!] This will remove ALL data volumes!${NC}"
    read -p "Are you sure? (y/N) " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker compose down -v --remove-orphans
        docker system prune -f
        
        # 删除本地数据目录
        rm -rf logs/* backups/* archives/* data/*
        
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
        echo -e "${YELLOW}Cancelled${NC}"
    fi
}

# ====================
# 主入口
# ====================
case "${1:-help}" in
    up)
        dev_up
        ;;
    down)
        dev_down
        ;;
    restart)
        dev_restart
        ;;
    build)
        dev_build
        ;;
    logs)
        dev_logs "${2:-backend}" "false"
        ;;
    logs-f)
        dev_logs "${2:-backend}" "true"
        ;;
    shell|sh)
        dev_shell
        ;;
    db|psql)
        dev_db
        ;;
    redis|r)
        dev_redis
        ;;
    test|t)
        dev_test
        ;;
    lint|l)
        dev_lint
        ;;
    format|f)
        dev_format
        ;;
    status|s)
        dev_status
        ;;
    clean)
        dev_clean
        ;;
    help|h|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
