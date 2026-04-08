# Agent_上下文工程规范

---

## 1. 全局中文标点符号禁令 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、配置、Rules 中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 核心原则

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x2714; 上下文是装配系统，不是静态文档</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    提示词来自不同来源，有不同优先级、新鲜度、职责。必须先在工程上把层级关系建好，再交给模型。
  </div>
</div>

---

## 3. 上下文分层模型

```
L1: System Prompt (最高优先级，最稳定)
    - Agent 角色定义、行为约束、会议规范

L2: Domain Context (中等优先级，可刷新)
    - 当前会议状态、参与者列表、历史纪要

L3: Session Context (低优先级，会话级)
    - 本次对话历史、用户最新指令

L4: Ephemeral Context (最低优先级，每次调用动态注入)
    - 实时转录片段、工具执行结果、临时状态
```

---

## 4. 上下文裁剪策略

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 长会话必须裁剪，禁止无限累积</strong>
</div>

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>把上下文写成单文件静态文档，不做动态装配</li>
    <li>长会话无限累积，不做 token 预算管理</li>
    <li>所有信息平铺，不做优先级分层</li>
  </ul>
</div>