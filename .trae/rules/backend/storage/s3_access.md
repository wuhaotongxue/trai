# Backend - S3 存储与访问控制规范

> 所有私有资源（音视频、文档、头像等）必须通过 Presigned URL 访问，严禁 Public Read

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 存储分区设计 (含多租户隔离)

```
S3 Bucket: trai-media (私有 Bucket，所有对象默认禁止公开访问)
│
├── private/
│   ├── tenants/{tenant_id}/           # 多租户隔离 (每个企业/组织独立路径)
│   │   ├── meetings/{meeting_id}/
│   │   ├── documents/{meeting_id}/
│   │   ├── avatars/{user_id}/
│   │   └── _retention_XXX/            # Lifecycle 保留期标记前缀
│   │
│   └── _retention_7d/                  # 普通用户 (7天)
│   └── _retention_30d/                 # VIP/企业微信普通成员 (30天)
│   └── _retention_90d/                 # 部门负责人 (90天)
│   └── _retention_admin/              # 管理员 (1年+)
│
├── temp/                              # 临时上传 (24h 自动清理)
│
└── public/                            # 公开资源 (可选)
```

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 绝对禁止跨租户访问</strong>
  <div style="margin-top:8px;font-size:13px;">
    每次 S3 路径构建时，必须校验当前用户的 <code>tenant_id</code> 与目标路径的 <code>tenant_id</code> 是否一致。
  </div>
</div>

---

## 3. Bucket 权限配置 (CRITICAL)

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| Block Public Access | 全部开启 | 禁止公网访问 |
| Bucket ACL | Private | 不给任何人读权限 |
| 强制 HTTPS | 开启 | 禁止 HTTP 明文传输 |
| 版本控制 | 开启 | 支持历史版本回溯 |
| 服务器端加密 | AES-256 或 KMS | 默认加密存储 |
| Lifecycle | 开启 | 自动归档/删除冷数据 |
| CloudTrail | 开启 | 全量 S3 操作审计 |

---

## 4. 用户角色与权限分级

> 核心设计：不同角色的用户，获取不同有效期的 Presigned URL

### 4.1 角色定义

| 角色 | 标识 | 来源 |
|------|------|------|
| 普通用户 | `user` | 密码登录/微信登录 |
| 会员用户 | `vip` | 后台配置/付费 |
| 企业微信用户 | `wecom_vip` | **企业微信扫码登录 (SSO)** |
| 企业微信部门负责人 | `dept_leader` | 企业微信扫码登录 (SSO) |
| 管理员 | `admin` | 后台手动配置 |

### 4.2 有效期策略（分角色 + 分资源）

| 资源类型 | 普通用户 | VIP / 企业微信普通成员 | 部门负责人 | 管理员 |
|----------|---------|---------------------|-----------|--------|
| 会议音视频 | **5 分钟** | **2 小时** | **4 小时** | **24 小时** |
| 会议聊天记录 | **5 分钟** | **1 小时** | **4 小时** | **24 小时** |
| 会议文档 | **15 分钟** | **4 小时** | **4 小时** | **24 小时** |
| 消息附件 | **5 分钟** | **1 小时** | **1 小时** | **8 小时** |
| 用户头像 | **1 小时** | **12 小时** | **24 小时** | **24 小时** |

### 4.3 企业微信权限映射

> **必须通过扫码登录 (SSO)**，禁止使用企业微信用户名密码直接登录（视为普通用户）

| 企业微信角色 | S3 角色 | 会议音视频有效期 |
|-------------|--------|----------------|
| 超管 / 分级管理员 | `admin` | 24 小时 |
| 部门负责人 | `dept_leader` | **4 小时** |
| 普通成员 | `wecom_vip` | 2 小时 |
| 外部访客 | `user` | 5 分钟 |

---

## 5. Presigned URL 核心原理

### 访问流程

```
客户端 ──→ Backend (鉴权 + 角色判断 + 限流检查) ──→ S3 (生成带签名的 Presigned URL)
                                                    │
客户端 ←── { presigned_url, expires_in } ←─────────┘
```

### 请求链路中的检查顺序

```
用户请求文件访问
  │
  ▼
1. 限流检查 (滑动窗口，每分钟 N 次)
  │ 通过
  ▼
2. 身份鉴权 (JWT Token 校验)
  │ 通过
  ▼
3. 租户隔离校验 (tenant_id 一致性)
  │ 通过
  ▼
4. 角色权限判断 (user/vip/wecom_vip/dept_leader/admin)
  │
  ▼
5. 文件类型白名单校验
  │ 通过
  ▼
6. 文件大小校验 (按角色区分)
  │ 通过
  ▼
7. 生成 Presigned URL (有效期由角色决定)
  │
  ▼
8. 记录审计日志
```

---

## 6. 会议录制生命周期

> 录制文件根据用户角色决定保留期限，超期后自动归档或删除

| 用户角色 | 保留期限 | S3 路径前缀 |
|----------|---------|-----------|
| 普通用户 | **7 天** | `_retention_7d` |
| 会员 / 企业微信普通成员 | **30 天** | `_retention_30d` |
| 企业微信部门负责人 | **90 天** | `_retention_90d` |
| 管理员 | **1 年+** | `_retention_admin` |

