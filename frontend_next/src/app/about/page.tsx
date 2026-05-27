"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Users, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

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

const team = [
  { name: "Wuhao", role: "Product Manager", desc: "Leading the vision and strategy for TRAI.", avatar: "W", color: "bg-cyan-400" },
  { name: "Developer A", role: "Fullstack Engineer", desc: "Building scalable backend and robust frontend.", avatar: "A", color: "bg-emerald-400" },
  { name: "Designer B", role: "UI/UX Designer", desc: "Crafting the Neo-Brutalism experience.", avatar: "B", color: "bg-indigo-400" },
  { name: "Expert C", role: "AI Researcher", desc: "Integrating top-tier AI models.", avatar: "C", color: "bg-rose-400" },
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
      <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
              <Users className="h-4 w-4" />
              关于我们
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-5 tracking-tight leading-tight uppercase">
              致力于打造顶级的<br />
              <span className="text-cyan-600 dark:text-cyan-400">开源 AI 应用开发平台</span>
            </h1>
            <p className="text-xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              TRAI 不仅仅是一个工具，更是一种探索 AI 边界的全新方式。我们追求极致的工程架构与硬核的交互体验。
            </p>
          </Reveal>
        </div>
      </section>

      {/* 数字亮点 */}
      <section className="py-20 bg-white dark:bg-slate-950 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { value: "3000+", label: "活跃用户", icon: Users },
              { value: "10万+", label: "累计调用", icon: Bot },
              { value: "99.9%", label: "服务可用性", icon: Award },
              { value: "10+", label: "接入模型", icon: Globe },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all duration-300">
                  <s.icon className="h-10 w-10 text-slate-900 dark:text-white mx-auto mb-4" />
                  <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">{s.value}</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-24 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white text-center mb-16 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
              发展历程
            </h2>
            <div className="space-y-8 relative">
              <div className="absolute left-8 top-4 bottom-4 w-1 bg-slate-900 dark:bg-white" />
              {milestones.map((m, i) => (
                <Reveal key={m.year} delay={i * 100}>
                  <div className="flex items-start gap-8 pl-16 relative">
                    <div className="absolute left-[26px] top-2 w-6 h-6 bg-cyan-400 border-4 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] z-10" />
                    <div className="bg-white dark:bg-slate-800 p-6 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all w-full">
                      <span className="inline-block text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-900 bg-cyan-300 px-3 py-1 border-2 border-slate-900 dark:border-white mb-3 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">
                        {m.year}
                      </span>
                      <p className="text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                        {m.event}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cyan-400 dark:bg-cyan-900 border-t-4 border-slate-900 dark:border-white">
        <div className="container mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">加入我们</h2>
            <p className="text-2xl font-bold text-slate-800 dark:text-cyan-100 mb-12 max-w-2xl mx-auto">准备好体验新粗野主义的极致交互了吗？</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#ffffff] dark:shadow-[8px_8px_0px_0px_#0f172a] hover:bg-slate-800 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#ffffff] dark:hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                  免费注册 <ArrowRight className="h-6 w-6" />
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
