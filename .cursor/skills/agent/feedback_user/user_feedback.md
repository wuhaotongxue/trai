# Agent_用户反馈与问题报告规范

---

## 1. 反馈类型

| 类型 | 说明 | 优先级 |
|------|------|-------|
| bug | 功能异常、崩溃 | P0-P2 |
| feature_request | 功能建议 | P2-P3 |
| ux_issue | 体验问题 | P3 |
| security | 安全漏洞 | P0 |
| contact | 联系我们 | P1-P2 |

---

## 2. 反馈状态

```
submitted -> triaged -> in_progress -> resolved -> closed
                |
           waiting_user
                |
           in_progress
```

### 2.1 状态说明

| 状态 | 说明 |
|------|------|
| submitted | 已提交 |
| triaged | 已分类 |
| waiting_user | 等待用户补充 |
| in_progress | 处理中 |
| resolved | 已解决 |
| closed | 已关闭 |

---

## 3. 反馈工具

| 工具 ID | 说明 |
|---------|------|
| feedback.submit | 提交反馈 |
| feedback.get_status | 查看状态 |
| feedback.add_comment | 添加评论 |
| feedback.contact_support | 联系客服 |

---

## 4. 核心规则

| 规则 | 说明 |
|------|------|
| 安全漏洞 | P0 优先，通知安全团队 |
| VIP 用户 | 自动提升优先级响应 |
| 内容安全 | 提交前必须检查 |
| 隐私保护 | 用户只能查看自己的反馈 |

---

## 5. PostgreSQL 表设计

### 5.1 user_feedbacks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| category | VARCHAR(50) | 分类 |
| severity | VARCHAR(20) | 严重程度 |
| status | VARCHAR(20) | 状态 |
| title | VARCHAR(200) | 标题 |
| description | TEXT | 描述 |
| priority | INT | 优先级 (1-5, 1 为最高) |
| created_at | TIMESTAMPTZ | 创建时间 |

### 5.2 索引

| 索引 | 字段 |
|------|------|
| user_id_idx | user_id, created_at |
| status_idx | status |
| category_idx | category |

---

## 6. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>安全漏洞报告不优先处理</li>
    <li>VIP 用户反馈无优先响应</li>
    <li>反馈处理状态不更新</li>
    <li>用户查看他人反馈 (隐私泄露)</li>
    <li>反馈不关联 Agent 会话</li>
  </ul>
</div>

---

## 7. 快速参考

| 类型 | 响应时间 |
|------|---------|
| critical | 1 hour |
| high | 4 hours |
| normal | 24 hours |
