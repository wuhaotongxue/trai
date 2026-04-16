---
name: "backend_code_check_wuhao"
description: "用于自动格式化和检查 backend 目录下的 Python 代码。当修改完后台代码或用户要求格式化后台代码时调用此技能，强制执行 DDD 5层架构、类封装规范（每个 .py 必须有类，所有函数必须封装在类中）、文件头规范与标点符号规范。"
---

# Backend_Code_Review_(Wuhao)

作为 TRAI 平台核心后端开发人员 (wuhao) 的专属代码审查警察，请严格按照以下规范进行审查。

## 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| Python 规范 | `rules/python.md` | 必读 |
| 数据库规范 | `rules/database.md` | 新增 Model 时 |
| 数据库表总览 | `database_schema.md` | 查看表结构时 |
| API 设计规范 | `api_design/routes.md` | 新增 API 时 |
| S3 存储与访问控制 | `storage/s3_access.md` | 涉及文件上传/下载时 |
| DDD 五层架构 | `architecture/layered.md` | 必读 |

---

## 核心审查规则

### 1. 中文标点禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、日志、异常文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
  <p style="margin-top:8px;font-size:13px;color:#D32F2F;font-weight:bold;">
    ⚠️ AI 强制动作：在每次编写或修改代码时，你必须主动自我检查输出的内容！如果遇到或产生了任何中文全角标点，必须立即使用 SearchReplace 工具将其修改为半角英文标点！
  </p>
</div>

### 2. Python 3.13 环境

| 设置项 | 值 |
|--------|------|
| 标准环境 | `trai_31313_20260413` (Conda) |
| Python 版本 | 3.13.13 |
| 类型提示 | `|` 替代 `Union`/`Optional`，`list[int]` 替代 `typing.List` |
| 缩进 | 4 个空格，禁止 Tab |
| 跨平台路径 | 禁止硬编码 `\`，必须使用 `pathlib` |

### 2.1 测试与验证 (MANDATORY)

- 后端功能验证统一使用 Python 脚本, 放在 `backend/scripts/` 下, 运行即输出结果
- 默认使用 `http://127.0.0.1:5666` 作为 API_BASE, 不要在测试命令里拼接 PowerShell 的 `$env:...` 或复杂引号
- 需要切换虚拟环境时, 先 `conda activate trai_31313_20260413`, 然后直接 `python scripts/xxx.py`
- PowerShell 语法不要用 `&&`, 多条命令用 `;`

### 3. 强制类封装与 DDD 分层 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 强制要求</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>每个 .py 文件必须有类</strong>，禁止创建没有任何类的占坑文件</li>
    <li><strong>所有函数必须封装在类中</strong>，禁止文件顶层孤立函数</li>
    <li>业务相关配置变量应作为类变量或实例变量，禁止模块顶层全局变量</li>
    <li><strong>Domain 层禁止引入任何第三方框架</strong> (SQLAlchemy / FastAPI / Redis)</li>
  </ul>
</div>

| 文件行数限制 | 说明 |
|-------------|------|
| 单文件 ≤ 1500 行 | 超限必须按功能拆分 |
| 建议单个 class ≤ 300 行 | 超限考虑拆分职责 |

### 4. API 设计规范

| 规则 | 说明 |
|------|------|
| HTTP 方法 | 业务接口强制仅使用 **POST**，GET 仅用于查询类接口 |
| 统一响应格式 | `{"code": 200, "msg": "OK", "data": {}, "req_id": "...", "ts": "..."}` |
| 输入验证 | 所有输入必须通过 Pydantic 模型验证 |
| 长任务处理 | 必须使用 `BackgroundTasks` 或消息队列 |
| API 层禁止 | 禁止直接写 SQL、禁止写业务逻辑 |

### 5. 数据库规范

| 规则 | 说明 |
|------|------|
| 表名 | 复数 snake_case (`users`, `meeting_records`) |
| 主键 | UUID 或 BigInt Identity (**禁止 Serial**) |
| 必备字段 | `created_at`, `updated_at`, `deleted_at` |
| 强制注释 | 表和每个字段必须有中文 `comment` |
| 查询红线 | 禁止 `SELECT *`、禁止 N+1 (必须 joinedload)、禁止裸 SQL 拼接 |
| 迁移规范 | **禁止在生产环境执行 DDL**，必须使用 Alembic |

