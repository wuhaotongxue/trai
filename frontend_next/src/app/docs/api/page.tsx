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
    icon: <Key className="h-5 w-5 text-emerald-500" />,
  },
  {
    titleKey: "docs.api.sse",
    descKey: "docs.api.sse.desc",
    icon: <Zap className="h-5 w-5 text-amber-500" />,
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
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
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
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
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
      <div className="min-h-screen bg-white dark:bg-[#080c1a]">
        <section className="pt-28 pb-10 bg-gradient-to-b from-slate-50 to-white dark:from-[#0d1220] dark:to-[#080c1a]">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 text-sm font-medium">
              <Terminal className="h-4 w-4" />
              API Reference
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-6 tracking-tight">
              {translate("docs.api.title")}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-300 mt-3 leading-relaxed max-w-3xl">
              {translate("docs.api.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={openapiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                {translate("docs.api.swagger")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href="/docs/sdk"
                className="inline-flex items-center justify-center h-10 px-6 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {translate("docs.api.sdk_guide")}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {apiFeatures.map((feature, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white dark:bg-[#0d1220] dark:border-slate-800/60">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{translate(feature.titleKey)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{translate(feature.descKey)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileJson className="h-6 w-6 text-blue-500" />
                    {translate("docs.api.overview")}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                    {translate("docs.api.overview.desc")}
                  </p>
                </div>

                <div className="space-y-3">
                  {endpoints.map((ep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0a0f1c]">
                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wider ${ep.color}`}>
                          {ep.method}
                        </span>
                        <code className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                          {ep.path}
                        </code>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                        {translate(ep.descKey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden border border-slate-800 relative">
                <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800/50 flex items-center px-4 border-b border-slate-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mx-auto text-xs text-slate-400 font-mono">request.sh</div>
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
                    <code className="block text-amber-300">
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
