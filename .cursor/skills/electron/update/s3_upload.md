# Electron - 自动更新规范

## 1. latest.yml 格式

| 字段 | 说明 | 示例 |
|------|------|------|
| `version` | 版本号 (Semver) | `1.0.1` |
| `files` | 安装包列表 | url, sha512, size |
| `path` | 主安装包路径 | `TRAI-1.0.1-x64.exe` |
| `sha512` | 校验和 | `<hash>` |
| `releaseDate` | 发布日期 | ISO 8601 格式 |

## 2. 自动更新服务

| 事件 | 说明 |
|------|------|
| `checking-for-update` | 正在检查更新 |
| `update-available` | 发现新版本 |
| `update-not-available` | 已是最新版本 |
| `download-progress` | 下载进度 |
| `update-downloaded` | 下载完成 |
| `error` | 更新出错 |

| 方法 | 说明 |
|------|------|
| `checkForUpdates()` | 检查更新 |
| `downloadUpdate()` | 下载更新 |
| `quitAndInstall()` | 安装并重启 |

## 3. 更新通道配置

| 通道 | 用途 | latest.yml 文件 |
|------|------|-----------------|
| `latest` | 正式稳定版 | `TRAI-latest.yml` |
| `beta` | Beta 测试版 | `TRAI-beta.yml` |
| `alpha` | Alpha 开发版 | `TRAI-alpha.yml` |

## 4. S3 存储结构

```
S3 Bucket: update.trai.com/
│
├── releases/                     # 发布版本目录
│   ├── TRAI-1.0.0-x64.exe       # Windows 安装包
│   ├── TRAI-1.0.0-x64.zip      # Windows 便携包
│   ├── latest.yml               # 指向最新版本
│   │
│   ├── beta/                    # Beta 版本目录
│   │   ├── TRAI-1.1.0-beta.1-x64.exe
│   │   └── latest.yml
│   │
│   └── alpha/                   # Alpha 版本目录
│       ├── TRAI-1.2.0-alpha.1-x64.exe
│       └── latest.yml
```

## 5. S3 Bucket 权限配置

| 设置项 | 值 | 说明 |
|--------|-----|------|
| Bucket 权限 | Public Read | 允许匿名下载 |
| 版本控制 | Enabled | 支持版本历史 |
| 静态网站托管 | Enabled | 可选，用于直接访问 |
| CORS | Disabled | 更新通过 electron-updater |

## 6. GitHub Actions 发布流程

| 步骤 | 说明 |
|------|------|
| 1. 构建 | `npm run build` + `electron-builder --win` |
| 2. 上传 | 调用 Backend API 上传到 S3 |
| 3. 发布 | 创建 GitHub Release |

## 7. 快速参考卡片

| 场景 | 规范 |
|------|------|
| 版本号 | 严格 Semver (X.Y.Z) |
| 元数据 | electron-updater 必需 latest.yml |
| 发布方式 | 通过 Backend API 上传 S3 |
| 通道管理 | latest/beta/alpha 三通道 |
| Bucket 权限 | Public Read |
