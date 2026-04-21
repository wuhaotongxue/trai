# TRAI 前端

基于 Next.js 16 + React 19 + TypeScript 5 的 TRAI 项目前端，采用 App Router 架构。

## 技术栈

- Next.js 16.2.3（App Router + Turbopack）
- React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Zustand 5（状态管理）
- pnpm 9（包管理器）

## 快速开始

推荐使用 pnpm 并配置淘宝镜像源加速:

```bash
# 安装依赖
pnpm install --registry=https://registry.npmmirror.com

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm type-check
```

## 目录结构

```
src/
├── app/               # App Router 页面
│   ├── (website)/     # 营销官网路由组
│   ├── (admin)/      # 管理后台路由组
│   └── (app)/         # 业务功能路由组
├── components/
│   ├── ui/            # shadcn/ui 基础组件
│   └── 功能名/         # 按模块命名的业务组件
├── stores/            # Zustand 状态管理
├── lib/               # 工具函数和 API 客户端
└── types/            # 类型定义
```

## 路由说明

| 路由 | 页面 |
|------|------|
| `/` | TRAI 官网首页 |
| `/features` | 功能介绍 |
| `/pricing` | 定价方案 |
| `/contact` | 联系我们 |
| `/agent` | AI Agent 对话 |
| `/todo` | 任务管理 |
| `/admin` | 管理后台仪表盘 |
| `/admin/users` | 用户管理 |
| `/admin/quotas` | 配额配置 |
| `/admin/monitor` | 系统监控 |

## 规范

所有代码、注释、UI 文案必须使用简体中文，详见 `.trae/skills/frontend_next/SKILL.md`。

## 📝 更新日志 (Changelog)

### 🛠️ 系统更新_2026_04_21_1138
- [交互] 恢复右下角 AI 助手为当前页弹窗模式，支持右上角一键在新标签页中展开
- [模型] AI 对话助手默认对接后台 DeepSeek 模型，并默认使用空知识库状态

### 🛠️ 系统更新_2026_04_21_1047
- [安全] 引入 Redis Token 黑名单机制，拦截登出和刷新后的废弃 Token
- [功能] 客户端 (client_electron) 增加 Axios 拦截器，实现并发安全的无感知 Token 刷新
- [功能] 前端 (frontend_next) 增加 Fetch 拦截器，实现并发安全的无感知 Token 刷新

### 🛠️ 系统更新_2026_04_21_1013
- [安全] 修复 AES_KEY 与 AES_IV 缺失导致服务启动失败的问题
- [安全] 修复 JWT 弱密钥检测策略及数据库会话连接泄露风险
- [安全] 完善前端 Token 存储方式为 js-cookie 及新增全栈中文标点自动修复
- [功能] 完善管理后台前端页面 (知识库管理、组织架构、客户端发布)
- [规范] 升级前后端与客户端 Skills 规范，加入严格安全红线检查



### 🎨 前端_2026_04_19
- **规范(comment)**: 为所有接口、类型、组件、函数添加完整的 JSDoc 注释，提升代码可维护性
- **规范(comment)**: 更新 code-commenter skill，补充接口类型的注释规则

### 🎨 前端_2026_04_17_2215
- **规范(a11y)**: 后台通知与设置页补齐按钮与表单控件可访问名称, 避免 Microsoft Edge Tools/axe 报错

### 🎨 前端_2026_04_17_1702
- **修复(admin)**: 修复下拉菜单分组 Label 组件上下文报错

### 🎨 前端_2026_04_16_0934
- **修复(api_base)**: 未配置 `NEXT_PUBLIC_API_BASE` 时，自动使用当前页面 hostname 推导后端地址，支持局域网访问
- **修复(hydration)**: 修复管理后台下拉菜单触发器按钮嵌套导致的 hydration error
- **优化(lint)**: 清理未使用变量与 `<img>` 规则告警，并补齐流式接口的 API Base 推导逻辑

### 🎨 前端_2026_04_15_1641
- **新增(wecom)**: 增加企业微信登录回调页面与路由，补齐登录链路与页面结构
- **优化(lint)**: 执行 eslint --fix 统一格式并清理可自动修复的问题

### 🎨 前端_2026_04_15_1000
- **修复(frontend_next)**: 修复登录页表单提交导致的客户端路由问题，优化表单体验，并根据角色不同(`admin` 或 `user`) 登录后分别跳转后台或工作台
- **修复(frontend_next)**: 修复 Next.js WebSocket 及热更新在局域网下的 `403 Forbidden` 问题，通过配置 `allowedDevOrigins` 支持内网 IP 访问

### 🎨 前端_2026_04_15_0940
- **修复(frontend_next)**: 执行 `eslint --fix` 修复无用变量等 Lint 警告

### 🎨 前端_2026_04_14_1750
- **新增(changelog)**: 将 `/changelog` 占位页重构为真实的更新日志页面，采用左侧时间轴设计，按版本 (v0.1.0 ~ v0.4.0) 展示所有迭代与功能进化，并增加多彩的类型标签 (feat/fix/refactor/docs)

### 🎨 前端_2026_04_14_1717
- **新增(docs)**: 补充 `/docs/api` (API 接口文档) 页面，采用全宽视觉布局，展示核心 API (如登录、对话、工具调用等) 概览，并嵌入后端 Swagger 交互文档链接与 Shell 调用示例

### 🎨 前端_2026_04_14_1610
- **新增(roadmap)**: 增加路线图页面, 支持线性时间轴, 关系图谱, 按前端/后端/客户端分组展示当日变更
- **新增(docs)**: 补齐文档中心与子页面路由, 包含 /docs, /docs/api, /docs/sdk, /docs/quickstart, /docs/faq
- **优化(layout)**: 官网多页面统一为更接近全屏的 max-w-7xl 布局, 减少内容区过窄的问题
- **优化(交互)**: 页脚链接统一新标签页打开, 避免打断当前页面操作流
- **规范(rename)**: 文件名与导入命名统一 snake_case, 替换 kebab-case 命名

### 🎨 前端_2026_04_13_2015
- **新增(frontend_next)**: 使用 `kity.svg` 作为默认图标配置

### 🎨 前端_2026_04_13_1955
- **新增(frontend_next)**: 补充 Next.js 前端模块的 README.md 说明文档

### 🎨 前端_2026_04_13_1521
- **修复(frontend)**: 修复前端组件（navbar, pricing, settings）中出现的乱码及中文全角标点问题
