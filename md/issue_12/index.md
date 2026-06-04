<!-- Author: wuhao Date: 2026-05-23 -->
# TRAI 第12期: 下一代勘探蓝图 (多智能体与私有矿脉)

<div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a8a;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 规划下一代 TRAI 架构蓝图, 聚焦多智能体协同管线、用户自建 Agent、私有知识库 RAG 与全链路追踪系统, 打造企业级 AI 协作平台。
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_12/index.md</code>
  <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1;">
    📋 <strong>上期节点</strong>: <a href="https://gitee.com/no5689/trai/commit/adc769fc7e2352194e2bfa335463712f7d0f23d0" target="_blank" style="color:#2563eb;">Gitee</a> | <a href="https://github.com/wuhaotongxue/trai/commit/adc769fc7e2352194e2bfa335463712f7d0f23d0" target="_blank" style="color:#2563eb;">GitHub</a> · <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">adc769fc</code> · 2026-05-23 16:52:32 +0800
  </div>
  <div style="margin-top:6px;">
    🎯 <strong>本期节点</strong>: <a href="https://gitee.com/no5689/trai/commit/9d92a9ef555ea4aafa49d80eef7047092ef09f20" target="_blank" style="color:#2563eb;">Gitee</a> | <a href="https://github.com/wuhaotongxue/trai/commit/9d92a9ef555ea4aafa49d80eef7047092ef09f20" target="_blank" style="color:#2563eb;">GitHub</a> · <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">9d92a9ef</code> · 2026-05-24 13:03:15 +0800
  </div>
  <div style="margin-top:6px;">
    📐 <strong>本期范围</strong>: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log adc769fc..9d92a9ef</code>
  </div>
</div>

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">预览配色</strong>: 彩色块写法与 <code>.cursor/skills/project/SKILL.md</code> 一致, 使用内联 <code>style</code>, 避免在 <code>&lt;div&gt;</code> 开头与正文之间插入<strong>空行</strong> (否则预览会把 <code>&lt;/div&gt;</code> 当成普通文字).
</div>

## 这次更新做了什么

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">AI 遥测与追踪</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">引入全链路 AI 遥测与追踪系统, 记录 Token 消耗、工具调用轨迹与会话回放, 实现可观测性闭环.</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">多智能体架构</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">升级为多智能体协同管线, 包含 Router Agent 总指挥与多个专业 Worker Agents, 实现任务拆解与并行执行.</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">私有知识库 RAG</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">支持用户自建知识库, 通过向量数据库实现企业内部知识的智能检索与生成, 消除大模型幻觉.</p>
</div>

### 1. 地壳波动监测与断层回溯 (AI 对话与全链路追踪)

<div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;padding:12px 16px;margin:14px 0;color:#0e7490;">
  <strong style="color:#0e7490;">全链路追踪</strong>: 确保勘探设备的每一次震动都可追溯, 引入全链路的 AI 遥测与追踪系统.
</div>

#### 1.1 Token 消耗监控

**实现方案**:
- 在 `conversation_manager.py` 中集成 Token 计数器
- 记录每一次请求的 Prompt Tokens 和 Completion Tokens
- 支持按会话、用户、模型维度统计
- 实时更新 Token 使用量到数据库

**API 接口设计**:
```
POST /api/v1/tracking/token/record
{
  "session_id": "uuid",
  "prompt_tokens": 1500,
  "completion_tokens": 800,
  "model": "deepseek-chat",
  "cost_usd": 0.0023
}
```

**数据库表结构**:
```sql
CREATE TABLE token_usage (
    id UUID PRIMARY KEY,
    session_id UUID,
    user_id UUID,
    model VARCHAR(100),
    prompt_tokens INT,
    completion_tokens INT,
    cost_usd DECIMAL(10,6),
    created_at TIMESTAMP
);
```

#### 1.2 工具调用轨迹

**实现方案**:
- 在 `agent_executor.py` 中添加调用链记录
- 使用 OpenTelemetry 追踪工具调用链路
- 记录每个工具调用的输入参数、输出结果、耗时
- 支持可视化展示调用链

**调用链数据结构**:
```python
class ToolCallTrace(BaseModel):
    tool_name: str
    parameters: dict
    result: Any
    duration_ms: int
    timestamp: datetime
    error: Optional[str]
```

#### 1.3 会话回放机制

**实现方案**:
- 将完整对话历史存储到时序数据库
- 支持按时间戳回放整个对话过程
- 记录中间思考步骤和工具调用
- 支持导出对话日志用于审计

**回放 API**:
```
GET /api/v1/sessions/{session_id}/replay?start_time=xxx&end_time=xxx
```

