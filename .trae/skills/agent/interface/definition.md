# Agent_接口定义规范

---

## 1. 核心定位

> 所有 Agent 必须遵循统一的输入输出接口标准，确保 Agent 可替换、可组合、可测试。

---

## 2. 标准化接口模型

### 2.1 Agent 基类定义

```typescript
/**
 * Agent 基类接口
 * 所有 Agent 必须实现此接口
 */
interface IAgent {
  // ============ 标识信息 ============
  readonly id: AgentId;           // Agent 唯一标识
  readonly name: string;          // Agent 名称
  readonly version: string;       // 版本号
  readonly category: AgentCategory; // 分类

  // ============ 核心方法 ============
  execute(input: AgentInput): Promise<AgentOutput>;
  validate(input: AgentInput): ValidationResult;
  get_capabilities(): AgentCapability[];

  // ============ 生命周期 ============
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}
```

### 2.2 输入输出结构

#### AgentInput (标准输入)

```typescript
interface AgentInput {
  // ============ 必需字段 ============
  task_id: string;                // 任务 ID (UUID)
  user_id: string;                 // 用户 ID
  intent: string;                  // 用户意图 (原始文本)
  timestamp: number;               // 时间戳 (毫秒)

  // ============ 上下文信息 ============
  context: {
    session_id: string;            // 会话 ID
    history: ConversationTurn[];   // 对话历史
    metadata: Record<string, any>; // 扩展元数据
  };

  // ============ 任务参数 ============
  params: {
    language?: string;             // 语言 (default: "zh")
    priority?: TaskPriority;       // 优先级
    deadline?: number;            // 超时时间戳
    options?: Record<string, any>; // 自定义选项
  };

  // ============ 权限信息 ============
  permissions: {
    role: UserRole;                // Guest | User | VIP | Admin
    quota_remaining: number;      // 剩余配额
    features: string[];           // 启用的功能列表
  };
}
```

#### AgentOutput (标准输出)

```typescript
interface AgentOutput {
  // ============ 执行结果 ============
  task_id: string;                 // 任务 ID
  status: ExecutionStatus;         // 执行状态
  result: any;                     // 执行结果

  // ============ 执行追踪 ============
  trace: {
    reasoning_chain: ReasoningStep[]; // 思考链
    tools_used: ToolCall[];            // 使用的工具
    duration_ms: number;              // 执行时长
  };

  // ============ 质量标记 ============
  quality: {
    confidence: number;            // 置信度 (0-1)
    needs_review: boolean;         // 是否需要审核
    watermark_required: boolean;   // 是否需要水印
  };

  // ============ 错误信息 (失败时) ============
  error?: {
    code: string;                  // 错误码
    message: string;              // 错误信息
    retryable: boolean;           // 是否可重试
  };
}
```

---

## 3. 类型定义

### 3.1 枚举类型

```typescript
// Agent 分类
type AgentCategory =
  | "meeting"    // 会议
  | "report"     // 报告
  | "chat"       // 对话
  | "media"      // 媒体
  | "admin"      // 管理
  | "search"     // 搜索
  | "coordinator"; // 编排器

// 执行状态
type ExecutionStatus =
  | "pending"    // 待执行
  | "running"    // 执行中
  | "success"    // 成功
  | "partial"    // 部分成功
  | "failed"     // 失败
  | "cancelled"; // 取消

// 任务优先级
type TaskPriority =
  | "low"        // 低
  | "normal"     // 普通
  | "high"       // 高
  | "urgent";    // 紧急

// 用户角色
type UserRole =
  | "guest"      // 访客
  | "user"       // 普通用户
  | "vip"        // VIP
  | "admin";     // 管理员
```

### 3.2 辅助类型

