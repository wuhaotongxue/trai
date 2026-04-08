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

## 2. 存储分区设计

```
S3 Bucket: trai-media (私有 Bucket，所有对象默认禁止公开访问)
│
├── private/                          # 私有资源 (需鉴权)
│   ├── meetings/{meeting_id}/       # 会议音视频录制
│   │   ├── {uuid}_audio.webm
│   │   ├── {uuid}_video.webm
│   │   └── {uuid}_chat.json
│   ├── avatars/{user_id}/           # 用户头像
│   │   └── {uuid}.jpg
│   ├── documents/{meeting_id}/      # 会议文档
│   │   ├── {uuid}_slides.pdf
│   │   └── {uuid}_transcript.txt
│   └── attachments/{msg_id}/        # 消息附件
│       └── {uuid}_{filename}
│
├── temp/                             # 临时上传
│   ├── uploads/{user_id}/
│   └── cleanup lifecycle: 24h         # 自动清理
│
└── public/                          # 公开资源 (可选，白名单资产)
    ├── icons/
    └── banners/
```

---

## 3. Bucket 权限配置

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止设置 Public Read</strong>
  <div style="margin-top:8px;font-size:13px;">
    严禁在 Bucket Policy 或 ACL 中允许 <code>s3:GetObject</code> 给 <code>Principal: "*"</code>。
  </div>
</div>

### 推荐配置

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| Block Public Access | 全部开启 | 禁止公网访问 |
| Bucket ACL | Private | 不给任何人读权限 |
| 强制 HTTPS | 开启 | 禁止 HTTP 明文传输 |
| 版本控制 | 开启 | 支持历史版本回溯 |
| 服务器端加密 | AES-256 或 KMS | 默认加密存储 |
| Lifecycle | 开启 | 自动归档/删除冷数据 |

### Lifecycle 策略

```json
{
  "Rules": [
    {
      "ID": "temp-cleanup",
      "Status": "Enabled",
      "Prefix": "temp/uploads/",
      "Expiration": { "Days": 1 }
    },
    {
      "ID": "archive-old-meetings",
      "Status": "Enabled",
      "Prefix": "private/meetings/",
      "Transitions": [
        { "Days": 30, "StorageClass": "GLACIER" },
        { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
      ]
    }
  ]
}
```

---

## 4. 用户角色与权限分级

> 核心设计：不同角色的用户，获取不同有效期的 Presigned URL

### 4.1 角色定义

| 角色 | 标识 | 说明 | 来源 |
|------|------|------|------|
| 普通用户 | `user` | 注册用户，默认权限 | 密码登录/微信登录 |
| 会员用户 | `vip` | 付费会员，享受更长有效期 | 后台配置/付费 |
| 企业微信用户 | `wecom_vip` | 企业微信成员，自动 VIP | **企业微信扫码登录 (SSO)** |
| 企业微信部门负责人 | `dept_leader` | 本部门会议全部可访问 | 企业微信扫码登录 (SSO) |
| 管理员 | `admin` | 平台管理员，最高权限 | 后台手动配置 |

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; 企业微信 = 自动 VIP</strong>
  <div style="margin-top:8px;font-size:13px;">
    企业微信用户首次登录时，Backend 自动将其角色设为 <code>wecom_vip</code>，享受与付费 VIP 相同的文件访问有效期。
  </div>
</div>

### 4.2 有效期策略（分角色 + 分资源）

| 资源类型 | 普通用户 (`user`) | 会员用户 / 企业微信 (`vip`/`wecom_vip`) | 管理员 (`admin`) |
|----------|-------------------|------------------------------------------|------------------|
| 会议音视频 | **5 分钟** | **2 小时** | **24 小时** |
| 会议聊天记录 | **5 分钟** | **1 小时** | **24 小时** |
| 会议文档 | **15 分钟** | **4 小时** | **24 小时** |
| 消息附件 | **5 分钟** | **1 小时** | **8 小时** |
| 用户头像 | **1 小时** | **12 小时** | **24 小时** |
| 临时上传凭证 | **15 分钟** | **30 分钟** | **1 小时** |
| 公开 Banner | **24 小时** | **24 小时** | **7 天** |

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; 会员权益体现</strong>
  <div style="margin-top:8px;font-size:13px;">
    会员用户的会议录音可以回放 2 小时，普通用户只能听 5 分钟 — 这是付费会员的核心体验差异之一。
  </div>
</div>

### 4.3 企业微信权限映射（可选扩展）

> 企业微信有一套完整的组织架构和部门权限管理，可以将企业微信中的角色映射到 S3 访问权限

#### 企业微信权限等级

| 企业微信角色 | S3 角色 | 会议音视频有效期 | 说明 |
|-------------|--------|----------------|------|
| 超管（企业创建者） | `admin` | 24 小时 | 企业最高管理员 |
| 分级管理员 | `admin` | 24 小时 | 可分配权限的管理员 |
| 部门负责人 | `dept_leader` | **4 小时** | 部门会议全部可访问 |
| 普通成员 | `wecom_vip` | 2 小时 | 与 VIP 相同 |
| 外部访客 | `user` | 5 分钟 | 受限访问 |

#### 企业微信部门数据拉取

```python
class WeComRoleResolver:
    """
    企业微信角色解析器，将企业微信组织架构映射为 S3 权限.

    参数:
        wecom_api: 企业微信 API 客户端.
        cache_ttl: 部门数据缓存时间 (秒).

    异常:
        ValueError: 企业微信 API 调用失败时抛出.
    """

    # 企业微信权限等级 → S3 角色映射
    ROLE_MAP = {
        "superadmin": "admin",      # 超管
        "admin": "admin",            # 分级管理员
        "dept_leader": "dept_leader",  # 部门负责人
        "member": "wecom_vip",       # 普通成员
        "external": "user",          # 外部访客
    }

    # 部门负责人额外有效期配置
    EXPIRES_CONFIG_DEPT_LEADER = {
        "meeting_audio": 14400,      # 4 小时
        "meeting_video": 14400,      # 4 小时
        "meeting_chat": 14400,       # 4 小时
        "meeting_doc": 14400,        # 4 小时
        "attachment": 3600,          # 1 小时
        "avatar": 86400,            # 24 小时
        "upload": 3600,              # 1 小时
        "public": 86400,             # 24 小时
    }

    def __init__(self, wecom_api, cache_ttl: int = 3600) -> None:
        self._wecom = wecom_api
        self._cache_ttl = cache_ttl
        self._cache: dict[str, tuple[str, datetime]] = {}

    async def resolve_s3_role(self, user_id: str, auth_source: str) -> str:
        """
        根据企业微信数据解析用户 S3 角色.

        参数:
            user_id: 用户 ID.
            auth_source: 登录来源.

        返回:
            str: S3 角色标识 ("admin" / "dept_leader" / "wecom_vip" / "user").

        异常:
            ValueError: 用户不在企业微信中时抛出.
        """
        if auth_source != AuthSource.WECOM.value:
            return UserRole.USER.value

        # 1. 从缓存获取用户企业微信信息
        wecom_user = await self._get_wecom_user(user_id)
        if not wecom_user:
            raise ValueError(f"User {user_id} not found in WeCom")

        # 2. 获取用户在企业微信中的角色
        wecom_role = wecom_user.get("role", "member")

        # 3. 映射到 S3 角色
        return self.ROLE_MAP.get(wecom_role, "wecom_vip")

    async def _get_wecom_user(self, user_id: str) -> dict | None:
        """
        获取企业微信用户信息（带缓存）.

        参数:
            user_id: 用户 ID.

        返回:
            dict | None: 企业微信用户信息，不存在返回 None.
        """
        if user_id in self._cache:
            role, cached_at = self._cache[user_id]
            if datetime.now(timezone.utc) - cached_at < timedelta(seconds=self._cache_ttl):
                return {"userid": user_id, "role": role}

        # 调用企业微信 API 获取用户信息
        wecom_user = await self._wecom.get_user(user_id)
        if wecom_user:
            role = wecom_user.get("role", "member")
            self._cache[user_id] = (role, datetime.now(timezone.utc))

        return wecom_user

    def get_expires_seconds(self, role: str, resource_type: str) -> int:
        """
        根据 S3 角色和资源类型获取有效期.

        参数:
            role: S3 角色标识.
            resource_type: 资源类型.

        返回:
            int: 有效期秒数.
        """
        # 部门负责人使用独立配置
        if role == "dept_leader":
            return self.EXPIRES_CONFIG_DEPT_LEADER.get(resource_type, 300)

        # 其他角色使用标准配置
        return S3Client.EXPIRES_CONFIG.get(role, S3Client.EXPIRES_CONFIG["user"]).get(
            resource_type, 300,
        )
```

