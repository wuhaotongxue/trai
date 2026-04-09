# Frontend_Admin_系统设置规范

---

## 1. 页面结构

```tsx
// /admin/system/page.tsx
// - 模型配置
// - 配额配置
// - 限流规则
// - 系统日志
```

---

## 2. AI 模型配置

```tsx
interface ModelConfig {
  id: string;
  name: string;          // 模型名称
  provider: string;       // 提供商
  status: "active" | "inactive" | "maintenance";
  rate_limit: number;     // 每分钟调用次数
  cost_per_call: number;  // 每次调用成本
}
```

### 模型列表

| 模型 | 提供商 | 状态 | 限流 |
|------|--------|------|------|
| GPT-4 | OpenAI | active | 60/min |
| Claude 3 | Anthropic | active | 60/min |
| Qwen | 阿里云 | active | 100/min |

---

## 3. 配额配置

```tsx
interface QuotaConfig {
  plan_name: string;
  user_role: string;
  limits: Record<QuotaType, number>;
}
```

### 默认套餐

| 套餐 | 角色 | 图片 | 音频 | 转录 |
|------|------|------|------|------|
| Guest | guest | 5/月 | 10/月 | 30分钟 |
| Basic | user | 50/月 | 100/月 | 300分钟 |
| VIP | vip | 无限 | 无限 | 无限 |

---

## 4. 限流规则

```tsx
interface RateLimitConfig {
  config_key: string;
  limit_type: "global" | "user" | "endpoint";
  max_requests: number;
  window_seconds: number;
  strategy: "reject" | "delay" | "queue";
}
```

### 默认规则

| 规则 | 限流 | 窗口 |
|------|------|------|
| global:default | 1000 | 60秒 |
| user:guest | 10 | 60秒 |
| user:basic | 60 | 60秒 |
| user:vip | 300 | 60秒 |

---

## 5. 系统日志

```tsx
interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  category: string;
  message: string;
  details: Record<string, unknown>;
}
```

### 日志级别

| 级别 | 说明 |
|------|------|
| info | 正常操作 |
| warning | 警告信息 |
| error | 错误信息 |

---

## 6. 配置编辑

```tsx
interface ConfigEditorProps {
  config: Config;
  onSave: (config: Config) => void;
  onCancel: () => void;
}
```

---

## 7. 禁止事项

- 修改生产配置无备份
- 删除默认配额套餐
- 限流规则设为 0
- 配置变更无审计日志