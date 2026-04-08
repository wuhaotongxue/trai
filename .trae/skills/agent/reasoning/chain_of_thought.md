# Agent - 思考链 (Chain of Thought) 规范

---

## 1. 核心概念

思考链是 Agent 的推理轨迹记录，不是最终答案，而是得出答案的过程。

| 类型 | 说明 | 对用户可见 |
|------|------|-----------|
| 内隐思考链 | 模型内部推理 | 否 |
| 外显思考链 | 推理过程输出 | 是 |
| 结构化思考链 | 格式化推理步骤 | 是 |

---

## 2. 触发条件

复杂度 >= 5 必须启用，>= 8 强制结构化。

### 2.1 复杂度评分公式

| 因素 | 权重 |
|------|------|
| 步骤数 (steps) | 1 |
| 工具调用数 (tool_count) | 2 |
| 权限需求 (permission) | 3 |
| 跨用户操作 (cross_user) | 5 |
| AI 生成 (ai_generation) | 4 |

### 2.2 复杂度阈值

| 复杂度 | 触发类型 |
|--------|---------|
| < 5 | 无思考链 |
| >= 5 | 启用思考链 |
| >= 8 | 强制结构化 |

---

## 3. 思考链节点类型

| 节点类型 | 说明 |
|----------|------|
| GOAL | 目标定义 |
| FACT | 事实收集 |
| ANALYSIS | 分析推理 |
| EVALUATION | 选项评估 |
| DECISION | 决策选择 |
| PLAN | 执行计划 |
| VERIFICATION | 结果验证 |
| REFLECTION | 反思总结 |

---

## 4. 七步思考模板

| 步骤 | 阶段 | 问题 |
|------|------|------|
| Step 1 | Goal Definition | 目标是什么？ |
| Step 2 | Fact Gathering | 已知事实有哪些？ |
| Step 3 | Analysis | 分析推理过程 |
| Step 4 | Option Evaluation | 选项对比评分 |
| Step 5 | Decision | 最终选择和理由 |
| Step 6 | Execution Plan | 执行步骤 |
| Step 7 | Verification | 如何验证结果 |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>思考链不记录，直接输出结果</li>
    <li>复杂任务不触发思考链</li>
    <li>思考链无限循环无步数限制</li>
    <li>置信度随意填写无依据</li>
  </ul>
</div>

---

## 6. 快速参考

| 复杂度 | 触发类型 |
|--------|---------|
| < 5 | 无思考链 |
| >= 5 | 启用思考链 |
| >= 8 | 强制结构化 |
