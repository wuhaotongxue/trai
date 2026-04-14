"use client";

import Link from "next/link";
import { BookOpen, FileText, HelpCircle, Package } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";

const docsCards = [
  {
    title: "快速开始",
    desc: "从 0 到 1 了解 TRAI 的核心能力与使用方式",
    href: "/docs/quickstart",
    icon: BookOpen,
  },
  {
    title: "API 参考",
    desc: "查看后端 Swagger 文档, 支持全屏阅读",
    href: "/docs/api",
    icon: FileText,
  },
  {
    title: "SDK 下载",
    desc: "获取前端与后端 SDK, 快速集成到你的系统",
    href: "/docs/sdk",
    icon: Package,
  },
  {
    title: "常见问题",
    desc: "账号, 配额, 登录, 回调等高频问题汇总",
    href: "/docs/faq",
    icon: HelpCircle,
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-14 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              文档中心
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              TRAI 文档
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              这里提供快速开始, API 参考, SDK 下载与常见问题. 如果你需要更系统的接入方案, 可以先从快速开始进入.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docsCards.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group p-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors dark:bg-[#0d1220] dark:border-slate-800/60 dark:hover:bg-white/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <c.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {c.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                        {c.desc}
                      </p>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700"
                        >
                          进入
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
