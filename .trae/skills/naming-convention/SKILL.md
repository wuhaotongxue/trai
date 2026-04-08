---
name: "naming-convention"
description: "TRAI 命名规范入口。创建或修改任何代码文件时调用，强制 snake_case，禁止 kebab-case。"
---

# naming-convention

本技能是可执行入口。执行时先读取并严格遵循以下规范文件：

- `.trae/skills/project/naming_convention/SKILL.md`

执行要点：
- 文件名、变量名、函数名默认 snake_case
- 类名使用 PascalCase（语言允许时）
- 禁止 kebab-case（横杠）与随意混用大小写风格
