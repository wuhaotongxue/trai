/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 17:50:00
 * 描述: 更新日志页面
 */

"use client";

import { useState } from "react";
import { FileText, PlusCircle, Wrench, Bug, RefreshCw, FileCode, ChevronDown, FoldVertical, UnfoldVertical } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

// 提取类型的样式和图标映射
const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  feat: { 
    label: "新特性", 
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: <PlusCircle className="w-3.5 h-3.5" />
  },
  fix: { 
    label: "问题修复", 
    color: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    icon: <Bug className="w-3.5 h-3.5" />
  },
  refactor: { 
    label: "代码重构", 
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: <RefreshCw className="w-3.5 h-3.5" />
  },
  chore: { 
    label: "工程配置", 
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    icon: <Wrench className="w-3.5 h-3.5" />
  },
  docs: { 
    label: "文档更新", 
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: <FileCode className="w-3.5 h-3.5" />
  }
};

const changelogData = [
  {
    version: "v0.4.0",
    date: "2026-04-14",
    title: "Electron 客户端重生与全栈大整合",
    changes: [
      { type: "refactor", content: "桌面端抛弃 PyQt6 彻底拥抱 Electron, 带来原生流畅的 Win11 Fluent 体验与系统托盘管理" },
      { type: "feat", content: "对话界面深度支持 DeepSeek 流式响应、Markdown 渲染与核心的「思维链 (CoT) 加载状态」" },
      { type: "refactor", content: "前端官网首屏及周边营销页升级至 max-w-7xl 全宽大屏视觉, 管理后台彻底修复 React Hydration 报错" },
      { type: "feat", content: "上线基于真实 Git 提交的动态路线图与 FE/BE/CL 多端关系联动图谱" },
      { type: "feat", content: "后端接入多 Agent 注册模块, 新增包含目标体积压缩与尺寸裁剪的图片格式转换工具" },
      { type: "chore", content: "规范层面落地极其严苛的「中文全角标点禁令」与 ruff_check 自动化拦截" }
    ]
  },
  {
    version: "v0.3.0",
    date: "2026-04-10",
    title: "Agent 核心组件与可观测性重构",
    changes: [
      { type: "feat", content: "引入全新 Agent 状态流转机制, 增加工具调用上下文追踪与日志落库" },
      { type: "feat", content: "重构前端对话消息组件, 支持实时打字机流式效果与完整的 Markdown 语法渲染" },
      { type: "fix", content: "修复并发请求下大模型响应被截断的问题, 优化了流式解码的稳定性" },
      { type: "docs", content: "梳理客户端交互架构文档与 PostgreSQL 权限设计方案" }
    ]
  },
  {
    version: "v0.2.0",
    date: "2026-04-09",
    title: "后端与前端基础能力成型",
    changes: [
      { type: "feat", content: "完成基于 FastAPI 的基础接口设计与 PostgreSQL SQLAlchemy ORM 整合" },
      { type: "feat", content: "Next.js 15 前端应用骨架搭建, 采用 App Router 架构并深度集成 shadcn/ui 组件库" },
      { type: "feat", content: "实现全栈 JWT 用户身份认证机制、路由鉴权与 Token 刷新续期" },
      { type: "fix", content: "修复开发环境下 CORS 跨域请求被拦截的配置问题" }
    ]
  },
  {
    version: "v0.1.0",
    date: "2026-04-07",
    title: "项目初始化",
    changes: [
      { type: "chore", content: "创建 TRAI 核心代码仓库与初始 monorepo 目录结构" },
      { type: "docs", content: "拟定并输出基础架构设计文档、多域开发协作规范 (Skills)" },
      { type: "chore", content: "配置前后端基础 Linter 规则与 Git 提交拦截钩子" }
    ]
  }
];

export default function ChangelogPage() {
  // 默认全部展开
  const [expandedVersions, setExpandedVersions] = useState<string[]>(
    changelogData.map((v) => v.version)
  );

  const isAllExpanded = expandedVersions.length === changelogData.length;

  const toggleAll = () => {
    if (isAllExpanded) {
      setExpandedVersions([]);
    } else {
      setExpandedVersions(changelogData.map((v) => v.version));
    }
  };

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        {/* 头部区域 */}
        <section className="pt-28 pb-10 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  更新日志
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
                  Changelog
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed max-w-2xl">
                  记录 TRAI 平台每一次激动人心的迭代与功能进化. 从底层架构重构到细节体验打磨, 我们的步履从未停歇.
                </p>
              </div>
              
              {/* 全局折叠/展开控制 */}
              <button
                onClick={toggleAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors shrink-0"
              >
                {isAllExpanded ? (
                  <>
                    <FoldVertical className="w-4 h-4" />
                    全部折叠
                  </>
                ) : (
                  <>
                    <UnfoldVertical className="w-4 h-4" />
                    全部展开
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 日志列表区域 */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-4xl space-y-12">
              {changelogData.map((release, idx) => {
                const isExpanded = expandedVersions.includes(release.version);

                return (
                  <div key={idx} className="relative pl-0 md:pl-8">
                    {/* 时间轴左侧竖线 - 仅桌面端显示 */}
                    <div className="hidden md:block absolute left-[11px] top-10 bottom-[-48px] w-px bg-slate-200 dark:bg-slate-800 last:hidden" />
                    
                    {/* 版本卡片头部 */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-6">
                      <div className="flex items-center gap-3">
                        {/* 时间轴圆点 */}
                        <div className="hidden md:flex absolute left-0 w-6 h-6 rounded-full bg-white dark:bg-[#080c1a] border-4 border-blue-500 items-center justify-center z-10" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                          {release.version}
                        </h2>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {release.date}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                    </div>
                    
                    {/* 版本详情内容容器 */}
                    <div 
                      className={`bg-white dark:bg-[#0d1220] border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
                        isExpanded ? "pb-6" : "pb-0"
                      }`}
                    >
                      {/* 可点击的标题行 */}
                      <div 
                        className="p-6 pb-0 cursor-pointer group flex items-center justify-between"
                        onClick={() => toggleVersion(release.version)}
                      >
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {release.title}
                        </h3>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors shrink-0">
                          <ChevronDown 
                            className={`w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`} 
                          />
                        </div>
                      </div>
                      
                      {/* 折叠内容 */}
                      <div 
                        className={`px-6 transition-all duration-300 ease-in-out origin-top ${
                          isExpanded 
                            ? "opacity-100 max-h-[1000px] mt-6" 
                            : "opacity-0 max-h-0 mt-0 overflow-hidden"
                        }`}
                      >
                        <ul className="space-y-4">
                          {release.changes.map((change, i) => {
                            const typeInfo = typeConfig[change.type] || typeConfig.feat;
                            
                            return (
                              <li key={i} className="flex items-start gap-4">
                                <div className={`mt-0.5 flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold shrink-0 ${typeInfo.color}`}>
                                  {typeInfo.icon}
                                  {typeInfo.label}
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                                  {change.content}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}