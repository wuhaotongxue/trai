---
name: "report-generation"
description: "生成结构化周报/月报。用户要求写周报/月报、从 Git/Excel 汇总工作内容时调用。"
---

# report-generation

本技能是可执行入口。执行时先读取并严格遵循以下规范文件：

- `.trae/skills/project/report_generation/SKILL.md`

执行要点：
- 汇总输入来源（Excel/CSV、Git、自由文本、历史报告）
- 归纳新增/完成/进行中工作项并结构化输出
- 支持导出与入库（按项目规范）