#### 权限流转示例

```
企业微信管理员在后台设置:
├── 超管 / 分级管理员 ──→ S3 role = admin (24h)
├── 部门负责人 (如"销售部负责人") ──→ S3 role = dept_leader (4h)
│    └─ 特殊: 可访问本部门所有会议文件
└── 普通成员 ──→ S3 role = wecom_vip (2h)
     └─ 外部访客 ──→ S3 role = user (5min)
```

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 企业微信部门权限优先级</strong>
  <div style="margin-top:8px;font-size:13px;">
    企业微信的部门权限独立于付费 VIP 系统。<br/>
    部门负责人的 4 小时有效期是基于组织架构，不是基于付费。
  </div>
</div>

---

## 5. Presigned URL 核心原理

### 5.1 访问流程

```
客户端 ──→ Backend (鉴权 + 角色判断) ──→ S3 (生成带签名的 Presigned URL)
                                            │
客户端 ←── { presigned_url, expires_in } ←───┘
     │
     │ 直接用 Presigned URL 访问 S3
     ▼
  S3 验证签名 + 有效期 ──→ 通过 ──→ 返回文件内容
                         │
                         ▼
                    拒绝 (403 / 过期)
```

### 5.2 为什么用 Presigned URL

| 对比项 | 直接返回 S3 地址 | Presigned URL |
|--------|-----------------|--------------|
| 安全性 | 任何人知道地址就能访问 | 签名绑定过期时间 |
| 有效期 | 永久有效（泄漏=永久泄漏） | 可设为 5 分钟 |
| 权限控制 | 无 | 可按角色/资源动态控制 |
| 日志追踪 | 无 | Backend 可记录每次签发 |
| 费用 | S3 直接暴露 | 必须经过 Backend |

### 5.3 EXE 更新与 S3 访问完全独立

```
┌─────────────────────────────────────────────────────────┐
│  桌面客户端 EXE (程序文件)                                │
│  - 只存 API 地址 + 认证 Token                            │
│  - EXE 更新 = 程序换版本，不改任何权限逻辑                 │
└────────────────────────────┬────────────────────────────┘
                             │ 调用 Backend API
                             ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (控制权限)                                     │
│  - 判断用户角色 (user/vip/wecom_vip/admin)              │
│  - 生成对应有效期的 Presigned URL                        │
│  - 这里才是权限核心，EXE 完全不参与                       │
└────────────────────────────┬────────────────────────────┘
                             │ S3 只认签名
                             ▼
┌─────────────────────────────────────────────────────────┐
│  S3 Bucket (trai-media)                                 │
│  - 完全不知道谁在访问，只认签名 + 有效期                  │
│  - EXE 更新对它毫无影响                                  │
└─────────────────────────────────────────────────────────┘
```

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; EXE 更新零影响</strong>
  <div style="margin-top:8px;font-size:13px;">
    S3 只认三样东西：Presigned URL 签名 + 有效期 + 文件是否存在。<br/>
    无论客户端 EXE 升级多少次版本，只要 Backend 没动，权限逻辑一模一样。
  </div>
</div>

---

## 6. Backend 实现

### 6.1 有效期配置

```python
# backend/src/infrastructure/storage/s3_client.py
"""S3 客户端封装，提供 Presigned URL 生成能力."""
import boto3
from botocore.config import Config
from datetime import datetime, timezone, timedelta


class S3Client:
    """
    S3 客户端封装，管理 Presigned URL 生成与文件上传.

    参数:
        无 (使用配置注入).

    异常:
        ValueError: 文件路径或参数非法时抛出.
        boto3.ClientError: S3 操作失败时抛出.
    """

    BUCKET_NAME = "trai-media"
    PRIVATE_PREFIX = "private/"
    TEMP_PREFIX = "temp/"
    PUBLIC_PREFIX = "public/"

    # 有效期配置 (秒) — 按角色 × 资源类型
    # 注意: wecom_vip (企业微信用户) 与 vip 享受相同有效期
    # 注意: dept_leader (企业微信部门负责人) 有独立配置
    EXPIRES_CONFIG: dict[str, dict[str, int]] = {
        # 普通用户
        "user": {
            "meeting_audio": 300,        # 5 分钟
            "meeting_video": 300,        # 5 分钟
            "meeting_chat": 300,         # 5 分钟
            "meeting_doc": 900,          # 15 分钟
            "attachment": 300,           # 5 分钟
            "avatar": 3600,              # 1 小时
            "upload": 900,               # 15 分钟
            "public": 86400,             # 24 小时
        },
        # 会员用户 / 企业微信用户 (同等权限)
        "vip": {
            "meeting_audio": 7200,       # 2 小时
            "meeting_video": 7200,       # 2 小时
            "meeting_chat": 3600,        # 1 小时
            "meeting_doc": 14400,        # 4 小时
            "attachment": 3600,          # 1 小时
            "avatar": 43200,            # 12 小时
            "upload": 1800,             # 30 分钟
            "public": 86400,            # 24 小时
        },
        "wecom_vip": {  # 企业微信普通成员，与 vip 相同权限
            "meeting_audio": 7200,       # 2 小时
            "meeting_video": 7200,       # 2 小时
            "meeting_chat": 3600,        # 1 小时
            "meeting_doc": 14400,        # 4 小时
            "attachment": 3600,           # 1 小时
            "avatar": 43200,           # 12 小时
            "upload": 1800,              # 30 分钟
            "public": 86400,           # 24 小时
        },
        # 企业微信部门负责人 (基于组织架构的额外权限)
        "dept_leader": {
            "meeting_audio": 14400,     # 4 小时
            "meeting_video": 14400,     # 4 小时
            "meeting_chat": 14400,      # 4 小时
            "meeting_doc": 14400,      # 4 小时
            "attachment": 3600,         # 1 小时
            "avatar": 86400,           # 24 小时
            "upload": 3600,             # 1 小时
            "public": 86400,           # 24 小时
        },
        # 管理员
        "admin": {
            "meeting_audio": 86400,      # 24 小时
            "meeting_video": 86400,      # 24 小时
            "meeting_chat": 86400,       # 24 小时
            "meeting_doc": 86400,       # 24 小时
            "attachment": 28800,         # 8 小时
            "avatar": 86400,            # 24 小时
            "upload": 3600,              # 1 小时
            "public": 604800,           # 7 天
        },
    }

    def __init__(self, region: str, access_key: str, secret_key: str) -> None:
        self._client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version="s3v4"),
        )

    def get_expires_seconds(self, role: str, resource_type: str) -> int:
        """
        根据用户角色和资源类型获取有效期.

        参数:
            role: 用户角色 ("user" / "vip" / "admin").
            resource_type: 资源类型 (如 "meeting_audio").

        返回:
            int: 有效期秒数，默认 300 (5 分钟).
        """
        role_config = self.EXPIRES_CONFIG.get(role, self.EXPIRES_CONFIG["user"])
        return role_config.get(resource_type, 300)

    def generate_presigned_get_url(
        self,
        file_path: str,
        expires_seconds: int = 300,
    ) -> str:
        """
        生成 GET Presigned URL.

        参数:
            file_path: S3 对象路径.
            expires_seconds: URL 有效期.

        返回:
            str: Presigned GET URL.
        """
        if not file_path or len(file_path) > 1024:
            raise ValueError("Invalid file_path")

        url = self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.BUCKET_NAME, "Key": file_path},
            ExpiresIn=expires_seconds,
        )
        return url

    def generate_presigned_put_url(
        self,
        file_path: str,
        content_type: str,
        expires_seconds: int = 900,
    ) -> str:
        """
        生成 PUT Presigned URL.

        参数:
            file_path: S3 对象路径.
            content_type: 文件 MIME 类型.
            expires_seconds: URL 有效期.

        返回:
            str: Presigned PUT URL.
        """
        url = self._client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.BUCKET_NAME,
                "Key": file_path,
                "ContentType": content_type,
            },
            ExpiresIn=expires_seconds,
        )
        return url

    def generate_presigned_delete_url(
        self,
        file_path: str,
        expires_seconds: int = 300,
    ) -> str:
        """
        生成 DELETE Presigned URL.

        参数:
            file_path: S3 对象路径.
            expires_seconds: URL 有效期.

        返回:
            str: Presigned DELETE URL.
        """
        url = self._client.generate_presigned_url(
            "delete_object",
            Params={"Bucket": self.BUCKET_NAME, "Key": file_path},
            ExpiresIn=expires_seconds,
        )
        return url

    def validate_path_prefix(self, file_path: str) -> bool:
        """
        校验文件路径前缀，防止路径穿越.

        参数:
            file_path: 待校验的路径.

        返回:
            bool: True 合法, False 非法.
        """
        invalid_patterns = ["..", "~", "//", "s3:/"]
        for pattern in invalid_patterns:
            if pattern in file_path:
                return False
        return True
```

