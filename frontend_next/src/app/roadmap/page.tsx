/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 10:00:00
 * 描述: 项目发展路线图
 */

"use client";

import { CheckCircle2, ChevronRight, CircleDashed, Milestone, Rocket } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";
import { useMemo, useState } from "react";

type ChangeArea = "frontend" | "backend" | "client";

type RoadmapStatus = "completed" | "in_progress" | "planned";

type RoadmapNode = {
  id: string;
  range_label: string;
  title: string;
  status: RoadmapStatus;
  items: string[];
};

type CommitType = "feat" | "fix" | "refactor" | "docs" | "chore" | "merge" | "other";

const roadmap_nodes: RoadmapNode[] = [
  {
    id: "2026-04-07",
    range_label: "2026-04-07",
    title: "项目初始化",
    status: "completed",
    items: [
      "Add README",
      "test: wuhao -> develop -> main",
      "merge: wuhao into develop",
      "merge: develop into main",
    ],
  },
  {
    id: "2026-04-08",
    range_label: "2026-04-08",
    title: "版本标记与规范完善",
    status: "completed",
    items: [
      "chore: add VERSION 0.1.0",
      "Merge pull request #1 from wuhaotongxue/wuhao",
      "更新README.md文件",
      "docs: update README",
      "feat: 完善 skills 体系与规则索引",
      "chore: 清理 README 末尾空白",
      "Merge pull request #2 from wuhaotongxue/wuhao",
    ],
  },
  {
    id: "2026-04-09",
    range_label: "2026-04-09",
    title: "后端与前端基础能力成型",
    status: "completed",
    items: [
      "feat(backend): 初始化 TRAI 后端项目结构",
      "feat: 新增 backend/.env.example 完整配置模板",
      "feat(project): 创建项目待办清单 TODO.md, 梳理全模块规划",
      "feat(frontend): 初始化 Next.js 项目, 开发 TODO 管理页面",
      "feat(backend): 新增 AI 对话、绘图、媒体上传、会话管理及数据库 ORM 功能",
      "refactor(backend): 重构代码目录结构, 优化 DDD 五层架构路径",
      "feat(backend): 新增安全认证模块 (JWT/密码哈希) 与领域仓储接口",
      "feat(backend): 新增认证路由模块 (登录/注册/登出/刷新令牌/当前用户)",
      "feat(backend): 新增 UserModel 数据库模型与 UserRepository 仓储实现",
    ],
  },
  {
    id: "2026-04-10",
    range_label: "2026-04-10",
    title: "Agent 核心组件与可观测性增强",
    status: "completed",
    items: [
      "feat(agent): 新增 PolicyEngine/TokenCounter/ContextManager 三大核心组件并完善 Agent 工具生态",
      "feat(backend): 完善认证接口 (数据库集成/密码管理/用户管理)",
      "feat(backend): 完善会话/AI/媒体接口并新增数据库初始化脚本",
      "feat(backend): 增强健康检查/监控接口并新增通知管理接口",
      "feat(backend): 完善会话路由并新增可观测性/限流/审计中间件",
      "docs(agent): 融合 Agent Harness 2026 论文, 新增可观测性子规范",
    ],
  },
  {
    id: "2026-04-13",
    range_label: "2026-04-13",
    title: "客户端 Electron 迁移与工程化修复",
    status: "completed",
    items: [
      "refactor: 移除原 desktop_client 并重定向规范至 client_electron",
      "fix(frontend_next): 将前端模块从子模块链接转换为常规文件追踪",
      "feat(client_electron): 新增客户端左侧菜单、路由及注册登录模块",
      "fix(client_electron): 修复打包后应用白屏问题 (修正 Vite 及加载路径)",
      "feat(client_electron): 集成系统托盘并重构 Win11 Fluent Design 风格 UI",
      "feat: 完善客户端登录与注册功能, 接入后端真实接口",
      "fix: 修复后端登录接口的 AttributeError 异常及客户端打包配置",
      "fix: 从版本库中移除误提交的 client_electron/node_modules",
    ],
  },
  {
    id: "2026-04-14",
    range_label: "2026-04-14",
    title: "代码合并与分支同步",
    status: "completed",
    items: [
      "Merge pull request #34 from wuhaotongxue/develop",
      "Merge pull request #33 from wuhaotongxue/wuhao",
    ],
  },
  {
    id: "2026-q2",
    range_label: "2026 Q2",
    title: "数据分析与企业级特性",
    status: "in_progress",
    items: [
      "后台管理面板与数据可视化报表",
      "角色权限与月度配额控制系统",
      "流式 SSE 响应优化",
      "私有化部署方案探索",
    ],
  },
  {
    id: "2026-q3",
    range_label: "2026 Q3",
    title: "生态扩展与多模态",
    status: "planned",
    items: [
      "自定义插件市场",
      "语音交互与实时 TTS",
      "多智能体协同 (Multi-Agent)",
      "更丰富的可视化编排工作流",
    ],
  },
];

