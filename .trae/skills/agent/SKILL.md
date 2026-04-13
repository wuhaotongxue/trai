---
name: "agent_harness_engineering"
description: "用于规范 TRAI 项目中 Agent 智能体系统的工程实现。强制执行 Harness 五层架构：上下文装配、工具治理、安全规则、反馈状态、熵管理。"
---

# TRAI_Agent_Harness_Engineering

作为 TRAI 平台 Agent 工程规范的主入口，请严格按照 Harness Engineering 五层模型进行审查和实现。

---

## 1. 快速索引

| 子规范 | 路径 | 触发场景 |
|--------|------|----------|
| **Harness 五层架构** | | |
| 上下文工程 | `context/engineering.md` | 设计 Agent 上下文时 |
| 工具治理 | `tools/governance.md` | 注册/调用工具时 |
| 工具抽象层 | `tools/abstraction.md` | 工具解耦/可扩展设计 |
| 安全与规则 | `security/rules.md` | 定义 Agent 行为边界时 |
| 反馈与状态 | `state/feedback.md` | 设计 Agent 循环时 |
| 熵管理 | `entropy/management.md` | Agent 长周期运行时 |
| **多 Agent 协作** | | |
| 编排器总览 | `orchestrator/overview.md` | 编排器架构和职责 |
| 编排器与路由 | `orchestrator/router.md` | 多 Agent 任务编排 |
| 协作模式 | `collaboration/patterns.md` | 多 Agent 协作模式详解 |
| Agent 接口定义 | `interface/definition.md` | 定义 Agent 输入输出 |
| 通信协议 | `protocol/message.md` | Agent 间消息格式 |
| 消息路由 | `protocol/routing.md` | 消息路由规则 |
| 生命周期管理 | `lifecycle/management.md` | Agent 注册/健康检查/热更新 |
| **核心能力** | | |
| 思考链 | `reasoning/chain_of_thought.md` | 复杂任务推理 (复杂度>=5) |
| 纠错机制 | `reasoning/correction.md` | Agent 自我检测修正错误 |
| 用户反馈 | `feedback_user/user_feedback.md` | Bug报告/功能建议/联系我们 |
| 设计模式 | `patterns/design.md` | 新 Agent 设计 |
| **基础设施** | | |
| 监控指标 | `monitoring/metrics.md` | 性能监控和告警阈值 |
| 部署规范 | `deployment/pipeline.md` | 灰度发布和回滚策略 |
| 通知告警 | `notification/alert.md` | critical/warning/info 三级通知 |
| 月度配额 | `quota/management.md` | User AI 任务配额 |
| 速率限制 | `rate_limit/management.md` | API 端点限流 |
| 审计日志 | `audit/logging.md` | 安全操作审计 (PG+S3) |
| **媒体处理** | `media/*.md` | 音频/视频/图片/对话工具 |

---

## 2. 核心概念：Harness Engineering

> **Harness = Agent 运行时的工程环境总和**
>
> 如果说模型是智能体的"大脑"，那么 **Harness 就是它的飞控系统 + 黑匣子 + 地面管制台 + 测试台**。

### 2.1 五层架构

| 层级 | 核心问题 | TRAI 落地场景 |
|------|---------|--------------|
| **上下文装配** | 给模型什么信息？ | 会议/对话/音频/视频/图片上下文分层注入 |
| **工具治理** | 工具如何被暴露/拦截？ | 转录/翻译/生成/审核/录制 |
| **工具抽象层** | 工具如何解耦/可扩展？ | 三端 Adapter / Registry / 权限代理 |
| **安全与规则** | Agent 能做什么？ | RBAC / VIP 特权 / 水印跳过规则 |
| **反馈与状态** | Agent 如何持续做事？ | 工具执行结果回流，状态持久化 |
| **熵管理** | 如何防止系统腐烂？ | Rules/Skills 定期清理，上下文裁剪 |

### 2.2 三条闭环（核心架构）

