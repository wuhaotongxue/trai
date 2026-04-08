# Backend - API 设计规范

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

## 2. HTTP 方法规范

- **业务接口强制仅使用 POST**
- 禁止使用 GET/PUT/DELETE 用于业务接口
- GET 仅用于查询类接口（如 `/releases/latest`）

---

## 3. 统一响应格式

```python
{
    "code": 200,       # 业务状态码
    "msg": "OK",       # 消息
    "data": {},        # 业务数据
    "req_id": "...",   # 请求追踪 ID
    "ts": "..."       # 时间戳
}
```

---

## 4. 错误响应格式

```python
{
    "code": 400,
    "msg": "Invalid version format",
    "data": None,
    "req_id": "...",
    "ts": "..."
}
```

---

## 5. 输入验证

- 所有输入必须通过 Pydantic 模型验证
- 使用 `Field` 添加描述和约束

```python
from pydantic import BaseModel, Field

class CreateMeetingRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="会议标题")
    host_id: str = Field(..., description="主持人 ID")
    start_time: str = Field(..., description="开始时间 ISO 格式")
```

---

## 6. 路由组织

```
api/routers/
├── auth/          # 认证相关
│   ├── login.py
│   ├── users.py
│   └── wecom.py
├── apps/          # 业务应用
│   ├── admin.py   # 管理员
│   ├── meeting.py # 会议
│   ├── release.py # 发布
│   └── report.py
├── ai/            # AI 能力
│   ├── chat.py
│   ├── image.py
│   ├── music.py
│   ├── video.py
│   └── speech.py
├── media/        # 媒体存储 (Presigned URL)
│   └── access.py
├── system/        # 系统
│   ├── health.py
│   └── monitor.py
└── tools/         # 工具
    ├── excel.py
    └── doc.py
```

---

## 7. 媒体存储路由 (CRITICAL)

> 所有私有文件必须通过 Presigned URL，**严禁 Public Read**

| 路由 | 方法 | 用途 |
|------|------|------|
| `/media/access` | POST | 生成文件访问 Presigned GET URL |
| `/media/upload` | POST | 生成文件上传 Presigned PUT URL |
| `/media/batch-access` | POST | 批量生成访问 URL |

---

## 8. 禁止事项

```python
# ❌ 禁止: API 层直接写 SQL
@router.post("/meeting/list")
async def list_meetings(req):
    result = await db.execute("SELECT * FROM meetings")  # ❌

# ✅ 正确: 调用 Application 层
@router.post("/meeting/list")
async def list_meetings(req, usecase: ListMeetingsUseCase = Depends()):
    return await usecase.execute(req)

# ❌ 禁止: 不验证输入
@router.post("/meeting/create")
async def create_meeting(meeting_id: str):  # ❌

# ✅ 正确: 使用 Pydantic
@router.post("/meeting/create")
async def create_meeting(req: CreateMeetingRequest):
    ...
```