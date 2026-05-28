/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 17:30:00
 * 描述: API 参考文档页面
 */

"use client";

import Link from "next/link";
import { Terminal, ArrowRight, Code, Key, Zap, Shield, FileJson } from "lucide-react";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { useI18n } from "@/i18n/i18n_context";

const apiFeatures = [
  {
    titleKey: "docs.api.rest",
    descKey: "docs.api.rest.desc",
    icon: <Code className="h-5 w-5 text-blue-500" />,
  },
  {
    titleKey: "docs.api.jwt",
    descKey: "docs.api.jwt.desc",
    icon: <Key className="h-5 w-5 text-cyan-500" />,
  },
  {
    titleKey: "docs.api.sse",
    descKey: "docs.api.sse.desc",
    icon: <Zap className="h-5 w-5 text-cyan-500" />,
  },
  {
    titleKey: "docs.api.validate",
    descKey: "docs.api.validate.desc",
    icon: <Shield className="h-5 w-5 text-indigo-500" />,
  },
];

const endpoints = [
  {
    method: "POST",
    path: "/api/auth/login",
    descKey: "docs.api.login",
    color: "text-cyan-600 dark:text-cyan-400 bg-amber-50 dark:bg-slate-200/10",
  },
  {
    method: "GET",
    path: "/api/users/me",
    descKey: "docs.api.me",
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  },
  {
    method: "POST",
    path: "/api/chat/completions",
    descKey: "docs.api.chat",
    color: "text-cyan-600 dark:text-emerald-400 bg-emerald-50 dark:bg-cyan-500/10",
  },
  {
    method: "POST",
    path: "/api/tools/compress-image",
    descKey: "docs.api.upload",
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
  },
];

export default function ApiDocsPage() {
  const { translate } = useI18n();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5666/api_trai/v1";
  const backendOrigin = apiBase.replace(/\/api_trai\/v1\/?$/, "").replace(/\/api\/?$/, "");
  const openapiDocsUrl = `${backendOrigin}/docs`;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <section className="pt-28 pb-10 bg-cyan-300 dark:bg-cyan-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]">
              <Terminal className="h-4 w-4" />
              API Reference
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mt-6 tracking-widest uppercase">
              {translate("docs.api.title")}
            </h1>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-4 leading-relaxed max-w-3xl">
              {translate("docs.api.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={openapiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-12 px-8 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all"
              >
                {translate("docs.api.swagger")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <Link
                href="/docs/sdk"
                className="inline-flex items-center justify-center h-12 px-8 border-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all"
              >
                {translate("docs.api.sdk_guide")}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {apiFeatures.map((feature, idx) => (
                <div key={idx} className="p-8 rounded-none border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all">
                  <div className="w-16 h-16 rounded-none bg-cyan-300 dark:bg-cyan-600 flex items-center justify-center mb-6 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">{translate(feature.titleKey)}</h3>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{translate(feature.descKey)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3 border-b-4 border-slate-900 dark:border-white pb-4 mb-4">
                    <FileJson className="h-8 w-8 text-cyan-500" />
                    {translate("docs.api.overview")}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 font-bold">
                    {translate("docs.api.overview.desc")}
                  </p>
                </div>

                <div className="space-y-4">
                  {endpoints.map((ep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-none border-4 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-none border-2 border-slate-900 dark:border-white text-sm font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] ${ep.color}`}>
                          {ep.method}
                        </span>
                        <code className="text-base font-black text-slate-900 dark:text-white font-mono bg-cyan-100 dark:bg-cyan-900 px-2 py-1">
                          {ep.path}
                        </code>
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:block">
                        {translate(ep.descKey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-none p-6 md:p-8 border-4 border-slate-900 dark:border-white shadow-[12px_12px_0px_0px_#0f172a] dark:shadow-[12px_12px_0px_0px_#ffffff] overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-12 bg-slate-800 border-b-4 border-slate-900 dark:border-white flex items-center px-4">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-none border-2 border-slate-900 bg-rose-400" />
                    <div className="w-4 h-4 rounded-none border-2 border-slate-900 bg-amber-400" />
                    <div className="w-4 h-4 rounded-none border-2 border-slate-900 bg-emerald-400" />
                  </div>
                  <div className="mx-auto text-sm font-black text-white font-mono uppercase tracking-widest">request.sh</div>
                </div>
                <div className="mt-8">
                  <pre className="text-sm font-mono text-slate-300 overflow-x-auto">
                    <code className="block mb-2">
                      <span className="text-blue-400">curl</span> -X POST {backendOrigin}/api/chat/completions \
                    </code>
                    <code className="block mb-2">
                      {"  "}-H <span className="text-emerald-400">"Authorization: Bearer YOUR_TOKEN"</span> \
                    </code>
                    <code className="block mb-2">
                      {"  "}-H <span className="text-emerald-400">"Content-Type: application/json"</span> \
                    </code>
                    <code className="block text-cyan-300">
                      {"  "}-d '{JSON.stringify({
                        model: "Qwen/Qwen3.5-0.8B",
                        messages: [{ role: "user", content: translate("docs.api.example_request") }],
                        stream: true
                      }, null, 2)}'
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
