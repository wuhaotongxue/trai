---
name: "frontend-design"
description: "创建独特、生产级的前端界面。用户要求构建组件、页面、海报等，或希望美化 UI/应用 Neo-Brutalism 设计时调用。拒绝通用 AI 风格。"
---

# Frontend Design (Neo-Brutalism & Creative Aesthetics)

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. It incorporates best practices from Anthropic's design guidelines while deeply integrating the user's preferred **Neo-Brutalism (新粗野主义)** style.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Neo-Brutalism / 新粗野主义 (MANDATORY)**: 
  - 大量使用 `font-black` (极粗体)、`uppercase` (全大写) 和 `tracking-wide` (宽字距)。
  - 采用硬核的偏移阴影（如 `shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]`）和明确的深色粗边框（如 `border-2 border-slate-900 dark:border-white`）。
  - 极高饱和度的功能色块碰撞（如 bg-emerald-400, bg-indigo-500, bg-rose-500, bg-amber-400, bg-cyan-400）。
  - 按钮/卡片交互：`hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all`。
  - 摒弃圆滑渐变与玻璃拟物化 (No backdrop-blur, no soft shadows)。
- **Empty States (空白填充)**: 
  - **NEVER** leave an empty screen without context.
  - 必须使用大尺寸的 Lucide 图标（如 `w-16 h-16`），放在一个带有粗边框和硬核阴影的纯色块背景中（如 `w-32 h-32 bg-amber-400 rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center`）。
  - 配合 `font-black uppercase tracking-widest text-2xl` 的中文提示文字（如 "等待接入", "暂无数据" 等）。
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? 

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Bold, characterful font choices. 
- **Color & Theme**: High-contrast, high-saturation colors. 
- **Spatial Composition**: Clear, boxed-out layouts. Use distinct dividing lines (`border-b-2 border-slate-900`).
- **Backgrounds**: Solid colors or distinct dot/grid patterns. No soft meshes.

NEVER use generic AI-generated aesthetics like overused soft purple gradients, subtle drop-shadows (`shadow-sm`, `shadow-lg`), and cookie-cutter design that lacks context-specific character.

Remember: Implement with extreme confidence. Every component, panel, and popup must scream "Neo-Brutalism".
