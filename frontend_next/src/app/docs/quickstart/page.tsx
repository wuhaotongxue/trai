"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "注册并登录", desc: "创建账号并进入控制台", done: true },
  { title: "创建会话", desc: "在 Agent 页面创建一个新的对话会话", done: true },
  { title: "调用工具", desc: "尝试让 Agent 执行搜索, 计算, 文件处理等工具", done: false },
  { title: "接入 API", desc: "通过 API 方式接入到你的业务系统", done: false },
];

export default function DocsQuickstartPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-12 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                快速开始
              </div>
              <Link href="/docs" className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors">
                返回文档中心
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              3 分钟上手 TRAI
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              这份指南帮助你快速完成基础配置, 并开始使用 Agent 能力. 如果你想直接查看 API, 可以进入 API 参考页面.
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <Link href="/agent">
                <Button className="gap-2">
                  进入 Agent <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                  查看 API <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((s) => (
                <div
                  key={s.title}
                  className="p-6 rounded-2xl border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.done ? "bg-emerald-500/15" : "bg-muted/40"} `}>
                      <CheckCircle2 className={`h-5 w-5 ${s.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-white">{s.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