### 6.2 媒体访问服务

### 6.2 用户角色解析 (含企业微信)

```python
class UserRole(str, Enum):
    """用户角色枚举."""
    USER = "user"
    VIP = "vip"
    WECOM_VIP = "wecom_vip"  # 企业微信用户，自动享 VIP 权限
    ADMIN = "admin"


class AuthSource(str, Enum):
    """登录来源枚举.

    注意: 企业微信必须通过扫码登录 (SSO)，禁止用户名密码登录.
    """
    PASSWORD = "password"     # 密码登录 → 普通用户
    WECOM = "wecom"           # 企业微信扫码登录 (SSO) → VIP (强制)
    WECHAT = "wechat"        # 微信登录 → 普通用户
    ADMIN_SET = "admin_set"  # 后台手动配置 → 可升为 admin
```

> **企业微信映射规则**: 企业微信用户 (`auth_source=WECOM`) 在首次注册/登录时，自动将 `role` 设为 `wecom_vip`，等同于 VIP 会员权限。

```python
def resolve_role_from_auth_source(
    auth_source: str,
    current_role: str,
) -> str:
    """
    根据登录来源和当前角色确定最终权限.

    优先级: 企业微信扫码登录 (SSO) > 后台手动配置 > 当前角色

    注意:
        企业微信必须通过扫码登录 (SSO) 才享受 VIP 权限。
        禁止使用企业微信用户名密码直接登录（视为普通用户）。

    参数:
        auth_source: 登录来源 (password / wecom / wechat / admin_set).
        current_role: 数据库中存储的当前角色.

    返回:
        str: 最终使用的角色标识.
    """
    if auth_source == AuthSource.WECOM.value:
        # 企业微信扫码登录 (SSO)，无论数据库里是什么，强制 VIP
        return UserRole.WECOM_VIP.value
    if auth_source == AuthSource.ADMIN_SET.value:
        # 后台手动配置，可以是 admin 或其他
        return current_role
    # 企业微信用户名密码直接登录 → 视为普通用户，不享受 VIP
    return current_role
```


@dataclass
class MediaAccessResult:
    """媒体访问结果."""
    presigned_url: str
    file_path: str
    expires_in: int
    expires_at: datetime
    role: str
    resource_type: str


class MediaAccessService:
    """
    媒体访问服务，提供受控的 S3 资源访问.

    参数:
        s3_client: S3 客户端实例.
        user_repo: 用户仓储 (用于鉴权).
        meeting_repo: 会议仓储 (用于鉴权).

    异常:
        PermissionError: 用户无权访问指定资源时抛出.
        ValueError: 资源不存在或路径非法时抛出.
    """

    # 资源类型映射
    RESOURCE_TYPE_MAP = {
        "audio": "meeting_audio",
        "video": "meeting_video",
        "chat": "meeting_chat",
        "doc": "meeting_doc",
        "attachment": "attachment",
        "avatar": "avatar",
    }

    def __init__(
        self,
        s3_client,
        user_repo,
        meeting_repo,
    ) -> None:
        self._s3 = s3_client
        self._user_repo = user_repo
        self._meeting_repo = meeting_repo

    def _resolve_user_role(self, user_id: str, auth_source: str = "password") -> str:
        """
        从用户仓储解析用户角色，优先根据登录来源确定.

        参数:
            user_id: 用户 ID.
            auth_source: 登录来源 (password / wecom / wechat / admin_set).

        返回:
            str: 角色标识 ("user" / "vip" / "wecom_vip" / "admin").

        异常:
            ValueError: 用户不存在时抛出.
        """
        user = self._user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        current_role = user.role.value if hasattr(user, "role") else UserRole.USER.value

        # 企业微信登录，强制 VIP 权限
        if auth_source == AuthSource.WECOM.value:
            return UserRole.WECOM_VIP.value

        # 后台手动配置角色
        if auth_source == AuthSource.ADMIN_SET.value:
            return current_role

        # 普通登录，保持数据库中的角色
        return current_role

    async def get_meeting_media_url(
        self,
        meeting_id: str,
        user_id: str,
        media_type: str,
    ) -> MediaAccessResult:
        """
        获取会议音视频访问 URL，根据用户角色动态设置有效期.

        参数:
            meeting_id: 会议 ID.
            user_id: 操作用户 ID (用于鉴权).
            media_type: 媒体类型 ("audio" / "video" / "chat").

        返回:
            MediaAccessResult: 包含 Presigned URL 的结果对象.

        异常:
            PermissionError: 用户不是会议参与者时抛出.
            ValueError: 媒体文件不存在时抛出.
        """
        # 1. 鉴权: 必须是会议参与者
        meeting = await self._meeting_repo.find_by_id(meeting_id)
        if not meeting:
            raise ValueError("Meeting not found")

        if user_id not in meeting.participant_ids:
            raise PermissionError("Not a participant")

        # 2. 解析用户角色 (传入登录来源，企业微信自动 VIP)
        role = self._resolve_user_role(user_id, auth_source)

        # 3. 确定资源类型和有效期
        resource_type = self.RESOURCE_TYPE_MAP.get(media_type, "meeting_audio")
        expires_in = self._s3.get_expires_seconds(role, resource_type)

        # 4. 构建路径
        filename_map = {
            "audio": f"{uuid_lib.uuid4()}_audio.webm",
            "video": f"{uuid_lib.uuid4()}_video.webm",
            "chat": f"{uuid_lib.uuid4()}_chat.json",
        }
        filename = filename_map.get(media_type, "")
        file_path = f"private/meetings/{meeting_id}/{filename}"

        # 5. 校验路径安全性
        if not self._s3.validate_path_prefix(file_path):
            raise ValueError("Invalid path")

        # 6. 生成 Presigned URL
        presigned_url = self._s3.generate_presigned_get_url(file_path, expires_in)

        return MediaAccessResult(
            presigned_url=presigned_url,
            file_path=file_path,
            expires_in=expires_in,
            expires_at=datetime.now(timezone.utc),
            role=role,
            resource_type=resource_type,
        )

    async def get_upload_url(
        self,
        file_path: str,
        content_type: str,
        file_size: int,
        user_id: str,
    ) -> MediaAccessResult:
        """
        获取文件上传 Presigned PUT URL.

        参数:
            file_path: 目标存储路径.
            content_type: 文件 MIME 类型.
            file_size: 文件大小 (字节).
            user_id: 操作用户 ID.

        返回:
            MediaAccessResult: 包含 Presigned PUT URL 的结果对象.

        异常:
            ValueError: 文件类型不允许或大小超限时抛出.
        """
        allowed_types = {
            "video/webm", "video/mp4",
            "audio/webm", "audio/mp4",
            "image/jpeg", "image/png", "image/gif",
            "application/pdf", "application/json",
        }
        if content_type not in allowed_types:
            raise ValueError(f"Unsupported content type: {content_type}")

        # 文件大小限制 (100MB)
        MAX_SIZE = 100 * 1024 * 1024
        if file_size > MAX_SIZE:
            raise ValueError(f"File too large: max {MAX_SIZE} bytes")

        if not self._s3.validate_path_prefix(file_path):
            raise ValueError("Invalid path")

        role = self._resolve_user_role(user_id)
        expires_in = self._s3.get_expires_seconds(role, "upload")
        presigned_url = self._s3.generate_presigned_put_url(
            file_path, content_type, expires_in,
        )

        return MediaAccessResult(
            presigned_url=presigned_url,
            file_path=file_path,
            expires_in=expires_in,
            expires_at=datetime.now(timezone.utc),
            role=role,
            resource_type="upload",
        )
