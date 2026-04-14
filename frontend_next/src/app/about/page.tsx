/**
 * page.tsx
 * TRAI 关于我们页
 */

"use client";

import Link from "next/link";
import { ArrowRight, Bot, Users, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

const team = [
  { name: "Team Member A", role: "产品", desc: "专注大模型应用落地与 ToB 产品设计", avatar: "A" },
  { name: "Team Member B", role: "工程", desc: "负责后端架构与工程化, 聚焦稳定性与可观测性", avatar: "B" },
  { name: "Team Member C", role: "前端", desc: "负责 Web 交互与体验, 深色模式与组件体系", avatar: "C" },
  { name: "Team Member D", role: "设计", desc: "负责视觉与交互, 统一风格与信息层级", avatar: "D" },
];

const milestones = [
  { year: "2026-04-07", event: "Add README, merge: develop into main" },
  { year: "2026-04-08", event: "chore: add VERSION 0.1.0, feat: 完善 skills 体系与规则索引" },
  { year: "2026-04-09", event: "feat(backend): 初始化 TRAI 后端项目结构, feat(frontend): 初始化 Next.js 项目" },
  { year: "2026-04-10", event: "feat(agent): 新增 PolicyEngine/TokenCounter/ContextManager, feat(backend): 完善会话与认证能力" },
  { year: "2026-04-13", event: "refactor: 移除 desktop_client, feat(client_electron): 新增客户端路由与注册登录模块" },
  { year: "2026-04-14", event: "Merge pull request #33, Merge pull request #34" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            关于我们
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
            让每个人都能<br />
            <span className="text-blue-600">用 AI 提升生产力</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            TRAI 成立于 2025 年, 是一支由头部科技公司工程师组成的团队, 致力于将大模型能力转化为简单易用的产品, 让 AI 真正成为你工作和生活中的得力助手
          </p>
        </div>
      </section>

      {/* 数字亮点 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { value: "3000+", label: "月活跃用户", icon: Users },
              { value: "10万+", label: "Agent 调用量", icon: Bot },
              { value: "99.9%", label: "服务可用率", icon: Award },
              { value: "10+", label: "企业客户", icon: Globe },
            ].map((s) => (
              <div key={s.label} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <s.icon className="h-6 w-6 text-blue-500 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 团队 */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">核心团队</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {team.map((t) => (
              <div key={t.name} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  {t.avatar}
                </div>
                <p className="font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{t.role}</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">发展历程</h2>
          <div className="space-y-6 relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
            {milestones.map((m) => (
              <div key={m.year} className="flex items-start gap-5 pl-10 relative">
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white border-2 border-blue-500" />
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{m.year}</span>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">期待与你同行</h2>
          <p className="text-blue-100 mb-8">加入 TRAI, 一起探索 AI 的无限可能</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-full text-base font-semibold bg-white text-blue-600 shadow-lg gap-2 hover:bg-blue-50">
                立即开始 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-full text-base font-semibold bg-white/10 text-white border-white/30 gap-2 hover:bg-white/20">
                加入我们 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
      <Footer />
    </>
  );
}
