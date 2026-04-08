# Frontend Next.js - Monorepo 结构规范

---

## 1. TRAI 项目 Monorepo 结构

```
trai/
│
├── frontend_next/                    # Next.js 前端 (App Router)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── domains/
│   │   ├── features/
│   │   ├── contexts/
│   │   └── i18n/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         # Python FastAPI 后端
│   ├── src/
│   │   ├── api/                   # API 路由
│   │   ├── core/                 # 核心配置
│   │   ├── models/               # 数据模型
│   │   ├── services/             # 业务服务
│   │   ├── schemas/              # Pydantic 模型
│   │   └── main.py
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── desktop_client/                   # PyQt6 桌面客户端
│   ├── src/
│   │   ├── ui/                   # UI 层
│   │   ├── domain/               # 领域层
│   │   ├── application/          # 应用层
│   │   └── infrastructure/       # 基础设施层
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── shared/                          # 共享代码
│   ├── types/                     # 共享 TypeScript 类型
│   ├── constants/                 # 共享常量
│   └── utils/                    # 共享工具
│
├── docs/                           # 文档
│
├── packages/                       # 内部包 (可选)
│   ├── ui-components/             # 共享 UI 组件库
│   └── api-client/               # 共享 API 客户端
│
├── docker-compose.yml
├── pnpm-workspace.yaml           # pnpm workspaces
└── README.md
```

---

## 2. 包管理配置

```yaml
# pnpm-workspace.yaml
packages:
  - "frontend_next"
  - "backend"
  - "desktop_client"
  - "shared"
  - "packages/*"
```

```json
// frontend_next/package.json
{
  "name": "@trai/frontend",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["../../shared", "../../packages/*"],
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  },
  "dependencies": {
    "@trai/shared": "workspace:*",
    "@trai/ui-components": "workspace:*"
  }
}
```

---

## 3. 共享包设计

### 3.1 @trai/shared

```
shared/
├── types/                        # 共享类型
│   ├── user.types.ts
│   ├── meeting.types.ts
│   └── index.ts
│
├── constants/                     # 共享常量
│   ├── api.ts
│   ├── routes.ts
│   └── index.ts
│
├── utils/                        # 共享工具
│   ├── format.ts
│   ├── validation.ts
│   └── index.ts
│
└── package.json
```

```json
// shared/package.json
{
  "name": "@trai/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./constants": "./dist/constants/index.js"
  }
}
```

### 3.2 @trai/ui-components

```
packages/
└── ui-components/
    ├── src/
    │   ├── button/
    │   │   ├── button.tsx
    │   │   └── index.ts
    │   ├── card/
    │   │   ├── card.tsx
    │   │   └── index.ts
    │   └── index.ts
    │
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 4. 依赖管理

### 4.1 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAI Dependencies                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   frontend_next ──────────────┬──────────────► backend       │
│         │                   │                             │
│         │                   │                             │
│         ▼                   ▼                             │
│   @trai/ui-components  @trai/shared                        │
│         │                   │                             │
│         │                   │                             │
│         └─────────┬─────────┘                             │
│                   │                                       │
│                   ▼                                       │
│             desktop_client                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 版本管理

```json
// 根 package.json
{
  "name": "trai-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend_next", "backend", "desktop_client", "shared", "packages/*"],
  "scripts": {
    "dev:frontend": "pnpm --filter @trai/frontend dev",
    "dev:backend": "pnpm --filter @trai/backend dev",
    "dev:desktop": "pnpm --filter @trai/desktop dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  }
}
```

---

## 5. 构建配置

### 5.1 Next.js 配置

```javascript
// frontend_next/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@trai/shared", "@trai/ui-components"],
  experimental: {
    // 优化
  },
  webpack: (config) => {
    // 支持 shared 包
    config.resolve.alias = {
      ...config.resolve.alias,
      "@trai/shared": require.resolve("@trai/shared"),
      "@trai/ui-components": require.resolve("@trai/ui-components"),
    };
    return config;
  },
};

module.exports = nextConfig;
```

### 5.2 TypeScript 配置

```json
// frontend_next/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@trai/shared/*": ["../../shared/*"],
      "@trai/ui-components/*": ["../../packages/ui-components/src/*"]
    },
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "../../shared" },
    { "path": "../../packages/ui-components" }
  ]
}
```

---

## 6. 开发工作流

### 6.1 启动开发

```bash
# 启动所有服务
pnpm dev

# 或单独启动
pnpm dev:frontend   # 只启动前端
pnpm dev:backend     # 只启动后端
```

### 6.2 代码共享

```typescript
// frontend_next/src/lib/user-api.ts
import type { User } from "@trai/shared/types";
import { API_ENDPOINTS } from "@trai/shared/constants";

// 使用共享类型和常量
async function getUser(id: string): Promise<User> {
  const res = await fetch(`${API_ENDPOINTS.USERS}/${id}`);
  return res.json();
}
```

---

## 7. 测试配置

### 7.1 单元测试 (Vitest)

```typescript
// frontend_next/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@trai/shared": path.resolve(__dirname, "../../shared"),
    },
  },
});
```

### 7.2 E2E 测试 (Playwright)

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should display user dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("欢迎回来");
  });
});
```

---

## 8. 部署配置

### 8.1 Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  frontend:
    build: ./frontend_next
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/trai

  desktop:
    build: ./desktop_client
    ports:
      - "8080:8080"
```

### 8.2 独立部署

```dockerfile
# frontend_next/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 9. CI/CD 流程

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --coverage

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

---

## 10. 禁止事项

- 跨包循环依赖
- 版本不一致的依赖
- 在共享包中写业务逻辑
- 直接复制代码而非提取到共享包
- 忽略构建顺序
