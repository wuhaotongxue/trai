---
name: "backend-rules"
description: "TRAI 后端开发规范。强制执行 DDD 5层架构、类封装规范、文件头规范、中文标点禁令。"
---

# Backend 开发规范

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| Python 规范 | `rules/python.md` | 必读 |
| 数据库规范 | `rules/database.md` | 新增 Model 时 |
| API 设计规范 | `api_design/routes.md` | 新增 API 时 |
| S3 存储与访问控制 | `storage/s3_access.md` | 涉及文件上传/下载时 |
| DDD 五层架构 | `architecture/layered.md` | 必读 |

## 核心规则

### 1. 中文标点禁令 (CRITICAL)
- **绝对禁止**在代码和注释中出现中文全角标点 (`，`、`。`、`！`、`：`)
- 必须使用英文半角标点 (`,`, `.`, `!`, `:`)

### 2. Python 3.13 环境
- 标准环境：`zz_trai_3_13_12_dev_20260311` (Conda)
- 强制使用 `|` 替代 `Union`/`Optional`
- 缩进 4 个空格

### 3. 强制类封装与 DDD 分层
- **每个 .py 文件必须有类**
- **所有函数必须封装在类中**
- 禁止文件顶层孤立函数

### 4. API 设计规范
- 业务接口强制仅使用 **POST**
- 统一响应格式: `{"code": 200, "msg": "OK", "data": {}, "req_id": "...", "ts": "..."}`

### 5. 数据库规范
- 表名: 复数 snake_case
- 主键: UUID 或 BigInt Identity (禁止 Serial)
- 必备字段: `created_at`, `updated_at`, `is_deleted`

### 6. 文件头模板 (MANDATORY)
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际文件名}
# 作者: wuhao
# 日期: {YYYY-MM-DD HH:MM:SS}
# 描述: {该文件的用途/功能简述，一句话概括}
```

### 7. Docstring 全覆盖
- 每个 `class`、每个 `def`/`async def` 必须有中文 docstring
- 内容: 用途 + 参数 + 返回值 + 异常

### 8. 安全红线
- 必须使用 `passlib` + `bcrypt`/`Argon2` 哈希密码
- 严禁在日志中记录明文密码或 Token
- **严禁 S3 资源 Public Read**，必须通过 Presigned URL 访问 (详见 `storage/s3_access.md`)
- **企业微信禁止用户名密码登录**，仅支持扫码登录 (SSO)，否则视为普通用户
- **企业微信扫码登录自动授予 `wecom_vip` 权限**（等同于 VIP 会员有效期）
- **EXE 更新不影响 S3 权限**，权限控制仅在 Backend 侧
- **多租户强制隔离**：每次 S3 访问必须校验 `tenant_id`，禁止跨租户访问
- **上传必须双重校验**：Content-Type + 扩展名同时通过才允许上传
- **可执行文件禁止上传**：`.exe/.sh/.py/.js/.jar/.dll/.so` 及对应 MIME 类型一律拒绝
- **下载必须限流**：每次签发 Presigned URL 前先检查滑动窗口限流
- **S3 操作全量审计**：GetObject/PutObject/DeleteObject 全部记录结构化日志
- **AI 内容必须审核**：文生图/图生视频生成后必须经过内容安全审核才能展示
- **AI 服务直传安全**：Presigned PUT URL 有效期 ≤ 300 秒，校验 x-amz-expected-bucket-owner
- **AI 月配额控制**：用户提交 AI 任务前必须校验月度配额，超额拒绝