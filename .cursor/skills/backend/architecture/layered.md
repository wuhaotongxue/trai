# Backend - DDD 五层架构规范

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

## 2. 五层目录结构

```
backend/src/
├── domain/                         # 领域层 (Domain)
│   ├── user/
│   │   ├── entities.py             # 用户实体 (纯 Python)
│   │   └── interfaces.py           # 用户仓储接口 (纯 Python)
│   ├── meeting/
│   │   ├── entities.py             # 会议实体
│   │   └── interfaces.py           # 会议仓储接口
│   └── tools_interface/
│       └── base/
│           └── base_tool.py        # 工具基类 (纯 Python)
│
├── application/                    # 应用层 (Application)
│   ├── user/
│   │   ├── usecases.py            # 用户用例
│   │   └── dto.py                 # 用户 DTO
│   ├── meeting/
│   │   ├── usecases.py            # 会议用例
│   │   ├── service.py             # 会议服务
│   │   └── dto.py                 # 会议 DTO
│   └── common/
│       └── result.py               # 统一结果封装
│
├── infrastructure/                 # 基础设施层 (Infrastructure)
│   ├── persistence/
│   │   ├── database.py            # 数据库连接
│   │   ├── orm_models/           # ORM 模型
│   │   └── repositories/          # 仓储实现
│   ├── llm/                       # 大模型调用
│   ├── storage/                   # S3 文件存储 (Presigned URL)
│   ├── cache/                     # 缓存
│   └── logging/                   # 日志
│
├── api/                           # API 层
│   ├── main.py                   # FastAPI 实例
│   ├── deps.py                   # 依赖注入
│   └── routers/
│       ├── auth/
│       ├── apps/
│       ├── ai/
│       └── media.py              # 媒体存储路由 (Presigned URL)
│
└── scripts/                       # 运维脚本
    └── backup.py                  # 备份脚本
```

---

## 3. 各层职责

| 层级 | 目录 | 职责 | 禁止行为 |
|------|------|------|----------|
| **Domain** | `domain/` | 纯 Python 实体和接口定义 | 禁止引入任何第三方框架 |
| **Application** | `application/` | 用例编排和调度 | 禁止直接操作数据库 |
| **Infrastructure** | `infrastructure/` | 数据库操作、缓存、大模型 API、S3 | 禁止写业务判断逻辑 |
| **API** | `api/` | 接收 HTTP 请求，参数校验 | 禁止直接写 SQL 或业务逻辑 |
| **Scripts** | `scripts/` | 运维脚本 (必须封装在类中) | 禁止无类占坑 |

---

## 4. 层级调用规则

```
API 层
    ↓ 调用 (注入 UseCase)
Application 层 (UseCase / Service)
    ↓ 调用 (注入 Repository Interface)
Domain 层 (interfaces) + Infrastructure 层 (repositories / llm / storage)
```

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 反向依赖禁止</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Infrastructure 不得依赖 Application</li>
    <li>Domain 不得依赖任何其他层</li>
  </ul>
</div>

---

## 5. 类封装规则

**约束**：
- 每个 `.py` 文件必须有至少一个类
- 所有函数必须封装在类中（实例方法、静态方法、类方法）
- 禁止文件顶层孤立函数
- 禁止创建没有任何类的占坑文件

---

## 6. Domain 层禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; Domain 层严禁导入</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>禁止 <code>from sqlalchemy import Column</code> (ORM)</li>
    <li>禁止 <code>from fastapi import Depends</code> (Web 框架)</li>
    <li>禁止 <code>import redis</code> (基础设施)</li>
  </ul>
  <div style="margin-top:8px;font-size:13px;">
    正确导入：<code>from dataclasses import dataclass</code>、<code>from typing import Protocol, Any</code>
  </div>
</div>

---

## 7. Repository 模式

**约束**：
- Domain 层定义 `Protocol` 接口（纯 Python，无第三方依赖）
- Infrastructure 层实现具体仓储类

---

## 8. 文件行数限制

| 限制 | 说明 |
|------|------|
| 单文件 ≤ 1500 行 | 超限必须按功能拆分 |
| 建议单个 class ≤ 300 行 | 超限考虑拆分职责 |

---

## 9. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">Domain 纯净</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止第三方框架导入</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">反向禁止</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Infra 不调用 Application</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">文件有类</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止顶层孤立函数</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">文件行数</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">单文件 ≤ 1500 行</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Protocol 抽象</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Repository 用 Protocol</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">层级单向</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">API → App → Domain+Infra</div>
  </div>

</div>
