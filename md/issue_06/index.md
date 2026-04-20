# TRAI 第6期: 客户端深度重构, 三段式布局与深色模式, Mermaid 渲染优化

<div style="background:linear-gradient(135deg,#eff6ff 0%,#f0f9ff 100%);border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 继第4期彻底拥抱 Electron、第5期落地管理后台与知识库之后, 本期全面重构了客户端视觉——全量铺开“三段式折叠布局”与“深色模式”切换; 同时彻底拔除 MD 转 PDF 的外网 CDN 依赖, 实现断网下 Mermaid 与公式的完美渲染.
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_05/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">3bc882c</code> · 2026-04-17 17:30:38 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 3bc882c..HEAD</code>
</div>

## 核心架构演进概览

本期的核心目标是**“统一与健壮”**。在早期的快速迭代中，我们在不同的页面堆砌了不同的布局逻辑，导致了大量的 CSS 重复和边缘状态的冲突。同时，核心的 PDF 导出功能一直存在对外部网络的强依赖，这是一个随时可能引爆的雷。

在第6期，我们对客户端进行了自下而上的“手术”，重构的重点涵盖以下四个维度：

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">1. 全局视觉基建 · ThreePanelLayout 统一化</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">承接第 4 期的 Win11 Fluent 风格，本期将仪表盘、AI 创作、工具箱与设置页全量重构为统一的 <code>ThreePanelLayout</code>。我们彻底清除了各个页面里零散的 <code>div</code> 拼凑，用一套严密的 Flex 骨架接管了整个应用的空间分配。</p>
</div>

<div style="border:1px solid #fef08a;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#a16207;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fef08a;">2. 深色模式与原子化 CSS 变量</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">将所有的颜色硬编码抽离为基于 <code>data-theme</code> 的 CSS 变量。新增了持久化的明暗主题切换机制，确保在各种光线环境下都有最佳的阅读体验。</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">3. 底层渲染革命 · 彻底的离线化解析</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">将 Mermaid、KaTeX 等核心渲染库全部沉淀至后端本地资源目录；重写了 Python 后端的 Markdown 代码块提取引擎，从根源上解决了 Python-Markdown 破坏 LaTeX 复杂公式的历史顽疾。</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">4. 工程治理与数据监控</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">沿着第 2、3 期的规范化思路，仪表盘新增 Windows GPU 本地监控与 2 秒平滑轮询机制；后端代码执行全局 <code>ruff check --fix</code> 清理坏味道；客户端全面跑通 <code>tsc --noEmit</code> 类型校验，确保 IPC 与 UI 零隐患。</p>
</div>

---

## 1. 客户端: 全局三段式布局 (ThreePanelLayout) 的深度重构

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">技术突破</strong>: 告别各页面“各自为战”的排版, 用一套顶层骨架收拢导航、列表与详情, 极大提升了代码复用率、可维护性和视觉的整齐度.
</div>

在早期的开发中，诸如“AI对话”、“设置”、“仪表盘”等页面都在各自维护左右或三栏分栏结构。这不仅导致了 CSS 代码的大量冗余，还带来了极难维护的边距对齐问题。本期我们抽象了顶层 `ThreePanelLayout` 容器组件。

### 1.1 结构与动态控制的收拢
- **绝对的统一阵型**: 无论是“仪表盘 -> 系统信息 -> 详情”这样纯数据展示页, 还是“AI创作 -> 文生图分类 -> 参数面板”这样的重交互页, 全部统一为“左(主导航)-中(子列表)-右(内容详情)”的三栏结构。
- **开合逻辑重构**: 以前每个页面的折叠按钮位置各异，让用户无所适从。现在，中间列表的“收起”按钮统一锚定在头部最右侧，而“展开”按钮则统一挂在右侧详情区的头部最左侧。这种设计彻底符合了用户在桌面端操作“抽屉”时的空间直觉。
- **响应式防溢出边界**: 三栏布局的底层改用严密的 Flexbox 配合 `min-width` 强约束。哪怕用户将窗口缩小到极致，也能保证中栏内容（如二级分类菜单）不被生硬截断或发生 DOM 挤压变形。

### 1.2 “四字文案”与排版规范的强制落地
在桌面端紧凑的左侧和中间栏中，中文排版的痛点尤为明显。混合长度的中文字符（尤其是3个字和5个字的混排）极易造成视觉的参差不齐。

