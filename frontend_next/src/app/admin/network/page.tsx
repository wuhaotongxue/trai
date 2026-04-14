/**
 * page.tsx
 * 网络状态页面
 */

"use client";

import { useState } from "react";
import {
  Wifi,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Signal,
  Server,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const endpoints = [
  { name: "OpenAI API (api.openai.com)", type: "AI 模型", status: "ok", latency: "145ms", uptime: "99.95%", lastCheck: "刚刚" },
  { name: "ModelScope API (api.modelscope.cn)", type: "AI 模型", status: "ok", latency: "98ms", uptime: "99.88%", lastCheck: "刚刚" },
  { name: "智谱 GLM API (open.bigmodel.cn)", type: "AI 模型", status: "warn", latency: "420ms", uptime: "98.45%", lastCheck: "刚刚" },
  { name: "S3 存储服务 (s3.amazonaws.com)", type: "文件存储", status: "ok", latency: "38ms", uptime: "99.99%", lastCheck: "刚刚" },
  { name: "Vercel CDN (vercel.app)", type: "CDN", status: "ok", latency: "12ms", uptime: "99.99%", lastCheck: "刚刚" },
  { name: "SMTP 邮件服务 (smtp.feishu.cn)", type: "邮件", status: "ok", latency: "85ms", uptime: "99.72%", lastCheck: "刚刚" },
  { name: "钉钉 Webhook", type: "通知", status: "ok", latency: "52ms", uptime: "99.98%", lastCheck: "刚刚" },
  { name: "飞书 Webhook", type: "通知", status: "ok", latency: "61ms", uptime: "99.95%", lastCheck: "刚刚" },
  { name: "企业微信 Webhook", type: "通知", status: "ok", latency: "48ms", uptime: "99.99%", lastCheck: "刚刚" },
];

const statusInfo = {
  ok: { cls: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2, label: "正常" },
  warn: { cls: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle, label: "响应慢" },
  error: { cls: "text-red-600", bg: "bg-red-50", icon: XCircle, label: "故障" },
};

export default function NetworkPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const okCount = endpoints.filter((e) => e.status === "ok").length;
  const warnCount = endpoints.filter((e) => e.status === "warn").length;
  const errorCount = endpoints.filter((e) => e.status === "error").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">网络状态</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            上次检测: {lastRefresh.toLocaleTimeString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-slate-200" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            重新检测
          </Button>
        </div>
      </div>

      {/* 状态总览 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "正常", value: okCount, total: endpoints.length, color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
          { label: "警告", value: warnCount, total: endpoints.length, color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle },
          { label: "故障", value: errorCount, total: endpoints.length, color: "bg-red-500", text: "text-red-600", bg: "bg-red-50", icon: XCircle },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.text}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{item.value}/{item.total}</p>
                <p className={`text-xs font-medium ${item.text}`}>{item.label}服务</p>
              </div>
              <div className="ml-auto">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <Signal className={`h-5 w-5 ${item.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 端点列表 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">外网端点连通性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {endpoints.map((ep) => {
              const info = statusInfo[ep.status as keyof typeof statusInfo];
              return (
                <div
                  key={ep.name}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${info.bg}`}>
                    <Globe className={`h-4 w-4 ${info.cls}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-700 truncate">{ep.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${info.bg} ${info.cls}`}>{info.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{ep.type}</span>
                      <span>延迟 {ep.latency}</span>
                      <span>可用率 {ep.uptime}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <info.icon className={`h-4 w-4 mx-auto ${info.cls}`} />
                    <p className="text-xs text-slate-400 mt-0.5">{ep.lastCheck}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}