```typescript
// 思考链步骤
interface ReasoningStep {
  step: number;
  thought: string;        // 思考内容
  action?: string;        // 采取的行动
  observation?: string;   // 观察到的结果
  timestamp: number;
}

// 工具调用记录
interface ToolCall {
  tool_id: string;
  tool_name: string;
  parameters: Record<string, any>;
  result: any;
  status: "success" | "failed";
  duration_ms: number;
}

// 对话轮次
interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Agent 能力
interface AgentCapability {
  id: string;
  name: string;
  description: string;
  input_schema: object;   // JSON Schema
  output_schema: object;  // JSON Schema
  risk_level: RiskLevel;
}
```

---

## 4. 必需能力清单

### 4.1 每个 Agent 必须实现

| 能力 | 方法 | 说明 |
|------|------|------|
| **输入校验** | `validate()` | 校验输入合法性 |
| **能力查询** | `get_capabilities()` | 返回支持的能力列表 |
| **错误处理** | 返回 `error` 字段 | 失败时返回错误信息 |
| **执行追踪** | 返回 `trace` 字段 | 记录思考链和工具调用 |

### 4.2 Agent 分类能力

#### MeetingAgent

| 能力 ID | 输入 | 输出 |
|---------|------|------|
| `meeting.transcribe` | 音频文件 URL | 转录文本 |
| `meeting.summarize` | 转录文本 | 会议纪要 |
| `meeting.analyze` | 会议 ID | 分析报告 |

#### ReportAgent

| 能力 ID | 输入 | 输出 |
|---------|------|------|
| `report.weekly` | 日期范围 | 周报内容 |
| `report.git` | 仓库/用户 | Git 分析 |
| `report.export` | 报告 ID | 导出文件 |

#### MediaAgent

| 能力 ID | 输入 | 输出 |
|---------|------|------|
| `media.image.generate` | 描述文本 | 图片 URL |
| `media.video.generate` | 描述文本 | 视频 URL |
| `media.audio.synthesize` | 文本 | 音频 URL |

---

## 5. 验证规则

### 5.1 输入校验清单

| 字段 | 校验规则 |
|------|----------|
| `task_id` | 非空，UUID 格式 |
| `user_id` | 非空 |
| `intent` | 非空，最大 10000 字符 |
| `context.session_id` | 非空 |
| `permissions.role` | 必须在 UserRole 枚举内 |
| `params.deadline` | 大于当前时间戳 |

### 5.2 输出校验清单

| 字段 | 校验规则 |
|------|----------|
| `task_id` | 必须与输入一致 |
| `status` | 必须在 ExecutionStatus 枚举内 |
| `trace` | 必须包含 reasoning_chain |
| `quality.confidence` | 必须在 0-1 之间 |

---

## 6. 错误码规范

| 错误码 | 说明 | 是否可重试 |
|--------|------|------------|
| `INVALID_INPUT` | 输入参数错误 | 否 |
| `UNAUTHORIZED` | 未授权 | 否 |
| `QUOTA_EXCEEDED` | 配额超限 | 否 |
| `TOOL_NOT_FOUND` | 工具不存在 | 否 |
| `TOOL_EXECUTION_FAILED` | 工具执行失败 | 是 |
| `AGENT_TIMEOUT` | Agent 超时 | 是 |
| `CONTEXT_TOO_LONG` | 上下文超长 | 是 |
| `RATE_LIMITED` | 速率限制 | 是 |
| `INTERNAL_ERROR` | 内部错误 | 是 |

---

## 8. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>Agent 输出不含 trace 字段</li>
    <li>Agent 失败不返回 error 信息</li>
    <li>绕过 validate 直接执行</li>
    <li>硬编码 Agent ID 或名称</li>
    <li>输出不含 reasoning_chain</li>
  </ul>
</div>

---

## 9. 快速参考

| 配置项 | 说明 |
|--------|------|
| `max_intent_length` | 10000 字符 |
| `max_history_turns` | 50 轮 |
| `max_reasoning_steps` | 20 步 |
| `default_language` | zh |
| `default_priority` | normal |