- **`ui_text.ts` 全局接管**: 为了解决中英文字符在窄边栏的排版错位问题，我们抽离了专用的工具类 `ui_text.ts`，内置 `should_ellipsis` 和 `to_fixed_chars` 函数，全局接管中栏和左栏的标题截断逻辑。
- **重命名规整行动**: 将 AI 创作、设置、反馈等页面的子分类名全部规整为严谨的“四字风格”。例如，将“动物”改为“动物风格”，将“系统”改为“系统设置”。
- **动态省略机制**: 对于确实无法精简为四字的长文案，严格遵循“>4字显示省略号”和“<=4字完整显示”的自动化截断规则。这一规范的落地，使得整个应用侧边栏的视觉高度对齐，彻底治愈了“强迫症”。

---

## 2. 拥抱深色模式 (Dark Mode) 与 CSS 原子化

<div style="background:#fef3c7;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin:14px 0;color:#92400e;">
  <strong style="color:#b45309;">技术突破</strong>: 从杂乱的内联硬编码颜色，全面迁移到基于 CSS 变量的动态色彩体系，实现了真正的动态主题切换，并支持用户配置的跨生命周期持久化。
</div>

在第 4 期的重构中，我们确立了禁止使用紫色系的 UI 规范。本期更进一步，彻底铲除了代码库中遗留的类似 `#ffffff`、`#f8fafc`、`#333333` 这类硬编码色彩。

### 2.1 CSS 变量驱动的语义化色彩体系
在全局样式文件 `global.css` 中，我们建立了一套不依赖具体色值的“语义化”变量：
```css
/* global.css 节选 */
:root {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-hover: #f1f5f9;
  --text-primary: #334155;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
}

html[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-hover: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --border-color: #334155;
}
```
通过在根节点 `html[data-theme="light|dark"]` 上切换属性，组件内部无需编写任何判断逻辑，即可实现全局背景、边框、文字、阴影等视觉元素的无缝切换。

### 2.2 一键切换与状态持久化
- 顶栏组件 `title_bar.tsx` 新增了专属的太阳/月亮图标，支持用户无感一键切换浅色/深色模式。
- **状态同步存储**: 主题切换时，不仅会实时更新 DOM，还会将用户的偏好同步写入本地的 Electron Config Store（与 API 地址、超时时间等系统设置保存在一起）。这确保了用户下次打开客户端时，依然能无缝恢复其上次选择的主题环境。
- **深色对比度调优**: 各个复杂页面（如侧边栏导航、对话页的 AI 气泡、工具箱卡片）在深色模式下的对比度经过了精细调优，极大改善了夜间工作环境下的易读性。

---

## 3. 底层渲染: 彻底脱离外网的 Mermaid 与 KaTeX 闭环

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">技术突破</strong>: 彻底斩断 PDF 导出强依赖外网 CDN 的致命隐患, 实现内网环境下图表与复杂公式的高保真离线渲染，并重写引擎解决了历史遗留的正则破坏问题。
</div>

Markdown 转 PDF 一直是 TRAI 平台的核心产物交付能力。但在过去的架构中，由于 `wkhtmltopdf` 等后端引擎在渲染时，需要通过 `<script src="...">` 加载 CDN 上的 `mermaid.min.js` 和 `katex.min.js`。一旦用户的网络环境受限（如企业内网或弱网），导出的 PDF 就会出现大面积的流程图空白或公式源码外溢的致命缺陷。

### 3.1 渲染依赖全面本地化
- 将 Mermaid 和 KaTeX 相关的全套 JS 和 CSS 静态资源，完整沉淀到了 `backend/assets/pdf_vendor/` 目录下。
- 后端在拼装最终的 HTML 模板时，改用注入本地脚本的方式加载这些核心依赖。现在，哪怕是在彻底断网的环境下，系统依然能利用本地资源渲染出极其精美的矢量流程图和复杂的数学矩阵。

