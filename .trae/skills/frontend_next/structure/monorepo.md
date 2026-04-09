# Frontend_Next_js_Monorepo_结构规范

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

### 2.1 pnpm-workspace.yaml

```yaml
packages:
  - "frontend_next"
  - "backend"
  - "desktop_client"
  - "shared"
  - "packages/*"
```

### 2.2 package.json 脚本

| 脚本 | 说明 |
|------|------|
| `dev` | 开发模式 |
| `build` | 构建项目 |
| `start` | 生产启动 |
| `lint` | 代码检查 |
| `test` | 运行测试 |

### 2.3 workspace 依赖

| 依赖方式 | 说明 |
|---------|------|
| `"workspace:*"` | 引用本地 workspace 包 |
| `"@trai/shared"` | 共享类型/常量 |
| `"@trai/ui-components"` | 共享 UI 组件 |

**实现参考**：`frontend_next/package.json`, `pnpm-workspace.yaml`

---

## 3. 共享包设计

### 3.1 @trai/shared 结构

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

### 3.2 包发布配置

| 配置项 | 说明 |
|--------|------|
| `name` | 包名，如 `@trai/shared` |
| `main` | 入口文件 |
| `types` | 类型定义入口 |

**实现参考**：`shared/package.json`

---

## 4. 禁止事项

- workspace 包循环依赖
- 包之间版本不一致
- 直接引用未发布的内部包
- 包名冲突
