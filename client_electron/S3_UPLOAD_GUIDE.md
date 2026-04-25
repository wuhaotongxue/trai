# TRAI 客户端发布指南

## 方式一：手动上传到 S3（最简单）

### 1. 构建客户端

```bash
cd client_electron
npm run build
```

### 2. 上传文件到 S3

构建完成后，将以下文件上传到你的 S3 bucket：

```
S3 Bucket Structure:
├── releases/
│   ├── {version}/
│   │   ├── latest.yml
│   │   └── TRAI Setup {version}.exe
```

**示例（使用 AWS CLI）：**

```bash
# 设置版本号
VERSION="0.1.0"
BUCKET="s3://your-bucket-name"

# 上传 latest.yml
aws s3 cp "release/TRAI-latest.yml" "${BUCKET}/releases/${VERSION}/latest.yml" \
  --content-type "application/x-yaml"

# 上传安装包
aws s3 cp "release/TRAI Setup ${VERSION}.exe" "${BUCKET}/releases/${VERSION}/" \
  --content-type "application/octet-stream"

# 验证上传
aws s3 ls "${BUCKET}/releases/${VERSION}/"
```

### 3. 更新 latest 链接（可选）

如果想保持 `latest` 通道最新：

```bash
# 复制到 latest 目录
aws s3 cp "${BUCKET}/releases/${VERSION}/latest.yml" "${BUCKET}/releases/latest.yml"
aws s3 cp "${BUCKET}/releases/${VERSION}/TRAI Setup ${VERSION}.exe" "${BUCKET}/releases/TRAI-latest.exe"
```

---

## 方式二：使用 Python 脚本

### 1. 配置环境变量

```bash
# 后端 API 地址
export TRAI_API_URL=http://127.0.0.1:5666

# 管理员 Token（登录后获取）
export TRAI_ADMIN_TOKEN=your_admin_token_here
```

### 2. 运行脚本

```bash
cd backend/src/scripts
python publish_client.py --version 0.1.0
```

### 3. 获取 Token

```bash
# 登录获取 Token
curl -X POST http://127.0.0.1:5666/api_trai/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wuhao","password":"your_password"}'
```

---

## 方式三：使用 Node.js 脚本

### 1. 配置环境变量

```bash
export TRAI_API_URL=http://127.0.0.1:5666
export TRAI_ADMIN_TOKEN=your_admin_token_here
export TRAI_RELEASE_NOTES="修复了一些 bug"
```

### 2. 运行脚本

```bash
cd client_electron
npm run publish
```

---

## 方式四：后端管理界面

1. 访问后端管理界面：`http://your-backend:5666/docs`
2. 找到 `/api_trai/v1/admin/client/release` 接口
3. 使用 Swagger UI 上传文件

---

## S3 配置检查清单

- [ ] Bucket 名称：`trai`（或你的 bucket 名）
- [ ] Public Read 权限（客户端需要匿名下载）
- [ ] CORS 配置（如果需要跨域）
- [ ] 版本控制已启用（可选，便于回滚）

## 验证客户端更新

客户端更新时会请求：
```
GET /api_trai/v1/client/update/latest.yml
```

确保该请求能返回正确的 `latest.yml` 内容。

## 回滚操作

如果新版本有问题，需要回滚：

```bash
# 将旧版本的 yml 和 exe 复制为 latest
aws s3 cp "${BUCKET}/releases/0.0.9/latest.yml" "${BUCKET}/releases/latest.yml"
aws s3 cp "${BUCKET}/releases/0.0.9/TRAI Setup 0.0.9.exe" "${BUCKET}/releases/TRAI-latest.exe"
```
