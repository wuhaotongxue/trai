"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";

const faqs = [
  {
    q: "后台登录不了怎么办",
    a: "先确认后端已启动并能打开 http://localhost:5666/docs. 然后在 /admin/login 使用默认账号 admin / admin123 进行登录. 登录成功后会写入 token.",
  },
  {
    q: "为什么 /docs/api 是全屏, 其他文档不是全屏",
    a: "API 参考页为了完整展示 Swagger, 使用 iframe 全屏嵌入. 其他文档页面是普通内容页, 会保留官网导航和底部.",
  },
  {
    q: "深色模式切换后界面不生效",
    a: "确保右上角主题按钮已切换到深色. 如果仍未生效, 刷新页面并检查浏览器是否禁止 localStorage.",
  },
  {
    q: "页面 404 怎么处理",
    a: "如果导航里有入口但页面不存在, 需要补齐对应路由. 目前 /docs/faq, /docs/quickstart, /docs/sdk 已补齐.",
  },
];

export default function DocsFaqPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 text-sm font-medium">
              <HelpCircle className="h-4 w-4" />
              常见问题
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              FAQ
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed">
              这里整理了常见问题, 包含登录, 文档访问与主题切换.
              <Link href="/docs" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                返回文档中心
              </Link>
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="p-6 rounded-2xl border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60"
              >
                <p className="text-base font-bold text-slate-900 dark:text-white">{item.q}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
