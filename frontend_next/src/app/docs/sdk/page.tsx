"use client";

import Link from "next/link";
import { Download, Package } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Button } from "@/components/ui/button";

const sdkList = [
  { name: "前端 SDK", desc: "用于在 Web 项目中快速接入 TRAI 服务", href: "#" },
  { name: "后端 SDK", desc: "用于服务端调用 TRAI API, 支持鉴权与重试", href: "#" },
  { name: "OpenAPI 规范", desc: "直接使用 OpenAPI 生成客户端代码", href: "/docs/api" },
];

export default function DocsSdkPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
              <Package className="h-4 w-4" />
              SDK 下载
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              SDK 与接入方式
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              这里提供 SDK 与 OpenAPI 入口. 如果你只想查看接口定义, 进入 API 参考即可.
              <Link href="/docs" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                返回文档中心
              </Link>
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdkList.map((s) => (
              <div
                key={s.name}
                className="p-6 rounded-2xl border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
              >
                <p className="text-base font-bold text-slate-900 dark:text-white">{s.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">{s.desc}</p>
                <div className="mt-4">
                  <Link href={s.href}>
                    <Button size="sm" variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
