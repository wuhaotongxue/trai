# Backend_API_设计规范

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

**约束**：
- 业务接口强制仅使用 **POST**
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
    "ts": "..."        # 时间戳
}
```

---

## 4. 输入验证

**约束**：
- 所有输入必须通过 Pydantic 模型验证
- 使用 `Field` 添加描述和约束

---

## 5. 路由组织

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
│   ├── dashboard.py
│   └── report.py
├── ai/            # AI 能力
│   ├── chat.py
│   ├── image.py
│   ├── music.py
│   ├── video.py
│   └── speech.py
├── system/        # 系统
│   ├── health.py
│   ├── monitor.py
│   └── i18n.py
└── tools/         # 工具
    ├── excel.py
    ├── doc.py
    └── crawl.py
```

---

## 6. 路由前缀规范

| 路由组 | 前缀 | 示例 |
|--------|------|------|
| 管理员 | `/admin/` | `/admin/users/list` |
| 会议 | `/meetings/` | `/meetings/create` |
| 发布 | `/admin/releases/` | `/admin/releases/upload` |
| AI | `/ai/` | `/ai/chat/completions` |
| 系统 | `/monitor/` | `/monitor/ping` |

---

## 7. 长任务处理

**约束**：
- 必须使用 `BackgroundTasks` 或消息队列处理耗时操作
- API 测试超时时间至少为 **100秒**

---

## 8. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; API 层严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>禁止直接写 SQL</li>
    <li>禁止不验证输入参数</li>
    <li>禁止直接操作数据库（应委托给 Application 层）</li>
    <li>禁止将业务逻辑写在 API 路由函数内部</li>
  </ul>
</div>

---

## 9. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">业务接口 POST</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止 GET/PUT/DELETE</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Pydantic 验证</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">所有输入必须验证</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">分层调用</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">API → Application → Domain</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">统一响应格式</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">code/msg/data/req_id/ts</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">长任务后台处理</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">BackgroundTasks</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">依赖注入</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">FastAPI Depends</div>
  </div>

</div>
