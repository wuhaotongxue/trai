# Frontend_Next_js_国际化__i18n_规范

---

## 1. 技术方案

| 技术 | 说明 |
|------|------|
| next-intl | 国际化框架 |
| ICU MessageFormat | 消息格式 |
| JSON | 翻译文件 |

---

## 2. 目录结构

```
src/
├── i18n/
│   ├── request.ts          # 服务端配置
│   ├── routing.ts          # 路由配置
│   └── messages/
│       ├── zh.json         # 中文
│       └── en.json         # 英文
│
├── app/[locale]/
│   ├── layout.tsx          # 包含 NextIntlClientProvider
│   └── page.tsx
```

---

## 3. 命名空间

| 命名空间 | 说明 |
|---------|------|
| common | 通用文本 |
| auth | 登录/注册 |
| dashboard | 用户工作台 |
| admin | 后台管理 |
| landing | 官网 |
| errors | 错误信息 |

---

## 4. 翻译文件格式

### 4.1 JSON 结构

```json
{
  "common": { "save", "cancel", "delete", "edit", "confirm", "loading", "noData" },
  "auth": { "login", "logout", "loginSuccess", "loginFailed" },
  "dashboard": { "welcome", "aiTools", "recentTasks", "announcements" },
  "errors": { "networkError", "serverError", "unauthorized" }
}
```

### 4.2 命名规范

| 规范 | 说明 |
|------|------|
| 小写 + 驼峰 | `loginSuccess` |
| 按模块分组 | `auth.login` |
| 错误信息单独命名空间 | `errors.networkError` |

---

## 5. 组件使用

### 5.1 Client Component

| Hook | 返回 | 说明 |
|------|------|------|
| `useTranslations(ns)` | `t(key)` | 获取翻译函数 |
| `useLocale()` | `string` | 获取当前语言 |
| `useTranslations()` | `t(key)` | 默认 common 命名空间 |

### 5.2 ICU MessageFormat

| 格式 | 示例 |
|------|------|
| 变量 | `{name} 登录成功` |
| 复数 | `{count, plural, =0 {无文件} =1 {1个文件} other {#个文件}}` |
| 选择 | `{gender, select, male {他} female {她} other {它}}` |

**实现参考**：`frontend_next/src/i18n/messages/zh.json`

---

## 6. 禁止事项

- 硬编码中文字符串
- 使用拼音作为 key
- 命名空间混乱
- 缺少错误信息翻译
