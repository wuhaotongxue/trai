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
| 启动规范 | `startup.md` | 启动后端时 |

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
</div>

### 2. Python 3.13 环境

| 设置项 | 值 |
|--------|------|
| 标准环境 | `trai` (Conda) |
| 类型提示 | `|` 替代 `Union`/`Optional`，`list[int]` 替代 `typing.List` |
| 缩进 | 4 个空格，禁止 Tab |
| 跨平台路径 | 禁止硬编码 `\`，必须使用 `pathlib` |

### 3. 导入规范 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止重复导入</strong> — 同一个模块禁止出现两个相同的 import 语句
  <div style="margin-top:12px;background:#fff5f5;padding:12px;border-radius:6px;">
    <strong style="color:#D32F2F;">错误示例：</strong>
    <pre style="background:#fff;padding:8px;border-radius:4px;margin:8px 0 0 0;font-size:12px;overflow-x:auto;">
from typing import List
from typing import List  # 重复导入！</pre>
  </div>
  <div style="margin-top:12px;background:#f0fff0;padding:12px;border-radius:6px;">
    <strong style="color:#2E7D32;">正确做法：</strong>
    <pre style="background:#fff;padding:8px;border-radius:4px;margin:8px 0 0 0;font-size:12px;overflow-x:auto;">
from typing import List  # 合并到一行</pre>
  </div>
  <div style="margin-top:12px;">
    <strong>审查时必须检查：</strong>
    <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
      <li>每个 import 语句唯一性</li>
      <li>同一模块只导入一次</li>
      <li>使用 pylint <code>reimported</code> 或 flake8 <code>E401</code> 检查</li>
    </ul>
  </div>
</div>

### 4. 强制类封装与 DDD 分层 (CRITICAL)

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

### 5. API 设计规范

| 规则 | 说明 |
|------|------|
| HTTP 方法 | 业务接口强制仅使用 **POST**，GET 仅用于查询类接口 |
| 统一响应格式 | `{"code": 200, "msg": "OK", "data": {}, "req_id": "...", "ts": "..."}` |
| 输入验证 | 所有输入必须通过 Pydantic 模型验证 |
| 长任务处理 | 必须使用 `BackgroundTasks` 或消息队列 |
| API 层禁止 | 禁止直接写 SQL、禁止写业务逻辑 |

### 6. 数据库规范

| 规则 | 说明 |
|------|------|
| 表名 | 复数 snake_case (`users`, `meeting_records`) |
| 主键 | UUID 或 BigInt Identity (**禁止 Serial**) |
| 必备字段 | `created_at`, `updated_at`, `deleted_at` |
| 强制注释 | 表和每个字段必须有中文 `comment` |
| 查询红线 | 禁止 `SELECT *`、禁止 N+1 (必须 joinedload)、禁止裸 SQL 拼接 |
| 迁移规范 | **禁止在生产环境执行 DDL**，必须使用 Alembic |

### 9. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>禁止 `print()`</strong>，必须使用 `loguru` 或项目封装的 `logger`</li>
    <li><strong>禁止裸 `except:`</strong>，必须指明异常类型</li>
    <li><strong>禁止静默 `pass`</strong>，捕获异常后必须 `logger.error(...)` 记录</li>
    <li><strong>禁止使用单字母变量名（如 e, t, i, n, r）</strong></li>
    <li><strong>禁止使用与关键字冲突的变量名（如 now, Date, time, type）</strong></li>
  </ul>
</div>

### 10. 变量命名语义化规范

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止单字母变量名和命名冲突</strong>
</div>

| 场景 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 异常捕获 | `except Exception as e:` | `except Exception as error:` |
| 循环变量 | `for i in range(n):` | `for index in range(count):` |
| 当前时间 | `now = datetime.now()` | `current_time = datetime.now()` |
| 定时器 | `t = Timer(...)` | `timer = Timer(...)` |
| 数组遍历 | `for r in results:` | `for record in results:` |
| 文件对象 | `f = open(...)` | `file_handle = open(...)` |
| 类型检查 | `type = type(obj)` | `obj_type = type(obj)` |</div>

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止与关键字冲突的变量名</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><code>now</code> → 使用 <code>current_time</code></li>
    <li><code>Date</code> → 使用 <code>current_date</code> 或 <code>date_obj</code></li>
    <li><code>time</code> → 使用 <code>current_time</code> 或 <code>elapsed_time</code></li>
    <li><code>type</code> → 使用 <code>obj_type</code> 或 <code>item_type</code></li>
    <li><code>file</code> → 使用 <code>file_path</code> 或 <code>file_handle</code></li>
  </ul>
</div>

### 11. 文件头模板 (MANDATORY)

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

### 12. Docstring 全覆盖 (MANDATORY)

文件中出现的**每一个** `class` 及**每一个** `def`/`async def`，**都必须**具备中文 docstring，**禁止留空**。包括私有方法、`__init__`、`@staticmethod`、`@classmethod` 同等强制。

docstring 内容必须包含：
- **用途或流程概述** + **参数**（含类型与含义）+ **返回值**（含类型与含义）+ **异常** 四段

### 13. 安全红线 (CRITICAL)

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

---

## 启动规范

> 详见 `backend/startup.md`

| 场景 | 说明 |
|------|------|
| 端口占用 | `run.py` 自动检测并清理占用端口的进程 |
| 日志记录 | `run.py` 使用 `LogWriter` 将控制台输出同步写入 `logs/backend_*.log` |