function normalize_display_text(value: string): string {
  return value
    .replaceAll(", ", ",")
    .replaceAll(": ", ":")
    .replaceAll("（", "(")
    .replaceAll("）", ")")
    .replaceAll(". ", ".")
    .replaceAll("! ", "!")
    .replaceAll("? ", "?");
}

function infer_area_from_subject(subject: string): ChangeArea | null {
  const s = subject.toLowerCase();
  if (s.includes("frontend_next") || s.includes("feat(frontend") || s.includes("fix(frontend") || s.includes("frontend")) return "frontend";
  if (s.includes("backend") || s.includes("feat(backend") || s.includes("fix(backend") || s.includes("refactor(backend") || subject.includes("后端") || s.includes("fastapi")) return "backend";
  if (s.includes("client_electron") || s.includes("electron") || s.includes("client")) return "client";
  return null;
}

function infer_commit_type(subject: string): CommitType {
  const s = subject.toLowerCase();
  if (s.startsWith("merge pull request") || s.startsWith("merge:") || s.startsWith("merge ")) return "merge";
  if (s.startsWith("feat")) return "feat";
  if (s.startsWith("fix")) return "fix";
  if (s.startsWith("refactor")) return "refactor";
  if (s.startsWith("docs")) return "docs";
  if (s.startsWith("chore")) return "chore";
  return "other";
}

function get_area_meta(area: ChangeArea): { label: string; badge_class_name: string; node_class_name: string } {
  if (area === "frontend") {
    return {
      label: "前端",
      badge_class_name: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
      node_class_name: "fill-blue-500",
    };
  }

  if (area === "backend") {
    return {
      label: "后端",
      badge_class_name: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
      node_class_name: "fill-emerald-500",
    };
  }

  return {
    label: "客户端",
    badge_class_name: "bg-amber-50 text-cyan-800 dark:bg-slate-200/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
    node_class_name: "fill-cyan-500",
  };
}

