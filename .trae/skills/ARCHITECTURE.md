# Cursor 与 Trae Skills 架构说明

## 1. 两种编辑器的 Skills 机制对比

| 特性 | Cursor | Trae |
|------|--------|------|
| **Skills 路径** | `~/.cursor/skills/`（全局）<br>`.cursor/skills/`（项目） | `~/.trae/skills/`（全局）<br>`.trae/skills/`（项目） |
| **注册机制** | 需要 `manifest.json` 注册 skill IDs | 自动扫描目录，无需 manifest |
| **识别方式** | 读取 manifest → 加载对应目录的 SKILL.md | 递归扫描 skills 目录 → 读取每个 SKILL.md |
| **配置文件** | `~/.cursor/skills-cursor/.cursor-managed-skills-manifest.json`<br>`.cursor-managed-skills-manifest.json` | 无 |

## 2. 项目现状

```
e:\code\trai_dev\trai\
├─ .cursor/skills/        ← Cursor 项目级 Skills（11 个 SKILL.md）
├─ .trae/skills/          ← Trae 项目级 Skills（11 个 SKILL.md + 100+ 子文档）
├─ .trae/rules/           ← Trae Rules（持续生效的全局规范）
└─ .cursor-managed-skills-manifest.json  ← Cursor 项目 manifest
```

## 3. Skills 的演变历史

### 阶段一：只有 Trae
- 最初项目只使用 Trae
- Skills 集中在 `.trae/skills/`，包含完整的子文档树

### 阶段二：引入 Cursor
- Cursor 无法直接读取 `.trae/skills/`
- 将 Skills 复制到 `.cursor/skills/`
- **问题：缺少 manifest，Cursor 不知道这些 skills 存在**

### 阶段三：修复 Cursor
- 在 `~/.cursor/skills-cursor/` 创建 manifest
- 在 `.cursor/skills/` 创建 manifest
- 在项目根目录创建 manifest
- 三重注册确保 Cursor 能识别

### 阶段四：同步 Trae 全局
- Trae 支持全局 Skills：`~/.trae/skills/`
- 将 `.trae/skills/` 完整复制到用户目录
- 项目级和全局级都能生效

## 4. 当前文件分布

### Cursor Skills（已修复）

| 路径 | 内容 | 状态 |
|------|------|------|
| `~/.cursor/skills-cursor/.cursor-managed-skills-manifest.json` | 11 个 skill IDs 注册 | ✅ |
| `.cursor/skills/.cursor-managed-skills-manifest.json` | manifest | ✅ |
| 项目根目录 `.cursor-managed-skills-manifest.json` | manifest | ✅ |
| `.cursor/skills/*.SKILL.md` | 11 个技能入口 | ✅ |

### Trae Skills（自动生效）

| 路径 | 内容 | 状态 |
|------|------|------|
| `~/.trae/skills/` | 全局 Skills（11 个 SKILL.md + 子文档） | ✅ |
| `.trae/skills/` | 项目级 Skills（11 个 SKILL.md + 100+ 子文档） | ✅ |

## 5. Skills 列表

| Skill ID | 名称 | 路径 | 说明 |
|----------|------|------|------|
| `trai-skills-index` | 总索引 | `.trae/skills/SKILL.md` | 所有 Skills 的导航入口 |
| `backend` | 后端规范 | `.trae/skills/backend/SKILL.md` | Python DDD 五层架构规范 |
| `desktop_client` | 桌面客户端规范 | `.trae/skills/desktop_client/SKILL.md` | PyQt6 防卡死、信号槽、Fluent UI |
| `frontend_next` | 前端规范 | `.trae/skills/frontend_next/SKILL.md` | Next.js App Router、i18n 规范 |
| `electron` | Electron 桌面 | `electron/SKILL.md` | TypeScript、IPC、窗口管理 |
| `agent` | Agent 智能体规范 | `.trae/skills/agent/SKILL.md` | Harness 五层架构 |
| `project` | 项目管理规范 | `.trae/skills/project/SKILL.md` | 全局研发规范 |
| `git_submit` | Git 提交 | `.trae/skills/git_submit/SKILL.md` | 自动提交并推送 |
| `report-generation` | 周报生成 | `.trae/skills/report-generation/SKILL.md` | Git 分析、Excel 导入 |
| `readme-update` | README 更新 | `.trae/skills/readme-update/SKILL.md` | Changelog 自动维护 |
| `naming-convention` | 命名规范 | `.trae/skills/naming-convention/SKILL.md` | snake_case 强制规范 |

## 6. 最佳实践

### 不要混用目录
- **Cursor 专用** → `.cursor/skills/` + `manifest.json`
- **Trae 专用** → `.trae/skills/`（自动扫描）
- **通用内容** → 两边都放一份，但内容保持同步

### 同步策略
```powershell
# 更新 Cursor Skills 时，同步到 Trae
Copy-Item .cursor/skills/* ~/.trae/skills/ -Recurse -Force

# 更新 Trae Skills 时，同步到 Cursor
Copy-Item .trae/skills/* .cursor/skills/ -Recurse -Force
```

### 重启生效
- Cursor 修改 manifest 后需要重启
- Trae 修改 Skills 后自动生效（无需重启）

## 7. 常见问题

### Q: Cursor 看不到 Skills？
- 检查 manifest 中是否注册了该 skill ID
- 检查 SKILL.md 的 `name` 字段是否与 manifest 中的 ID 对应
- 重启 Cursor IDE

### Q: Trae 看不到 Skills？
- 检查 `.trae/skills/` 目录是否存在
- 检查每个 Skill 目录下是否有 `SKILL.md`
- 无需 manifest，直接扫描目录

### Q: 两边的 Skills 内容不一致？
- `.trae/skills/` 包含更丰富的子文档（115 个文件）
- `.cursor/skills/` 只包含 SKILL.md 入口（11 个文件）
- 建议以 `.trae/skills/` 为基准，保持两边同步