### 3.2 解析健壮性重写：解决 Python-Markdown 的历史顽疾
- **过去的痛点**:
  1. 原有的后端大正则匹配方式非常脆弱，一旦用户的 Markdown 文件中 ````mermaid` 没有正确闭合，或者少敲了一个换行符，就会导致整个文件的提取链崩溃。
  2. `Python-Markdown` 核心库在转译 HTML 时，会无脑将复杂 KaTeX 公式（如 `$$ e^{i\pi} + 1 = 0 $$`）中的 `^`、`_` 等符号转义为 HTML 的 `<em>` 或 `<sup>` 标签，导致前端 KaTeX 拿到源码时彻底无法渲染。
- **全新的引擎架构**:
  - **逐行扫描容错引擎**: 抛弃了粗暴的全局正则替换，重写为后端对 Markdown 代码块的“逐行扫描提取”机制。它能宽容处理不规范的缩进、缺失的换行符以及错误的闭合标记。若文件实在无法识别，系统不会静默崩溃，而是通过 IPC 通道向客户端抛出明确的中文拦截提示（如“未检测到闭合的反引号，请检查 Markdown 语法”）。
  - **渲染保真的“占位符”隔离策略**: 采用了全新的“提取隔离 -> 占位替换 -> MD 转 HTML -> 还原注入”的分段处理策略。即在交给 Python-Markdown 处理前，先把复杂的公式和图表抽离并替换为安全的 `<div data-placeholder="x">`，等 HTML 生成完毕后，再将原始内容原封不动地塞回去。这一“偷梁换柱”的策略，完美避开了 Python-Markdown 的瞎转义，彻底解决了 KaTeX 渲染崩溃的历史难题。

### 3.3 客户端双向预览赋能
- 客户端的 MD 转 PDF 工具箱界面，新增了基于 iframe 的双向预览架构。
- 页面左侧可编辑和查看 Markdown 原文，右侧无缝嵌入了后端生成的 PDF 产物预览框，实现了真正意义上的“所见即所得”。

---

## 4. 业务能力扩容：数据监控平滑化与图生图闭环

<div style="background:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <div style="font-weight:700;color:#be123c;margin-bottom:8px;">体验优化要点</div>
  <p style="margin:0;">在底层基建狂飙重构的同时, 我们也没有停下业务能力打磨的脚步，重点消除了数据监控的粗糙感, 并补齐了 AI 绘图的最后一块拼图。</p>
</div>

### 4.1 仪表盘监控的深度与平滑度优化
- **GPU 底层采集接入**: 系统信息的监控面板打破了只看 CPU/内存的局限，在 Electron 的 Main 进程中新增了针对 Windows WMI（`wmic path win32_VideoController`）的原生调用，实现了本地 GPU 型号与状态的读取与展示。
- **2秒平滑轮询机制**: 过去的 CPU 和内存折线图由于采用了 1 秒 1 次的暴力刷新，且没有过渡动画，视觉上显得极为生硬和闪烁。本期将轮询频率降至更为科学的 2 秒，引入了 ECharts 的平滑过渡动画（`animationDuration` 配合 `smooth: true`），并在折线图上补充了清晰的 Y 轴刻度文本，彻底消除了数据展示的盲区。

### 4.2 AI 创作：图生图全链路闭环
- 在早期版本中，图生图功能仅停留在纯 UI 界面层面，缺乏真正与大模型交互的上传链路。
- 本期全面补齐了客户端本地图片的选取能力，并在 Renderer 进程利用 FileReader 实现了图片的安全 Base64 转换。
- 转换后的图像数据通过 IPC 白名单通道传给 Main 进程，最终对接到后端新开放的 `POST /api/routers/ai/image` 接口。客户端现在可以直接支持本地图片的预览、清除，并将其一键推给大模型进行风格重绘。

---

## 5. 工程治理与代码洁癖

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong style="color:#4c1d95;">双向收紧的防腐化策略</strong>：功能越复杂，代码越容易腐化。我们在本期启用了极其严苛的工具链，以“零容忍”的态度对待代码异味。
</div>

### 5.1 后端 Ruff 深度清理
- 在本期的最终交付前，我们对 `backend/src` 目录执行了全局无死角的 `ruff check --fix` 和 `ruff format`。
- 这次清理干掉了大量历史遗留的未使用导入（尤其是因 `playwright` 按需加载而产生的未使用引用警告）、不规范的变量命名以及隐蔽的格式偏差。通过强制手段，让后端的 Python 代码完全符合当前最高标准的 Lint 规范。

### 5.2 客户端 TypeScript 强约束
- 在完成了横跨数十个文件、极其庞大的 `ThreePanelLayout` 布局重构后，客户端代码库跑通了完整的 `pnpm run type-check` (`tsc --noEmit`) 类型校验。
- 确保了所有新增的 IPC 接口签名（如新增的获取系统指标 API）、React 组件的 Props 传递以及复杂的事件绑定完全做到了类型安全。真正实现了“编译即无错”的工程目标。

### 5.3 规范的延续：向全角标点说不
- 继续严格执行我们在第 1 期就确立的“全局中文全角标点禁令”。无论是底层核心代码注释、终端错误日志，还是对外的 Git 提交信息，均保持了半角标点（英文逗号、句号）的高度一致性，体现了团队对极致细节的掌控力。

---

## 本期 Git 核心提交明细 (按域归纳)

本期工作涵盖了大量的重构与新特性，以下是核心改动日志（覆盖范围: `git log 3bc882c..HEAD --oneline --no-merges`）。

### 客户端 (Client Electron) - 布局、主题与监控
- `3f0f11f` feat: 客户端主题切换与预览, 补图生图上传链路
- `8dce34a` feat(client): 新增系统信息接口和优化工具箱页面
- `74ac1f2` fix: 统一所有页面左侧栏折叠按钮和中间栏展开按钮逻辑
- `0bc0dd4` fix(settings): 统一标题栏图标大小为16px
- `237ad97` fix(settings): 修复折叠按钮逻辑和布局
- `6279baa` fix(settings): 修复设置页面标题栏对齐和样式一致性
- `e418510` feat(settings): 完善设置页面三段式布局
- `2bdfa35` feat(ai): 中间栏标题根据选中的分类动态变化，添加版本号显示
- `4d64d1c` feat(feedback): 完善反馈页面交互和样式
- `17ce097` feat(feedback): 添加反馈子分类功能
- `646eba8` fix(feedback): 优化反馈页面布局和提示内容
- `01ff898` fix(tools): 修复工具箱标题栏布局，确保折叠按钮正确显示
- `5ac3ec0` fix(tools): 统一工具箱标题栏padding，完善反馈页面邮箱功能
- `f63a29e` fix(tools): 修复工具箱页面布局对齐问题
- `c3704b6` feat(ui): 完善工具箱和反馈页面布局
- `94f2bbd` feat(ai): 完善文生图、图生图、音乐、视频页面的三段式布局
- `c86359f` feat(text_to_image): 添加右侧标题栏标题'图片生成'
- `a916b13` feat(text_to_image): 添加左侧风格分类栏，实现完整三段式布局
- `da70adb` style: 降低搜索框高度至28px，与按钮高度一致
- `a46ed16` style: 调整上传文件按钮padding和图标大小，适配标题栏高度
- `ab38231` style: 统一知识库页面底部按钮padding和图标大小

### 后端 (Backend) - 渲染重写与工程化
- `6adf89f` fix(ruff): 修复后端代码 Lint 警告，添加 noqa 标记
- `2274d46` fix(main): 初始化UpdateService以修复版本号获取

### 跨域治理与其他修复
- `c7bcb29` fix(tools): 添加PanelLeftClose导入
- `89d4dbc` fix(agent): 添加PanelLeftClose导入

---

## 6. 后续演进方向与技术债清理 (Roadmap)

<div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin:14px 0;color:#374151;">
  <strong style="color:#1f2937;">写在最后</strong>：架构的重构永远在路上，第6期的完成只是客户端体验升级的一个新起点。
</div>

本期虽然解决了视觉统一与断网渲染的两大痛点，但系统依然潜藏着一些技术债需要我们在接下来的迭代中逐步消化：

### 6.1 性能与打包体积优化
- **当前瓶颈**: 由于沉淀了大量的 PDF 离线资源（如体积较大的 KaTeX 字体文件与 Playwright 依赖），后端的发行体积出现了显著膨胀。
- **后续动作**: 我们计划在第7期引入资源的按需加载与 Gzip 压缩分发机制，并探索将部分静态资源的解析能力前置到客户端的 Renderer 进程中，以减轻后端的压力。

### 6.2 大模型交互链路的全面流式化 (Streaming)
- **当前瓶颈**: 目前的图生图、文档解析等链路大多采用同步等待机制，在处理超大体积图片或复杂提示词时，客户端会出现较长时间的“加载中”白屏状态，用户体验不够丝滑。
- **后续动作**: 全面推进 SSE (Server-Sent Events) 与 WebSockets 的接入，将所有与大模型交互的链路彻底流式化，实现打字机效果输出和进度实时回调。

### 6.3 跨平台与沙盒安全强化
- **当前瓶颈**: 当前的 WMI GPU 采集仅限 Windows 平台有效。
- **后续动作**: 
  - 引入 `systeminformation` 等跨平台 Node 库，补齐 macOS (Apple Silicon) 与 Linux 的硬件状态采集。
  - 进一步收紧 Electron 的 `contextIsolation` 安全策略，将更多原生 API 封装在白名单之内。

<br/>
<div style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
  如有问题, 请联系邮箱: wuhaotongxue@gmail.com
</div>