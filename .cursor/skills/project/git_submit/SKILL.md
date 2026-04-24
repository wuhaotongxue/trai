---
name: "git_submit"
description: >-
  用于一键提交并推送本地修改到远端仓库。当用户说提交代码/保存代码/推送到某分支等或主动调用此技能时执行。
---

# 自动提交与推送代码_(git_submit)

当用户调用此技能时，请严格按照以下步骤连贯执行：

## 执行步骤

### 1. 状态检查
运行 `git status` 了解当前修改了哪些文件。

### 2. 规范检查与 AI 警察拦截 (强制)

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:12px;">
    <strong style="color:#1565C0;">&#x1F6E1; 强制检查</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>修改 <code>backend</code> → 必须调用 <code>backend/SKILL.md</code> 检查 DDD 架构</li>
      <li>修改 <code>desktop_client</code> → 必须调用 <code>desktop_client/SKILL.md</code> 检查防卡死规范</li>
      <li>修改 <code>electron</code> → 必须调用 <code>electron/SKILL.md</code> 检查 Electron 规范</li>
      <li>修改 <code>frontend_next</code> → 必须调用 <code>frontend_next/SKILL.md</code> 检查 App Router 规范</li>
    </ul>
  </div>
  <div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px;">
    <strong style="color:#F57F17;">&#x26A0; 检查不通过</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      必须修复问题后才能继续提交
    </div>
  </div>
</div>

### 3. 更新日志检查 (Changelog Check)

检查是否更新了对应模块的 `README.md` 与根 `README.md` 的 `## 📝 更新日志 (Changelog)` 顶部。

**如果未更新**，必须调用 `readme-update` 技能：
- 追加到两处 README 顶部，按时间倒序

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x26A0; 强制要求获取当前时间 (CRITICAL)</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>第一步：必须先执行 Shell 命令获取当前时间</strong></li>
    <li>Windows: <code>Get-Date -Format "yyyy_MM_dd_HHmm"</code></li>
    <li>Linux/Mac: <code>date +%Y_%m_%d_%H%M</code></li>
    <li><strong>第二步：使用获取到的真实时间生成时间戳标题</strong></li>
    <li><strong>禁止估算、禁止使用预估值、禁止使用 AI 训练数据中的时间</strong></li>
    <li>格式示例：<code>### 🛠️ 后端_2026_04_24_2355</code></li>
  </ul>
</div>

### 4. 暂存文件
运行 `git add .` 将所有修改添加到暂存区。

### 5. 生成提交信息并 Commit

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 必须使用</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>严格使用**中文**</li>
      <li>遵循 Angular 规范前缀</li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 禁止</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>英文 Commit Message</li>
    </ul>
  </div>
</div>

**Commit 类型**（全部中文）：

| 类型 | 用途 | 示例 |
|------|------|------|
| `新增` | 新功能 | `新增 知识库批量上传功能` |
| `修复` | Bug 修复 | `修复 视频预览区背景色异常` |
| `优化` | 性能优化 | `优化 知识库搜索查询速度` |
| `文档` | 文档更新 | `文档 更新错误日志记录规范` |
| `重构` | 代码重构 | `重构 Agent 管理页面状态管理` |
| `测试` | 测试相关 | `测试 添加知识库单元测试` |
| `杂项` | 杂项任务 | `杂项 更新依赖版本` |
| `样式` | 样式调整 | `样式 调整侧边栏圆角样式` |
| `界面` | 界面修改 | `界面 优化设置页面布局` |
| `合并` | 分支合并 | `合并 wuhao 分支到 develop` |
| `撤销` | 代码回滚 | `撤销 上次误删的配置` |
| `权限` | 权限相关 | `权限 优化用户角色管理` |
| `安全` | 安全相关 | `安全 修复 XSS 漏洞` |
| `迁移` | 数据迁移 | `迁移 用户数据到新表结构` |
| `构建` | 构建配置 | `构建 更新 Docker 配置` |
| `部署` | 部署相关 | `部署 添加 K8s 部署脚本` |
| `日志` | 日志相关 | `日志 优化错误日志格式` |
| `缓存` | 缓存相关 | `缓存 添加 Redis 缓存策略` |
| `导入` | 导入导出 | `导入 优化 Excel 导入性能` |

**提交信息规范**：
- 类型后加空格
- 简洁明了，一行说明
- 可选括号标注模块：`新增（知识库）批量上传功能`

**领域标签**（括号标注，方便区分）：
| 标签 | 说明 | 适用于 |
|------|------|--------|
| `（后端）` | Python 后端代码 | backend/ 目录 |
| `（前端）` | Next.js 前端代码 | frontend_next/ 目录 |
| `（Electron）` | Electron 客户端 | client_electron/ 目录 |
| `（桌面）` | PyQt6 桌面客户端 | desktop_client/ 目录 |
| `（技能）` | Cursor Skills 规范 | .cursor/skills/ 目录 |
| `（文档）` | 纯文档更新 | md/ 目录、README.md |
| `（项目）` | 项目级配置 | 根目录配置文件 |

**完整示例**：
- `新增（后端）用户权限管理功能`
- `修复（Electron）视频预览区背景色异常`
- `优化（前端）知识库搜索查询速度`
- `样式（Electron）统一界面背景色为白色`
- `文档（项目）更新错误日志记录规范`

**Windows PowerShell 兼容性注意**：
- ⚠️ PowerShell **不支持** heredoc 语法（`cat <<'EOF'`）
- ✅ Linux/Mac 可使用 heredoc 多行提交信息
- ❌ Windows 必须使用单行 `-m "提交信息"` 格式

### 6. 拉取与推送

**目标推送分支**：
- 根据用户输入中的关键词（如"推送到 wuhao"）提取目标分支
- 如果用户未指定，则推送到当前所在的活动分支

**自动切换到 wuhao 分支**：
- ⚠️ **重要**：无论用户指定推送到哪个分支，推送完成后必须切换回 `wuhao` 分支
- 例如：用户说"推送到 develop 和 main"，执行完后必须 `git checkout wuhao`

**网络问题重试策略**：
- ⚠️ 推送时如遇网络错误（Connection reset / Timeout / Failed to connect）
- 🔄 **最少重试 3 次**，每次间隔 2-3 秒
- 如果 3 次都失败，告知用户网络问题，手动稍后重试

---

## 强约束

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁绕过本技能直接推送</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>这是多人协作仓库</li>
    <li>任何"提交/推送"指令必须通过本技能执行</li>
    <li>若用户要求"只更新 README"，也必须调用 <code>readme-update</code> 后再走本技能</li>
  </ul>
</div>

### 7. 反馈
告知用户提交成功，并简述提交的内容以及拉取/推送的分支详情。

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止绕过</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须通过本技能提交</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">规范检查</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">backend/desktop/electron/frontend</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">README 更新</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">局部+根目录两处</div>
  </div>

</div>
