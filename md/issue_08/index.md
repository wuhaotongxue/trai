# TRAI 第8期: AI 角色管理系统, 多群通知集成, 对话风格体系建立, 联系我们功能上线

<div style="background:linear-gradient(135deg,#fdf4ff 0%,#faf5ff 100%);border:1px solid #e9d5ff;border-left:4px solid #a855f7;border-radius:10px;padding:14px 18px;margin:1em 0;color:#581c87;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 建立 AI 角色管理系统，支持数据库配置和前端管理；深化对话风格体系，地理专家、爆炸分身、御姐等角色正式登场；企微通知支持 wuhao/wudu 双群推送；联系我们页面与通知功能完善上线。
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_07/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">0de939ec</code> · 2026-04-25 23:13:31 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 0de939ec..HEAD</code>
</div>

---

## 1. AI 角色管理系统

<div style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #16a34a;border-radius:8px;padding:12px 16px;margin:14px 0;color:#14532d;">
  <strong style="color:#15803d;">角色驱动的智能体</strong>: 建立 AI 角色数据库，支持前端动态配置，告别硬编码角色时代。
</div>

### 1.1 数据库模型设计

<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;margin:10px 0;color:#0c4a6e;font-size:0.9em;">
  <code style="background:#e0f2fe;padding:1px 5px;border-radius:3px;">架构</code> 新增 `t_agent_roles` 数据表，存储角色名称、代码、描述、图标等核心属性。
</div>

角色表结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| t_role_code | VARCHAR | 角色代码，唯一标识 |
| t_role_name | VARCHAR | 角色中文名称 |
| t_description | TEXT | 角色描述 |
| t_icon | VARCHAR | 角色图标 emoji |
| t_system_prompt | TEXT | 系统提示词 |
| t_is_active | BOOLEAN | 是否启用 |
| t_sort_order | INTEGER | 排序权重 |

### 1.2 后端接口实现

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:10px 14px;margin:10px 0;color:#065f46;font-size:0.9em;">
  <code style="background:#d1fae5;padding:1px 5px;border-radius:3px;">API</code> 新增 CRUD 接口，支持前端动态查询可用角色列表。
</div>

新增 `AgentRolesController` 控制器，提供：

- `GET /agent-roles` - 获取所有角色列表
- `POST /agent-roles` - 创建新角色
- `PUT /agent-roles/{id}` - 更新角色
- `DELETE /agent-roles/{id}` - 删除角色

管理后台路由 `/admin/agent_roles`，支持角色列表展示、新增/编辑/删除角色、系统提示词可视化配置、启用/禁用开关等操作。

<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="font-weight:600;font-size:0.85em;color:#1e293b;margin-bottom:10px;">AI 角色管理界面</div>
  <img src="issue_08_02.png" alt="管理后台 AI 角色管理界面" style="width:100%;border-radius:8px;border:1px solid #e2e8f0;" />
</div>

### 1.3 客户端角色选择

<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 14px;margin:10px 0;color:#581c87;font-size:0.9em;">
  <code style="background:#f3e8ff;padding:1px 5px;border-radius:3px;">交互</code> 客户端发布页新增 AI 角色选择下拉框，发布时可指定通知角色。
</div>

客户端发布页面支持选择 AI 角色：

- 下拉框展示所有启用角色
- 选择后发布通知带上角色信息
- 角色专属评论自动生成

---

## 2. 对话风格体系建立

<div style="background:#fef3c7;border:1px solid #fde68a;border-left:4px solid #d97706;border-radius:8px;padding:12px 16px;margin:14 0;color:#92400e;">
  <strong style="color:#b45309;">角色一致性规范</strong>: 建立多角色对话体系，每个角色有独特语气和知识背景。
</div>

