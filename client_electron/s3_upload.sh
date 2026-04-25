#!/bin/bash
# 文件名: s3_upload.sh
# 作者: wuhao
# 日期: 2026-04-25 04:30:00
# 描述: S3 上传脚本 - 使用 AWS CLI 上传客户端到 S3

# ============================================================
# 配置区域 - 请根据实际情况修改
# ============================================================

# S3 Bucket 名称
S3_BUCKET="${S3_BUCKET:-trai}"

# S3 终端节点（留空使用默认）
S3_ENDPOINT="${S3_ENDPOINT:-}"

# 发布版本（留空自动从文件名读取）
VERSION="${VERSION:-}"

# 发布目录
RELEASE_DIR="release"

# ============================================================
# 颜色定义
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# 辅助函数
# ============================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# 主函数
# ============================================================
main() {
    echo ""
    echo "=================================================="
    echo "     TRAI 客户端 S3 上传工具"
    echo "=================================================="
    echo ""

    # 检查 AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI 未安装，请先安装 AWS CLI"
        echo "安装指南: https://docs.aws.amazon.com/cli/latest/userguide/install-windows.html"
        exit 1
    fi

    # 检查发布目录
    if [ ! -d "$RELEASE_DIR" ]; then
        log_error "发布目录不存在: $RELEASE_DIR"
        log_info "请先运行 npm run build 构建客户端"
        exit 1
    fi

    # 查找安装包
    EXE_FILE=$(find "$RELEASE_DIR" -name "*.exe" -type f 2>/dev/null | head -n 1)
    if [ -z "$EXE_FILE" ]; then
        log_error "未找到 .exe 安装包文件"
        exit 1
    fi

    # 提取版本号
    if [ -z "$VERSION" ]; then
        VERSION=$(echo "$EXE_FILE" | grep -oP 'Setup\s+[\d.]+' | sed 's/Setup\s*//')
        if [ -z "$VERSION" ]; then
            VERSION=$(basename "$EXE_FILE" | grep -oP '[\d]+\.[\d]+\.[\d]+' | head -n 1)
        fi
    fi

    if [ -z "$VERSION" ]; then
        log_error "无法自动提取版本号，请手动设置 VERSION 环境变量"
        exit 1
    fi

    log_info "版本: $VERSION"
    log_info "安装包: $EXE_FILE"

    # 显示文件大小
    FILE_SIZE=$(du -h "$EXE_FILE" | cut -f1)
    log_info "文件大小: $FILE_SIZE"

    # 构建 S3 路径
    S3_PATH="s3://${S3_BUCKET}/releases/${VERSION}"
    LATEST_PATH="s3://${S3_BUCKET}/releases/latest.yml"
    LATEST_EXE_PATH="s3://${S3_BUCKET}/releases/TRAI-latest.exe"

    echo ""
    echo "上传配置:"
    echo "  Bucket: $S3_BUCKET"
    echo "  路径: $S3_PATH"
    echo ""

    # 构建 aws cli 命令
    AWS_CMD="aws s3"
    if [ -n "$S3_ENDPOINT" ]; then
        AWS_CMD="$AWS_CMD --endpoint-url $S3_ENDPOINT"
    fi

    # 确认上传
    read -p "确认上传? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        log_info "取消上传"
        exit 0
    fi

    echo ""
    log_info "开始上传..."

    # 上传安装包
    log_info "上传安装包..."
    $AWS_CMD cp "$EXE_FILE" "${S3_PATH}/" \
        --content-type "application/x-msdownload" \
        --acl public-read

    if [ $? -eq 0 ]; then
        log_success "安装包上传成功"
    else
        log_error "安装包上传失败"
        exit 1
    fi

    # 生成 latest.yml
    log_info "生成 latest.yml..."
    cat > /tmp/latest.yml << EOF
version: ${VERSION}
releaseDate: $(date -Iseconds)
files:
  - url: $(basename "$EXE_FILE")
    sha512: placeholder
    size: $(stat -c%s "$EXE_FILE" 2>/dev/null || stat -f%z "$EXE_FILE")
path: $(basename "$EXE_FILE")
EOF

    # 上传 latest.yml
    log_info "上传 latest.yml..."
    $AWS_CMD cp /tmp/latest.yml "${S3_PATH}/latest.yml" \
        --content-type "application/x-yaml" \
        --acl public-read

    if [ $? -eq 0 ]; then
        log_success "latest.yml 上传成功"
    else
        log_error "latest.yml 上传失败"
        exit 1
    fi

    # 更新 latest 链接（可选）
    echo ""
    read -p "是否更新 releases/latest.yml 和 releases/TRAI-latest.exe (用于稳定版通道)? (y/n): " UPDATE_LATEST
    if [ "$UPDATE_LATEST" == "y" ] || [ "$UPDATE_LATEST" == "Y" ]; then
        log_info "更新 latest 通道..."
        $AWS_CMD cp /tmp/latest.yml "$LATEST_PATH" \
            --content-type "application/x-yaml" \
            --acl public-read
        $AWS_CMD cp "$EXE_FILE" "$LATEST_EXE_PATH" \
            --content-type "application/x-msdownload" \
            --acl public-read
        log_success "latest 通道已更新"
    fi

    # 验证上传
    echo ""
    log_info "验证上传..."
    $AWS_CMD ls "${S3_PATH}/"

    echo ""
    echo "=================================================="
    log_success "上传完成!"
    echo "=================================================="
    echo ""
    echo "客户端用户可通过以下地址下载:"
    echo "  ${S3_ENDPOINT:-https://ai.tuoren.com/trai}/releases/${VERSION}/TRAI-latest.exe"
    echo ""
    echo "或访问管理后台: http://127.0.0.1:5666/docs"
    echo ""
}

# 运行主函数
main "$@"
