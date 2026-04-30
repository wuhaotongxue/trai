# TRAI Agent 智能体实现文档

## 1. 架构概览

TRAI Agent 是一个基于大模型的智能助手系统，支持多轮对话、工具调用、自我纠错和知识库增强。

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                  │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ FloatingWidget  │    │         AgentStore (Zustand)         │ │
│  │ (悬浮助手组件)   │    │  - messages / sessions / quotas       │ │
│  └────────┬────────┘    └──────────────────┬──────────────────┘ │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │         HTTP / WebSocket          │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     API Layer (FastAPI)                      ││
│  │                    /api/v1/agent/chat                       ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │              Orchestrator (编排器)                            ││
│  │                   - AgentRouter                              ││
│  │                   - 根据意图路由到不同 Agent                    ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │               AgentExecutor (执行器)                          ││
│  │  - 多轮工具调用循环                                           ││
│  │  - 自我纠错 (SelfCorrector)                                  ││
│  │  - 配额控制 (QuotaService)                                    ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                  ToolGovernor (工具治理器)                    ││
│  │  - 风险等级检查                                              ││
│  │  - 权限验证                                                  ││
│  │  - 配额校验                                                  ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                  ToolRegistry (工具注册表)                    ││
│  │  - calculator / translate / search / weather / wecom / ...   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心组件

### 2.1 Orchestrator (编排器)

**文件**: `backend/src/infrastructure/agent/orchestrator/router.py`

负责根据用户输入自动路由到最合适的 Agent。

```python
class AgentRouter:
    """Agent 路由分发器"""
    
    async def route(self, query: str) -> str:
        # 使用 LLM 判断用户意图
        # 从 _MOCK_AGENTS 列表中选择最匹配的 Agent ID
        prompt = f"""
你是一个智能路由系统. 请根据用户的输入, 
从下面的 Agent 列表中选择一个最适合处理该请求的 Agent ID.
...
"""
        response = await self.ai_client.chat(messages=[...], model="gpt-4o-mini")
        return selected_id
```

**内置 Agents**:

| ID | 名称 | 描述 |
|----|------|------|
| `agent-default` | 默认 | 全能型助手 |
| `agent-001` | 代码助手 | 代码编写和审查 |
| `agent-002` | 设计大师 | 文生图提示词优化 |

### 2.2 AgentExecutor (执行器)

**文件**: `backend/src/infrastructure/agent/executor.py`

核心执行器，管理多轮工具调用循环。

```python
class AgentExecutor:
    MAX_TURNS = 10  # 最多 10 轮对话
    
    async def execute(self, messages, context, stream=False):
        # 1. 设置 Agent 系统提示词
        # 2. 循环执行直到结束:
        while turn < MAX_TURNS:
            # 调用 AI 获取响应
            ai_response = await self._call_ai(messages)
            
            # 如果有工具调用，执行工具
            if tool_calls:
                for tool_call in tool_calls:
                    result = await self._execute_tool(tool_call)
                    messages.append(tool_result)
            else:
                # 没有工具调用，返回结果
                return final_response
```

### 2.3 SelfCorrector (自我纠错器)

**文件**: `backend/src/infrastructure/agent/self_corrector.py`

根据错误类型自动纠错。

```python
class SelfCorrector:
    """
    错误分类 → 对应策略:
    - quota / permission / validation → reject (直接拒绝)
    - rate_limit → retry_with_backoff (退避重试)
    - tool_execution → retry → alternative → rollback
    - business_logic → rollback
    - external → retry
    - system → escalate (升级通知)
    """
```

### 2.4 ErrorClassifier (错误分类器)

**文件**: `backend/src/infrastructure/agent/error_classifier.py`

将异常映射为结构化错误类型。

```python
class ErrorCategory(StrEnum):
    VALIDATION = "validation"
    PERMISSION = "permission"
    QUOTA = "quota"
    RATE_LIMIT = "rate_limit"
    TOOL_EXECUTION = "tool_execution"
    BUSINESS_LOGIC = "business_logic"
    EXTERNAL = "external"
    SYSTEM = "system"
```

### 2.5 ToolGovernors (工具治理器)

**文件**: `backend/src/infrastructure/agent/tools/governor.py`

工具执行前的安全检查。

```python
class ToolGovernor:
    """工具治理器"""
    
    async def execute(self, tool, params, context):
        # 1. 风险等级检查
        # 2. 权限验证
        # 3. 配额校验
        # 4. 执行工具
        # 5. 记录审计日志
```

