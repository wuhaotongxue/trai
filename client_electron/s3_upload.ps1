# TRAI 客户端 S3 上传脚本 (Windows PowerShell)
# 文件名: s3_upload.ps1
# 作者: wuhao
# 日期: 2026-04-25 04:30:00
# 描述: S3 上传脚本 - 使用 AWS CLI 上传客户端到 S3

# ============================================================
# 配置区域 - 请根据实际情况修改
# ============================================================

# S3 Bucket 名称
$S3_BUCKET = if ($env:S3_BUCKET) { $env:S3_BUCKET } else { "trai" }

# S3 终端节点（留空使用默认）
$S3_ENDPOINT = if ($env:S3_ENDPOINT) { $env:S3_ENDPOINT } else { "" }

# 发布版本（留空自动从文件名读取）
$VERSION = if ($env:VERSION) { $env:VERSION } else { "" }

# 发布目录
$RELEASE_DIR = "release"

# ============================================================
# 辅助函数
# ============================================================

function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Log-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# ============================================================
# 主函数
# ============================================================

function Main {
    Write-Host ""
    Write-Host "=================================================="
    Write-Host "     TRAI 客户端 S3 上传工具 (PowerShell)"
    Write-Host "=================================================="
    Write-Host ""

    # 检查 AWS CLI
    try {
        $null = Get-Command aws -ErrorAction Stop
    } catch {
        Log-Error "AWS CLI 未安装，请先安装 AWS CLI"
        Write-Host "安装指南: https://docs.aws.amazon.com/cli/latest/userguide/install-windows.html"
        return
    }

    # 检查发布目录
    if (-not (Test-Path $RELEASE_DIR)) {
        Log-Error "发布目录不存在: $RELEASE_DIR"
        Log-Info "请先运行 npm run build 构建客户端"
        return
    }

    # 查找安装包
    $exeFiles = Get-ChildItem -Path $RELEASE_DIR -Filter "*.exe" -File | Where-Object { $_.Name -like "*Setup*" }
    if ($exeFiles.Count -eq 0) {
        Log-Error "未找到 Setup 安装包文件"
        return
    }

    $exeFile = $exeFiles[0].FullName

    # 提取版本号
    if (-not $VERSION) {
        # 尝试从文件名提取
        if ($exeFile -match 'Setup\s+([\d.]+)') {
            $VERSION = $matches[1]
        } elseif ($exeFile -match '([\d]+\.[\d]+\.[\d]+)') {
            $VERSION = $matches[1]
        }
    }

    if (-not $VERSION) {
        Log-Error "无法自动提取版本号，请手动设置 VERSION 环境变量"
        return
    }

    Log-Info "版本: $VERSION"
    Log-Info "安装包: $exeFile"

    # 显示文件大小
    $fileSize = (Get-Item $exeFile).Length / 1MB
    Log-Info "文件大小: $([math]::Round($fileSize, 2)) MB"

    # 构建 S3 路径
    $S3_BASE = "s3://$S3_BUCKET/releases"
    $S3_VERSION_PATH = "$S3_BASE/$VERSION"
    $LATEST_YML_PATH = "$S3_BASE/latest.yml"
    $LATEST_EXE_PATH = "$S3_BASE/TRAI-latest.exe"

    Write-Host ""
    Write-Host "上传配置:"
    Write-Host "  Bucket: $S3_BUCKET"
    Write-Host "  版本路径: $S3_VERSION_PATH"
    Write-Host ""

    # 构建 aws cli 命令
    $awsCmd = "aws s3"
    if ($S3_ENDPOINT) {
        $awsCmd = "$awsCmd --endpoint-url $S3_ENDPOINT"
    }

    # 确认上传
    $confirm = Read-Host "确认上传? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Log-Info "取消上传"
        return
    }

    Write-Host ""
    Log-Info "开始上传..."

    # 上传安装包
    Log-Info "上传安装包..."
    $uploadExeCmd = "$awsCmd cp `"$exeFile`" `"$S3_VERSION_PATH/`" --content-type `"application/x-msdownload`" --acl public-read"
    Invoke-Expression $uploadExeCmd

    if ($LASTEXITCODE -eq 0) {
        Log-Success "安装包上传成功"
    } else {
        Log-Error "安装包上传失败"
        return
    }

    # 生成 latest.yml
    Log-Info "生成 latest.yml..."
    $ymlContent = @"
version: ${VERSION}
releaseDate: $(Get-Date -Format "o")
files:
  - url: $(Split-Path $exeFile -Leaf)
    sha512: placeholder
    size: $((Get-Item $exeFile).Length)
path: $(Split-Path $exeFile -Leaf)
"@
    $tempYml = Join-Path $env:TEMP "latest.yml"
    $ymlContent | Out-File -FilePath $tempYml -Encoding UTF8

    # 上传 latest.yml
    Log-Info "上传 latest.yml..."
    $uploadYmlCmd = "$awsCmd cp `"$tempYml`" `"$S3_VERSION_PATH/latest.yml`" --content-type `"application/x-yaml`" --acl public-read"
    Invoke-Expression $uploadYmlCmd

    if ($LASTEXITCODE -eq 0) {
        Log-Success "latest.yml 上传成功"
    } else {
        Log-Error "latest.yml 上传失败"
        return
    }

    # 更新 latest 链接（可选）
    Write-Host ""
    $updateLatest = Read-Host "是否更新 releases/latest.yml 和 releases/TRAI-latest.exe (用于稳定版通道)? (y/n)"
    if ($updateLatest -eq "y" -or $updateLatest -eq "Y") {
        Log-Info "更新 latest 通道..."
        Invoke-Expression "$awsCmd cp `"$tempYml`" `"$LATEST_YML_PATH`" --content-type `"application/x-yaml`" --acl public-read"
        Invoke-Expression "$awsCmd cp `"$exeFile`" `"$LATEST_EXE_PATH`" --content-type `"application/x-msdownload`" --acl public-read"
        Log-Success "latest 通道已更新"
    }

    # 验证上传
    Write-Host ""
    Log-Info "验证上传..."
    Invoke-Expression "$awsCmd ls `"$S3_VERSION_PATH/`""

    Write-Host ""
    Write-Host "=================================================="
    Log-Success "上传完成!"
    Write-Host "=================================================="
    Write-Host ""
    Write-Host "客户端用户可通过以下地址下载:"
    Write-Host "  https://ai.tuoren.com/trai/releases/$VERSION/TRAI-latest.exe"
    Write-Host ""
    Write-Host "或访问管理后台: http://127.0.0.1:5666/docs"
    Write-Host ""

    # 清理临时文件
    Remove-Item $tempYml -Force -ErrorAction SilentlyContinue
}

# 运行主函数
Main