### 6. 异常处理与日志 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>禁止 `print()`</strong>，必须使用 `loguru` 或项目封装的 `logger`</li>
    <li><strong>禁止裸 `except:`</strong>，必须指明异常类型</li>
    <li><strong>禁止静默 `pass`</strong>，捕获异常后必须 `logger.error(...)` 记录</li>
  </ul>
</div>

### 7. 文件头模板 (MANDATORY)

#### Python 文件模板

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际文件名}
# 作者: wuhao
# 日期: 2026_04_09_10:47:12  ← 当前时间（每次修改配置时刷新）
# 描述: {该文件的用途/功能简述，一句话概括}
```

#### .env.example 文件模板

```bash
# ============================================================
# TRAI Backend Environment Configuration
# 文件名: .env
# 作者: wuhao
# 日期: 2026_04_09_10:47:12  ← 当前时间（每次修改配置时刷新）
# 描述: {配置文件用途简述}
# 说明: {补充说明}
# ============================================================
```

<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#E65100;">&#x26A0; 时间获取强制流程</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>第一步：获取当前时间</strong> — 任何涉及日期的操作前，必须先调用 Shell 执行 <code>date +%Y_%m_%d_%H:%M:%S</code> 或 <code>Get-Date -Format "yyyy_MM_dd_HH:mm:ss"</code></li>
    <li><strong>第二步：使用获取到的时间</strong> — 将第一步获取的时间填入日期字段</li>
    <li><strong>禁止使用预估值或固定值</strong> — 严禁用记忆中的时间、估算时间或历史时间</li>
    <li><strong>禁止使用 AI 内部时间</strong> — AI 训练数据中的时间不是真实时间</li>
  </ul>
</div>

#### 错误示例（禁止）

```bash
# 日期: 2026_04_09_17:30:00    # ❌ 估算/记忆的时间
# 日期: 2026_01_01_00:00:00    # ❌ 固定历史时间
# 日期: {current_time}          # ❌ 未获取真实时间
```

#### 正确示例

```bash
# 假设当前时间是 2026_04_09_10:45:00
# 日期: 2026_04_09_10:45:00    # ✅ 使用真实获取的时间
```

### 8. Docstring 全覆盖 (MANDATORY)

文件中出现的**每一个** `class` 及**每一个** `def`/`async def`，**都必须**具备中文 docstring，**禁止留空**。包括私有方法、`__init__`、`@staticmethod`、`@classmethod` 同等强制。

docstring 内容必须包含：
- **用途或流程概述** + **参数**（含类型与含义）+ **返回值**（含类型与含义）+ **异常** 四段

### 9. 安全红线 (CRITICAL)

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 安全红线 — 任何一条违规直接打回</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>密码必须使用 <code>passlib</code> + <code>bcrypt</code>/<code>Argon2</code> 哈希，<strong>禁止明文存储或使用 MD5/SHA1</strong></li>
    <li>严禁在日志中记录用户的明文密码、真实 Token 等敏感信息</li>
    <li><strong>严禁 S3 资源 Public Read</strong>，必须通过 Presigned URL 访问</li>
    <li><strong>企业微信禁止用户名密码登录</strong>，仅支持扫码登录 (SSO)</li>
    <li><strong>多租户强制隔离</strong>：每次 S3 访问必须校验 <code>tenant_id</code></li>
    <li><strong>上传必须双重校验</strong>：Content-Type + 扩展名同时通过才允许上传</li>
    <li><strong>可执行文件禁止上传</strong>：`.exe/.sh/.py/.js/.jar/.dll/.so` 一律拒绝</li>
    <li><strong>下载必须限流</strong>：每次签发 Presigned URL 前检查滑动窗口限流</li>
    <li><strong>S3 操作全量审计</strong>：GetObject/PutObject/DeleteObject 全部记录结构化日志</li>
    <li><strong>AI 内容必须审核</strong>：文生图/图生视频生成后必须经过内容安全审核才能展示</li>
    <li><strong>AI 服务直传安全</strong>：Presigned PUT URL 有效期 ≤ 300 秒，校验 <code>x-amz-expected-bucket-owner</code></li>
    <li><strong>AI 月配额控制</strong>：用户提交 AI 任务前必须校验月度配额，超额拒绝</li>
  </ul>
</div>

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止裸 except</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须指明异常类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 print</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须使用 logger</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">文件必须有类</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止顶层孤立函数</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">Domain 纯净</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止第三方框架导入</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 Serial</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">用 UUID 或 BigInt</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">pathlib</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止硬编码路径</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Docstring</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每个 def 必须有</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">业务接口 POST</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止 GET/PUT/DELETE</div>
  </div>

</div>