### 2.6 ToolRegistry (工具注册表)

**文件**: `backend/src/infrastructure/agent/tools/registry.py`

统一管理所有工具的注册和调用。

```python
class ToolRegistry:
    """工具注册表 - 全局单例"""
    
    def register(self, tool: BaseTool):
        """注册工具"""
        
    def get_tool(self, tool_id: str) -> BaseTool:
        """获取工具实例"""
        
    def get_tools_by_category(self, category: ToolCategory):
        """按分类获取工具"""
```

---

## 3. 工具系统

### 3.2 联网搜索工具 (SearchTool)

**文件**: `backend/src/infrastructure/agent/tools/search.py`

基于 DuckDuckGo 实现的无广告隐私搜索。

```python
from duckduckgo_search import DDGS

class SearchTool(BaseTool):
    """搜索工具"""

    FORBIDDEN_PATTERNS = [
        "password", "token", "secret", "key",
        "eval(", "exec(", "import ", "open(",
        ".exe", ".dll", ".bat",
    ]

    @property
    def definition(self) -> ToolDefinition:
        return ToolDefinition(
            id="utility_search",
            name="联网搜索",
            description="搜索互联网上的相关信息,返回标题、摘要和链接",
            category=ToolCategory.UTILITY,
            risk_level=RiskLevel.MONITORED,
            parameters=[
                ToolParameter(name="query", description="搜索关键词", type="string", required=True),
            ],
            monthly_quota_check=True,
            audit_log=True,
        )

    async def execute(self, params: dict, context: ExecutionContext) -> ToolCallResult:
        query = params.get("query", "")

        # 1. 敏感词过滤
        for pattern in self.FORBIDDEN_PATTERNS:
            if pattern in query.lower():
                return ToolCallResult(success=False, error="搜索内容包含敏感词,已被拦截")

        # 2. 执行搜索
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=self._max_results))

        # 3. 格式化返回
        if not results:
            return ToolCallResult(success=True, output="未找到相关结果")

        output = " ||| ".join([
            f"{r['title']}({r['href']}): {r['body'][:300]}"
            for r in results
        ])
        return ToolCallResult(success=True, output=output)
```

**特性**:
- 🔒 **安全过滤**: 敏感词检测 (`password`, `token`, `eval` 等)
- 🦆 **DuckDuckGo**: 无追踪、无广告隐私搜索
- 📝 **摘要提取**: 返回标题 + 链接 + 前 300 字符摘要
- 📊 **结果限制**: 默认最多 3 条结果

### 3.3 其他内置工具

| 工具 ID | 名称 | 分类 | 风险等级 |
|---------|------|------|----------|
| `calculator` | 计算器 | utility | safe |
| `translate` | 翻译 | utility | safe |
| `weather` | 天气 | utility | safe |
| `wecom_contact` | 企业微信联系人 | notification | monitored |

### 3.2 工具基类

```python
class BaseTool(ABC):
    """工具基类 - 所有工具必须继承此类"""
    
    @property
    @abstractmethod
    def definition(self) -> ToolDefinition:
        """返回工具定义"""
        
    @abstractmethod
    async def execute(self, params: dict, context: ExecutionContext) -> ToolCallResult:
        """执行工具"""
```

### 3.3 工具定义

```python
@dataclass
class ToolDefinition:
    id: str                           # 工具唯一标识
    name: str                         # 工具名称
    description: str                  # 工具描述
    category: ToolCategory            # 分类
    risk_level: RiskLevel             # 风险等级
    parameters: list[ToolParameter]  # 参数定义
    monthly_quota_check: bool = True  # 是否检查月度配额
    audit_log: bool = True            # 是否记录审计日志
```

---

## 4. 前端实现

### 4.1 FloatingWidget (悬浮助手)

**文件**: `frontend_next/src/components/website/floating_widget.tsx`

官网悬浮组件，支持最小化/最大化/新窗口打开。

```tsx
// 功能特性:
// - 官网页面右下角悬浮按钮
// - 点击展开对话窗口
// - 支持最大化/还原
// - 支持新窗口打开
// - 与 AgentStore 同步状态
```

### 4.2 AgentStore (状态管理)

**文件**: `frontend_next/src/stores/agent.store.ts`

使用 Zustand 管理 Agent 对话状态。

```typescript
interface AgentState {
  sessionId: string | null      // 会话 ID
  messages: Message[]             // 消息列表
  sessions: SessionItem[]        // 会话列表
  isStreaming: boolean            // 是否流式传输
  quotas: QuotaStatus[]           // 配额状态
  activeToolCall: ToolCallActive  // 活动工具调用
}
```

