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

1. **环境检查与安装**：
   确保后端虚拟环境中已安装 `ruff`。如果没有，先执行 `pip install ruff`。
   当前项目虚拟环境推荐路径：`backend/.venv/Scripts/pip` 或通过 conda 环境。

2. **执行格式化 (Format)**：
   在 `backend` 目录下执行：
   ```powershell
   .venv\Scripts\ruff.exe format src/
   # 或如果使用 conda:
   # conda run -n trai ruff format src/
   ```

3. **执行代码检查 (Check / Lint)**：
   在 `backend` 目录下执行并自动修复可安全修复的问题：
   ```powershell
   .venv\Scripts\ruff.exe check src/ --fix
   # 或使用 conda:
   # conda run -n trai ruff check src/ --fix
   ```

4. **处理报错**：
   如果 `ruff check` 报出了无法自动修复的 Error，必须仔细阅读报错信息，**并使用 Trae 代码编辑工具手动修复这些问题**，直到 `ruff check` 完全通过。

5. **总结**：
   修复完成后，告知用户代码已通过 Ruff 检查并格式化完毕。
