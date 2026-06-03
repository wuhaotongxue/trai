<!-- Author: wuhao Date: 2026-06-03 -->
# TRAI 第14期: 多模态视听链路闭环, 工程化监控与离线缓存升级

<div style="background:linear-gradient(135deg,#eff6ff 0%,#f0f9ff 100%);border:1px solid #bfdbfe;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 全面打通音乐与视频生成多模态链路, 深度集成 Agnes AI 与本地 S3 存储; 引入 OpenTelemetry 链路追踪与 APScheduler 定时清理; Electron 客户端新增 SQLite 离线缓存; 多模态交互 UI 全面升级.
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_13/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">ec67a7ad</code> · 2026-06-01 09:25:28 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log ec67a7ad..HEAD</code>
</div>

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">预览配色</strong>: 彩色块写法与 <code>.cursor/skills/project/SKILL.md</code> 一致, 使用内联 <code>style</code>, 避免在 <code>&lt;div&gt;</code> 开头与正文之间插入<strong>空行</strong> (否则预览会把 <code>&lt;/div&gt;</code> 当成普通文字).
</div>

## 这次更新做了什么

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">后端与多模态 · 链路闭环</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">深度重构音乐歌词引擎与 S3 存储; 集成 Agnes AI 视频生成轮询与媒体资源转存; 智能字幕解析与前端直接预览.</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">工程化 · 监控与调度</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">引入 OpenTelemetry (Jaeger) 全局链路追踪; 增加 APScheduler 自动化定时清理任务, 防止垃圾数据堆积.</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">客户端 · 离线与交互</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">Electron 客户端接入 SQLite 本地离线缓存; 多模态面板布局优化与视频等待动画升级.</p>
</div>

### 1. 后端与多模态: 从「单点生成」到「视听闭环」

<div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;padding:12px 16px;margin:14px 0;color:#0e7490;">
  <strong style="color:#0e7490;">主线</strong>: 音乐歌词引擎重构 → Agnes AI 视频轮询机制 → S3 媒体资源转存 → 智能字幕前端渲染.
</div>

**音乐链路重构**: 彻底告别简单的音频返回, 增加歌词生成, 封面自动提取及梦幻播放器. 优化人声清晰度并杜绝抄袭问题. 支持历史音乐的封面展示与歌词预览.

**视频与图像集成**: 引入 Agnes AI, 支持图文/视频生成的稳定轮询与 S3 转存. 客户端添加 tenacity 退避重试机制, 有效解决视频生成轮询接口 404 错误. 将外部生成的媒体资源转存至本地 S3 并返回预签名 URL, 防止防盗链拦截.

**智能字幕预览**: 告别外部下载, 实现 SRT 字幕的直接解析与站内滚动预览. 重构智能字幕结果展示面板, 修复纯音频任务无结果显示的缺陷.

### 2. 工程化架构: 从「跑得通」到「跑得稳」

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">基石加固</strong>: OpenTelemetry 监控 API 性能瓶颈; APScheduler 作为后台清洁工维护 S3 与临时目录整洁.
</div>

- **链路追踪 (OTLP)**: 集成 Jaeger 分布式追踪, 自动监控 FastAPI 与各路大模型 LLM API 的请求耗时. 统一同网段 OTLP 默认上报地址, 并修复 Jaeger 初始化顺序.
- **定时清理任务**: 增加基于 APScheduler 的定时任务调度, 自动检测并删除过期临时文件与废弃的 S3 垃圾数据.

### 3. 客户端交互: 从「依赖网络」到「离线可用」

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  为 Electron 客户端插上离线翅膀, 断网依然可查; UI 视觉细节同步升级.
</div>

- **SQLite 本地缓存**: 引入 SQLite 作为本地数据库底座, 支持断网环境下离线查看历史聊天记录与媒体资产, 大幅降低首屏加载时的网络请求压力.
- **UI 与动效**: 视频等待状态增加胶片滚动与 4K 渲染趣味动画; 画廊与多模态面板布局结构优化, 画廊移至独立底栏.

## 本期 Git 摘要 (按主题)

| 主题 | 内容要点 |
|------|----------|
| 多模态音乐 | 重构歌词引擎, 优化人声清晰度, 修复音乐生成 UI 与前端梦幻播放器 |
| 多模态视频 | 集成 Agnes AI, 支持图文/视频生成轮询, S3 转存及 tenacity 重试 |
| 可观测性 | 引入 OpenTelemetry (Jaeger) 监控 FastAPI 与 LLM 耗时, 统一配置 |
| 定时调度 | 新增 APScheduler 定时任务, 自动清理过期临时文件与 S3 数据 |
| 客户端架构 | Electron 接入 SQLite 本地缓存, 支持断网环境历史记录查看 |
| 考试后台 | 完成考试发布与答卷后台管理闭环逻辑 |
| 前端交互 | 视频等待趣味动画, 智能字幕前端渲染, 多模态面板画廊布局优化 |

## 下一步方向

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">续写第 15 期时</strong>: 用 <code>git log -1 -- md/issue_14/index.md</code> 取本期入库提交作新锚点, 再拉 <code>git log</code> 写 <code>md/issue_15/index.md</code>. 详见 <code>.trae/skills/project/issue_index/SKILL.md</code>.
</div>

- 推进前端公开答题页与提交流程闭环.
- 补齐主观题人工复核, 改分及再次同步功能.
- 继续优化本地 SQLite 缓存机制, 实现与远程后端的无缝数据同步与冲突处理.

---

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <em>编写说明: 本期依据 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log</code> 自 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_13/index.md</code> 最后入库提交起算; 可选样式表见 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_docs.css</code>. 如有问题, 请联系邮箱: wuhaotongxue@gmail.com.</em>
</div>