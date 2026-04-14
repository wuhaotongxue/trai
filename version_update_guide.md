# TRAI 版本更新与发布指南

本文档介绍了 TRAI 客户端（Electron）以及服务端的版本更新机制和流程。

## 1. 客户端 (Electron) 版本更新机制

TRAI 桌面客户端基于 `electron-updater` 实现自动更新机制。更新流程依赖于语义化版本号（Semver）、打包构建以及发布（Release）流程。

### 1.1 更新流程概览

1. **版本号升级**: 每次发版前，需修改 `client_electron/package.json` 中的 `version` 字段（如 `0.1.0` -> `0.1.1`）。
2. **构建打包**: 运行构建命令（`npm run build`），`electron-builder` 会根据配置打包出安装包（如 `.exe`）。
3. **生成元数据**: 在打包的同时，`electron-builder` 会自动生成 `latest.yml` 文件。该文件包含了最新版本的版本号、发布时间、安装包下载路径以及文件的哈希校验值（SHA512）。
4. **资源上传**: 将生成的 `.exe` 安装包以及 `latest.yml` 一起上传到服务器（如 AWS S3、阿里云 OSS 或私有文件服务器）。
5. **客户端检查更新**:
   - 运行中的 Electron 客户端会定期或在启动时通过 `autoUpdater.checkForUpdates()` 访问线上的 `latest.yml`。
   - 对比本地版本号与 `latest.yml` 中的版本号。若发现新版本，触发 `update-available` 事件。
6. **自动下载与安装**: 
   - 客户端后台静默下载 `.exe` 文件，并在下载完成后提示用户安装，或在用户退出应用时自动覆盖安装（`autoUpdater.quitAndInstall()`）。

### 1.2 突破 S3 时间限制与后端分发策略 (核心)

在使用 S3 等对象存储时，出于安全考虑，生成的文件下载链接通常是**带有时间限制的预签名链接**（如 5 分钟、1 小时后过期）。这会导致一个严重问题：如果客户端把 `electron-updater` 的检查地址直接写死为 S3 链接，链接一旦过期，所有客户端都无法再获取更新。

为了解决这个问题并确保客户端**始终能稳定获取最新版本**，我们采用“**后端接口动态中转**”的架构：

1. **后端提供固定更新 API**:
   后端提供一个固定的路由接口，例如 `/api/client/update/latest.yml` 和 `/api/client/update/download`。
2. **动态生成预签名链接**:
   当 Electron 客户端请求 `/api/client/update/latest.yml` 时，后端服务实时向 S3 申请一个有效期为 5 分钟的预签名链接，然后通过 `HTTP 302 Found` 临时重定向将请求转到该 S3 链接。
3. **客户端无感知获取**:
   客户端的 `autoUpdater.setFeedURL()` 配置为指向后端固定 API，这样每次检查更新都会拿到最新鲜、未过期的下载地址。

### 1.3 发布端 (自动化脚本)

开发人员在发布新版时，执行以下流程：
1. 本地执行 `pnpm build`，在 `release/` 目录生成 `TRAI Setup X.Y.Z.exe` 和 `latest.yml`。
2. 调用后端的发布接口（如 `/api/admin/client/release`），将这两个文件作为 FormData 提交。
3. 后端接收文件后，上传至 S3，并在数据库中记录最新版本号及对象存储的 Key 路径。

## 2. 后端与前端 (Web) 版本更新

- **后端**: 通常采用 Git Pull 或 CI/CD 管道（如 GitHub Actions）将最新的代码拉取到服务器，重启服务（如 Gunicorn / Uvicorn）即完成更新。
- **前端 Web (Next.js)**: 在构建服务器上执行 `npm run build`，生成最新的 `.next` 产物，重启 Node 进程完成无缝更新。

## 3. 注意事项
- **版本号规范**: 必须遵循 `主版本号.次版本号.修订号` 规范，否则 `electron-updater` 可能无法正确识别新版本。
- **安全校验**: 更新依赖于 `latest.yml` 里的 SHA512 校验和，确保下载过程防篡改。
- **降级保护**: 默认配置下，应用不能通过自动更新机制降级。