### 2.1 角色家族

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:14px 0;">
  <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;border-radius:12px;padding:14px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">🌍</div>
    <div style="font-weight:700;font-size:0.9em;color:#065f46;">地理专家</div>
    <div style="font-size:0.78em;color:#047857;margin-top:4px;">地理知识科普型</div>
    <div style="font-size:0.72em;color:#059669;margin-top:6px;">"说到地理呀～这条消息从东经出发，已成功抵达群聊坐标！"</div>
  </div>
  <div style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:1px solid #fed7aa;border-radius:12px;padding:14px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">💥</div>
    <div style="font-weight:700;font-size:0.9em;color:#9a3412;">爆炸分身</div>
    <div style="font-size:0.78em;color:#c2410c;margin-top:4px;">吐槽抱怨型</div>
    <div style="font-size:0.72em;color:#ea580c;margin-top:6px;">"呜……本来不想写的呜……啊呀终于写完了！"</div>
  </div>
  <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border:1px solid #fcd34d;border-radius:12px;padding:14px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">🍬</div>
    <div style="font-weight:700;font-size:0.9em;color:#92400e;">小甜心</div>
    <div style="font-size:0.78em;color:#b45309;margin-top:4px;">撒娇卖萌型</div>
    <div style="font-size:0.72em;color:#d97706;margin-top:6px;">"辛苦啦～小甜心觉得超棒的呢！"</div>
  </div>
  <div style="background:linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%);border:1px solid #f9a8d4;border-radius:12px;padding:14px;text-align:center;">
    <div style="font-size:24px;margin-bottom:8px;">👸</div>
    <div style="font-weight:700;font-size:0.9em;color:#9d174d;">御姐</div>
    <div style="font-size:0.78em;color:#be185d;margin-top:4px;">霸道点评型</div>
    <div style="font-size:0.72em;color:#db2777;margin-top:6px;">"嗯，做得还行，御姐准了。"</div>
  </div>
</div>

### 2.2 角色一致性规则

<div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 14px;margin:10px 0;color:#6b21a8;font-size:0.9em;">
  <code style="background:#f3e8ff;padding:1px 5px;border-radius:3px;">规范</code> 角色代号使用「说」代替第一人称，禁止混用角色风格。
</div>

对话风格规范要点：

- 执行 Shell 命令时，用当前角色代号描述动作
- 禁止用「我来帮你」这类普通第一人称
- 要用「地理专家来帮你」「小甜心来帮你」等
- 每句话都要符合当前风格的语气

### 2.3 角色周一到周日差异化表达

<div style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:8px;padding:10px 14px;margin:10px 0;color:#0c4a6e;font-size:0.9em;">
  <code style="background:#e0f2fe;padding:1px 5px;border-radius:3px;">特性</code> 每个角色增加周一到周日不同状态的差异化表达。
</div>

同一角色在不同日期有不同的状态和语气：

- 周一：周一综合症 vs 周一元气满满
- 周五：周五期待 vs 周五摸鱼
- 周末：休息模式 vs 工作模式

---

## 3. 多群通知系统升级

<div style="background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #3b82f6;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">双群并行推送</strong>: 企微通知支持 wuhao 和 wudu 两个群同步推送。
</div>

### 3.1 环境变量配置

<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin:10px 0;color:#991b1b;font-size:0.9em;">
  <code style="background:#fee2e2;padding:1px 5px;border-radius:3px;">安全</code> 移除代码中的硬编码 webhook，改为环境变量读取。
</div>

企微 webhook 配置从 `.env` 读取：

- `NOTIFY_WECOM_WUHAO_WEBHOOK` - wuhao 群
- `NOTIFY_WECOM_WUDU_WEBHOOK` - wudu 群

### 3.2 客户端群选择

<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="font-weight:600;font-size:0.85em;color:#1e293b;margin-bottom:10px;">企微群选择界面</div>
  <img src="issue_08_03.png" alt="客户端发布页企微群选择" style="width:100%;border-radius:8px;border:1px solid #e2e8f0;" />
</div>

客户端发布页支持选择企微群：

- 下拉框选择 wuhao/wudu/全部
- 多选支持同时推送到多个群
- 群选择持久化记忆

---

## 4. 联系我们功能上线

<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:8px;padding:12px 16px;margin:14px 0;color:#14532d;">
  <strong style="color:#15803d;">用户反馈通道</strong>: 新增联系我们页面，支持表单提交和多渠道通知。
</div>

### 4.1 前端页面

<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 14px;margin:10px 0;color:#581c87;font-size:0.9em;">
  <code style="background:#f3e8ff;padding:1px 5px;border-radius:3px;">界面</code> 新增联系我们页面，包含姓名、邮箱、主题、内容表单。
</div>

联系我们页面功能：

- 姓名、邮箱必填验证
- 主题下拉选择（功能建议/Bug 反馈/商务合作/其他）
- 富文本内容输入
- 提交成功/失败提示

