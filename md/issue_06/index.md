# TRAI 第6期: 客户端深度重构, 三段式布局与深色模式, Mermaid 渲染优化

<div style="background:linear-gradient(135deg,#eff6ff 0%,#f0f9ff 100%);border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 继第4期彻底拥抱 Electron、第5期落地管理后台与知识库之后, 本期全面重构了客户端视觉——全量铺开“三段式折叠布局”与“深色模式”切换; 同时彻底拔除 MD 转 PDF 的外网 CDN 依赖, 实现断网下 Mermaid 与公式的完美渲染.
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_05/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">3bc882c</code> · 2026-04-17 17:30:38 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 3bc882c..HEAD</code>
</div>

## 这次更新做了什么

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">客户端 · 全局三段式与视觉重塑</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">承接第 4 期的 Win11 Fluent 风格，本期将仪表盘、AI 创作、工具箱与设置页全量重构为统一的 <code>ThreePanelLayout</code>. 引入一键切换深浅色模式(CSS 变量驱动), 并统一全站“四字文案”与排版规范, 解决中英文字符在窄边栏的错位痛点.</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">底层渲染 · MD 转 PDF 断网可用</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">将 Mermaid、KaTeX 等核心渲染库全部沉淀至后端本地资源目录; 重写 Markdown 代码块提取引擎, 解决 Python-Markdown 破坏公式的顽疾, 并在客户端加入原 MD vs 产物 PDF 实时双向预览.</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">工程治理 · 数据监控与极度洁癖</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">沿着第 2、3 期的规范化思路，仪表盘新增 GPU 监控与 2 秒平滑轮询机制; 后端代码执行全局 <code>ruff check --fix</code> 清理坏味道; 客户端在庞大重构后通过严格 <code>tsc --noEmit</code> 类型校验, 确保 IPC 与 UI 零隐患.</p>
</div>

---

## 1. 客户端: 全局三段式布局 (ThreePanelLayout) 的重构

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">核心点</strong>: 告别各页面“各自为战”的排版, 用同一套骨架收拢导航、列表与详情, 极大提升了代码复用率和视觉的整齐度.
</div>

在早期的客户端开发中，每个页面（如仪表盘、设置页、工具箱、智能对话）都在手动维护左右分栏结构。这不仅导致了 CSS 代码的大量冗余，还带来了极难维护的边距对齐问题。本期我们抽离了顶层的 `ThreePanelLayout` 组件，将其作为所有主要页面的基础骨架。

**1. 结构与动态控制优化**:
- **统一阵型**: 无论是“仪表盘 -> 系统信息 -> 详情”, 还是“AI创作 -> 文生图分类 -> 参数面板”, 全部统一为“左(主导航)-中(子列表)-右(内容详情)”的三栏结构。
- **开合逻辑重构**: 中间列表的“收起”按钮统一锚定在头部最右侧，而“展开”按钮则挂在右侧详情区的头部最左侧。这种设计彻底符合了用户在桌面端折叠面板时的直觉操作体验。
- **响应式防溢出**: 三栏布局底层使用 Flexbox 与 `min-width` 的强约束。即使在调整窗口大小的过程中，也能保证中栏内容不被生硬截断或挤压变形。

**2. “四字文案”与排版规范的强制落地**:
- **中文排版痛点**: 在窄边栏中，混合长度的中文字符（尤其是3个字和5个字的混排）极易造成视觉参差不齐。
- **ui_text.ts 全局接管**: 抽离了 `should_ellipsis` 和 `to_fixed_chars` 工具函数，全局接管中栏和左栏的标题截断。
- **重命名规整**: 将 AI 创作、设置、反馈等页面的子分类名全部规整为“四字风格”。例如，将“动物”改为“动物风格”，将“系统”改为“系统设置”。对于不足四字或超过四字的场景，严格遵循“>4字省略号”和“<=4字完整显示”的规则。现在整个侧边栏的视觉高度对齐，治愈了强迫症。

---

## 2. 拥抱深色模式 (Dark Mode) 与持久化状态

<div style="background:#fef3c7;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin:14px 0;color:#92400e;">
  <strong style="color:#b45309;">核心点</strong>: 从硬编码颜色全面迁移到 CSS 变量，实现了真正的动态主题切换，并支持用户配置的持久化。
</div>

在第 4 期的重构中，我们确定了不使用紫色系的色彩规范。本期更进一步，彻底铲除了代码中遗留的 `#ffffff` 或 `#f8fafc` 这类硬编码背景色。

**1. CSS 变量驱动的色彩体系**:
- 在 `global.css` 中，我们定义了一套完整的色彩语义变量：
  - `--bg-primary`、`--bg-secondary`、`--bg-hover`
  - `--text-primary`、`--text-secondary`
  - `--border-color`
