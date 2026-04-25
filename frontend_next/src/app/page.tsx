/**
 * page.tsx
 * TRAI 官网首页 (根路由)
 * 国际化双语支持，默认中文
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Bot, CheckCircle, ChevronDown, Cpu, Database, Globe, Image, MessageSquare, Shield, Sparkles, Star, Workflow, Zap, Puzzle, Code2, LineChart, Users, Play, ExternalLink, TrendingUp, Lock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

const trustedBy = [
  { key: "bytedance" },
  { key: "tencent" },
  { key: "alibaba" },
  { key: "meituan" },
  { key: "xiaomi" },
  { key: "huawei" },
];

const features = [
  { icon: Bot, color: "blue", key: "agent" },
  { icon: Zap, color: "amber", key: "correction" },
  { icon: Image, color: "emerald", key: "vision" },
  { icon: MessageSquare, color: "cyan", key: "streaming" },
  { icon: Shield, color: "rose", key: "quota" },
  { icon: BarChart3, color: "teal", key: "analytics" },
];

const stats = [
  { value: "10,000+", key: "users" },
  { value: "99.9%", key: "uptime" },
  { value: "100M+", key: "calls" },
  { value: "< 200ms", key: "latency" },
];

const useCases = [
  { icon: Workflow, key: "support" },
  { icon: Database, key: "data" },
  { icon: Globe, key: "content" },
  { icon: Cpu, key: "auto" },
];

const steps = [
  { num: "01", key: "step1" },
  { num: "02", key: "step2" },
  { num: "03", key: "step3" },
];

const testimonials = [
  { nameKey: "name1", roleKey: "role1", companyKey: "company1", avatar: "ZM", color: "blue", name: "张明" },
  { nameKey: "name2", roleKey: "role2", companyKey: "company2", avatar: "SL", color: "amber", name: "李四" },
  { nameKey: "name3", roleKey: "role3", companyKey: "company3", avatar: "DW", color: "emerald", name: "王五" },
];

const faqs = [
  { key: "q1" },
  { key: "q2" },
  { key: "q3" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  const delayClass = delay === 0 ? "delay-0" : delay === 100 ? "delay-100" : delay === 200 ? "delay-200" : delay === 300 ? "delay-300" : delay === 400 ? "delay-400" : delay === 500 ? "delay-500" : delay === 600 ? "delay-600" : delay === 800 ? "delay-800" : "";
  return (
    <div
      ref={ref}
      className={[
        className,
        "transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
        delayClass,
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

function HeroParticles() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animation: string;
    animationDelay: string;
    width: string;
    height: string;
    backgroundColor: string;
  }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        width: `${2 + Math.random() * 3}px`,
        height: `${2 + Math.random() * 3}px`,
        backgroundColor:
          i % 3 === 0
            ? "rgba(59, 130, 246, 0.15)"
            : i % 3 === 1
              ? "rgba(139, 92, 246, 0.1)"
              : "rgba(6, 182, 212, 0.1)",
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((style, i) => (
        <div key={i} className="absolute rounded-full" style={style} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { translate, locale } = useI18n();
  const isEn = locale === "en";

  return (
    <>
      <Navbar />

      {/* ===== Hero Section ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center pt-16">
        <div className="absolute inset-0 bg-white dark:bg-[#030712]" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-[#030712] dark:to-[#030712]" />
        <HeroParticles />
        {/* 背景网格 */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="container mx-auto px-4 pb-24 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            {translate("hero.badge")}
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white animate-slide-up">
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {translate("hero.title")}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            {translate("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-blue-500/20 text-base font-semibold rounded-full btn-press bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
                {translate("hero.cta1")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="h-12 px-8 gap-2 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/5 text-base rounded-full btn-press">
                {translate("hero.cta2")}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["blue", "indigo", "purple", "pink"].map((color, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#030712] bg-gradient-to-br from-${color}-400 to-${color}-600`} />
                ))}
              </div>
              <span>{translate("hero.users")}</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-medium">4.9</span>
              <span className="text-slate-400">{translate("hero.reviews")}</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{translate("hero.sla")}</span>
            </div>
          </div>

          {/* Product Mockup */}
          <div className="max-w-3xl mx-auto mt-20">
            <Reveal delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 rounded-3xl blur-2xl" />
                <div className="relative bg-[#0d1117] rounded-2xl border border-slate-800 shadow-2xl shadow-blue-500/10 overflow-hidden">
                  {/* Window Header */}
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800/50 bg-[#161b22]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                      <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-slate-500">TRAI Agent</span>
                    </div>
                    <div className="w-12" />
                  </div>
                  {/* Chat Content */}
                  <div className="p-6 space-y-5">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-[#21262d] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-200 max-w-md">
                        {translate("chat.hi")}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-blue-600 rounded-2xl rounded-tr-md px-4 py-3 text-sm text-white max-w-md">
                        {translate("hero.chat.user_beijing")}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-[#21262d] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-200 max-w-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-400 text-xs font-medium">{translate("chat.tool.weather")}</span>
                        </div>
                        <p className="text-slate-300">
                          {translate("hero.chat.beijing_weather")}
                        </p>
                      </div>
                    </div>
                    {/* Input Area */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex-1 bg-[#21262d] rounded-full px-4 py-3 text-sm text-slate-500 border border-slate-700">
                        {translate("hero.chat.input")}
                      </div>
                      <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400">
          <span className="text-xs">{translate("hero.scroll")}</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* ===== Trusted By ===== */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
              {translate("trusted.title")}
            </p>
          </Reveal>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {trustedBy.map((company) => (
              <div key={company.key} className="flex items-center gap-3 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                  {translate(`trusted.${company.key}`).charAt(0)}
                </div>
                <span className="font-semibold text-sm">{translate(`trusted.${company.key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-24 bg-slate-50/50 dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium mb-4">
                {isEn ? "Features" : "核心功能"}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                {translate("features.title")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {translate("features.subtitle")}
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <Reveal key={f.key} delay={i * 80}>
                <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 p-6 card-hover h-full group">
                  <CardContent className="p-0">
                    <div className={`w-12 h-12 rounded-xl bg-${f.color}-50 dark:bg-${f.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon className={`h-6 w-6 text-${f.color}-600 dark:text-${f.color}-400`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {translate(`features.${f.key}`)}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {translate(`features.${f.key}.desc`)}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-20 bg-slate-900 dark:bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <Reveal key={stat.key} delay={i * 100}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-sm text-slate-400">{translate(`stats.${stat.key}`)}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Use Cases ===== */}
      <section className="py-24 bg-white dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                {translate("scenarios.title")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                {translate("scenarios.subtitle")}
              </p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {useCases.map((s, i) => (
              <Reveal key={s.key} delay={i * 80}>
                <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 p-6 card-hover h-full group">
                  <CardContent className="p-0 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                      <s.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{translate(`scenarios.${s.key}`)}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{translate(`scenarios.${s.key}.desc`)}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Tech Stack ===== */}
      <section className="py-24 bg-slate-50/50 dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-medium mb-4">
                  {isEn ? "Tech Stack" : "技术架构"}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  {isEn ? translate("tech.title") : translate("tech.title")}
                  <br />
                  <span className="text-blue-600 dark:text-blue-400">{isEn ? translate("tech.title2") : translate("tech.title2")}</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  {translate("tech.subtitle")}
                </p>
                <div className="space-y-3">
                  {[
                    translate("tech.stack1"),
                    translate("tech.stack2"),
                    translate("tech.stack3"),
                    translate("tech.stack4"),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 p-6 space-y-3">
                {[
                  { label: translate("tech.layer.frontend"), icon: "🖥", desc: "Next.js 15 + App Router", color: "border-blue-200 dark:border-blue-500/30", dot: "bg-blue-500 dark:bg-blue-400" },
                  { label: translate("tech.layer.api"), icon: "⚡", desc: "FastAPI + SSE 流式", color: "border-cyan-200 dark:border-cyan-500/30", dot: "bg-cyan-500 dark:bg-cyan-400" },
                  { label: translate("tech.layer.ai"), icon: "🤖", desc: translate("tech.layer.ai.desc"), color: "border-amber-200 dark:border-amber-500/30", dot: "bg-amber-500 dark:bg-amber-400" },
                  { label: translate("tech.layer.data"), icon: "💾", desc: "PostgreSQL + Redis + S3", color: "border-emerald-200 dark:border-emerald-500/30", dot: "bg-emerald-500 dark:bg-emerald-400" },
                ].map((layer) => (
                  <div key={layer.label} className={`flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border ${layer.color}`}>
                    <div className="text-2xl">{layer.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{layer.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{layer.desc}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${layer.dot}`} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 bg-white dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                {translate("steps.title")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {translate("steps.subtitle")}
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[22%] right-[22%] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            {steps.map((s, i) => (
              <Reveal key={s.key} delay={i * 100}>
                <div className="text-center relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 mx-auto">
                    <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{translate(`steps.${s.key}.title`)}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{translate(`steps.${s.key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-24 bg-slate-50/50 dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {translate("testimonials.title")}
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((item, idx) => (
              <Reveal key={item.name} delay={idx * 100}>
                <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 p-6 h-full">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">&ldquo;{translate(`testimonials.quote${idx + 1}`)}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 flex items-center justify-center text-white text-sm font-medium`}>
                        {item.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{translate(`testimonials.${item.nameKey}`)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{translate(`testimonials.${item.roleKey}`)}, {translate(`testimonials.${item.companyKey}`)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 bg-white dark:bg-[#030712]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                {translate("faq.title")}
              </h2>
            </div>
          </Reveal>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.key} delay={i * 80}>
                <Card className="bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 overflow-hidden">
                  <button
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{translate(`faq.${f.key}`)}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-4">
                      {translate(`faq.${f.key.replace("q", "a")}`)}
                    </div>
                  )}
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 bg-slate-900 dark:bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {translate("cta.title")}
            </h2>
            <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10">
              {translate("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-10 gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-xl text-base font-semibold rounded-full btn-press">
                  {translate("cta.btn1")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-12 px-10 gap-2 bg-transparent border-white/20 text-white hover:bg-white/10 text-base rounded-full btn-press">
                  {translate("cta.btn2")}
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{translate("cta.free")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{translate("cta.card")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>{translate("cta.support")}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <Footer />
    </>
  );
}
