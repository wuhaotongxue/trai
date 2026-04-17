---
name: "issue_index"
description: "按仓库期数编写 md/issue_NN/index.md：锚定上一期 index 的 Git 提交时间，用该区间内的 git log 归纳本期叙事，文风对齐 md/issue_02/index.md。"
---

# Issue 期数文档（issue_index）

用于在 `md/issue_NN/` 下撰写「第 N 期」总结文档，并与 Git 历史对齐，避免凭记忆写偏。

## 何时触发

- 用户要求「写第 N 期」「issue_NN」「更新 issue 文档」「按上期文档写本期」等。  
- 需要把一段时间内的代码与文档变更，整理成与 `md/issue_02/index.md` 同风格的叙事稿。

## 目录与命名

- 第 N 期正文固定为：`md/issue_NN/index.md`（N 为两位或递增数字，与已有目录连续）。  
- 配图放在同目录，例如 `issue_NN_01.png`，文中用相对路径引用：`![说明](issue_NN_01.png)`。

## 锚点规则（必须执行）

1. **确定上一期路径**  
   - 本期为 N，则上一期为 `md/issue_{N-1}/index.md`。  
   - 若上一期文件尚不存在，改用仓库内「最近一期已存在的」`md/issue_MM/index.md`（M 最大且文件存在）。

2. **取上一期 index 的入库时间**  
   在仓库根目录执行：

   ```text
   git log -1 --format="%H %ci %s" -- md/issue_{N-1}/index.md
   ```

   记下输出的 **完整 commit hash**（记为 `ANCHOR`）与提交时间（记为 `ANCHOR_TIME`）。  
   若该文件从未被提交过，则退化为：`git log -1 --format="%H %ci" HEAD`。

3. **取本期应覆盖的提交范围**  

   ```text
   git log ANCHOR..HEAD --oneline --no-merges
   ```

   需要更细时可用 `--format` 带作者与日期。  
   **禁止**仅凭模糊记忆写「本期做了什么」；必须以该区间 log 为主，再结合工作区未提交改动（若有）用 `git status` 补充说明。

4. **当前时间**  
   使用用户环境给出的「今天」或对话中的权威日期；在文档中可写「截至 YYYY-MM-DD」或「至当前主干 HEAD」。

## 正文写作规范（保持可读性）

- **分段**：单段超过 4 行应主动拆成 2-3 个短段，每段聚焦一件事，不要写成「大段叙述」。  
- **列表**：能用 `- ` 或 `1.` 列举的不要用一句话逗号分隔堆在一段里（如「基础层 / 治理闭环 / Agent 深化」用列表拆开比一段长句更清晰）。  
- **顺序**：每节开头先给「一句话 / 一行结论」定调，再展开解释；不要把结论埋在段落中后段。  
- **参考**：`md/issue_03/index.md` 是最新示范（已按此规范重写），写新期数时照此风格对齐。

## 视觉与排版（与 project SKILL 一致，优先内联 style）

期数文档**鼓励**适度加色块与重点框，避免长文单调；写法须与 `.cursor/skills/project/SKILL.md` 中已有示例一致，保证 Cursor / VS Code **Markdown 预览**即可看到颜色。

1. **推荐（默认）**：在 `<div>` 上使用**内联 `style="..."`**（背景色、边框、圆角、`padding`、`margin`、标题 `color` 等），且**不要在「开标签的下一行」留空行再接正文**。CommonMark 下若 `<div ...>` 与后续内容之间出现空行，预览常把 HTML 块提前结束，导致正文与 `</div>` 被当成普通 Markdown 文本，出现「看得见 `</div>`、没有颜色」的现象。  
2. **整块 HTML 内用 `<strong>`、`<p>`、`<code>`**：彩色框内少用 `**粗体**` 混排（部分预览器不把框内当 Markdown 解析）；与 project SKILL 一样用 HTML 标签更稳。  
3. **可选**：`md/issue_docs.css` 中的 `doc-*` 类 + 工作区 `markdown.styles` 可减轻重复样式，但仍须遵守第 1 条的**空行规则**，且部分环境对外链 CSS 或 class 支持不一致，**不能替代**内联方案作为唯一依赖。  
4. **表格**：普通 Markdown 表格不要包在外层 `<div>` 里以免解析错乱；需要表格外框时可改用纯 HTML `<table style="...">` 或仅对表格外段落用色块。  
5. **前端 UI 叙事**：对话页、工具卡片、工作流等除配图外，可用红/蓝/绿提示框突出产品要点，配色可与 `frontend_next` Skills 叙述一致，不必贴实现代码。

## 与 project 索引的关系

撰写或更新 `md/issue_NN/index.md` 后，若用户需要同步 Changelog，再按 `readme_update` 技能处理 README；若用户要求推送，再按 `git_submit` 技能执行。

## 自检清单

- [ ] 已执行 `git log -1` 定位 `ANCHOR`。  
- [ ] 已执行 `git log ANCHOR..HEAD` 并据此归纳章节。  
- [ ] 新文件路径为 `md/issue_NN/index.md`，配图路径正确。  
- [ ] 文风与第 2 期对齐，避免无关长篇代码块。  
- [ ] 单段超过 4 行已主动拆成短段或列表。  
- [ ] 文档末尾已补充联系邮箱, 例如: `如有问题, 请联系邮箱: wuhaotongxue@gmail.com`。  
- [ ] 若使用 HTML 色块，已采用内联 `style` 或已确认 `<div>` 与内容间无破坏解析的空行；若仅用 `doc-*` 类，已配置 `markdown.styles` 并自测预览。