function get_commit_type_meta(type: CommitType): { label: string; badge_class_name: string } {
  if (type === "feat") return { label: "feat", badge_class_name: "border-blue-200 text-blue-700 dark:border-blue-500/20 dark:text-blue-300" };
  if (type === "fix") return { label: "fix", badge_class_name: "border-rose-200 text-rose-700 dark:border-rose-500/20 dark:text-rose-300" };
  if (type === "refactor") return { label: "refactor", badge_class_name: "border-teal-200 text-teal-700 dark:border-teal-500/20 dark:text-teal-300" };
  if (type === "docs") return { label: "docs", badge_class_name: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300" };
  if (type === "chore") return { label: "chore", badge_class_name: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300" };
  if (type === "merge") return { label: "merge", badge_class_name: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300" };
  return { label: "other", badge_class_name: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300" };
}

function get_status_meta(status: RoadmapStatus): {
  label: string;
  badge_class_name: string;
  dot_class_name: string;
  icon: "check" | "rocket" | "planned";
} {
  if (status === "completed") {
    return {
      label: "已完成",
      badge_class_name: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
      dot_class_name: "bg-emerald-500 dark:bg-slate-100",
      icon: "check",
    };
  }

  if (status === "in_progress") {
    return {
      label: "进行中",
      badge_class_name: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
      dot_class_name: "bg-blue-500 dark:bg-blue-400",
      icon: "rocket",
    };
  }

  return {
    label: "计划中",
    badge_class_name: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    dot_class_name: "bg-slate-400 dark:bg-slate-600",
    icon: "planned",
  };
}

function build_area_stats(items: string[]): { areas: ChangeArea[]; counts: Record<ChangeArea, number> } {
  const counts: Record<ChangeArea, number> = { frontend: 0, backend: 0, client: 0 };
  for (const raw of items) {
    const area = infer_area_from_subject(raw);
    if (!area) continue;
    counts[area] += 1;
  }
  const areas: ChangeArea[] = (Object.keys(counts) as ChangeArea[]).filter((k) => counts[k] > 0);
  return { areas, counts };
}

function RelationshipGraph({
  active_areas,
  selected_area,
  on_select_area,
}: {
  active_areas: ChangeArea[];
  selected_area: ChangeArea | "all";
  on_select_area: (area: ChangeArea) => void;
}) {
  const has_frontend = active_areas.includes("frontend");
  const has_backend = active_areas.includes("backend");
  const has_client = active_areas.includes("client");

  const is_selected = (area: ChangeArea): boolean => selected_area === area;

  const edge_class = (active: boolean): string =>
    active ? "stroke-slate-700 dark:stroke-slate-200" : "stroke-slate-200 dark:stroke-slate-800";

  const node_opacity = (active: boolean): string => (active ? "opacity-100" : "opacity-40");
  const ring_class = (area: ChangeArea): string =>
    is_selected(area) ? "stroke-slate-900 dark:stroke-white stroke-[6]" : "stroke-transparent stroke-[0]";

  return (
    <div className="rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60 p-4">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">关系图谱</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        点击节点可定位到对应域的更新列表, 再次点击可取消高亮
      </div>
      <div className="mt-4">
        <svg viewBox="0 0 320 160" className="w-full h-[160px]">
          <line x1="80" y1="45" x2="240" y2="45" className={edge_class(has_frontend && has_backend)} strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="45" x2="160" y2="125" className={edge_class(has_frontend && has_client)} strokeWidth="3" strokeLinecap="round" />
          <line x1="240" y1="45" x2="160" y2="125" className={edge_class(has_backend && has_client)} strokeWidth="3" strokeLinecap="round" />

          <g className={[node_opacity(has_frontend), "cursor-pointer"].join(" ")} onClick={() => on_select_area("frontend")}>
            <circle cx="80" cy="45" r="24" className={ring_class("frontend")} fill="transparent" />
            <circle cx="80" cy="45" r="18" className="fill-blue-500" />
            <text x="80" y="50" textAnchor="middle" className="fill-white text-[12px] font-semibold">FE</text>
            <text x="80" y="80" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[12px]">前端</text>
          </g>

          <g className={[node_opacity(has_backend), "cursor-pointer"].join(" ")} onClick={() => on_select_area("backend")}>
            <circle cx="240" cy="45" r="24" className={ring_class("backend")} fill="transparent" />
            <circle cx="240" cy="45" r="18" className="fill-emerald-500" />
            <text x="240" y="50" textAnchor="middle" className="fill-white text-[12px] font-semibold">BE</text>
            <text x="240" y="80" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[12px]">后端</text>
          </g>

          <g className={[node_opacity(has_client), "cursor-pointer"].join(" ")} onClick={() => on_select_area("client")}>
            <circle cx="160" cy="125" r="24" className={ring_class("client")} fill="transparent" />
            <circle cx="160" cy="125" r="18" className="fill-cyan-500" />
            <text x="160" y="130" textAnchor="middle" className="fill-white text-[12px] font-semibold">CL</text>
            <text x="160" y="155" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[12px]">客户端</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { translate } = useI18n();
  const [active_id, set_active_id] = useState<string>(roadmap_nodes[0]?.id ?? "");
  const [selected_area, set_selected_area] = useState<ChangeArea | "all">("all");
  const active_node = useMemo<RoadmapNode | null>(() => {
    const found = roadmap_nodes.find((node) => node.id === active_id);
    return found ?? roadmap_nodes[0] ?? null;
  }, [active_id]);
  const active_meta = active_node ? get_status_meta(active_node.status) : null;
  const active_area_stats = useMemo(() => (active_node ? build_area_stats(active_node.items) : { areas: [], counts: { frontend: 0, backend: 0, client: 0 } }), [active_node]);
  const grouped_items = useMemo(() => {
    const initial: { frontend: string[]; backend: string[]; client: string[]; other: string[] } = {
      frontend: [],
      backend: [],
      client: [],
      other: [],
    };
    if (!active_node) return initial;

    for (const raw of active_node.items) {
      const area = infer_area_from_subject(raw);
      if (area === "frontend") initial.frontend.push(raw);
      else if (area === "backend") initial.backend.push(raw);
      else if (area === "client") initial.client.push(raw);
      else initial.other.push(raw);
    }

    return initial;
  }, [active_node]);

  const select_timeline_node = (id: string) => {
    set_active_id(id);
    set_selected_area("all");
    setTimeout(() => {
      document.getElementById("roadmap_detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const select_graph_area = (area: ChangeArea) => {
    set_selected_area((prev) => (prev === area ? "all" : area));
    setTimeout(() => {
      const target_id = `roadmap_area_${area}`;
      document.getElementById(target_id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-slate-100 dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
              <Milestone className="h-4 w-4" />
              {translate("roadmap.title")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              Roadmap
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              {translate("roadmap.desc")}
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60 p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{translate("roadmap.timeline")}</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">Git {translate("roadmap.timeline")}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {translate("roadmap.timeline.hint")}
                </div>
              </div>

              <div className="relative mt-8">
                <div className="hidden md:block">
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-7 h-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex flex-wrap items-start justify-center gap-2">
                      {roadmap_nodes.map((node, i) => {
                        const meta = get_status_meta(node.status);
                        const is_active = node.id === active_id;
                        const is_last = i === roadmap_nodes.length - 1;
                        return (
                          <div key={node.id} className="flex items-start gap-2 min-w-0">
                            <button
                              type="button"
                              aria-label={`查看 ${node.range_label}`}
                              onClick={() => select_timeline_node(node.id)}
                              className="w-[140px] text-left focus:outline-none"
                            >
                              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center whitespace-nowrap leading-tight min-h-[28px]">
                                {node.range_label}
                              </div>
                              <div className="flex items-center justify-center mt-2">
                                <div
                                  className={[
                                    "w-5 h-5 rounded-none flex items-center justify-center",
                                    meta.dot_class_name,
                                    is_active ? "ring-4 ring-slate-200/60 dark:ring-slate-800/60" : "ring-2 ring-white dark:ring-[#0d1220]",
                                  ].join(" ")}
                                >
                                  {meta.icon === "check" ? (
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  ) : meta.icon === "rocket" ? (
                                    <Rocket className="h-4 w-4 text-white" />
                                  ) : (
                                    <CircleDashed className="h-4 w-4 text-white" />
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 text-center">
                                <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug min-h-[32px]">
                                  {node.title}
                                </div>
                                <div className={["inline-flex mt-2 px-2 py-0.5 rounded-none text-[11px] font-medium", meta.badge_class_name].join(" ")}>
                                  {meta.label}
                                </div>
                              </div>
                            </button>
                            {!is_last ? (
                              <div className="pt-[26px] text-slate-300 dark:text-slate-700 flex-shrink-0">
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {roadmap_nodes.map((node) => {
                    const meta = get_status_meta(node.status);
                    const is_active = node.id === active_id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        aria-label={`查看 ${node.range_label}`}
                        onClick={() => select_timeline_node(node.id)}
                        className={[
                          "w-full p-4 rounded-none border text-left transition-colors",
                          is_active
                            ? "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-white/5"
                            : "border-slate-200 bg-white dark:border-slate-800/60 dark:bg-[#0d1220]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{node.range_label}</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{node.title}</div>
                          </div>
                          <div className={["px-2 py-0.5 rounded-none text-[11px] font-medium flex-shrink-0", meta.badge_class_name].join(" ")}>
                            {meta.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {active_node ? (
              <div id="roadmap_detail" className="mt-6 rounded-none bg-slate-50 dark:bg-[#0b1020] p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{active_node.range_label}</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{active_node.title}</h2>
                  </div>
                  <div className={["px-3 py-1 rounded-none text-xs font-medium", active_meta?.badge_class_name ?? ""].join(" ")}>
                    {active_meta?.label ?? ""}
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  <RelationshipGraph
                    active_areas={active_area_stats.areas}
                    selected_area={selected_area}
                    on_select_area={(area) => select_graph_area(area)}
                  />
                  <div className="rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60 p-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">关联摘要</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      当同一天存在多个域的提交时, 视为存在关联
                    </div>
                    <div className="mt-4 flex items-center flex-wrap gap-2">
                      {(Object.keys(active_area_stats.counts) as ChangeArea[]).map((area) => {
                        const count = active_area_stats.counts[area];
                        if (count <= 0) return null;
                        const meta = get_area_meta(area);
                        return (
                          <span
                            key={area}
                            className={[
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-none border text-xs font-medium",
                              meta.badge_class_name,
                            ].join(" ")}
                          >
                            {meta.label}
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {count}
                            </span>
                          </span>
                        );
                      })}
                      {active_area_stats.areas.length === 0 ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {translate("roadmap.summary.empty")}
                        </span>
                      ) : null}
                    </div>

                    {active_area_stats.areas.length >= 2 ? (
                      <div className="mt-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
                        {active_area_stats.areas
                          .map((a) => get_area_meta(a).label)
                          .join(" -> ")}
                      </div>
                    ) : null}
                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      {translate("roadmap.filter")} {selected_area === "all" ? translate("roadmap.filter.all") : get_area_meta(selected_area).label}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60 p-4">
                  <div className="grid lg:grid-cols-3 gap-4">
                    {(Object.keys({ frontend: 1, backend: 1, client: 1 }) as ChangeArea[]).map((area) => {
                      const meta = get_area_meta(area);
                      const list = grouped_items[area];
                      const is_active = selected_area === "all" || selected_area === area;
                      const is_emphasis = selected_area === area;

                      return (
                        <div
                          key={area}
                          id={`roadmap_area_${area}`}
                          className={[
                            "rounded-none border p-4 transition-colors",
                            is_emphasis
                              ? "border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-white/5"
                              : "border-slate-200 bg-white dark:border-slate-800/60 dark:bg-[#0d1220]",
                            is_active ? "opacity-100" : "opacity-30",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{meta.label}</div>
                            <span className={["inline-flex items-center gap-2 px-2.5 py-1 rounded-none border text-xs font-medium", meta.badge_class_name].join(" ")}>
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{list.length}</span>
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {list.length > 0 ? (
                              list.map((raw_item, i) => {
                                const item = normalize_display_text(raw_item);
                                const type = infer_commit_type(raw_item);
                                const type_meta = get_commit_type_meta(type);
                                return (
                                  <div key={`${active_node.id}_${area}_${i}`} className="flex items-start gap-3">
                                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500 select-none w-6 text-right">
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <span className={["inline-flex items-center px-2 py-0.5 rounded-none border text-[11px] font-medium", type_meta.badge_class_name].join(" ")}>
                                          {type_meta.label}
                                        </span>
                                      </div>
                                      <div className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                                        {item}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                无更新
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {grouped_items.other.length > 0 ? (
                    <div className="mt-4 rounded-none border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60 p-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">其他</div>
                      <div className="mt-3 space-y-2">
                        {grouped_items.other.map((raw_item, i) => {
                          const item = normalize_display_text(raw_item);
                          const type = infer_commit_type(raw_item);
                          const type_meta = get_commit_type_meta(type);
                          return (
                            <div key={`${active_node.id}_other_${i}`} className="flex items-start gap-3">
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-500 select-none w-6 text-right">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className={["inline-flex items-center px-2 py-0.5 rounded-none border text-[11px] font-medium", type_meta.badge_class_name].join(" ")}>
                                    {type_meta.label}
                                  </span>
                                </div>
                                <div className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                                  {item}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
