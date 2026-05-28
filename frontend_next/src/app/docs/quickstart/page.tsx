"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";

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

const steps = [
  { title: "第一步：注册账号", desc: "在平台注册您的开发者账号，并完成基础配置。", done: true },
  { title: "第二步：获取 API Key", desc: "在控制台生成专属的 API 密钥，用于安全调用接口。", done: true },
  { title: "第三步：集成 SDK", desc: "使用我们提供的官方 SDK，三行代码即可接入。", done: false },
  { title: "第四步：上线应用", desc: "测试完成后，一键部署并上线您的 AI 应用。", done: false },
];

export default function DocsQuickstartPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <section className="pt-32 pb-20 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <Reveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                  <BookOpen className="h-4 w-4" />
                  快速开始
                </div>
                <Link href="/docs" className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors underline decoration-2 underline-offset-4">
                  返回文档首页
                </Link>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mt-6 tracking-tight uppercase leading-tight">
                五分钟接入<br />
                <span className="text-cyan-600 dark:text-cyan-400">TRAI 核心能力</span>
              </h1>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400 mt-6 leading-relaxed max-w-3xl">
                跟随我们的引导，您将快速掌握平台的基础使用方法，并成功运行您的第一个 AI 任务。
              </p>
              <div className="flex items-center gap-6 mt-10 flex-wrap">
                <Link href="/agent">
                  <Button className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                    进入控制台 <ArrowRight className="h-6 w-6" />
                  </Button>
                </Link>
                <Link href="/docs/api">
                  <Button variant="outline" className="h-16 px-10 rounded-none text-xl font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none transition-all gap-3">
                    查看 API 文档 <ArrowRight className="h-6 w-6" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-24 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 100}>
                  <div
                    className="p-8 border-4 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start gap-6 relative z-10">
                      <div className={`w-16 h-16 rounded-none flex items-center justify-center shrink-0 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] ${
                        s.done ? "bg-emerald-300 dark:bg-emerald-600" : "bg-white dark:bg-slate-900"
                      }`}>
                        {s.done ? (
                          <CheckCircle2 className="h-8 w-8 text-slate-900 dark:text-white" />
                        ) : (
                          <span className="text-2xl font-black text-slate-900 dark:text-white">0{i + 1}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                          {s.title}
                        </h3>
                        <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
