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
import { useI18n } from "@/i18n/i18n_context";

const typeConfig = {
  feat: {
    labelKey: "changelog.tag.feat",
    color: "bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white border-slate-900 dark:border-white",
    icon: <PlusCircle className="w-4 h-4" />,
  },
  fix: {
    labelKey: "changelog.tag.fix",
    color: "bg-rose-300 dark:bg-rose-600 text-slate-900 dark:text-white border-slate-900 dark:border-white",
    icon: <Bug className="w-4 h-4" />,
  },
  refactor: {
    labelKey: "changelog.tag.refactor",
    color: "bg-amber-300 dark:bg-amber-600 text-slate-900 dark:text-white border-slate-900 dark:border-white",
    icon: <RefreshCw className="w-4 h-4" />,
  },
  chore: {
    labelKey: "changelog.tag.chore",
    color: "bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white border-slate-900 dark:border-white",
    icon: <Wrench className="w-4 h-4" />,
  },
  docs: {
    labelKey: "changelog.tag.docs",
    color: "bg-indigo-300 dark:bg-indigo-600 text-slate-900 dark:text-white border-slate-900 dark:border-white",
    icon: <FileCode className="w-4 h-4" />,
  },
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
      { type: "chore", content: "规范层面落地极其严苛的「中文全角标点禁令」与 ruff_check 自动化拦截" },
    ],
  },
  {
    version: "v0.3.0",
    date: "2026-04-10",
    title: "Agent 核心组件与可观测性重构",
    changes: [
      { type: "feat", content: "引入全新 Agent 状态流转机制, 增加工具调用上下文追踪与日志落库" },
      { type: "feat", content: "重构前端对话消息组件, 支持实时打字机流式效果与完整的 Markdown 语法渲染" },
      { type: "fix", content: "修复并发请求下大模型响应被截断的问题, 优化了流式解码的稳定性" },
      { type: "docs", content: "梳理客户端交互架构文档与 PostgreSQL 权限设计方案" },
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-04-09",
    title: "后端与前端基础能力成型",
    changes: [
      { type: "feat", content: "完成基于 FastAPI 的基础接口设计与 PostgreSQL SQLAlchemy ORM 整合" },
      { type: "feat", content: "Next.js 15 前端应用骨架搭建, 采用 App Router 架构并深度集成 shadcn/ui 组件库" },
      { type: "feat", content: "实现全栈 JWT 用户身份认证机制、路由鉴权与 Token 刷新续期" },
      { type: "fix", content: "修复开发环境下 CORS 跨域请求被拦截的配置问题" },
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-04-07",
    title: "项目初始化",
    changes: [
      { type: "chore", content: "创建 TRAI 核心代码仓库与初始 monorepo 目录结构" },
      { type: "docs", content: "拟定并输出基础架构设计文档、多域开发协作规范 (Skills)" },
      { type: "chore", content: "配置前后端基础 Linter 规则与 Git 提交拦截钩子" },
    ],
  },
];

export default function ChangelogPage() {
  const { translate } = useI18n();
  const [expandedVersions, setExpandedVersions] = useState<string[]>(
    changelogData.map((v) => v.version),
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
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <section className="pt-28 pb-10 bg-emerald-300 dark:bg-emerald-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">
                  <FileText className="h-4 w-4" />
                  {translate("changelog.title")}
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mt-6 tracking-widest uppercase">
                  Changelog
                </h1>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-4 leading-relaxed max-w-2xl">
                  {translate("changelog.subtitle")}
                </p>
              </div>

              <button
                onClick={toggleAll}
                className="inline-flex items-center gap-2 px-6 py-3 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all shrink-0"
              >
                {isAllExpanded ? (
                  <>
                    <FoldVertical className="w-5 h-5" />
                    {translate("changelog.collapse_all")}
                  </>
                ) : (
                  <>
                    <UnfoldVertical className="w-5 h-5" />
                    {translate("changelog.expand_all")}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="max-w-4xl space-y-16">
              {changelogData.map((release, idx) => {
                const isExpanded = expandedVersions.includes(release.version);

                return (
                  <div key={idx} className="relative pl-0 md:pl-8">
                    <div className="hidden md:block absolute left-[14px] top-12 bottom-[-64px] w-1 bg-slate-900 dark:bg-white last:hidden" />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex absolute left-0 w-8 h-8 rounded-none bg-emerald-400 dark:bg-emerald-600 border-4 border-slate-900 dark:border-white items-center justify-center z-10 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]" />
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {release.version}
                        </h2>
                        <span className="px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">
                          {release.date}
                        </span>
                      </div>
                      <div className="h-1 flex-1 bg-slate-900 dark:bg-white hidden sm:block" />
                    </div>

                    <div
                      className={`bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] transition-all overflow-hidden ${
                        isExpanded ? "pb-8" : "pb-0"
                      }`}
                    >
                      <div
                        className="p-8 pb-0 cursor-pointer group flex items-center justify-between"
                        onClick={() => toggleVersion(release.version)}
                      >
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {release.title}
                        </h3>
                        <div className="w-12 h-12 rounded-none bg-slate-100 dark:bg-slate-900 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center group-hover:bg-emerald-300 dark:group-hover:bg-emerald-600 group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0px_0px_#0f172a] dark:group-hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all shrink-0">
                          <ChevronDown
                            className={`w-6 h-6 text-slate-900 dark:text-white transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      <div
                        className={`px-8 transition-all duration-300 ease-in-out origin-top ${
                          isExpanded
                            ? "opacity-100 max-h-[2000px] mt-8"
                            : "opacity-0 max-h-0 mt-0 overflow-hidden"
                        }`}
                      >
                        <ul className="space-y-6">
                          {release.changes.map((change, i) => {
                            const typeInfo = typeConfig[change.type as keyof typeof typeConfig] || typeConfig.feat;

                            return (
                              <li key={i} className="flex items-start gap-6">
                                <div className={`mt-0.5 flex items-center gap-2 px-3 py-1.5 rounded-none border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] text-sm font-black uppercase tracking-widest shrink-0 ${typeInfo.color}`}>
                                  {typeInfo.icon}
                                  {translate(typeInfo.labelKey)}
                                </div>
                                <span className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
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