```

---

## 7. API 接口设计

### 7.1 获取文件访问 URL

```
POST /media/access
```

```typescript
interface MediaAccessRequest {
  file_path: string;           // S3 对象路径
  action: "read" | "upload" | "delete";
  filename?: string;           // 下载时的文件名 (可选)
}

interface MediaAccessResponse {
  presigned_url: string;
  file_path: string;
  expires_in: number;          // 秒数
  role: string;                // 签发时使用的用户角色
  resource_type: string;       // 资源类型
}
```

### 7.2 批量获取访问 URL

```
POST /media/batch-access
```

```typescript
interface BatchAccessRequest {
  files: Array<{
    file_path: string;
    action: "read";
  }>;
}

interface BatchAccessResponse {
  results: Array<{
    file_path: string;
    presigned_url: string;
    expires_in: number;
    role: string;
  }>;
}
```

---

## 8. 前端访问流程

```typescript
// 前端: 会议音视频播放器获取 URL
async function playMeetingAudio(meetingId: string, userId: string) {
  // ❌ 禁止: 直接拼接 S3 地址
  // const url = `https://trai-media.s3.amazonaws.com/private/meetings/${meetingId}/audio.webm`;

  // ✅ 正确: 通过 Backend API 获取 Presigned URL
  // Backend 自动根据用户角色决定有效期
  const { data } = await fetch("/media/access", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      file_path: `private/meetings/${meetingId}/audio_latest.webm`,
      action: "read",
    }),
  }).then((r) => r.json());

  // presigned_url 自动携带正确的有效期:
  // - 普通用户: 5 分钟
  // - VIP 用户: 2 小时
  // - 管理员: 24 小时
  const audio = new Audio(data.presigned_url);
  audio.play();
}
```

---

## 9. 日志与审计

```python
# 每次签发 Presigned URL 都应记录日志
logger.info(
    "Presigned URL issued: "
    f"user_id={user_id}, "
    f"role={role}, "
    f"resource_type={resource_type}, "
    f"expires_in={expires_in}s, "
    f"file_path={file_path}"
)
```

> **审计追踪**: 所有 Presigned URL 签发操作必须记录日志，包含 user_id、role、expires_in，便于安全审计和问题排查。

---

## 10. 禁止事项汇总

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Bucket 设置 Public Read 权限</li>
    <li>前端代码中硬编码 S3 原始地址 (<code>https://bucket.s3.amazonaws.com/...</code>)</li>
    <li>所有用户统一使用相同有效期（必须区分角色）</li>
    <li><strong>企业微信禁止用户名密码登录</strong>，仅支持扫码登录 (SSO)，否则视为普通用户</li>
    <li>企业微信部门负责人未授予对应权限</li>
    <li>不校验用户身份就直接签发 Presigned URL</li>
    <li>上传路径未校验前缀 (路径穿越攻击)</li>
    <li><strong>跨租户访问</strong>：用户访问其他企业/组织的文件（必须校验 tenant_id）</li>
    <li>用户上传可执行文件 (.exe/.sh/.py/.js 等)</li>
    <li>用户上传文件大小超过角色限制</li>
    <li>不记录 S3 操作日志（下载/上传/删除全部需要审计）</li>
    <li>限流超出后仍签发 Presigned URL（必须先检查限流）</li>
  </ul>
</div>

---

## 11. 多租户 S3 隔离

> 每个企业/组织有独立的存储路径前缀，防止跨租户数据泄漏

### 11.1 路径设计

```
private/
├── tenants/{tenant_id}/              # 企业/组织根隔离
│   ├── meetings/{meeting_id}/
│   ├── documents/{meeting_id}/
│   └── avatars/{user_id}/
├── temp/uploads/{tenant_id}/{user_id}/
└── public/tenants/{tenant_id}/       # 企业公开资源
```

### 11.2 隔离策略

```python
class TenantS3Isolation:
    """
    多租户 S3 路径隔离服务.

    参数:
        s3_client: S3 客户端实例.
        tenant_resolver: 租户解析器.

    异常:
        PermissionError: 跨租户访问时抛出.
        ValueError: 租户 ID 非法时抛出.
    """

    # 租户 ID 格式校验 (字母数字下划线，长度 8-64)
    TENANT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_]{8,64}$")

    def __init__(self, s3_client, tenant_resolver) -> None:
        self._s3 = s3_client
        self._resolver = tenant_resolver

    def build_path(
        self,
        tenant_id: str,
        resource_type: str,
        resource_id: str,
        filename: str,
    ) -> str:
        """
        构建带租户隔离的 S3 路径.

        参数:
            tenant_id: 租户 ID (企业/组织 ID).
            resource_type: 资源类型 (meetings/documents/avatars).
            resource_id: 资源 ID (会议 ID / 用户 ID 等).
            filename: 文件名.

        返回:
            str: 完整的 S3 路径，如 "private/tenants/acme_corp/meetings/123/audio.webm".

        异常:
            ValueError: 租户 ID 格式非法时抛出.
        """
        if not self.TENANT_ID_PATTERN.match(tenant_id):
            raise ValueError(f"Invalid tenant_id format: {tenant_id}")

        safe_filename = self._sanitize_filename(filename)
        return f"private/tenants/{tenant_id}/{resource_type}/{resource_id}/{safe_filename}"

    def _sanitize_filename(self, filename: str) -> str:
        """过滤危险字符，防止路径穿越."""
        dangerous = ["..", "~", "/", "\\", "\x00", "$"]
        for char in dangerous:
            filename = filename.replace(char, "_")
        return filename[:255]  # S3 key 最大长度 1024，这里限制文件名长度

    def validate_access(
        self,
        user_tenant_id: str,
        target_tenant_id: str,
    ) -> bool:
        """
        校验用户是否有权访问目标租户的资源.

        参数:
            user_tenant_id: 当前用户所属租户 ID.
            target_tenant_id: 目标资源所属租户 ID.

        返回:
            bool: True 有权访问, False 无权.

        异常:
            PermissionError: 跨租户访问尝试时抛出 (记录安全日志).
        """
        if user_tenant_id != target_tenant_id:
            logger.warning(
                f"Cross-tenant access attempt: "
                f"user_tenant={user_tenant_id}, target_tenant={target_tenant_id}"
            )
            raise PermissionError("Cross-tenant access denied")
        return True
