# Frontend Next.js - 国际化 (i18n) 规范

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

### 4.1 中文

```json
// messages/zh.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "confirm": "确认",
    "loading": "加载中...",
    "noData": "暂无数据"
  },
  "auth": {
    "login": "登录",
    "logout": "退出登录",
    "loginSuccess": "登录成功",
    "loginFailed": "登录失败"
  },
  "dashboard": {
    "welcome": "欢迎回来",
    "aiTools": "AI 工具",
    "recentTasks": "最近任务",
    "announcements": "系统公告"
  },
  "errors": {
    "networkError": "网络错误，请检查网络连接",
    "serverError": "服务器错误，请稍后重试",
    "unauthorized": "未登录或登录已过期"
  }
}
```

### 4.2 英文

```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "loading": "Loading...",
    "noData": "No data"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "loginSuccess": "Login successful",
    "loginFailed": "Login failed"
  },
  "dashboard": {
    "welcome": "Welcome back",
    "aiTools": "AI Tools",
    "recentTasks": "Recent Tasks",
    "announcements": "Announcements"
  },
  "errors": {
    "networkError": "Network error, please check your connection",
    "serverError": "Server error, please try again later",
    "unauthorized": "Please login or your session has expired"
  }
}
```

---

## 5. 组件使用

### 5.1 Client Component

```tsx
"use client";

import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations("common");
  return <button>{t("save")}</button>;
}
```

### 5.2 Server Component

```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("dashboard");
  return <h1>{t("welcome")}</h1>;
}
```

### 5.3 表单验证消息

```tsx
// 使用 zod + next-intl
import { z } from "zod";
import { createTranslator } from "next-intl";

const schema = (t: ReturnType<typeof createTranslator>) =>
  z.object({
    email: z.string().email(t("errors.invalidEmail")),
    password: z.string().min(6, t("errors.passwordTooShort")),
  });
```

---

## 6. 复数和变量

### 6.1 复数

```json
{
  "itemCount": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

### 6.2 变量

```json
{
  "welcome": "欢迎 {name}",
  "taskProgress": "{done}/{total} 已完成",
  "timeRemaining": "剩余 {minutes} 分钟"
}
```

### 6.3 使用

```tsx
const t = useTranslations("dashboard");

// 变量
<p>{t("welcome", { name: user.name })}</p>

// 复数
<p>{t("itemCount", { count: items.length })}</p>
```

---

## 7. 语言切换

### 7.1 语言选择器

```tsx
// components/language-switcher.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const LANGUAGES = [
  { code: "zh", name: "中文" },
  { code: "en", name: "English" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.push(pathname.replace(`/${locale}`, `/${newLocale}`));
  };

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

### 7.2 URL 结构

| 语言 | URL |
|------|-----|
| 中文 | /zh/dashboard |
| 英文 | /en/dashboard |

---

## 8. 日期和时间

```tsx
import { useFormatter, useTranslations } from "next-intl";

export function DateDisplay({ date }: { date: Date }) {
  const formatter = useFormatter();
  const t = useTranslations("common");

  return (
    <time dateTime={date.toISOString()}>
      {formatter.dateTime(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </time>
  );
}
```

---

## 9. 禁止事项

- 翻译 key 硬编码字符串
- 不同命名空间使用相同 key
- 翻译文件直接修改源语言
- 缺少翻译不回退到默认语言
- 动态内容不使用翻译