- 通过在根节点 `html[data-theme="light|dark"]` 上切换属性，实现了全局背景、边框、文字颜色的无缝切换。

**2. 一键切换与持久化**:
- 顶栏组件 `title_bar.tsx` 新增了太阳/月亮图标，支持用户一键切换浅色/深色模式。
- **状态同步**: 切换主题时，不仅会更新 DOM，还会将偏好写入本地配置（与 API 地址等设置一样），确保用户下次打开客户端时依然保持其选择的主题。
- 各个页面（如侧边栏、对话页气泡、工具箱卡片）已经全面适配了这套 CSS 变量，深色模式下的对比度与易读性得到了极大改善。

---

## 3. 底层渲染: 彻底脱离外网的 Mermaid 与 KaTeX

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">核心点</strong>: 彻底斩断 PDF 导出强依赖外网 CDN 的隐患, 实现内网环境下图表与复杂公式的高保真渲染，解决历史遗留的正则破坏问题。
</div>

Markdown 转 PDF 是 TRAI 平台的核心能力之一。但在过去的版本中，由于 `wkhtmltopdf` 或 `Playwright` 渲染时需要加载 CDN 上的 `mermaid.min.js` 和 `katex.min.js`，一旦用户网络环境受限，导出的 PDF 中就会出现流程图空白或公式无法解析的致命缺陷。

**1. 依赖全面本地化**:
- 将 Mermaid 和 KaTeX 相关的 JS 和 CSS 资源全部下载并沉淀到 `backend/assets/pdf_vendor/` 目录下。
- 后端在拼装 HTML 模板时，直接通过相对路径或注入本地脚本的方式加载这些资源。现在，哪怕是在纯内网或断网环境下，导出的 PDF 依然能渲染出精美的流程图和复杂的数学矩阵。

