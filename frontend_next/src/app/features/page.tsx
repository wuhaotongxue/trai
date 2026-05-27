/**
 * page.tsx
 * TRAI 功能介绍页
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Zap, Image, MessageSquare, Shield, Globe, Cpu, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

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
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: Bot,
    bg: "bg-cyan-300",
    titleKey: "features.agent",
    descKey: "features.agent.desc",
    tags: ["自动编排", "工具扩展", "MCP 协议"],
  },
  {
    icon: Zap,
    bg: "bg-emerald-300",
    titleKey: "features.correct",
    descKey: "features.correct.desc",
    tags: ["自动重试", "错误恢复", "容错机制"],
  },
  {
    icon: Image,
    bg: "bg-indigo-300",
    titleKey: "features.vision",
    descKey: "features.vision.desc",
    tags: ["图片问答", "多模态", "Base64"],
  },
  {
    icon: MessageSquare,
    bg: "bg-rose-300",
    titleKey: "features.sse",
    descKey: "features.sse.desc",
    tags: ["实时流式", "打字机效果", "低延迟"],
  },
  {
    icon: Shield,
    bg: "bg-cyan-300",
    titleKey: "features.security",
    descKey: "features.security.desc",
    tags: ["JWT 认证", "权限管理", "数据加密"],
  },
  {
    icon: Globe,
    bg: "bg-cyan-300",
    titleKey: "features.model",
    descKey: "features.model.desc",
    tags: ["OpenAI", "ModelScope", "智谱 GLM"],
  },
  {
    icon: Cpu,
    bg: "bg-emerald-300",
    titleKey: "features.ddd",
    descKey: "features.ddd.desc",
    tags: ["DDD 架构", "Clean Code", "可维护"],
  },
  {
    icon: Workflow,
    bg: "bg-indigo-300",
    titleKey: "features.session",
    descKey: "features.session.desc",
    tags: ["历史管理", "会话导出", "多会话"],
  },
];

export default function FeaturesPage() {
  const { translate } = useI18n();
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Hero */}
        <section className="pt-32 pb-20 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
              <Zap className="h-4 w-4" />
              {translate("features.hero.title")}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-5 tracking-tight leading-tight uppercase">
              {translate("features.hero.subtitle")}<br />
              <span className="text-cyan-600 dark:text-cyan-400">为你的 AI 应用而生</span>
            </h1>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-3xl mx-auto">
              {translate("features.hero.desc")}
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                  {translate("features.hero.cta1")} <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                  {translate("features.hero.cta2")} <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 功能列表 */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <Reveal key={f.titleKey} delay={i * 100}>
                <div
                  className="group p-8 bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all duration-300"
                >
                  <div className={`w-16 h-16 border-4 border-slate-900 dark:border-slate-900 ${f.bg} flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                    <f.icon className="h-8 w-8 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">{translate(f.titleKey)}</h3>
                  <p className="text-lg font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{translate(f.descKey)}</p>
                  <div className="flex flex-wrap gap-3">
                    {f.tags.map((tag) => (
                      <span key={tag} className="text-xs px-3 py-1.5 border-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-wider group-hover:bg-cyan-300 dark:group-hover:bg-cyan-600 dark:group-hover:text-white transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cyan-400 dark:bg-cyan-900 border-t-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">{translate("features.ready.title")}</h2>
            <p className="text-2xl font-bold text-slate-800 dark:text-cyan-100 mb-12 max-w-2xl mx-auto">{translate("features.ready.subtitle")}</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#ffffff] dark:shadow-[8px_8px_0px_0px_#0f172a] hover:bg-slate-800 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#ffffff] dark:hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                  {translate("features.ready.cta1")} <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:bg-slate-50 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                  {translate("features.ready.cta2")} <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      </div>
      <Footer />
    </>
  );
}