### 2. 多矿脉协同开采 (多智能体 / Multi-Agent 架构)

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">协同管线</strong>: 单兵作战的勘探车已经无法满足复杂地貌的需求, 升级为多智能体协同管线.
</div>

#### 2.1 Router Agent (总指挥)

**核心职责**:
- 接收用户指令并解析意图
- 将复杂任务拆解为子任务
- 分配任务给合适的 Worker Agent
- 汇总子任务结果并返回给用户

**任务拆解算法**:
```python
class TaskRouter:
    def analyze_task(self, task: str) -> TaskAnalysis:
        # 使用 LLM 分析任务类型和复杂度
        # 返回任务拆解结果和优先级
    
    def assign_agent(self, subtask: SubTask) -> AgentType:
        # 根据子任务类型选择最合适的 Agent
        # 考虑 Agent 负载和能力匹配度
```

#### 2.2 Worker Agents (专业钻探手)

**Researcher Agent**:
- 专职联网爬取资料
- 支持百度、Bing、360 多搜索引擎
- 智能摘要和信息提取
- 数据溯源和来源标注

**Media Agent**:
- 专职调度显卡生成音乐和视频
- 管理 GPU 资源分配
- 处理多媒体生成任务队列
- 支持多种媒体格式输出

**Reviewer Agent**:
- 负责质检生成的媒体内容
- 评估内容质量和合规性
- 提供改进建议
- 支持人工复核流程

#### 2.3 状态共享与黑板机制 (State Graph)

**实现方案**:
- 使用 Redis 作为共享内存
- 支持多 Agent 并发读写
- 实现乐观锁避免数据冲突
- 状态变更事件通知机制

**状态数据结构**:
```python
class SharedState(BaseModel):
    task_id: str
    stage: TaskStage
    progress: float
    artifacts: List[Artifact]
    last_updated: datetime
```

### 3. 自助式勘探机器人车间 (用户自建 Agent / Agent Builder)

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong style="color:#6d28d9;">专属定制</strong>: 赋予用户打造专属勘探设备的能力, 支持可视化编排与技能挂载.
</div>

#### 3.1 可视化编排 UI

**前端组件设计**:
- 拖拽式画布编辑器
- 节点连接和流程连线
- 实时预览执行流程
- 支持撤销/重做操作

**组件架构**:
```
AgentBuilder
├── Canvas (画布组件)
│   ├── NodeComponent (节点)
│   ├── ConnectionComponent (连接线)
│   └── Toolbar (工具栏)
├── PropertyPanel (属性面板)
└── PreviewPanel (预览面板)
```

#### 3.2 角色与人设定义

**人设配置项**:
- 角色名称和描述
- System Prompt 模板
- 语气和风格设定
- 专业领域限定

**Prompt 模板引擎**:
```python
class PromptTemplateEngine:
    def render(self, template: str, variables: dict) -> str:
        # 支持模板变量替换
        # 提供常用变量如 {{user_name}}, {{current_time}}
```

#### 3.3 技能挂载系统

**技能市场设计**:
- 分类展示可用技能
- 技能详情和使用说明
- 一键挂载到 Agent
- 支持技能组合和排序

**技能接口规范**:
```python
class AgentSkill(Protocol):
    name: str
    description: str
    parameters: List[Parameter]
    
    async def execute(self, params: dict, context: ExecutionContext) -> SkillResult:
        ...
```

#### 3.4 发布与分享

**发布流程**:
- 验证 Agent 配置完整性
- 生成 Agent 唯一标识
- 存储到 Agent 仓库
- 通知相关用户

**权限控制**:
- 私有 Agent (仅自己可见)
- 团队共享 (团队成员可见)
- 公开分享 (所有用户可见)

### 4. 专属私有矿脉图库 (用户自建知识库 / RAG)

<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:14px 0;color:#92400e;">
  <strong style="color:#b45309;">知识沉淀</strong>: 让 AI 掌握企业内部的绝密地质数据, 构建私有知识图谱.
</div>

#### 4.1 多模态文件解析

**支持文件类型**:
- PDF 文档解析
- Word 文档处理
- Excel 表格提取
- Markdown 文件支持
- 图片 OCR 识别

**解析流程**:
```
文件上传 → 格式检测 → 内容提取 → 文本清洗 → 分片存储
```

#### 4.2 向量化与存储 (Embedding)

**向量数据库选择**:
- Milvus (大规模向量检索)
- pgvector (PostgreSQL 扩展)
- RedisVL (Redis 向量搜索)

**向量化流程**:
```python
class DocumentVectorizer:
    def chunk_document(self, text: str) -> List[str]:
        # 文档切片，保持语义完整性
    
    def generate_embedding(self, chunks: List[str]) -> List[np.ndarray]:
        # 使用 SentenceTransformer 生成向量
    
    def store_vectors(self, vectors: List[np.ndarray], metadata: dict):
        # 存储到向量数据库
```