<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <div style="font-weight:600;font-size:0.85em;color:#1e293b;margin-bottom:10px;">联系我们页面</div>
  <img src="issue_08_01.png" alt="联系我们页面，支持表单提交" style="width:100%;border-radius:8px;border:1px solid #e2e8f0;" />
</div>

### 4.2 后端接口

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:10px 14px;margin:10px 0;color:#065f46;font-size:0.9em;">
  <code style="background:#d1fae5;padding:1px 5px;border-radius:3px;">API</code> 新增 `/contact` 接口，接收表单数据并发送通知。
</div>

后端接口功能：

- 表单数据校验
- 数据持久化存储
- 飞书/企微多渠道通知
- 管理员邮件提醒

### 4.3 邮箱配置管理

<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;margin:10px 0;color:#9a3412;font-size:0.9em;">
  <code style="background:#ffedd5;padding:1px 5px;border-radius:3px;">管理</code> 管理员可配置通知邮箱，支持多收件人。
</div>

管理后台新增邮箱配置：

- 发件邮箱地址
- 收件人列表（逗号分隔）
- SMTP 服务配置
- 测试邮件发送

---

## 5. 刷新令牌机制优化

<div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px;margin:14px 0;color:#991b1b;">
  <strong style="color:#dc2626;">安全加固</strong>: 修复刷新令牌接口返回格式，确保客户端正确解析。
</div>

### 5.1 接口修复

<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;margin:10px 0;color:#0c4a6e;font-size:0.9em;">
  <code style="background:#e0f2fe;padding:1px 5px;border-radius:3px;">Bug</code> 修复 refresh_token 接口返回 JSON 格式，确保 access_token 字段正确。
</div>

修复内容：

- 统一返回 `{access_token, token_type, expires_in}`
- 确保前端能正确解析令牌
- 添加详细的错误信息

---

## 本期 Git 更新 (按域归纳)

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:14px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  本期覆盖范围: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 0de939ec..HEAD --oneline --no-merges</code> · 共 31 个提交
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:14px 0;">
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#15803d;margin-bottom:8px;">AI 角色 (backend/frontend)</div>
    <div style="font-size:0.82em;color:#334155;line-height:1.5;">角色数据库、CRUD 接口、管理页面、客户端选择</div>
  </div>
  <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#7c3aed;margin-bottom:8px;">对话风格 (skills)</div>
    <div style="font-size:0.82em;color:#334155;line-height:1.5;">角色代号规范、差异化表达、地理专家/爆炸分身</div>
  </div>
  <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#1d4ed8;margin-bottom:8px;">多群通知 (backend)</div>
    <div style="font-size:0.82em;color:#334155;line-height:1.5;">企微 wuhao/wudu 双群、环境变量配置</div>
  </div>
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#c2410c;margin-bottom:8px;">联系我们 (backend/frontend)</div>
    <div style="font-size:0.82em;color:#334155;line-height:1.5;">表单提交、邮件通知、飞书/企微推送</div>
  </div>
</div>

### 关键提交清单

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:14px 0;">
<div style="font-size:0.78em;color:#64748b;margin-bottom:12px;font-family:ui-monospace,monospace;">📊 共 12 条关键提交 · 点击 commit hash 可跳转到仓库查看</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">

<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#16a34a;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#14532d;margin-bottom:6px;">🤖 AI 角色管理功能</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">数据库 + 前端页面 + 后端接口</div>
<code style="font-size:0.78em;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:4px;">a4ef8680</code>
</div>
</div>

<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#16a34a;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#14532d;margin-bottom:6px;">🎨 客户端角色选择</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">发布页 AI 角色下拉框</div>
<code style="font-size:0.78em;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:4px;">b53c73ff</code>
</div>
</div>

<div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#a855f7;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#6b21a8;margin-bottom:6px;">🌍 地理专家风格</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">地理知识库 + 角色一致性</div>
<code style="font-size:0.78em;color:#a855f7;background:#f3e8ff;padding:2px 6px;border-radius:4px;">32650589</code>
</div>
</div>

<div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#a855f7;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#6b21a8;margin-bottom:6px;">💥 爆炸分身登场</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">技能改名 + 角色代号规范</div>
<code style="font-size:0.78em;color:#a855f7;background:#f3e8ff;padding:2px 6px;border-radius:4px;">7ab28393</code>
</div>
</div>

