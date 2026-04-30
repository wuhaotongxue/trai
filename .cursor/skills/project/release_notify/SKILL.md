---
name: "release_notify"
description: >-
  TRAI 客户端发布通知规范。当用户说发布客户端/打包发布/新版本上线等或调用此技能时执行。
---

# TRAI_客户端发布通知规范_(release_notify)

当用户触发客户端发布操作时，必须遵循以下通知规范。

## 1. 通知发送时机

客户端发布成功后（包括一键打包和手动上传），**必须**发送飞书 + 企业微信通知。

## 2. 通知内容规范

### 必填字段

| 字段 | 说明 | 来源 |
|------|------|------|
| 版本号 | v{x.y.z} 格式 | 构建脚本生成 |
| 发布者 | 当前操作用户名 | current_user.get("username") |
| 发布者角色 | admin / user | current_user.get("role") |
| AI 角色 | 当前 AI 角色名称 | 自动识别 |
| AI 角色专属评论 | 角色风格的评论 | 查表获取 |
| 更新日志 | 用户填写的 changelog | 请求参数 |
| 下载地址 | S3 生成的下载链接 | s3_service.get_file_url() |

### 3. 角色代号与专属评论

<div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;margin:12px 0;">
  <strong style="color:#2E7D32;">&#x1F4CD; 发布通知必须带上当前 AI 角色</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>角色数据存储在数据库 <code>t_agent_roles</code> 表中</li>
    <li>前端可调用 <code>GET /api/admin/agent_roles</code> 获取角色列表，供用户选择</li>
    <li>选择后通过 Header <code>X-Agent-Role</code> 传递给后端</li>
  </ul>
</div>

**默认角色列表**:

| 角色 | 评论风格 | 触发关键词 |
|------|---------|-----------|
| 爆炸分身 | 吐槽抱怨 | 爆炸 |
| 小甜心 | 撒娇卖萌 | 甜心,甜甜,可爱 |
| 御姐 | 霸道点评 | 御姐,霸道,女王 |
| 软萌宝 | 委屈撒娇 | 软萌,撒娇,萌萌 |
| 知心姐姐 | 温柔鼓励 | 知心,温柔,姐姐 |
| 开心果 | 活泼正能量 | 开心果,活泼,开心 |
| 小泪包 | 心疼安慰 | 泪包,emo,难过 |
| 审查官 | 严格评价 | 审查,审计,严格 |
| 地理专家 | 地理科普 | 地理,专家,经纬度 |

## 4. 飞书卡片格式

```json
{
  "msg_type": "interactive",
  "card": {
    "config": { "wide_screen_mode": true },
    "header": {
      "title": { "tag": "plain_text", "content": "🚀 TRAI Desktop v{x.y.z} 正式发布" },
      "template": "blue"
    },
    "elements": [
      {
        "tag": "div",
        "text": {
          "tag": "lark_md",
          "content": "**版本号:** v{x.y.z}\n**发布时间:** {YYYY-MM-DD HH:MM}\n**发布者:** {username} ({role})\n**AI 角色:** {agent_role}"
        }
      },
      { "tag": "hr" },
      {
        "tag": "div",
        "text": { "tag": "lark_md", "content": "**更新内容:**\n{changelog}" }
      },
      {
        "tag": "action",
        "actions": [
          { "tag": "button", "text": { "tag": "plain_text", "content": "立即下载 (EXE)" }, "url": "{download_url}", "type": "primary" },
          { "tag": "button", "text": { "tag": "plain_text", "content": "查看更新日志" }, "url": "https://ai.tuoren.com/changelog", "type": "default" }
        ]
      },
      { "tag": "note", "elements": [{ "tag": "plain_text", "content": "提示: 如果下载缓慢, 请检查内网代理设置" }] },
      { "tag": "div", "text": { "tag": "lark_md", "content": "> {role_comment}" } }
    ]
  }
}
```

## 5. 企业微信 Markdown 格式

```markdown
🆕 **TRAI 客户端新版本发布 (v{x.y.z})**

**发布者:** {username} ({role})
**AI 角色:** {agent_role}

> **更新日志:**
> {changelog}

**下载地址:** [点击下载 EXE]({download_url})

> {role_comment}
```

## 6. 前端 / Agent 调用规范

**HTTP Header 传递 AI 角色**:

| Header 名称 | 说明 | 示例 |
|-------------|------|------|
| X-Agent-Role | 当前 AI 角色名称 | `地理专家` |

**前端调用示例**:

```typescript
// 前端调用发布接口时，自动带上当前 AI 角色
const response = await fetch('/api/admin/client/build_release', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Agent-Role': currentAgentRole,  // 自动注入当前 AI 角色
  },
  body: JSON.stringify({ release_notes: changelog }),
});
```

**Agent 调用时**:
- Agent 根据当前会话的 role，自动在请求头中添加 `X-Agent-Role`
- 后端接收到后，自动填充到通知消息中

## 7. 环境变量要求

| 变量名 | 说明 | 示例 |
|--------|------|------|
| NOTIFY_FEISHU_WEBHOOK | 飞书 Webhook | https://open.feishu.cn/... |
| NOTIFY_WECOM_WEBHOOK | 企微 Webhook | https://qyapi.weixin.qq.com/... |

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">必发通知</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">飞书 + 企业微信</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#2E7D32;">必填信息</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">版本/发布者/AI角色</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#E65100;">角色评论</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">根据角色风格选择</div>
  </div>

</div>
