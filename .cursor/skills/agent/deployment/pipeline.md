# Agent - 部署规范

---

## 1. 部署环境

| 环境 | 用途 |
|------|------|
| dev | 本地开发 |
| staging | 测试验证 |
| production | 正式生产 |

---

## 2. 部署流程

```
Code Push -> Lint -> Test -> Build -> Deploy Staging -> QA -> Deploy Production
```

### 2.1 流程步骤

| 步骤 | 说明 |
|------|------|
| Code Push | 代码提交到仓库 |
| Lint | 代码质量检查 |
| Test | 自动化测试 |
| Build | 构建产物 |
| Deploy Staging | 部署到预发布环境 |
| QA | QA 验收测试 |
| Deploy Production | 部署到生产环境 |

---

## 3. 配置管理

### 3.1 Agent 配置项

| 配置项 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| version | string | 版本号 | - |
| max_retries | int | 最大重试次数 | 3 |
| timeout_ms | int | 超时时间 (毫秒) | 30000 |
| reasoning.enabled | boolean | 是否启用思考链 | true |
| reasoning.min_complexity | int | 思考链最小复杂度 | 5 |
| correction.enabled | boolean | 是否启用纠错 | true |
| correction.auto_correct | boolean | 是否自动纠错 | true |

### 3.2 配置管理原则

| 原则 | 说明 |
|------|------|
| 环境隔离 | 不同环境使用不同配置 |
| 版本控制 | 配置文件必须版本化 |
| 最小权限 | 只暴露必要的配置项 |

---

## 4. 灰度发布

| 阶段 | 流量比例 | 监控时长 |
|------|----------|----------|
| 灰度 1 | 5% | 24 小时 |
| 灰度 2 | 20% | 24 小时 |
| 全量 | 100% | - |

### 4.1 灰度策略

| 策略 | 说明 |
|------|------|
| 按用户比例 | 随机选择用户 |
| 按地区 | 按地域灰度 |
| 按功能开关 | 特性开关控制 |

---

## 5. 回滚策略

| 触发条件 | 回滚操作 | 验证方式 |
|----------|----------|----------|
| 错误率飙升 | 回滚到上一版本 | 监控验证 |
| 延迟异常 | 回滚到上一版本 | 监控验证 |
| 核心功能异常 | 回滚到上一版本 | 功能测试 |

### 5.1 回滚流程

| 步骤 | 说明 |
|------|------|
| 1. 停止灰度 | 立即停止新版本流量 |
| 2. 验证稳定 | 确认旧版本稳定运行 |
| 3. 完全回滚 | 100% 流量切换到旧版本 |
| 4. 通知 | 通知相关人员 |

---

## 6. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>直接在生产环境修改配置</li>
    <li>无灰度发布直接全量</li>
    <li>回滚无监控验证</li>
  </ul>
</div>