```

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 绝对禁止跨租户访问</strong>
  <div style="margin-top:8px;font-size:13px;">
    每次 S3 路径构建时，必须校验当前用户的 <code>tenant_id</code> 与目标路径的 <code>tenant_id</code> 是否一致。
    跨租户访问必须记录安全日志并拒绝请求。
  </div>
</div>

---

## 12. 会议录制生命周期

> 录制文件根据用户角色决定保留期限，超期后自动归档或删除

### 12.1 保留期限策略

| 用户角色 | 会议音视频保留期 | 会议文档保留期 | 会议聊天记录保留期 |
|----------|----------------|--------------|-----------------|
| 普通用户 | **7 天** | **7 天** | **7 天** |
| 会员 / 企业微信 | **30 天** | **30 天** | **30 天** |
| 企业微信部门负责人 | **90 天** | **90 天** | **90 天** |
| 管理员 | **1 年** | **1 年** | **1 年** |

### 12.2 S3 Lifecycle 策略

```json
{
  "Rules": [
    {
      "ID": "temp-cleanup",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": { "Days": 1 }
    },
    {
      "ID": "lifecycle-rule-7d",
      "Status": "Enabled",
      "Prefix": "private/tenants/_retention_7d/",
      "Transitions": [
        { "Days": 7, "StorageClass": "GLACIER" },
        { "Days": 14, "StorageClass": "DEEP_ARCHIVE" },
        { "Days": 21, "StorageClass": "GLACIER_IR" }
      ],
      "Expiration": { "Days": 30 }
    },
    {
      "ID": "lifecycle-rule-30d",
      "Status": "Enabled",
      "Prefix": "private/tenants/_retention_30d/",
      "Transitions": [
        { "Days": 30, "StorageClass": "GLACIER" },
        { "Days": 90, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 365 }
    },
    {
      "ID": "lifecycle-rule-90d",
      "Status": "Enabled",
      "Prefix": "private/tenants/_retention_90d/",
      "Transitions": [
        { "Days": 90, "StorageClass": "GLACIER" },
        { "Days": 180, "StorageClass": "DEEP_ARCHIVE" }
      ],
      "Expiration": { "Days": 730 }
    },
    {
      "ID": "lifecycle-rule-admin",
      "Status": "Enabled",
      "Prefix": "private/tenants/_retention_admin/",
      "Transitions": [
        { "Days": 365, "StorageClass": "GLACIER" }
      ]
    }
  ]
}
```

### 12.3 保留期路径前缀设计

```python
# S3 路径中的 _retention_XXX 前缀用于触发不同的 Lifecycle 规则
# 由 Backend 在写入时根据用户角色自动设置前缀

def get_retention_prefix(role: str) -> str:
    """
    根据用户角色获取 S3 路径前缀 (用于 Lifecycle 隔离).

    参数:
        role: 用户角色标识.

    返回:
        str: S3 路径前缀.
    """
    prefix_map = {
        "user": "_retention_7d",
        "vip": "_retention_30d",
        "wecom_vip": "_retention_30d",
        "dept_leader": "_retention_90d",
        "admin": "_retention_admin",
    }
    return prefix_map.get(role, "_retention_7d")
```

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; Lifecycle 自动执行</strong>
  <div style="margin-top:8px;font-size:13px;">
    Lifecycle 规则由 S3 自动执行，无需 Backend 代码介入。<br/>
    普通用户的 7 天录制文件到期后自动进入 Glacier → 删除，无需人工清理。
  </div>
</div>

---

## 13. 上传限制（按角色区分）

### 13.1 文件大小限制

| 用户角色 | 单文件大小限制 | 单次会议总上传限制 |
|----------|-------------|-----------------|
| 普通用户 | **50 MB** | **100 MB** |
| 会员 / 企业微信 | **500 MB** | **2 GB** |
| 企业微信部门负责人 | **1 GB** | **5 GB** |
| 管理员 | **2 GB** | **无限制** |

### 13.2 实现代码

```python
class UploadSizeLimit:
    """
    上传文件大小限制服务 (按角色区分).

    异常:
        ValueError: 文件大小超限时抛出.
    """

    SINGLE_FILE_LIMITS: dict[str, int] = {
        "user": 50 * 1024 * 1024,       # 50 MB
        "vip": 500 * 1024 * 1024,        # 500 MB
        "wecom_vip": 500 * 1024 * 1024,  # 500 MB
        "dept_leader": 1024 * 1024 * 1024,  # 1 GB
        "admin": 2 * 1024 * 1024 * 1024,     # 2 GB
    }

    MEETING_TOTAL_LIMITS: dict[str, int] = {
        "user": 100 * 1024 * 1024,          # 100 MB
        "vip": 2 * 1024 * 1024 * 1024,      # 2 GB
        "wecom_vip": 2 * 1024 * 1024 * 1024,
        "dept_leader": 5 * 1024 * 1024 * 1024,  # 5 GB
        "admin": -1,  # 无限制
    }

    def validate_size(self, role: str, file_size: int, meeting_total_size: int) -> None:
        """
        校验文件大小是否在限制范围内.

        参数:
            role: 用户角色.
            file_size: 当前文件大小 (字节).
            meeting_total_size: 本次会议已上传总量 (字节).

        异常:
            ValueError: 文件大小超限时抛出，包含具体限制值.
        """
        single_limit = self.SINGLE_FILE_LIMITS.get(role, 50 * 1024 * 1024)
        if file_size > single_limit:
            raise ValueError(
                f"File too large: {file_size} bytes exceeds limit {single_limit} bytes "
                f"for role {role}"
            )

        total_limit = self.MEETING_TOTAL_LIMITS.get(role, 100 * 1024 * 1024)
        if total_limit > 0 and (meeting_total_size + file_size) > total_limit:
            raise ValueError(
                f"Meeting total size exceeded: {meeting_total_size + file_size} bytes "
                f"exceeds limit {total_limit} bytes for role {role}"
            )
```

---

## 14. 文件类型白名单

> 只允许上传音视频、图片、文档类文件，阻断可执行文件和恶意脚本

### 14.1 MIME 类型白名单

```python
class FileTypeWhitelist:
    """
    文件类型白名单校验服务.

    异常:
        ValueError: 文件类型不允许时抛出.
    """

    # MIME 类型白名单 (按用途分类)
    ALLOWED_TYPES: dict[str, set[str]] = {
        "video": {
            "video/webm",
            "video/mp4",
            "video/ogg",
            "video/quicktime",
            "video/x-msvideo",
        },
        "audio": {
            "audio/webm",
            "audio/mp4",
            "audio/mpeg",
            "audio/ogg",
            "audio/wav",
            "audio/aac",
            "audio/flac",
        },
        "image": {
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
        },
        "document": {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "text/markdown",
            "text/html",
        },
    }

    # MIME 类型黑名单 (绝对禁止)
    BLOCKED_TYPES: set[str] = {
        "application/x-msdownload",   # .exe
        "application/x-executable",   # 可执行文件
        "application/x-sh",           # Shell 脚本
        "application/x-shellscript",  # Shell 脚本
        "application/x-python",       # Python 脚本
        "application/javascript",      # JS 文件
        "text/javascript",            # JS 文件
        "application/x-javascript",   # JS 文件
        "text/x-python",              # Python 脚本
        "text/x-shellscript",          # Shell 脚本
        "application/x-rar",           # RAR 压缩包 (可能含恶意文件)
        "application/x-7z-compressed",  # 7z 压缩包
    }

    @classmethod
    def validate(cls, content_type: str, extension: str) -> str:
        """
        校验文件类型是否在白名单中.

        参数:
            content_type: 文件 MIME 类型 (从 Content-Type header 获取).
            extension: 文件扩展名 (小写，带点).

        返回:
            str: 文件分类标签 ("video" / "audio" / "image" / "document").

        异常:
            ValueError: 文件类型在黑名单或不在白名单中时抛出.
        """
        ct = content_type.lower().strip()

        # 黑名单检查
        if ct in cls.BLOCKED_TYPES:
            raise ValueError(f"File type blocked: {ct}")

        # 扩展名校验 (双重保险)
        blocked_extensions = {".exe", ".bat", ".cmd", ".sh", ".py", ".js", ".jar", ".dll", ".so"}
        if extension.lower() in blocked_extensions:
            raise ValueError(f"Extension blocked: {extension}")

        # 白名单检查
        for category, types in cls.ALLOWED_TYPES.items():
            if ct in types:
                return category

        raise ValueError(f"File type not allowed: {ct}")
```

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 双重校验原则</strong>
  <div style="margin-top:8px;font-size:13px;">
    同时校验 <code>Content-Type header</code> 和 <code>文件扩展名</code>。<br/>
    Content-Type 可被客户端伪造，扩展名也可被篡改，两者必须同时通过校验。
  </div>
</div>

---

## 15. 下载限流

> 防止用户批量请求 Presigned URL 耗尽 S3 带宽和 Backend 资源

### 15.1 限流策略

| 用户角色 | 每分钟 Presigned URL 签发上限 | 说明 |
|----------|---------------------------|------|
| 普通用户 | **10 次/分钟** | 防止批量盗链 |
| 会员 / 企业微信 | **60 次/分钟** | 合理使用场景更多 |
| 企业微信部门负责人 | **120 次/分钟** | 管理场景需求大 |
| 管理员 | **无限制** | 运维需要 |

### 15.2 实现代码

```python
import time
from threading import Lock
from collections import deque
from dataclasses import dataclass


@dataclass
class RateLimitResult:
    """限流检查结果."""
    allowed: bool
    current_count: int
    limit: int
    reset_at: int  # Unix timestamp


class DownloadRateLimiter:
    """
    下载 Presigned URL 限流器 (滑动窗口算法).

    参数:
        无 (使用类级别配置).

    异常:
        PermissionError: 请求超出限流时抛出 (HTTP 429).
    """

    # 每分钟签发上限 (次/分钟)
    LIMITS: dict[str, int] = {
        "user": 10,
        "vip": 60,
        "wecom_vip": 60,
        "dept_leader": 120,
        "admin": -1,  # 无限制
    }

    WINDOW_SIZE = 60  # 滑动窗口大小 (秒)

    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = {}
        self._lock = Lock()

    def check(self, user_id: str, role: str) -> RateLimitResult:
        """
        检查用户请求是否在限流范围内 (滑动窗口算法).

        参数:
            user_id: 用户 ID (作为限流 key).
            role: 用户角色.

        返回:
            RateLimitResult: 包含是否允许及当前计数.

        异常:
            PermissionError: 超出限流时抛出 (HTTP 429).
        """
        limit = self.LIMITS.get(role, 10)
        if limit < 0:
            return RateLimitResult(allowed=True, current_count=0, limit=-1, reset_at=0)

        now = time.time()
        key = f"media_rate:{user_id}"

        with self._lock:
            if key not in self._buckets:
                self._buckets[key] = deque(maxlen=limit)

            bucket = self._buckets[key]

            # 清理窗口外的过期记录
            cutoff = now - self.WINDOW_SIZE
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                reset_at = int(bucket[0] + self.WINDOW_SIZE)
                raise PermissionError(
                    f"Rate limit exceeded: {len(bucket)}/{limit} requests per minute. "
                    f"Reset at {reset_at}"
                )

            bucket.append(now)
            return RateLimitResult(
                allowed=True,
                current_count=len(bucket),
                limit=limit,
                reset_at=int(now + self.WINDOW_SIZE),
            )
```

### 15.3 与 Backend 集成

```python
# 在 MediaAccessService 中集成限流
async def get_meeting_media_url(self, meeting_id: str, user_id: str, media_type: str) -> MediaAccessResult:
    role = self._resolve_user_role(user_id, auth_source)

    # 1. 限流检查
    rate_limit_result = self._rate_limiter.check(user_id, role)
    if not rate_limit_result.allowed:
        raise PermissionError("Rate limit exceeded, please wait")

    # 2. 日志记录限流状态
    logger.info(
        f"Rate limit: user_id={user_id}, role={role}, "
        f"count={rate_limit_result.current_count}/{rate_limit_result.limit}"
    )

    # 3. 后续鉴权 + 生成 Presigned URL
    ...
```

---

## 16. CloudTrail 审计日志

> S3 操作全量记录，支持安全溯源和合规审查

### 16.1 CloudTrail 配置

```json
{
  "Name": "trai-media-audit",
  "TrailName": "trai-media-audit-trail",
  "IncludeGlobalServiceEvents": true,
  "IsMultiRegionTrail": true,
  "IsOrganizationTrail": false,
  "S3BucketName": "trai-audit-logs",
  "S3KeyPrefix": "cloudtrail/trai-media/",
  "EnableLogFileValidation": true,
  "IsLogging": true
}
```

### 16.2 必须记录的事件类型

| 事件 | 说明 | 安全相关性 |
|------|------|----------|
| `GetObject` | 文件下载 | 追踪谁访问了什么文件 |
| `PutObject` | 文件上传 | 追踪谁上传了什么文件 |
| `DeleteObject` | 文件删除 | 追踪数据销毁行为 |
| `CreateBucket` | 创建 Bucket | 异常创建 = 可能被攻击 |
| `PutBucketPolicy` | 修改 Bucket 策略 | 任何 Public 策略变更必须告警 |
| `DeleteBucket` | 删除 Bucket | 高危操作，告警 + 自动阻止 |

### 16.3 安全告警规则

```python
# CloudWatch Events 告警规则 (CloudFormation/YAML)
"""
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  S3SecurityAlert:
    Type: AWS::Events::Rule
    Properties:
      Name: trai-s3-security-alert
      State: ENABLED
      Targets:
        - Arn: !GetAtt SNSTopic.Arn
          Id: security-alert
      EventPattern:
        source:
          - aws.s3
        detail:
          eventSource:
            - s3.amazonaws.com
          eventName:
            - PutBucketPolicy
            - DeleteBucket
            - PutBucketPublicAccessBlock
          detail:
            requestParameters:
              bucketName: [trai-media]
            errorCode: [{ exists: false }]
"""
```

### 16.4 Backend 日志规范

```python
# 每次 S3 操作必须记录结构化日志 (ELK/Grafana 可解析)
logger.info(
    "S3 operation: "
    f"action={action}, "
    f"user_id={user_id}, "
    f"tenant_id={tenant_id}, "
    f"role={role}, "
    f"file_path={file_path}, "
    f"file_size={file_size}, "
    f"content_type={content_type}, "
    f"presigned_expires={expires_in}s, "
    f"req_id={req_id}, "
    f"ts={datetime.now(timezone.utc).isoformat()}"
)
```

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; 日志保留期</strong>
  <div style="margin-top:8px;font-size:13px;">
    CloudTrail 日志默认保留 <strong>90 天</strong>，如需更长保留期（合规要求），建议开启 S3 Object Lambda + 定期转存到 S3 Glacier Deep Archive。
  </div>
</div>

---

## 17. AI 生成内容存储 (文生图/图生视频/文生文)

> AI 模型生成的图片、视频、文本等资产，与会议录制同等重要，必须纳入统一存储管理

### 17.1 AI 资源类型与存储路径

| 资源类型 | S3 路径前缀 | 说明 |
|---------|-----------|------|
| 文生图 (Text-to-Image) | `ai_generated/images/{user_id}/{task_id}/` | 静态图片 (PNG/JPG/WEBP) |
| 图生视频 (Image-to-Video) | `ai_generated/videos/{user_id}/{task_id}/` | AI 生成的视频 |
| 文生文 / AI 对话 | `ai_generated/texts/{user_id}/{task_id}/` | AI 对话记录 (JSON/MD) |
| AI 合成语音 | `ai_generated/audio/{user_id}/{task_id}/` | TTS 生成音频 |
| AI 生成缩略图 | `ai_generated/thumbnails/{task_id}/` | 视频封面图 |

### 17.2 存储分区完整结构

```
S3 Bucket: trai-media
│
├── private/
│   ├── tenants/{tenant_id}/
│   │   ├── meetings/{meeting_id}/         # 会议录制
│   │   ├── documents/{meeting_id}/         # 会议文档
│   │   ├── avatars/{user_id}/            # 用户头像
│   │   ├── attachments/{msg_id}/           # 消息附件
│   │   └── ai_generated/                  # AI 生成内容
│   │       ├── images/{user_id}/{task_id}/ # 文生图
│   │       ├── videos/{user_id}/{task_id}/# 图生视频
│   │       ├── texts/{user_id}/{task_id}/ # AI 对话
│   │       └── audio/{user_id}/{task_id}/ # AI 语音
│   │
│   └── _retention_7d/     # 普通用户
│   └── _retention_30d/    # VIP / 企业微信
│   └── _retention_90d/    # 部门负责人
│   └── _retention_admin/  # 管理员
│
├── temp/
│   └── ai_pending/{user_id}/{task_id}/     # AI 任务临时文件 (2h 后清理)
│
└── public/
    └── ai_samples/                        # AI 生成的公开示例 (可选)
```

### 17.3 AI 资源有效期策略

> AI 生成内容的有效期策略与会议录制一致，按用户角色决定

| 用户角色 | 文生图有效期 | 图生视频有效期 | AI 对话有效期 |
|----------|-----------|-------------|-------------|
| 普通用户 | **15 分钟** | **15 分钟** | **30 分钟** |
| 会员 / 企业微信普通成员 | **4 小时** | **4 小时** | **12 小时** |
| 企业微信部门负责人 | **8 小时** | **8 小时** | **24 小时** |
| 管理员 | **7 天** | **7 天** | **30 天** |

### 17.4 AI 任务完整流程

```
用户提交 AI 请求 (文生图 / 图生视频 / 文生文)
     │
     ▼
1. Backend 接收请求，记录任务元数据
     │ tenant_id, user_id, task_type, prompt, status=pending
     ▼
2. 生成 S3 临时上传路径 (temp/ai_pending/{user_id}/{task_id}/)
     │ Presigned PUT URL，有效期 5 分钟
     ▼
3. AI 服务 (如 Stable Diffusion / Sora / GPT) 生成内容
     │
     ▼
4. AI 服务直接上传到 S3 临时路径 (服务端直传，不经过用户端)
     │ Cloud Run / Lambda 调用 Backend 签发的 Presigned PUT URL
     ▼
5. Backend 收到完成回调，移动到正式路径
     │ mv: temp/ai_pending/ → ai_generated/{type}/{user_id}/{task_id}/
     │ 同时更新任务状态: pending → completed
     ▼
6. 用户通过 Presigned GET URL 下载 (有效期由角色决定)
     │
     ▼
7. 记录审计日志 (task_id, user_id, tenant_id, model_name, cost)
```

### 17.5 AI 服务直传架构

> AI 生成文件直接由 AI 服务上传到 S3，不经过 Backend 中转，避免流量浪费

```python
class AIGenerationService:
    """
    AI 内容生成服务，管理 AI 任务的生命周期.

    参数:
        s3_client: S3 客户端实例.
        ai_provider: AI 服务提供商 (OpenAI / Stability AI / Runway 等).

    异常:
        ValueError: 请求参数不合法时抛出.
        AIProviderError: AI 服务调用失败时抛出.
    """

    # AI 任务类型枚举
    TASK_TYPES = ["text_to_image", "image_to_video", "text_to_text", "text_to_speech"]

    def __init__(self, s3_client, ai_provider) -> None:
        self._s3 = s3_client
        self._ai = ai_provider

    async def submit_task(
        self,
        tenant_id: str,
        user_id: str,
        task_type: str,
        prompt: str,
        params: dict | None = None,
    ) -> dict:
        """
        提交 AI 生成任务.

        参数:
            tenant_id: 租户 ID.
            user_id: 用户 ID.
            task_type: 任务类型 (text_to_image / image_to_video / text_to_text / text_to_speech).
            prompt: AI 提示词 / 对话内容.
            params: AI 模型参数 (分辨率 / 时长 / 模型版本等).

        返回:
            dict: 任务信息，包含 task_id 和 AI 服务直传的 Presigned PUT URL.

        异常:
            ValueError: 任务类型不合法或 prompt 超过长度时抛出.
        """
        if task_type not in self.TASK_TYPES:
            raise ValueError(f"Invalid task_type: {task_type}, allowed: {self.TASK_TYPES}")

        # 校验 prompt 长度 (AI 模型通常有 token 上限)
        if len(prompt) > 10000:
            raise ValueError("Prompt too long: max 10000 characters")

        task_id = str(uuid4())
        now = datetime.now(timezone.utc)

        # 1. 创建任务元数据记录
        task_meta = {
            "task_id": task_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "task_type": task_type,
            "prompt": prompt,
            "status": "pending",
            "created_at": now.isoformat(),
            "model": self._get_model_for_task(task_type, params),
            "cost": 0,
        }

        # 2. 生成 S3 临时路径 (AI 服务直传目标)
        temp_key = f"temp/ai_pending/{tenant_id}/{user_id}/{task_id}/output.{self._get_ext(task_type)}"
        put_url = self._s3.generate_presigned_put_url(temp_key, expires_seconds=300)

        task_meta["temp_s3_key"] = temp_key
        task_meta["put_url"] = put_url  # 仅在响应中返回给 AI 服务端

        # 3. 记录任务元数据 (Redis / DB)
        await self._save_task_meta(task_meta)

        logger.info(
            f"AI task submitted: task_id={task_id}, type={task_type}, "
            f"tenant_id={tenant_id}, user_id={user_id}"
        )

        return {
            "task_id": task_id,
            "status": "pending",
            "temp_s3_key": temp_key,
            "estimated_time": self._get_estimated_time(task_type, params),
        }

    def _get_model_for_task(self, task_type: str, params: dict | None) -> str:
        """根据任务类型和参数选择 AI 模型."""
        models = {
            "text_to_image": "stable-diffusion-xl-1024",
            "image_to_video": "sora-720p",
            "text_to_text": "gpt-4o",
            "text_to_speech": "tts-1-hd",
        }
        return models.get(task_type, "unknown")

    def _get_ext(self, task_type: str) -> str:
        """根据任务类型返回文件扩展名."""
        return {"text_to_image": "png", "image_to_video": "mp4", "text_to_text": "json", "text_to_speech": "mp3"}.get(task_type, "bin")

    def _get_estimated_time(self, task_type: str, params: dict | None) -> int:
        """估算任务完成时间 (秒)."""
        base_times = {"text_to_image": 30, "image_to_video": 120, "text_to_text": 10, "text_to_speech": 15}
        return base_times.get(task_type, 60)

    async def on_task_complete(self, task_id: str, output_s3_key: str) -> None:
        """
        AI 任务完成回调，将临时文件移动到正式路径.

        参数:
            task_id: 任务 ID.
            output_s3_key: AI 服务上传到的临时 S3 路径.

        异常:
            ValueError: 任务不存在时抛出.
        """
        task_meta = await self._load_task_meta(task_id)
        if not task_meta:
            raise ValueError(f"Task not found: {task_id}")

        # 1. 确定正式路径
        task_type = task_meta["task_type"]
        user_id = task_meta["user_id"]
        tenant_id = task_meta["tenant_id"]

        prefix_map = {"text_to_image": "images", "image_to_video": "videos", "text_to_text": "texts", "text_to_speech": "audio"}
        category = prefix_map.get(task_type, "others")
        final_key = f"private/tenants/{tenant_id}/ai_generated/{category}/{user_id}/{task_id}/output.{self._get_ext(task_type)}"

        # 2. S3 COPY (从临时路径到正式路径)
        await self._s3.copy_object(output_s3_key, final_key)

        # 3. 删除临时文件
        await self._s3.delete_object(output_s3_key)

        # 4. 更新任务状态
        task_meta["status"] = "completed"
        task_meta["final_s3_key"] = final_key
        task_meta["completed_at"] = datetime.now(timezone.utc).isoformat()
        await self._save_task_meta(task_meta)

        logger.info(f"AI task completed: task_id={task_id}, final_key={final_key}")

    async def get_user_access_url(self, task_id: str, user_id: str) -> str:
        """
        获取用户访问 AI 生成内容的 Presigned GET URL (有效期由角色决定).

        参数:
            task_id: 任务 ID.
            user_id: 用户 ID.

        返回:
            str: Presigned GET URL.

        异常:
            PermissionError: 用户无权访问该任务时抛出.
            ValueError: 任务不存在或未完成时抛出.
        """
        task_meta = await self._load_task_meta(task_id)
        if not task_meta:
            raise ValueError(f"Task not found: {task_id}")

        if task_meta["status"] != "completed":
            raise ValueError(f"Task not completed: status={task_meta['status']}")

        # 权限校验: 只能访问自己的任务 (或管理员跨用户访问)
        if task_meta["user_id"] != user_id:
            role = await self._get_user_role(user_id)
            if role != "admin":
                raise PermissionError("Not authorized to access this task")

        # 角色决定有效期
        role = await self._get_user_role(user_id)
        expires = self._get_ai_expires_seconds(role, task_meta["task_type"])

        url = self._s3.generate_presigned_get_url(task_meta["final_s3_key"], expires_seconds=expires)

        logger.info(
            f"AI content accessed: task_id={task_id}, user_id={user_id}, "
            f"role={role}, expires={expires}s"
        )

        return url

    def _get_ai_expires_seconds(self, role: str, task_type: str) -> int:
        """根据角色和任务类型返回 Presigned URL 有效期."""
        configs = {
            "user": {"text_to_image": 900, "image_to_video": 900, "text_to_text": 1800, "text_to_speech": 1800},
            "vip": {"text_to_image": 14400, "image_to_video": 14400, "text_to_text": 43200, "text_to_speech": 43200},
            "wecom_vip": {"text_to_image": 14400, "image_to_video": 14400, "text_to_text": 43200, "text_to_speech": 43200},
            "dept_leader": {"text_to_image": 28800, "image_to_video": 28800, "text_to_text": 86400, "text_to_speech": 86400},
            "admin": {"text_to_image": 604800, "image_to_video": 604800, "text_to_text": 2592000, "text_to_speech": 2592000},
        }
        return configs.get(role, configs["user"]).get(task_type, 900)
```

### 17.6 AI 生成内容成本控制

> AI 模型调用成本高，必须记录 Token/图片数/视频时长，用于计费和限流

```python
class AICostTracker:
    """
    AI 任务成本追踪器，按租户和用户记录费用.

    参数:
        redis_client: Redis 客户端，用于存储计数器.

    异常:
        QuotaExceededError: 当月配额超限时抛出.
    """

    # 每月免费额度 (按角色)
    MONTHLY_FREE_QUOTA: dict[str, dict[str, int]] = {
        "user": {"text_to_image": 10, "image_to_video": 2, "text_to_text": 50, "text_to_speech": 5},
        "vip": {"text_to_image": 100, "image_to_video": 20, "text_to_text": 500, "text_to_speech": 50},
        "wecom_vip": {"text_to_image": 100, "image_to_video": 20, "text_to_text": 500, "text_to_speech": 50},
        "dept_leader": {"text_to_image": 200, "image_to_video": 50, "text_to_text": 1000, "text_to_speech": 100},
        "admin": {"text_to_image": 999999, "image_to_video": 999999, "text_to_text": 999999, "text_to_speech": 999999},
    }

    # 单次成本 (USD, 仅供参考)
    UNIT_COST: dict[str, float] = {
        "text_to_image": 0.02,
        "image_to_video": 0.50,
        "text_to_text": 0.001,   # per 1K tokens
        "text_to_speech": 0.015,  # per 1K characters
    }

    def check_quota(self, user_id: str, role: str, task_type: str, count: int = 1) -> None:
        """
        校验用户 AI 配额是否充足.

        参数:
            user_id: 用户 ID.
            role: 用户角色.
            task_type: 任务类型.
            count: 本次请求数量.

        异常:
            QuotaExceededError: 当月配额超限时抛出.
        """
        quota = self.MONTHLY_FREE_QUOTA.get(role, {}).get(task_type, 0)
        used = self._get_monthly_usage(user_id, task_type)

        if used + count > quota:
            raise QuotaExceededError(
                f"AI quota exceeded: user={user_id}, type={task_type}, "
                f"used={used}, quota={quota}, requested={count}"
            )

    def record_usage(self, user_id: str, task_type: str, count: int = 1, cost: float | None = None) -> None:
        """记录 AI 使用量和成本."""
        # Redis INCR 月计数器
        self._incr_monthly_usage(user_id, task_type, count)
        # 记录成本 (用于账单)
        actual_cost = cost if cost is not None else self.UNIT_COST.get(task_type, 0) * count
        self._record_cost(user_id, task_type, actual_cost)

        logger.info(
            f"AI usage recorded: user_id={user_id}, type={task_type}, "
            f"count={count}, cost=${actual_cost:.4f}"
        )
```

### 17.7 AI 内容内容安全审核

> AI 生成内容必须经过安全审核后才能向用户展示，防止违规内容扩散

```python
class AIContentModeration:
    """
    AI 内容安全审核服务 (文生图/图生视频).

    参数:
        moderation_client: 内容审核 API 客户端 (AWS Rekognition / 第三方审核服务).

    异常:
        ContentRejectedError: 内容违规被拒绝时抛出.
    """

    # AWS Rekognition 审核标签阈值
    CONFIDENCE_THRESHOLD = 0.75

    # 违规内容标签 (一旦检测到直接拒绝)
    REJECT_LABELS = {
        "Explicit Nudity",
        "Suggestive",
        "Violence",
        "Drugs",
        "Hate Symbols",
        "Weapons",
    }

    async def moderate_image(self, s3_key: str) -> None:
        """
        审核 AI 生成的图片.

        参数:
            s3_key: S3 中的图片路径.

        异常:
            ContentRejectedError: 图片包含违规内容时抛出.
        """
        labels = await self._moderation_client.detect_moderation_labels(s3_key)

        for label in labels:
            if label["Name"] in self.REJECT_LABELS and label["Confidence"] >= self.CONFIDENCE_THRESHOLD:
                # 删除违规内容
                await self._s3.delete_object(s3_key)
                raise ContentRejectedError(
                    f"Content rejected: label={label['Name']}, confidence={label['Confidence']}, s3_key={s3_key}"
                )

        logger.info(f"Image moderated OK: s3_key={s3_key}, labels={[l['Name'] for l in labels]}")

    async def moderate_video(self, s3_key: str) -> None:
        """审核 AI 生成的视频 (异步，支持大文件)."""
        # 视频审核使用 S3 MediaLive / Rekognition Video
        job_id = await self._moderation_client.start_content_moderation(s3_key)
        # 回调处理结果
        ...
```

### 17.8 AI 服务提供商选型参考

| 能力 | 图片生成 | 视频生成 | 文本对话 | 语音合成 |
|------|---------|---------|---------|---------|
| OpenAI | DALL-E 3 | Sora | GPT-4o | TTS-1-HD |
| Stability AI | SDXL 1.0 | SVD | - | - |
| Runway | - | Gen-3 | - | - |
| ElevenLabs | - | - | - | Eleven Multilingual v2 |
| Anthropic | - | - | Claude 3.5 | - |

---

## 18. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止 Public Read</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">所有资源必须鉴权</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止硬编码地址</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须通过 API 获取</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#C62828;">禁止无角色分级</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须按 user/vip/admin 分有效期</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">普通用户上限</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">会议音视频 ≤ 5 分钟</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">VIP 用户</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">会议音视频 ≤ 2 小时</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">审计日志</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每次签发必须记录</div>
  </div>

</div>