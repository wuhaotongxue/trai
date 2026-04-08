---
name: "readme-update"
description: "更新 README 的 Changelog。用户要求更新日志/写 README 或提交前补齐 README 时调用。"
---

# readme-update

本技能是可执行入口。执行时先读取并严格遵循以下规范文件：

- `.trae/skills/project/readme_update/SKILL.md`

执行要点：
- 确认本次变更涉及的模块
- 用系统当前时间生成标题(模块_YYYY_MM_DD_HHmm)
- 同时更新根 README 与对应模块 README 的 Changelog 顶部