Lifecycle 策略: Standard → Glacier (30d) → Deep Archive (90d) → 删除

---

## 7. 上传限制 (按角色区分)

| 用户角色 | 单文件大小限制 | 单次会议总上传限制 |
|----------|-------------|-----------------|
| 普通用户 | **50 MB** | **100 MB** |
| 会员 / 企业微信 | **500 MB** | **2 GB** |
| 部门负责人 | **1 GB** | **5 GB** |
| 管理员 | **2 GB** | **无限制** |

---

## 8. 文件类型白名单

> 只允许上传音视频、图片、文档类文件，阻断可执行文件和恶意脚本

### MIME 类型白名单

| 类别 | 允许的类型 |
|------|---------|
| 视频 | `video/webm`, `video/mp4`, `video/ogg`, `video/quicktime` |
| 音频 | `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/flac` |
| 图片 | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` |
| 文档 | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-*`, `text/plain`, `text/markdown` |

### 绝对黑名单

`.exe` `.bat` `.cmd` `.sh` `.py` `.js` `.jar` `.dll` `.so` 及对应 MIME 类型

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 双重校验原则</strong>
  <div style="margin-top:8px;font-size:13px;">
    同时校验 <code>Content-Type header</code> 和 <code>文件扩展名</code>，两者必须同时通过校验。
  </div>
</div>

---

## 9. 下载限流 (滑动窗口)

| 用户角色 | 每分钟 Presigned URL 签发上限 |
|----------|---------------------------|
| 普通用户 | **10 次/分钟** |
| 会员 / 企业微信 | **60 次/分钟** |
| 部门负责人 | **120 次/分钟** |
| 管理员 | **无限制** |

超出限流返回 HTTP 429，禁止签发 Presigned URL。

---

## 10. CloudTrail 审计日志

> S3 操作全量记录，支持安全溯源和合规审查

### 必须记录的事件类型

| 事件 | 说明 |
|------|------|
| `GetObject` | 文件下载 (追踪谁访问了什么文件) |
| `PutObject` | 文件上传 (追踪谁上传了什么文件) |
| `DeleteObject` | 文件删除 (追踪数据销毁行为) |
| `PutBucketPolicy` | 修改 Bucket 策略 (**告警：任何变更需立即通知**) |
| `DeleteBucket` | 删除 Bucket (**高危：阻止 + 告警**) |

### 必须告警的场景

1. `PutBucketPolicy` 包含 `Principal: "*"` → **立即告警 (SMS + Email)**
2. `DeleteBucket` 调用 → **立即阻止 + 告警**
3. 单用户 1 分钟内请求超过 500 次 `GetObject` → **异常行为告警**
4. 跨租户访问尝试 → **安全事件记录 + 告警**

### 结构化日志规范

```python
logger.info(
    "S3 operation: "
    f"action={action}, user_id={user_id}, tenant_id={tenant_id}, "
    f"role={role}, file_path={file_path}, file_size={file_size}, "
    f"content_type={content_type}, presigned_expires={expires_in}s, "
    f"req_id={req_id}, ts={datetime.now(timezone.utc).isoformat()}"
)
```

---

## 11. API 接口设计

| 路由 | 方法 | 用途 |
|------|------|------|
| `/media/access` | POST | 生成文件访问 Presigned GET URL |
| `/media/upload` | POST | 生成文件上传 Presigned PUT URL |
| `/media/batch-access` | POST | 批量生成访问 URL |
| `/ai/generate` | POST | 提交 AI 生成任务 (文生图/图生视频/文生文) |

---

## 12. AI 生成内容存储 (文生图/图生视频/文生文)

> AI 模型生成的图片、视频、文本等资产纳入统一存储管理

### 12.1 AI 资源类型与存储路径

| 资源类型 | S3 路径前缀 | 说明 |
|---------|-----------|------|
| 文生图 (Text-to-Image) | `ai_generated/images/{user_id}/{task_id}/` | 静态图片 (PNG/JPG/WEBP) |
| 图生视频 (Image-to-Video) | `ai_generated/videos/{user_id}/{task_id}/` | AI 生成的视频 |
| 文生文 / AI 对话 | `ai_generated/texts/{user_id}/{task_id}/` | AI 对话记录 (JSON/MD) |
| AI 合成语音 | `ai_generated/audio/{user_id}/{task_id}/` | TTS 生成音频 |
| AI 生成缩略图 | `ai_generated/thumbnails/{task_id}/` | 视频封面图 |

### 12.2 完整存储分区 (含 AI)

```
S3 Bucket: trai-media
│
├── private/tenants/{tenant_id}/
│   ├── meetings/         # 会议录制
│   ├── documents/          # 会议文档
│   ├── avatars/          # 用户头像
│   ├── attachments/        # 消息附件
│   └── ai_generated/     # AI 生成内容
│       ├── images/        # 文生图
│       ├── videos/        # 图生视频
│       ├── texts/         # AI 对话
│       └── audio/         # AI 语音
│
├── temp/ai_pending/{tenant_id}/{user_id}/{task_id}/  # AI 任务临时文件 (2h 清理)
│
└── public/ai_samples/    # AI 公开示例
```

