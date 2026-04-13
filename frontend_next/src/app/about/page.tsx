/**
 * page.tsx
 * TRAI 关于我们页
 */

"use client";

import Link from "next/link";
import { ArrowRight, Bot, Users, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const team = [
  { name: "吴浩", role: "创始人 & CEO", desc: "前字节跳动 AI 工程师，专注大模型应用 5 年", avatar: "吴" },
  { name: "张琳", role: "产品负责人", desc: "前腾讯产品专家，擅长大型 ToB 产品设计", avatar: "张" },
  { name: "李明", role: "技术负责人", desc: "前阿里云架构师，精通分布式系统与 AI infra", avatar: "李" },
  { name: "王芳", role: "设计负责人", desc: "前字节 UED 设计师，追求极致的用户体验", avatar: "王" },
];

const milestones = [
  { year: "2025.06", event: "TRAI 项目启动，构建初代 Agent 框架" },
  { year: "2025.09", event: "内测版本上线，收获首批 500 名种子用户" },
  { year: "2025.12", event: "正式版发布，支持 OpenAI / ModelScope 多模型" },
  { year: "2026.01", event: "企业版上线，获得首批 10 家企业客户" },
  { year: "2026.03", event: "月活跃用户突破 3000，Agent 调用量破 10 万" },
  { year: "2026.04", event: "完成首轮融资，开启规模化增长之路" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            关于我们
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
            让每个人都能<br />
            <span className="text-blue-600">用 AI 提升生产力</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            TRAI 成立于 2025 年，是一支由头部科技公司工程师组成的团队，致力于将大模型能力转化为简单易用的产品，让 AI 真正成为你工作和生活中的得力助手
          </p>
        </div>
      </section>

      {/* 数字亮点 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
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
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">发展历程</h2>
          <div className="space-y-6 relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
            {milestones.map((m, i) => (
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
          <p className="text-blue-100 mb-8">加入 TRAI，一起探索 AI 的无限可能</p>
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
  );
}