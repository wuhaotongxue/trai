---
name: "git_submit"
description: "自动提交并推送代码到指定分支。用户说提交/推送/保存代码或提到分支名(如 wuhao)时调用。"
---

# git_submit

本技能是可执行入口。执行时先读取并严格遵循以下规范文件：

- `.trae/skills/project/git_submit/SKILL.md`

执行要点：
- 先做 `git status` 明确改动范围
- 必要时先按规范技能做检查与 README 更新
- `git add` -> 生成中文提交信息 -> `git commit`
- `git pull --rebase`（或按仓库规范）后推送到目标分支（未指定则推送当前分支）
