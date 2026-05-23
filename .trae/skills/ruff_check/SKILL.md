---
name: "ruff_check"
description: "Run astral's ruff tool to format and lint Python code in the backend. Invoke this before committing backend code or when the user asks to format/lint python code."
---

# Ruff Check (Python Linter and Formatter)

本技能使用 [Ruff](https://docs.astral.sh/ruff/) 工具对 `backend` 目录下的 Python 代码进行极速格式化和语法检查。

## 适用场景

1. 用户明确要求对后台代码进行格式化或代码检查。
2. **在提交包含 backend 目录的修改之前（作为 `git_submit` 的前置检查强制执行）**。

## 执行步骤

当调用此技能时，必须执行以下步骤：

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 环境红线 (CRITICAL)</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>绝对禁止使用 <code>.venv</code></strong>！严禁执行任何带有 <code>.venv/bin/</code> 或 <code>.venv\Scripts\</code> 的命令。</li>
    <li>必须且只能使用 <strong>Conda 环境 <code>trai31313</code></strong> 进行所有 Python 命令的调用。</li>
  </ul>
</div>

1. **执行格式化 (Format)**：
   在项目根目录或 `backend` 目录下执行：
   ```bash
   conda run -n trai31313 ruff format backend/src/
   ```

2. **执行代码检查 (Check / Lint)**：
   执行并自动修复可安全修复的问题：
   ```bash
   conda run -n trai31313 ruff check backend/src/ --fix
   ```

3. **执行语法编译检查 (Compileall)**：
   确保没有低级语法错误：
   ```bash
   conda run -n trai31313 python -m compileall backend/src/
   ```

4. **处理报错**：
   如果报出了无法自动修复的 Error，必须仔细阅读报错信息，**并使用 Trae 代码编辑工具手动修复这些问题**，直到检查完全通过。

5. **总结**：
   修复完成后，告知用户代码已通过 Ruff 检查并格式化完毕。