<div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#a855f7;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#6b21a8;margin-bottom:6px;">📅 周一到周日差异化</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">每个角色不同状态表达</div>
<code style="font-size:0.78em;color:#a855f7;background:#f3e8ff;padding:2px 6px;border-radius:4px;">1a235557</code>
</div>
</div>

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#3b82f6;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#1e40af;margin-bottom:6px;">🔔 双群通知支持</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">wuhao + wudu 同时推送</div>
<code style="font-size:0.78em;color:#3b82f6;background:#dbeafe;padding:2px 6px;border-radius:4px;">7b7b6ee7</code>
</div>
</div>

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#3b82f6;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#1e40af;margin-bottom:6px;">🔒 Webhook 环境变量</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">移除硬编码，安全加固</div>
<code style="font-size:0.78em;color:#3b82f6;background:#dbeafe;padding:2px 6px;border-radius:4px;">ab8ef62a</code>
</div>
</div>

<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#ea580c;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#9a3412;margin-bottom:6px;">📧 联系我们功能</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">表单 + 邮件通知</div>
<code style="font-size:0.78em;color:#ea580c;background:#ffedd5;padding:2px 6px;border-radius:4px;">b0329c91</code>
</div>
</div>

<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#ea580c;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#9a3412;margin-bottom:6px;">📬 企微群通知</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">contact 模块集成通知</div>
<code style="font-size:0.78em;color:#ea580c;background:#ffedd5;padding:2px 6px;border-radius:4px;">918c90ff</code>
</div>
</div>

<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#dc2626;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#991b1b;margin-bottom:6px;">🔧 刷新令牌修复</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">返回格式 + token_type</div>
<code style="font-size:0.78em;color:#dc2626;background:#fee2e2;padding:2px 6px;border-radius:4px;">3338d1b2</code>
</div>
</div>

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#059669;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#065f46;margin-bottom:6px;">📊 月报生成</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">Git 分析 + Excel 导出</div>
<code style="font-size:0.78em;color:#059669;background:#d1fae5;padding:2px 6px;border-radius:4px;">afb4e1a8</code>
</div>
</div>

<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 12px;position:relative;overflow:hidden;">
<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#7c3aed;border-radius:3px 0 0 3px;"></div>
<div style="padding-left:6px;">
<div style="font-size:0.78em;color:#581c87;margin-bottom:6px;">🛠️ 国际化完善</div>
<div style="font-size:0.75em;color:#64748b;margin-bottom:4px;">重命名 api_client + 后台翻译</div>
<code style="font-size:0.78em;color:#7c3aed;background:#f3e8ff;padding:2px 6px;border-radius:4px;">5b42ec85</code>
</div>
</div>

</div>
</div>

---

## 后续演进方向

<div style="background:linear-gradient(135deg,#f9fafb 0%,#f3f4f6 100%);border:1px solid #d1d5db;border-left:4px solid #6b7280;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1f2937;">
  <strong style="color:#374151;">规划中的第9期</strong>：持续完善 AI 角色系统、客户端自动更新推送、更多对话风格角色接入。
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:14px 0;">
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#15803d;margin-bottom:6px;">9.1 角色系统深化</div>
    <ul style="margin:0;padding-left:16px;font-size:0.82em;color:#334155;line-height:1.6;">
      <li>角色权限分级配置</li>
      <li>角色对话历史记忆</li>
      <li>角色知识库扩展</li>
    </ul>
  </div>
  <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#1d4ed8;margin-bottom:6px;">9.2 客户端自动更新</div>
    <ul style="margin:0;padding-left:16px;font-size:0.82em;color:#334155;line-height:1.6;">
      <li>S3 版本检测</li>
      <li>静默下载更新包</li>
      <li>热更新 vs 整包更新</li>
    </ul>
  </div>
  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px;">
    <div style="font-weight:700;font-size:0.88em;color:#b45309;margin-bottom:6px;">9.3 更多角色</div>
    <ul style="margin:0;padding-left:16px;font-size:0.82em;color:#334155;line-height:1.6;">
      <li>程序员型（代码解释）</li>
      <li>产品经理型（需求分析）</li>
      <li>测试工程师型（Bug 分析）</li>
    </ul>
  </div>
</div>

<br/>
<div style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
  如有问题, 请联系谷歌邮箱: <a href="mailto:wuhaotongxue@gmail.com" style="color:#3b82f6;">wuhaotongxue@gmail.com</a>
</div>
