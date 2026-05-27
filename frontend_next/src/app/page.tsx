/**
 * page.tsx
 * TRAI 官网首页 (根路由)
 * Neo-Brutalism 风格重构
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Bot, CheckCircle, ChevronDown, Cpu, Database, Globe, Image, MessageSquare, Shield, Sparkles, Star, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

const trustedBy = [
  { key: "bytedance", name: "字节跳动", color: "bg-teal-400" },
  { key: "tencent", name: "腾讯", color: "bg-blue-400" },
  { key: "alibaba", name: "阿里巴巴", color: "bg-slate-100" },
  { key: "meituan", name: "美团", color: "bg-slate-100" },
  { key: "xiaomi", name: "小米", color: "bg-orange-500" },
  { key: "huawei", name: "华为", color: "bg-red-500" },
];

const features = [
  { icon: Bot, color: "bg-slate-100", key: "agent", title: "智能 Agent", desc: "高度定制化的 AI 助手，满足复杂业务需求" },
  { icon: Zap, color: "bg-slate-100", key: "correction", title: "极速响应", desc: "底层深度优化，毫秒级 API 调用延迟" },
  { icon: Image, color: "bg-slate-100", key: "vision", title: "视觉大模型", desc: "支持图生图、多图编辑等高阶图像能力" },
  { icon: MessageSquare, color: "bg-slate-100", key: "streaming", title: "流式交互", desc: "原生支持 SSE，提供打字机般丝滑体验" },
  { icon: Shield, color: "bg-slate-100", key: "quota", title: "配额管控", desc: "企业级租户隔离与精确到 Token 的计费" },
  { icon: BarChart3, color: "bg-purple-400", key: "analytics", title: "数据洞察", desc: "全景大屏与多维统计，调用情况一目了然" },
];

const stats = [
  { value: "10,000+", key: "users", label: "活跃用户" },
  { value: "99.9%", key: "uptime", label: "服务可用性" },
  { value: "100M+", key: "calls", label: "累计调用" },
  { value: "< 200ms", key: "latency", label: "平均延迟" },
];

const useCases = [
  { icon: Workflow, key: "support", title: "智能客服", desc: "7x24小时全天候响应", color: "bg-pink-400" },
  { icon: Database, key: "data", title: "数据分析", desc: "自然语言查询数据库", color: "bg-lime-400" },
  { icon: Globe, key: "content", title: "内容创作", desc: "多语言批量生成文案", color: "bg-slate-100" },
  { icon: Cpu, key: "auto", title: "自动化流程", desc: "串联多个系统接口", color: "bg-fuchsia-400" },
];

const steps = [
  { num: "01", key: "step1", title: "注册账号", desc: "一键注册，立即获取免费体验额度" },
  { num: "02", key: "step2", title: "获取 API Key", desc: "在控制台生成您的专属鉴权密钥" },
  { num: "03", key: "step3", title: "接入应用", desc: "参考文档，三行代码完成 SDK 接入" },
];

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)",
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { translate } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 selection:bg-slate-100 selection:text-slate-900">
      <Navbar />

      {/* ===== Hero Section ===== */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b-4 border-slate-900 dark:border-white">
        {/* Brutalist Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div className="inline-block border-2 border-slate-900 dark:border-white bg-slate-100 text-slate-900 px-4 py-2 font-black uppercase tracking-widest text-sm mb-8 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transform -rotate-2">
                🚀 下一代 AI Agent 驱动引擎
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[1.1] mb-8 text-slate-900 dark:text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                企业级 <br/>
                <span className="text-emerald-500 dark:text-emerald-400">大模型</span> 与 <span className="text-indigo-500 dark:text-indigo-400">智能体</span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                提供高性能、高可用的 AI API 服务。轻松集成对话、视觉、音频等多模态能力，打造您的专属智能应用。
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/register">
                  <Button className="h-16 px-10 text-xl font-black uppercase tracking-widest bg-rose-500 text-white border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:bg-slate-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#0f172a] dark:hover:shadow-[6px_6px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all rounded-none">
                    立即开始体验 <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="outline" className="h-16 px-10 text-xl font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:bg-slate-100 dark:hover:bg-slate-700 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#0f172a] dark:hover:shadow-[6px_6px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all rounded-none">
                    了解更多功能
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Trusted By (Marquee) ===== */}
      <section className="py-8 border-b-4 border-slate-900 dark:border-white bg-cyan-200 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="animate-marquee flex gap-16 items-center px-8">
            {[...trustedBy, ...trustedBy, ...trustedBy].map((company, i) => (
              <div key={`${company.key}-${i}`} className="flex items-center gap-3">
                <div className={`w-12 h-12 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center font-black text-slate-900 text-xl ${company.color}`}>
                  {company.name.charAt(0)}
                </div>
                <span className="font-black text-xl text-slate-900 uppercase tracking-widest">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-24 bg-indigo-50 dark:bg-slate-800 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-8 border-indigo-500 inline-block pb-2 mb-6">
                核心能力架构
              </h2>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                我们提供从底层模型到上层应用的完整解决方案。
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Reveal key={f.key} delay={i * 100}>
                <div className={`group h-full border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-900 p-8 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#0f172a] dark:hover:shadow-[12px_12px_0px_0px_#ffffff] transition-all`}>
                  <div className={`w-16 h-16 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center mb-6 ${f.color}`}>
                    <f.icon className="h-8 w-8 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                    {f.title}
                  </h3>
                  <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-20 bg-rose-500 border-b-4 border-slate-900 dark:border-white text-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <Reveal key={stat.key} delay={i * 100}>
                <div className="border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_#0f172a] transform rotate-1 hover:rotate-0 transition-transform">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-2">{stat.value}</div>
                  <div className="text-xl font-bold uppercase tracking-widest">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 bg-emerald-50 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white border-b-8 border-emerald-500 inline-block pb-2">
                极简接入流程
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <Reveal key={s.key} delay={i * 100}>
                <div className="relative pt-12">
                  {/* Number Badge */}
                  <div className="absolute top-0 left-8 w-16 h-16 bg-slate-100 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center text-2xl font-black text-slate-900 z-10">
                    {s.num}
                  </div>
                  <div className="border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 p-8 pt-10 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">{s.title}</h3>
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-32 bg-slate-100 border-b-4 border-slate-900 dark:border-white text-slate-900 text-center">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-widest mb-8">
              准备好开始了吗？
            </h2>
            <p className="text-2xl font-bold mb-12 max-w-2xl mx-auto">
              立即注册即可获得免费调用额度，开启您的 AI 应用开发之旅。
            </p>
            <div className="flex justify-center">
              <Link href="/register">
                <Button className="h-20 px-12 text-2xl font-black uppercase tracking-widest bg-slate-900 text-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#ffffff] hover:bg-slate-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all rounded-none">
                  免费注册使用 <ArrowRight className="ml-3 h-8 w-8" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
