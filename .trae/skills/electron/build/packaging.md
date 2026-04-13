# Electron - 打包与发布规范

## 1. 打包配置

```yaml
# electron-builder.yml
appId: com.trai.electron
productName: TRAI
copyright: Copyright (C) 2026 TRAI

directories:
  buildResources: resources
  output: dist

files:
  - dist/                 # 构建输出
  - package.json

win:
  target:
    - target: nsis
      arch: x64
    - target: portable
      arch: x64
  icon: resources/icon.ico
  artifactName: ${productName}-${version}-${arch}.${ext}

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: TRAI

mac:
  target:
    - target: dmg
      arch: x64
    - target: zip
      arch: x64, arm64
  icon: resources/icon.icns
  category: public.app-category.productivity

linux:
  target:
    - target: AppImage
      arch: x64
  icon: resources/icons
  category: Office
```

## 2. 版本号规范 (Semver)

### 版本类型

| 版本类型 | 格式 | 正确示例 | 错误示例 |
|----------|------|----------|----------|
| 正式版 | `X.Y.Z` | `1.0.0`, `2.1.3` | `1.0`, `1` |
| 预发布版 | `X.Y.Z-alpha.N` | `1.0.0-alpha.1` | `1.0.0-alpha` |
| Beta 版 | `X.Y.Z-beta.N` | `1.0.0-beta.1` | `1.0.0-beta` |
| RC 版 | `X.Y.Z-rc.N` | `1.0.0-rc.1` | `1.0.0-RC1` |

### package.json 版本号

```json
{
  "version": "1.0.0",       // ✅ 必须符合 semver
  "buildVersion": "1.0.0"   // ✅ 构建版本号
}

// ❌ 禁止
{
  "version": "1.0",          // ❌ 必须有 patch
  "version": "v1.0.0",      // ❌ 禁止 v 前缀
  "version": "1.0.0.1",     // ❌ 只能是 3 位
  "version": "latest"       // ❌ 禁止 latest
}
```

## 3. 打包输出文件命名

```
dist/
├── TRAI-1.0.0-x64.exe      # NSIS 安装包
├── TRAI-1.0.0-x64.zip      # Windows 便携包
└── latest.yml              # electron-updater 元数据
```

## 4. 打包后处理脚本

```python
# scripts/postdist.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: electron/scripts/postdist.py
# 作者: wuhao
# 日期: 2026-04-07 10:00:00
# 描述: 打包后调用 Backend API 上传安装包到 S3

import sys
import os
import hashlib
import argparse
import requests
from pathlib import Path


class BackendApiClient:
    """Backend API 客户端"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Accept': 'application/json',
        })

    def upload_release(
        self,
        version: str,
        file_path: str,
        file_type: str,
        channel: str = 'latest',
    ) -> dict:
        """上传安装包到 Backend"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f'File not found: {file_path}')

        sha512 = hashlib.sha512(file_path.read_bytes()).hexdigest()
        file_size = file_path.stat().st_size

        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/octet-stream')}
            data = {
                'version': version,
                'file_type': file_type,
                'channel': channel,
                'sha512': sha512,
                'file_size': file_size,
            }
            response = self.session.post(
                f'{self.base_url}/api/admin/releases/upload',
                files=files,
                data=data,
            )
            response.raise_for_status()
            return response.json()

    def publish_release(self, version: str, channel: str = 'latest') -> dict:
        """发布版本 (生成 latest.yml)"""
        response = self.session.post(
            f'{self.base_url}/api/admin/releases/publish',
            json={'version': version, 'channel': channel},
        )
        response.raise_for_status()
        return response.json()


def main():
    parser = argparse.ArgumentParser(description='Post-distribution processing script')
    parser.add_argument('--version', required=True, help='版本号 (如: 1.0.0)')
    parser.add_argument('--dist-dir', required=True, help='dist 目录路径')
    parser.add_argument('--backend-url', required=True, help='Backend API URL')
    parser.add_argument('--api-key', required=True, help='API Key')
    parser.add_argument('--channel', default='latest', help='发布通道 (latest/beta/alpha)')
    args = parser.parse_args()

    dist_dir = Path(args.dist_dir)
    client = BackendApiClient(args.backend_url, args.api_key)

    exe_files = list(dist_dir.glob('TRAI-*.exe'))
    zip_files = list(dist_dir.glob('TRAI-*.zip'))

    for exe_file in exe_files:
        client.upload_release(args.version, str(exe_file), 'exe', args.channel)

    for zip_file in zip_files:
        client.upload_release(args.version, str(zip_file), 'zip', args.channel)

    client.publish_release(args.version, args.channel)
    print(f'Release v{args.version} published successfully.')


if __name__ == '__main__':
    main()
```

## 5. npm 脚本配置

```json
{
  "scripts": {
    "build": "electron-vite build",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "postdist": "python scripts/postdist.py --version $npm_package_version --dist-dir dist --backend-url $BACKEND_URL --api-key $ADMIN_API_KEY --channel latest",
    "release": "npm run dist:win && npm run postdist",
    "release:beta": "npm run dist:win && python scripts/postdist.py --version $npm_package_version --dist-dir dist --backend-url $BACKEND_URL --api-key $ADMIN_API_KEY --channel beta"
  }
}
```

## 6. 发布命令

```bash
# 正式版
npm run release

# Beta 版
npm run release:beta

# 手动发布
npm run dist:win
npm run postdist -- --version 1.0.0 --backend-url http://localhost:8000 --api-key xxx
```

## 7. 禁止事项

```python
# ❌ 禁止: 硬编码凭证
aws_access_key_id = 'AKIAIOSFODNN7EXAMPLE'  # ❌

# ✅ 正确: 环境变量
aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')

# ❌ 禁止: 跳过 SHA512 校验
# latest.yml 必须包含每个文件的 sha512

# ❌ 禁止: 覆盖正式版 latest.yml
# 除非确认是新版本的正式发布
```