### 4.3 API 客户端

**文件**: `frontend_next/src/lib/api_client.ts`

封装 Agent 对话 API。

```typescript
// 核心方法:
// - sendAgentMessage()    发送消息
// - getAgentSessions()    获取会话列表
// - createAgentSession()  创建会话
// - deleteAgentSession()  删除会话
```

---

## 5. API 路由

**文件**: `backend/src/api/routers/ai/agent.py`

| 路由 | 方法 | 描述 |
|------|------|------|
| `/agent/chat` | POST | Agent 对话（支持流式） |
| `/agent/tools` | GET | 获取可用工具列表 |
| `/agent/tools/call` | POST | 手动调用工具 |
| `/agent/sessions` | GET/POST/DELETE | 会话管理 |

---

## 6. 执行流程

### 6.1 用户发送消息

```
1. 用户在 FloatingWidget 输入消息
2. AgentStore.sendAgentMessage() 发送请求
3. Backend API 接收请求
```

### 6.2 Agent 路由

```
1. Orchestrator.route() 分析用户意图
2. 从 _MOCK_AGENTS 选择匹配的 Agent
3. 设置该 Agent 的系统提示词
```

### 6.3 多轮执行循环

```
for turn in range(MAX_TURNS):
    1. AgentExecutor._call_ai() 调用 LLM
    2. 检查是否有 tool_calls
    3. 如有工具调用:
       a. ToolGovernor.execute() 治理检查
       b. ToolRegistry.get_tool() 获取工具
       c. tool.execute() 执行工具
       d. 将结果添加到消息历史
    4. 如无工具调用，返回最终结果
```

### 6.4 自我纠错

```
1. 捕获异常
2. ErrorClassifier.classify() 分类错误
3. SelfCorrector.handle() 根据错误类型纠错
   - 可纠错: 重试 / 退避重试 / 回滚
   - 不可纠错: 拒绝 / 升级通知
```

### 6.5 返回结果

```
1. AgentExecutor 返回最终响应
2. 记录审计日志
3. 更新配额使用量
4. 流式/非流式返回给前端
```

---

## 7. 知识库增强 (RAG)

当用户选择知识库时:

```python
if request.knowledge_base_id:
    # 1. 调用百炼知识库 API 检索
    svc = KnowledgeBaseDemoService()
    client, m, wid = svc._create_bailian_client()
    req = m.RetrieveRequest(index_id=request.knowledge_base_id, query=request.message)
    result = client.retrieve(req)
    
    # 2. 将检索结果拼接到系统提示词
    rag_context = "\n".join([node.text for node in result.result.nodes])
    
    # 3. 返回来源信息
    sources = KnowledgeBaseSourceExtractor.extract(result.result.nodes)
```

---

## 8. 配额系统

```python
# 执行前检查配额
self._ensure_quota()
quota_service.check_quota(user_id, "chat")

# 执行后扣减配额
quota_service.consume(user_id, "chat", tokens_used)
```

---

## 9. 审计日志

所有工具调用都会记录审计日志:

```python
# ToolGovernor.execute() 中
if tool.definition.audit_log:
    await self._write_audit_log(
        user_id=context.user_id,
        tool_id=tool.definition.id,
        params=params,
        result=result,
    )
```

---

## 10. 目录结构

```
backend/src/
├── api/routers/ai/
│   ├── agent.py           # Agent API 路由
│   └── management.py      # Agent 注册管理
│
├── infrastructure/agent/
│   ├── orchestrator/
│   │   └── router.py      # 编排器与路由
│   ├── executor.py         # Agent 执行器
│   ├── self_corrector.py  # 自我纠错器
│   ├── error_classifier.py # 错误分类器
│   └── tools/
│       ├── base.py        # 工具基类
│       ├── registry.py    # 工具注册表
│       ├── governor.py    # 工具治理器
│       ├── loader.py      # 工具加载器
│       ├── calculator.py  # 计算器工具
│       ├── translate.py   # 翻译工具
│       ├── search.py      # 搜索工具
│       ├── weather.py     # 天气工具
│       └── wecom_contact.py # 企业微信工具

frontend_next/src/
├── components/website/
│   └── floating_widget.tsx  # 悬浮助手组件
├── stores/
│   └── agent.store.ts      # Agent 状态管理
└── lib/
    └── api_client.ts        # API 客户端
```