> 参考 [Agent Harness 论文 2026](https://mp.weixin.qq.com/s/Ymy252ZBM98nKT1z4AYhMw)

#### 闭环一：执行闭环
```
目标输入 → 规划 → 调用模型 → 选择工具 → 执行环境反馈 → 修正计划 → 产出结果
```
**这是大家最熟悉的一条环**。

#### 闭环二：治理闭环（决定能不能上线）
```
动作申请 → 风险判断 → 权限校验 → 预算检查 → 审批/拒绝/降级 → 审计留痕
```
必须强制执行，禁止绕过。

#### 闭环三：评测闭环（决定能不能演进）
```
采集真实轨迹 → 建立基准集 → 回放执行 → 自动评分 → 对比版本 → 反哺提示词/工具/策略/模型选择
```

### 2.3 六大管控维度

| 维度 | 说明 | TRAI 落地 |
|------|------|----------|
| **能力边界** | 哪些工具可见、哪些参数可传、哪些动作需审批 | RBAC + 工具风险分级 |
| **执行环境** | 代码/浏览器/文件系统的运行时隔离 | Sandbox 容器化 |
| **上下文与状态** | 会话切分、记忆失效策略、敏感数据脱敏 | 上下文裁剪 + Token 上限 |
| **策略与审批** | allow / deny / ask 三态决策 | PolicyEngine |
| **遥测与可观测性** | trace_id / span_id / token 消耗 / 时延 | **OpenTelemetry** |
| **评测与回放** | 基准任务集、固定输入输出、版本回归对比 | Langfuse / Phoenix |

### 2.4 OpenTelemetry 可观测性规范

> Agent 问题排查必须从"看聊天记录"升级到"看分布式追踪"。

必须采集的数据：
- 每次模型调用的 `trace_id / span_id`
- 每次工具调用的输入、输出、耗时、错误类型
- 每个会话的 token、成本、时延、重试次数
- 每个动作的策略判定结果
- 每个任务的最终完成状态与失败归因

推荐集成方案：
- **Langfuse**：覆盖 tracing、metrics、evals、prompt 管理
- **Phoenix**：强调 OpenTelemetry-based tracing + evals + 回放
- **OpenLIT**：OpenTelemetry-native，LLM 可观测性 + GPU 监控

### 2.5 评测闭环规范

评测坚持三条原则：
1. 不只看最终答案，也看过程质量
2. 不只看离线样例，也看真实环境回放
3. 不只看平均分，也看失败模式

### 2.2 三大核心能力

| 能力 | 说明 |
|------|------|
| 思考链 | 复杂任务必须启用推理过程记录，复杂度 >= 5 触发 |
| 纠错机制 | 错误分类 + 针对性策略，权限/配额错误不可自我纠错 |
| 用户反馈 | Bug 报告/功能建议/联系我们，安全漏洞 P0 优先处理 |

---

## 3. RBAC 角色体系

| 角色 | 权限 |
|------|------|
| **Guest** | 仅基础只读功能 |
| **User** | 基础功能 + 月度配额限制 + 必须水印 |
| **VIP** | 去除水印 + 无限配额 + 跳过审核 (图片审核除外) |
| **Admin** | 全部功能开放 |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>禁止把安全边界寄托在提示词上 (必须落在运行时)</li>
    <li>禁止工具没有治理 (裸 call 而无校验/分级/拦截)</li>
    <li>禁止 AI 生成内容不经过审核和水印直接展示</li>
    <li>禁止 VIP 水印跳过逻辑硬编码 (必须在 RBAC 层统一管理)</li>
    <li>禁止 Agent 输出不透明 (所有决策必须可追溯，必须有 trace_id)</li>
    <li>禁止长任务无 checkpoint (会话恢复依赖状态持久化)</li>
    <li>禁止 Rules/Skills 无限膨胀 (必须有熵管理机制)</li>
    <li>禁止 AI 生成任务无月度配额 (User 必须有配额限制)</li>
    <li>禁止 API 端点无速率限制 (必须 global/user/endpoint 三层限流)</li>
    <li>禁止 Agent 生产环境无 OpenTelemetry 追踪 (必须采集 trace_id/span_id)</li>
    <li>禁止 Agent 升级不做回归验证 (必须基于 benchmark 回放对比)</li>
  </ul>
</div>

---

## 5. 目录结构

```
agent/
├── SKILL.md                    # 主入口
├── context/
│   └── engineering.md           # 上下文工程
├── tools/
│   ├── governance.md           # 工具治理
│   └── abstraction.md          # 工具抽象层
├── security/
│   └── rules.md                # 安全与规则
├── state/
│   └── feedback.md             # 反馈与状态
├── entropy/
│   └── management.md           # 熵管理
├── orchestrator/               # 多 Agent 编排
│   ├── overview.md            # 编排器总览
│   └── router.md              # 编排器与路由
├── collaboration/              # 多 Agent 协作
│   └── patterns.md            # 协作模式详解
├── interface/                   # Agent 接口标准
│   └── definition.md          # 输入输出定义
├── protocol/                    # 通信协议
│   ├── message.md             # 消息格式
│   └── routing.md             # 消息路由
├── lifecycle/                   # 生命周期管理
│   └── management.md          # 注册/健康检查/热更新
├── reasoning/
│   ├── chain_of_thought.md     # 思考链
│   └── correction.md           # 纠错机制
├── feedback_user/
│   └── user_feedback.md        # 用户反馈
├── patterns/
│   └── design.md               # 设计模式
├── monitoring/
│   └── metrics.md              # 监控指标
├── deployment/
│   └── pipeline.md             # 部署规范
├── notification/
│   └── alert.md                # 通知告警
├── quota/
│   └── management.md           # 月度配额
├── rate_limit/
│   └── management.md           # 速率限制
├── audit/
│   └── logging.md              # 审计日志
└── media/
    ├── index.md                # 媒体处理索引
    ├── image.md                # 图片处理
    ├── audio/
    │   ├── index.md
    │   ├── overview.md
    │   ├── synthesis.md
    │   ├── transcribe.md
    │   ├── recording.md
    │   ├── stream.md
    │   ├── rules.md
    │   └── context.md
    ├── video/
    │   ├── index.md
    │   ├── overview.md
    │   ├── generate.md
    │   ├── stream.md
    │   ├── recording.md
    │   ├── screenshot.md
    │   ├── rules.md
    │   └── context.md
    └── chat/
        ├── index.md
        ├── overview.md
        ├── message.md
        ├── translate.md
        ├── summarize.md
        ├── reply.md
        ├── group.md
        ├── moderate.md
        ├── rules.md
        └── context.md
```

---

## 6. 目录结构

```
agent/
├── SKILL.md                    # 主入口
├── context/
│   └── engineering.md           # 上下文工程
├── tools/
│   ├── governance.md           # 工具治理
│   └── abstraction.md          # 工具抽象层
├── security/
│   └── rules.md                # 安全与规则
├── state/
│   └── feedback.md             # 反馈与状态
├── entropy/
│   └── management.md           # 熵管理
├── orchestrator/               # 多 Agent 编排
│   ├── overview.md            # 编排器总览
│   └── router.md              # 编排器与路由
├── collaboration/              # 多 Agent 协作
│   └── patterns.md            # 协作模式详解
├── interface/                   # Agent 接口标准
│   └── definition.md          # 输入输出定义
├── protocol/                    # 通信协议
│   ├── message.md             # 消息格式
│   └── routing.md             # 消息路由
├── lifecycle/                   # 生命周期管理
│   └── management.md          # 注册/健康检查/热更新
├── reasoning/
│   ├── chain_of_thought.md     # 思考链
│   └── correction.md           # 纠错机制
├── feedback_user/
│   └── user_feedback.md        # 用户反馈
├── patterns/
│   └── design.md               # 设计模式
├── monitoring/                  # ⚠️ 重点：可观测性
│   ├── metrics.md              # 监控指标
│   └── observability.md        # OpenTelemetry 集成规范
├── deployment/
│   └── pipeline.md             # 部署规范
├── notification/
│   └── alert.md                # 通知告警
├── quota/
│   └── management.md           # 月度配额
├── rate_limit/
│   └── management.md           # 速率限制
├── audit/
│   └── logging.md              # 审计日志
└── media/
    ├── index.md                # 媒体处理索引
    ├── image.md                # 图片处理
    ├── audio/
    │   ├── index.md
    │   ├── overview.md
    │   ├── synthesis.md
    │   ├── transcribe.md
    │   ├── recording.md
    │   ├── stream.md
    │   ├── rules.md
    │   └── context.md
    ├── video/
    │   ├── index.md
    │   ├── overview.md
    │   ├── generate.md
    │   ├── stream.md
    │   ├── recording.md
    │   ├── screenshot.md
    │   ├── rules.md
    │   └── context.md
    └── chat/
        ├── index.md
        ├── overview.md
        ├── message.md
        ├── translate.md
        ├── summarize.md
        ├── reply.md
        ├── group.md
        ├── moderate.md
        ├── rules.md
        └── context.md
```

---

## 7. 版本管理

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v2.4 | 2026-04-10 | 融合 Agent Harness 2026 论文：三条闭环、OpenTelemetry 可观测性、评测回放规范 |
| v2.3 | 2026-04-08 | 新增协作模式和生命周期管理文档，完善多 Agent 协作模块 |
| v2.2 | 2026-04-08 | 新增多 Agent 协作模块：编排器、接口定义、通信协议、消息路由 |
| v2.1 | 2026-04-08 | 重构所有子模块，统一使用 HTML 卡片展示禁止/允许规则 |
| v2.0 | 2026-04-08 | 重构所有文档，删除代码示例，统一使用表格和 HTML 卡片 |
| v1.3 | 2026-04-07 | 新增监控/部署/通知规范，精简所有文档 |
| v1.2 | 2026-04-07 | 新增用户反馈规范 |
| v1.1 | 2026-04-07 | 新增思考链和纠错机制规范 |
| v1.0 | 2026-04-01 | 初版发布 |

---

## 8. 参考资料

> 来源：[Agent Harness 与 Harness Engineering：从把智能体跑起来，到把智能体管起来](https://mp.weixin.qq.com/s/Ymy252ZBM98nKT1z4AYhMw)

| 资源 | 链接 | 用途 |
|------|------|------|
| Langfuse | https://github.com/langfuse/langfuse | LLM 可观测性、tracing、evals |
| Phoenix | https://github.com/Arize-ai/phoenix | OpenTelemetry tracing + 回放 |
| OpenLIT | https://github.com/openlit/openlit | OpenTelemetry-native LLM 监控 |
| LiteLLM | https://github.com/BerriAI/litellm | 模型路由、成本追踪、负载均衡 |
| OpenTelemetry GenAI | https://opentelemetry.io/docs/specs/semconv/gen-ai/ | GenAI 语义约定标准 |
| BrowserGym | https://github.com/ServiceNow/BrowserGym | Web Agent benchmark + 回放 |
| OpenHands | https://github.com/All-Hands-AI/OpenHands | 软件工程 Agent 评测基座 |
| AIO Sandbox | https://github.com/agent-infra/sandbox | 统一工作区沙箱 |
