# ============================================
# Trai Backend - Docker 开发环境脚本 (PowerShell)
# 作者: wuhao
# 日期: 2026_05_04
# 描述: Windows PowerShell 版本
# ============================================

param(
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PROJECT_ROOT

# 颜色函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Trai Backend - Docker Development Env" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

switch ($Command) {
    "up" {
        Write-ColorOutput "[+] Starting development environment..." Green
        
        # 创建目录
        $dirs = @("logs", "backups", "archives", "data", "uploads", 
                  "monitoring\prometheus", "monitoring\grafana\provisioning")
        foreach ($dir in $dirs) {
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
        }
        
        # 复制 .env
        if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
            Copy-Item ".env.example" ".env"
            Write-ColorOutput "[!] Created .env from .env.example" Yellow
        }
        
        docker compose up -d --build postgres redis minio backend
        
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "  Development environment is ready!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:" -ForegroundColor White
        Write-Host "  Backend API:     http://localhost:5666" -ForegroundColor Blue
        Write-Host "  Health Check:    http://localhost:5666/health" -ForegroundColor Blue
        Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor Blue
        Write-Host "  Redis:           localhost:6379" -ForegroundColor Blue
        Write-Host "  MinIO Console:   http://localhost:9001" -ForegroundColor Blue
        Write-Host ""
    }
    
    "down" {
        Write-ColorOutput "[-] Stopping services..." Red
        docker compose down
        Write-ColorOutput "All services stopped" Green
    }
    
    "restart" {
        docker compose down
        Start-Sleep -Seconds 2
        & $PSCommandPath -Command "up"
    }
    
    "build" {
        Write-ColorOutput "[~] Building Docker images..." Yellow
        docker compose build backend
        Write-ColorOutput "Build complete" Green
    }
    
    "logs" {
        $service = if ($args.Count -gt 0) { $args[0] } else { "backend" }
        docker compose logs --tail=100 $service
    }
    
    "logs-f" {
        $service = if ($args.Count -gt 0) { $args[0] } else { "backend" }
        docker compose logs -f $service
    }
    
    "shell" {
        Write-ColorOutput "[+] Entering backend container..." Green
        docker compose exec backend /bin/bash
    }
    
    "db" {
        Write-ColorOutput "[+] Connecting to PostgreSQL..." Green
        docker compose exec postgres psql -U trai -d trai
    }
    
    "redis" {
        Write-ColorOutput "[+] Connecting to Redis..." Green
        docker compose exec redis redis-cli
    }
    
    "test" {
        Write-ColorOutput "[~] Running tests..." Yellow
        docker compose exec backend conda run -n trai pytest tests/ -v --cov=src
    }
    
    "lint" {
        Write-ColorOutput "[~] Running code linter..." Yellow
        docker compose exec backend conda run -n trai ruff check src/
    }
    
    "format" {
        Write-ColorOutput "[~] Formatting code..." Yellow
        docker compose exec backend bash -c "conda run -n trai isort src/ && conda run -n trai black src/"
        Write-ColorOutput "Code formatted" Green
    }
    
    "status" {
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "   Service Status" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker compose ps
    }
    
    "clean" {
        Write-ColorOutput "[!] This will remove ALL data volumes!" Red
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            docker compose down -v --remove-orphans
            docker system prune -f
            Remove-Item -Recurse -Force logs\*, backups\*, archives\*, data\* -ErrorAction SilentlyContinue
            Write-ColorOutput "Cleanup complete" Green
        } else {
            Write-ColorOutput "Cancelled" Yellow
        }
    }
    
    default {
        Write-Host ""
        Write-Host "Usage: .\docker-dev.ps1 [command]" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor White
        Write-Host "  up          Start development environment"
        Write-Host "  down        Stop all services"
        Write-Host "  restart     Restart services"
        Write-Host "  build       Build Docker images"
        Write-Host "  logs [svc]  View service logs"
        Write-Host "  logs-f [svc] Follow logs"
        Write-Host "  shell       Enter backend container"
        Write-Host "  db          Enter PostgreSQL psql"
        Write-Host "  redis       Enter Redis CLI"
        Write-Host "  test        Run tests"
        Write-Host "  lint        Run linter"
        Write-Host "  format      Format code"
        Write-Host "  status      Show services status"
        Write-Host "  clean       Clean up volumes"
        Write-Host "  help        Show this help"
        Write-Host ""
    }
}