#### 4.3 混合检索生成 (RAG)

**检索策略**:
- 向量相似度检索
- 关键词匹配检索
- 混合检索融合

**RAG 流程**:
```
用户提问 → 向量化 → 向量检索 → 文档匹配 → 上下文构建 → LLM 生成
```

#### 4.4 权限隔离 (Tenant Isolation)

**多租户架构**:
- 租户级数据隔离
- 用户级权限控制
- 角色权限管理
- 数据加密存储

**访问控制矩阵**:
| 角色 | 查看知识库 | 上传文件 | 修改配置 | 管理用户 |
|------|----------|----------|----------|----------|
| 管理员 | ✓ | ✓ | ✓ | ✓ |
| 编辑者 | ✓ | ✓ | ✓ | ✗ |
| 查看者 | ✓ | ✗ | ✗ | ✗ |

### 5. 架构设计与技术选型

<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 16px;margin:14px 0;color:#581c87;">
  <strong style="color:#7c3aed;">技术底座</strong>: 选择合适的技术栈支撑下一代架构.
</div>

#### 5.1 后端技术栈

| 组件 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 语言 | Python | 3.13 | 生态成熟, AI 库丰富 |
| 框架 | FastAPI | 0.110 | 高性能, 异步支持 |
| ORM | SQLAlchemy | 2.0 | 成熟稳定, 类型安全 |
| 向量数据库 | Milvus | 2.4 | 大规模向量检索 |
| 缓存 | Redis | 7.2 | 高性能缓存和消息队列 |

#### 5.2 前端技术栈

| 组件 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 框架 | React | 19 | 生态成熟, 性能优秀 |
| 构建 | Vite | 6.5 | 快速构建, 热更新 |
| UI | shadcn/ui | latest | 高质量组件库 |
| 状态管理 | Zustand | 4.5 | 轻量级状态管理 |

#### 5.3 部署架构

```
┌─────────────────────────────────────────────────────┐
│                    负载均衡层                        │
│              Nginx / Cloud Load Balancer            │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  API Node   │  │  API Node   │  │  API Node   │
└─────────────┘  └─────────────┘  └─────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
            ┌─────────────────────┐
            │     PostgreSQL      │
            └─────────────────────┘
            ┌─────────────────────┐
            │      Milvus         │
            └─────────────────────┘
            ┌─────────────────────┐
            │       Redis         │
            └─────────────────────┘
```

### 6. 安全与合规

<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:14px 0;color:#991b1b;">
  <strong style="color:#b91c1c;">安全加固</strong>: 保障系统安全性和数据隐私.
</div>

#### 6.1 数据加密

- 传输加密: HTTPS/TLS 1.3
- 存储加密: AES-256 加密敏感数据
- 密钥管理: 使用密钥管理服务 (KMS)

#### 6.2 访问控制

- OAuth 2.0 + JWT 认证
- RBAC 角色权限控制
- API 速率限制
- 异常行为检测

#### 6.3 审计日志

- 操作日志记录
- 访问日志审计
- 安全事件追踪
- 合规报告生成

## 本期 Git 摘要 (按主题)

| 主题 | 内容要点 |
|------|----------|
| 全链路追踪 | Token 消耗监控、工具调用轨迹、会话回放机制、OpenTelemetry 集成 |
| 多智能体架构 | Router Agent、Worker Agents、状态共享黑板机制、任务拆解算法 |
| Agent Builder | 可视化编排 UI、角色人设定义、技能挂载与分享、多租户权限 |
| 私有知识库 | 多模态文件解析、向量化存储、RAG 混合检索、权限隔离 |
| 技术架构 | FastAPI、Milvus、Redis、React、shadcn/ui 技术栈 |
| 安全合规 | 数据加密、访问控制、审计日志、RBAC 权限管理 |

## 下一步方向

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">续写第 13 期时</strong>: 用 <code>git log -1 -- md/issue_12/index.md</code> 取本期入库提交作新锚点, 再拉 <code>git log</code> 写 <code>md/issue_13/index.md</code>.
</div>

- 实现全链路追踪系统的核心功能, 集成 OpenTelemetry.
- 开发多智能体协同管线的 MVP 版本, 支持任务拆解与分配.
- 完成 Agent Builder 的前端可视化编排界面开发.
- 搭建私有知识库 RAG 的技术底座, 集成 Milvus 向量数据库.
- 实现多租户权限隔离机制, 保障数据安全.

---

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <em>编写说明: 本期为规划阶段内容, 状态: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">Planning</code>. 如有问题, 请联系邮箱: wuhaotongxue@gmail.com.</em>
</div>
