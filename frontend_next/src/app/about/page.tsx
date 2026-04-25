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
import { useI18n } from "@/i18n/i18n_context";

const team = [
  { name: "Team Member A", roleKey: "about.team.role.product", descKey: "about.team.a.desc", avatar: "A" },
  { name: "Team Member B", roleKey: "about.team.role.engineer", descKey: "about.team.b.desc", avatar: "B" },
  { name: "Team Member C", roleKey: "about.team.role.frontend", descKey: "about.team.c.desc", avatar: "C" },
  { name: "Team Member D", roleKey: "about.team.role.design", descKey: "about.team.d.desc", avatar: "D" },
];

const milestones = [
  { year: "2026-04-07", eventKey: "about.milestone.1" },
  { year: "2026-04-08", eventKey: "about.milestone.2" },
  { year: "2026-04-09", eventKey: "about.milestone.3" },
  { year: "2026-04-10", eventKey: "about.milestone.4" },
  { year: "2026-04-13", eventKey: "about.milestone.5" },
  { year: "2026-04-14", eventKey: "about.milestone.6" },
];

export default function AboutPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            {translate("about.title")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight leading-tight">
            {translate("about.hero.line1")}<br />
            <span className="text-blue-600">{translate("about.hero.line2")}</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            {translate("about.hero.desc")}
          </p>
        </div>
      </section>

      {/* 数字亮点 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { value: "3000+", labelKey: "about.stat.users", icon: Users },
              { value: "10万+", labelKey: "about.stat.calls", icon: Bot },
              { value: "99.9%", labelKey: "about.stat.uptime", icon: Award },
              { value: "10+", labelKey: "about.stat.clients", icon: Globe },
            ].map((s) => (
              <div key={s.labelKey} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <s.icon className="h-6 w-6 text-blue-500 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{translate(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 团队 */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{translate("about.team.title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {team.map((t) => (
              <div key={t.name} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  {t.avatar}
                </div>
                <p className="font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{translate(t.roleKey)}</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{translate(t.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">{translate("about.timeline.title")}</h2>
          <div className="space-y-6 relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
            {milestones.map((m) => (
              <div key={m.year} className="flex items-start gap-5 pl-10 relative">
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white border-2 border-blue-500" />
                <div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{m.year}</span>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{translate(m.eventKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{translate("about.cta.title")}</h2>
          <p className="text-blue-100 mb-8">{translate("about.cta.desc")}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-11 px-8 rounded-full text-base font-semibold bg-white text-blue-600 shadow-lg gap-2 hover:bg-blue-50">
                {translate("about.cta.btn1")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-8 rounded-full text-base font-semibold bg-white/10 text-white border-white/30 gap-2 hover:bg-white/20">
                {translate("about.cta.btn2")} <ArrowRight className="h-4 w-4" />
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
