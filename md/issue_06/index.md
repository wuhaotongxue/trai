# TRAI 第6期: 客户端深度重构, 三段式布局与深色模式, Mermaid 渲染优化

<div style="background:linear-gradient(135deg,#eff6ff 0%,#f0f9ff 100%);border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 继第4期彻底拥抱 Electron、第5期落地知识库之后, 本期全面重构了客户端视觉——全量铺开“三段式折叠布局”与“深色模式”切换; 同时彻底拔除 MD 转 PDF 的外网 CDN 依赖, 实现断网下 Mermaid 与公式的完美渲染.
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_05/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">3bc882c</code> · 2026-04-17 17:30:38 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 3bc882c..HEAD</code>
</div>

## 这次更新做了什么

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">客户端 · 全局三段式与视觉重塑</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">将仪表盘、AI 创作、工具箱与设置页全量重构为统一的 <code>ThreePanelLayout</code>. 引入一键切换深浅色模式(CSS 变量驱动), 并统一全站“四字文案”与排版规范, 解决中英文字符在窄边栏的错位痛点.</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">底层渲染 · MD 转 PDF 断网可用</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">将 Mermaid、KaTeX 等核心渲染库全部沉淀至后端本地资源目录; 重写 Markdown 代码块提取引擎, 解决 Python-Markdown 破坏公式的顽疾, 并在客户端加入原 MD vs 产物 PDF 实时双向预览.</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">工程治理 · 数据监控与极度洁癖</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">仪表盘新增 GPU 监控与 2 秒平滑轮询机制; 后端代码执行全局 <code>ruff check --fix</code> 清理坏味道; 客户端在庞大重构后通过严格 <code>tsc --noEmit</code> 类型校验, 确保 IPC 与 UI 零隐患.</p>
</div>

## 1. 客户端: 全局三段式与深色模式落地

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">核心点</strong>: 告别各页面“各自为战”的排版, 用同一套骨架收拢导航、列表与详情, 同时把暗黑模式的基础设施一次性铺开.
</div>

**三段式折叠布局 (ThreePanelLayout)**:
- **统一阵型**: 无论是“仪表盘 -> 系统信息 -> 详情”, 还是“AI创作 -> 文生图分类 -> 参数面板”, 全部统一为“左-中-右”三栏结构.
- **动态控制优化**: 中间列表的“收起”按钮统一锚定在头部最右侧, “展开”按钮挂在右侧详情区的头部最左侧, 形成符合直觉的开合体验.
- **防溢出与文案规范**: 抽离 `ui_text.ts` 全局处理“文字超过4个字自动省略”; 将 AI 创作、设置、反馈等页面的子分类名全部规整为“四字风格”(如: 动物风格、系统设置), 视觉极致对齐.

**深色模式与持久化**:
- **CSS 变量驱动**: 摒弃 React 行内硬编码颜色, 全面改用 `html[data-theme]` 注入 `--bg-primary` 等变量.
- **一键切换**: 顶栏新增太阳/月亮图标, 支持一键切换, 并将用户偏好实时持久化到本地配置.

## 2. 底层渲染: 脱离外网的 Mermaid 与 KaTeX

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">核心点</strong>: 彻底斩断 PDF 导出强依赖外网 CDN 的隐患, 实现内网环境下图表与复杂公式的高保真渲染.
</div>

- **本地化依赖**: 将 `mermaid.min.js`, `katex.min.js` 及其配套 CSS 全部沉淀到 `backend/assets/pdf_vendor/`. 即使在纯内网环境, 导出的 PDF 依然能渲染流程图和数学矩阵.
- **解析健壮性重构**: 抛弃粗暴的大正则匹配, 重写后端对 Markdown 代码块的“逐行解析”引擎. 遇到没有换行、错误闭合等不规范 Markdown 也能宽容提取; 若无法识别, 通过 IPC 抛出明确的中文错误拦截.
- **渲染保真分段策略**: 采用“先提取公式 -> MD 转 HTML -> 再还原公式”的隔离策略, 彻底解决 Python-Markdown 转义 `^`、`_` 等符号导致 KaTeX 渲染崩溃的历史顽疾.

## 3. 数据监控与图生图闭环

<div style="background:#fff1f2;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <div style="font-weight:700;color:#be123c;margin-bottom:8px;">体验优化要点</div>
  <p style="margin:0;">在基建重构的同时, 业务能力也在持续打磨, 重点消除了数据监控的粗糙感, 并补齐了图生图的完整链路.</p>
</div>

- **仪表盘监控扩容**: 系统信息监控补充了 GPU 数据采集(Windows WMI), CPU、内存折线图改为平滑的 2 秒轮询机制, 加入 Y 轴刻度, 告别数据闪烁.
- **图生图闭环**: 补齐客户端本地图片的选取、Base64 转换与后端 `api/routers/ai/image.py` 的对接链路, 客户端直接支持本地图片预览并推给大模型.
- **双向预览赋能**: 客户端 MD 转 PDF 工具箱新增 iframe 双向预览, 左侧看 Markdown 原文, 右侧实时预览生成的 PDF 产物.

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