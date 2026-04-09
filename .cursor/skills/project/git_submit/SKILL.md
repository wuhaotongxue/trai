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
- 自动生成真实时间戳标题（如 `### 🛠️ 后端_2026_04_08_1430`）
- 追加到两处 README 顶部，按时间倒序

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

**Angular 规范前缀**：`feat:`、`fix:`、`chore:`、`refactor:`、`docs:` 等。

**Windows PowerShell 兼容性注意**：
- ⚠️ PowerShell **不支持** heredoc 语法（`cat <<'EOF'`）
- ✅ Linux/Mac 可使用 heredoc 多行提交信息
- ❌ Windows 必须使用单行 `-m "提交信息"` 格式

### 6. 拉取与推送

**目标推送分支**：
- 根据用户输入中的关键词（如"推送到 wuhao"）提取目标分支
- 如果用户未指定，则推送到当前所在的活动分支

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