**2. 解析健壮性重写 (解决 Python-Markdown 的历史顽疾)**:
- **旧痛点**: 原有的后端大正则匹配方式非常脆弱，一旦 Markdown 文件中 ````mermaid` 没有正确闭合，或者缺少换行符，就会导致整个文件的提取崩溃。更严重的是，`Python-Markdown` 库在转译 HTML 时，会无脑将复杂 KaTeX 公式中的 `^`、`_` 等符号转义为 `<em>` 或 `<sup>` 标签，导致公式彻底损毁。
- **新架构**:
  - **逐行解析引擎**: 抛弃粗暴的大正则匹配，重写后端对 Markdown 代码块的提取逻辑为“逐行扫描”机制。它能宽容处理不规范的缩进、缺失的换行符以及错误的闭合标记。若实在无法识别，则通过 IPC 抛出明确的中文错误拦截（如“未检测到闭合的反引号”）。
  - **渲染保真分段策略**: 采用了“先提取公式和图表并替换为占位符 -> MD 转 HTML -> 再将原始内容还原回 HTML 占位符”的隔离策略。这一策略成功避开了 Python-Markdown 的瞎转义，彻底解决了 KaTeX 渲染崩溃的历史顽疾。

**3. 客户端双向预览赋能**:
- 客户端 MD 转 PDF 工具箱新增了 iframe 双向预览架构。
- 左侧可查看 Markdown 原文，右侧嵌入了生成的 PDF 产物预览框，实现了“所见即所得”的转化体验。

---

## 4. 业务能力扩容：数据监控平滑化与图生图闭环

<div style="background:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <div style="font-weight:700;color:#be123c;margin-bottom:8px;">体验优化要点</div>
  <p style="margin:0;">在基建重构的同时, 业务能力也在持续打磨, 重点消除了数据监控的粗糙感, 并补齐了图生图的完整链路.</p>
</div>

**1. 仪表盘监控的深度优化**:
- **GPU 采集**: 系统信息监控打破了只看 CPU/内存的局限，主进程新增了针对 Windows WMI 的调用，实现了本地 GPU 信息的读取与展示。
- **2秒平滑轮询**: 过去的 CPU 和内存折线图每秒刷新一次，由于没有过渡动画，视觉上显得极为生硬和闪烁。本期将轮询频率降至 2 秒，引入了 ECharts 的平滑过渡动画，并在折线图上补充了清晰的 Y 轴刻度文本，消除了数据盲区。

**2. 图生图全链路闭环**:
- 过去图生图功能仅停留在 UI 层面，缺乏与大模型的交互链路。
- 本期补齐了客户端本地图片的选取能力，并在 Renderer 进程实现了图片的 Base64 转换。
- 转换后的数据通过 IPC 安全通道传给 Main 进程，最终对接到后端新开放的 `api/routers/ai/image.py` 接口。客户端现在可直接支持本地图片预览并推给大模型进行重绘。

---

## 5. 工程治理与代码洁癖

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong style="color:#4c1d95;">双向收紧</strong>：在功能狂飙的同时，我们用极其严苛的工具链保证代码库不腐化，继续贯彻极度洁癖的工程文化。
</div>

- **后端 Ruff 深度介入**:
  - 本期对 `backend/src` 执行了全局的 `ruff check --fix` 和 `ruff format`。
  - 清理了大量未使用的导入（如因 `playwright` 按需加载而产生的未使用引用警告）、变量异味与格式偏差。强制让 Python 代码符合严苛的 Lint 标准。
- **客户端 TypeScript 强约束**:
  - 在完成庞大的 `ThreePanelLayout` 重构后，客户端跑通了完整的 `tsc --noEmit` 类型校验。
  - 确保所有新增的 IPC 接口签名、React Props 和事件绑定完全类型安全，实现了“编译即无错”。
- **规范的延续**:
  - 继续严格执行第 1 期确立的“全局中文全角标点禁令”。无论是代码注释、终端日志还是 Git 提交信息，均保持了半角标点的高度一致性。

---

## 本期 Git 更新(按域归纳)

本期覆盖范围: `git log 3bc882c..HEAD --oneline --no-merges`。

| 域 | 重点内容 | 代表提交(节选) |
|---|---|---|
| 客户端(client_electron) | 三段式布局全量铺开, 深浅色主题切换, 图生图上传, 仪表盘监控 | `3f0f11f` `8dce34a` `e418510` `c3704b6` `94f2bbd` |
| 后端(backend) | MD 转 PDF 渲染链路重写, 本地依赖沉淀, 强制 ruff_check | `6adf89f` `8dce34a` |
| 规范与 UI(skills) | UI 四字文案统一规范, 统一折叠按钮逻辑 | `74ac1f2` `2bdfa35` `5ac3ec0` |

### 关键提交清单(更细一层)

| 主题 | 代表提交(节选) |
|---|---|
| 布局与视觉重构 | `74ac1f2` `237ad97` `e418510` `c3704b6` `94f2bbd` |
| 渲染与主题支持 | `3f0f11f` `8dce34a` |
| 工具箱与监控 | `01ff898` `5ac3ec0` `8dce34a` |
| 代码质量治理 | `6adf89f` `c7bcb29` `89d4dbc` |

<details>
  <summary><strong>完整提交列表(节选, 便于对照 git log)</strong></summary>
  <pre>
3f0f11f feat: 客户端主题切换与预览, 补图生图上传链路
8dce34a feat(client): 新增系统信息接口和优化工具箱页面
6adf89f fix(ruff): 修复后端代码 Lint 警告，添加 noqa 标记
c7bcb29 fix(tools): 添加PanelLeftClose导入
89d4dbc fix(agent): 添加PanelLeftClose导入
74ac1f2 fix: 统一所有页面左侧栏折叠按钮和中间栏展开按钮逻辑
0bc0dd4 fix(settings): 统一标题栏图标大小为16px
2274d46 fix(main): 初始化UpdateService以修复版本号获取
237ad97 fix(settings): 修复折叠按钮逻辑和布局
6279baa fix(settings): 修复设置页面标题栏对齐和样式一致性
e418510 feat(settings): 完善设置页面三段式布局
2bdfa35 feat(ai): 中间栏标题根据选中的分类动态变化，添加版本号显示
4d64d1c feat(feedback): 完善反馈页面交互和样式
17ce097 feat(feedback): 添加反馈子分类功能
646eba8 fix(feedback): 优化反馈页面布局和提示内容
01ff898 fix(tools): 修复工具箱标题栏布局，确保折叠按钮正确显示
5ac3ec0 fix(tools): 统一工具箱标题栏padding，完善反馈页面邮箱功能
f63a29e fix(tools): 修复工具箱页面布局对齐问题
c3704b6 feat(ui): 完善工具箱和反馈页面布局
94f2bbd feat(ai): 完善文生图、图生图、音乐、视频页面的三段式布局
c86359f feat(text_to_image): 添加右侧标题栏标题'图片生成'
a916b13 feat(text_to_image): 添加左侧风格分类栏，实现完整三段式布局
da70adb style: 降低搜索框高度至28px，与按钮高度一致
a46ed16 style: 调整上传文件按钮padding和图标大小，适配标题栏高度
ab38231 style: 统一知识库页面底部按钮padding和图标大小
  </pre>
</details>

<br/>
<div style="font-size: 13px; color: #666; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
  如有问题, 请联系邮箱: wuhaotongxue@gmail.com
</div>