### 12.3 AI 资源有效期策略

| 用户角色 | 文生图 | 图生视频 | AI 对话 | 语音 |
|----------|--------|---------|---------|------|
| 普通用户 | **15 分钟** | **15 分钟** | **30 分钟** | **30 分钟** |
| VIP / 企业微信普通成员 | **4 小时** | **4 小时** | **12 小时** | **12 小时** |
| 企业微信部门负责人 | **8 小时** | **8 小时** | **24 小时** | **24 小时** |
| 管理员 | **7 天** | **7 天** | **30 天** | **30 天** |

### 12.4 AI 任务完整流程

```
用户提交 AI 请求 (文生图 / 图生视频 / 文生文)
  │
  ▼
1. Backend 接收请求，记录任务元数据 (Redis / DB)
     ▼
2. 生成 S3 临时上传路径 (temp/ai_pending/)
     ▼
3. AI 服务 (DALL-E / Sora / GPT / ElevenLabs) 生成内容
     ▼
4. AI 服务直传 S3 (Presigned PUT URL，5 分钟有效期)
     ▼
5. 内容安全审核 (AWS Rekognition / 第三方审核 API)
     │ 违规 → 删除 + 拒绝
     │ 通过
     ▼
6. 移动到正式路径 (ai_generated/{type}/{user_id}/{task_id}/)
     ▼
7. 用户通过 Presigned GET URL 下载 (有效期由角色决定)
     ▼
8. 记录审计日志 (task_id, user_id, tenant_id, model_name, cost)
```

### 12.5 AI 服务直传架构

> AI 生成文件直接由 AI 服务上传到 S3，不经过 Backend 中转

```python
# AI 服务直传安全要求
1. Presigned PUT URL 有效期 = 300 秒 (5 分钟)
2. 必须设置 x-amz-expected-bucket-owner 为当前 AWS Account ID
3. S3 事件触发 SQS → Backend 回调处理
4. 回调时校验 x-amz-expected-bucket-owner 是否匹配
```

### 12.6 AI 成本控制 (按月配额)

| 用户角色 | 文生图/月 | 图生视频/月 | AI 对话/月 | 语音/月 |
|----------|---------|-----------|-----------|--------|
| 普通用户 | 10 次 | 2 次 | 50 次 | 5 次 |
| VIP / 企业微信 | 100 次 | 20 次 | 500 次 | 50 次 |
| 部门负责人 | 200 次 | 50 次 | 1000 次 | 100 次 |
| 管理员 | 无限制 | 无限制 | 无限制 | 无限制 |

### 12.7 AI 内容安全审核

> AI 生成内容必须经过安全审核后才能向用户展示

| 审核场景 | 违规处理 |
|---------|---------|
| 图片含暴力/色情/违禁内容 | 删除 S3 文件 + 拒绝 + 记录日志 |
| 视频含暴力/违禁内容 | 删除 S3 文件 + 拒绝 + 记录日志 |
| 文字含违规 prompt | 拒绝任务 + 记录日志 |

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; AI 服务直传安全</strong>
  <div style="margin-top:8px;font-size:13px;">
    AI 服务直传的 Presigned PUT URL 必须设置 <code>expires_seconds=300</code> (5 分钟)，<br/>
    且必须校验 <code>x-amz-expected-bucket-owner</code> 防止被其他账户利用。
  </div>
</div>

---

## 13. 禁止事项汇总

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Bucket 设置 Public Read 权限</li>
    <li>前端代码中硬编码 S3 原始地址</li>
    <li>所有用户统一使用相同有效期</li>
    <li><strong>企业微信禁止用户名密码登录</strong>，仅支持扫码登录 (SSO)</li>
    <li><strong>跨租户访问</strong>：不校验 tenant_id 就访问其他企业的文件</li>
    <li>上传可执行文件 (.exe/.sh/.py/.js 等)</li>
    <li>上传文件大小超过角色限制</li>
    <li>不记录 S3 操作日志</li>
    <li>限流超出后仍签发 Presigned URL</li>
    <li>上传路径未校验前缀 (路径穿越攻击)</li>
    <li>AI 生成内容未经过安全审核就向用户展示</li>
    <li>AI 任务直传 Presigned PUT URL 有效期超过 5 分钟</li>
    <li>AI 用户超出月配额仍允许提交任务</li>
  </ul>
</div>

---

## 14. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止 Public Read</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">所有资源必须鉴权</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">企业微信自动 VIP</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">扫码登录即享 2 小时</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">部门负责人 4 小时</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">基于组织架构，非付费</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">多租户强制隔离</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每企业独立 tenant_id 路径</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">文件白名单</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">仅音视频/图片/文档</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">下载限流</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">按角色限制每分钟次数</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">生命周期</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">7d-90d-1y 自动归档</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">AI 内容审核</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">生成后必须审核</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">AI 成本配额</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">按月限制防止滥用</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">AI 服务直传</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">AI → S3，不经用户端</div>
  </div>

</div>