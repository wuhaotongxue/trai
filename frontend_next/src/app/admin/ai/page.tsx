/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: AI 内容管理页面
 */

"use client";

import { useState, useEffect } from "react";
import { Bot, Image as ImageIcon, Video, Music, Settings, Activity, Power, RefreshCw, Sparkles, Zap, Cpu, Cloud, Server } from "lucide-react";
import { request } from "@/lib/api_client";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  api_base: string | null;
  is_active: boolean;
  model_type?: string;
}

interface AIStats {
  chat_count: number;
  image_count: number;
  video_count: number;
  audio_count: number;
}

interface ImageProvider {
  id: string;
  name: string;
  model: string;
  max_concurrent: number;
  status: "online" | "offline" | "loading";
}

const IMAGE_PRESETS = [
  { labelKey: "admin.ai.management.photorealistic", promptKey: "admin.ai.management.photorealistic_prompt" },
  { labelKey: "admin.ai.management.landscape", promptKey: "admin.ai.management.landscape_prompt" },
  { labelKey: "admin.ai.management.cyberpunk", promptKey: "admin.ai.management.cyberpunk_prompt" },
  { labelKey: "admin.ai.management.anime", promptKey: "admin.ai.management.anime_prompt" },
];

export default function AIManagementPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const [stats, setStats] = useState<AIStats | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useAdminToast();
  const [imageProviders] = useState<ImageProvider[]>([
    { id: "local", name: translate("admin.ai.management.local_node"), model: "Z-Image-Turbo", max_concurrent: 1, status: "online" as const },
    { id: "dashscope", name: translate("admin.ai.management.provider.dashscope"), model: "wanx-v1", max_concurrent: 5, status: "online" as const },
  ]);
  const [selectedProvider, setSelectedProvider] = useState("local");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        request<AIStats>("/admin/ai/stats").catch(() => null),
        request<ModelConfig[]>("/admin/ai/models").catch(() => []),
      ]);
      if (s) setStats(s);
      if (m) setModels(m);
    } catch {
      console.error("Fetch AI data failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNamespace('admin');
    void fetchData();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await request(`/admin/ai/models/${id}/toggle`, { method: "POST" });
      toast({ message: translate("admin.ai.management.model_updated"), variant: "success" });
      void fetchData();
    } catch (e: any) {
      toast({ message: e.message || translate("admin.ai.management.update_failed"), variant: "error" });
    }
  };

  const handlePreset = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({ message: translate("admin.ai.management.prompt_copied"), variant: "success" });
  };

  const statsData = [
    {
      labelKey: "admin.ai.management.chat_total",
      value: stats?.chat_count || 0,
      icon: Bot,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/20",
    },
    {
      labelKey: "admin.ai.management.image_gen",
      value: stats?.image_count || 0,
      icon: ImageIcon,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-cyan-500",
      borderColor: "border-emerald-500/20",
    },
    {
      labelKey: "admin.ai.management.video_synth",
      value: stats?.video_count || 0,
      icon: Video,
      gradient: "from-orange-500/20 to-cyan-500/20",
      iconColor: "text-orange-500",
      borderColor: "border-orange-500/20",
    },
    {
      labelKey: "admin.ai.management.audio_proc",
      value: stats?.audio_count || 0,
      icon: Music,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500",
      borderColor: "border-purple-500/20",
    },
  ];

  const systemMetrics = [
    { labelKey: "admin.ai.management.gpu_mem", used: 39.66, total: 44.39, color: "bg-cyan-500" },
    { labelKey: "admin.ai.management.cpu_usage", used: 23, total: 100, color: "bg-blue-500" },
    { labelKey: "admin.ai.management.mem_usage", used: 8.2, total: 32, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none-none bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{translate("admin.ai.management.title")}</h1>
            <p className="text-sm text-slate-900 dark:text-white font-bold mt-0.5">{translate("admin.ai.management.subtitle")}</p>
          </div>
        </div>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-none-none bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-all border border-primary/20"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {translate("admin.ai.management.refresh")}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((item) => (
          <div
            key={item.labelKey}
            className={`relative overflow-hidden rounded-none-none border ${item.borderColor} bg-gradient-to-br ${item.gradient} p-5 transition-all hover:scale-[1.02] hover:shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff]`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground mt-1">{item.value.toLocaleString()}</p>
                <p className="text-sm text-slate-900 dark:text-white font-bold mt-1">{translate(item.labelKey)}</p>
              </div>
              <div className="w-10 h-10 rounded-none-none bg-white dark:bg-slate-900 flex items-center justify-center shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-none-none bg-slate-100/20 translate-x-4 translate-y-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 模型节点配置 */}
        <div className="lg:col-span-2 rounded-none-none border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
              <h2 className="text-sm font-semibold">{translate("admin.ai.management.model_config")}</h2>
            </div>
            <button
              onClick={() => toast({ message: translate("admin.ai.management.coming_soon"), variant: "info" })}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-none-none bg-background border border-border text-xs text-slate-900 dark:text-white font-bold hover:bg-muted transition-colors"
            >
              <Settings className="h-3 w-3" />
              {translate("admin.ai.management.config_channel")}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {models.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-900 dark:text-white font-bold">
                {loading ? translate("admin.ai.management.loading") : translate("admin.ai.management.no_models")}
              </div>
            )}
            {models.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 p-4 rounded-none-none border border-border/50 hover:bg-muted/10 transition-all group"
              >
                <div className={`w-10 h-10 rounded-none-none flex items-center justify-center transition-colors ${
                  m.is_active ? "bg-cyan-500/10" : "bg-muted"
                }`}>
                  <Activity className={`h-5 w-5 ${m.is_active ? "text-cyan-500" : "text-slate-900 dark:text-white font-bold"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <span className={`px-2 py-0.5 rounded-none-md text-[10px] font-medium ${
                      m.is_active
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-emerald-400"
                        : "bg-muted text-slate-900 dark:text-white font-bold"
                    }`}>
                      {m.is_active ? translate("admin.ai.management.running") : translate("admin.ai.management.stopped")}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-none-md bg-muted text-[10px] text-slate-900 dark:text-white font-bold font-mono">{m.provider}</span>
                  </div>
                  <p className="text-xs text-slate-900 dark:text-white font-bold mt-1 truncate">{m.api_base || translate("admin.ai.management.internal")}</p>
                </div>
                <button
                  onClick={() => void handleToggle(m.id)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-none-none text-xs font-medium transition-all ${
                    m.is_active
                      ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
                      : "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 border border-emerald-500/20"
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {m.is_active ? translate("admin.ai.management.disable") : translate("admin.ai.management.enable")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 实时状态 */}
        <div className="rounded-none-none border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-slate-900 dark:text-white font-bold" />
              <h2 className="text-sm font-semibold">{translate("admin.ai.management.system_status")}</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              {systemMetrics.map((item) => (
                <div key={item.labelKey}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-900 dark:text-white font-bold">{translate(item.labelKey)}</span>
                    <span className="font-medium text-foreground">{item.used} / {item.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-none-none overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-none-none transition-all`}
                      style={{ width: `${(item.used / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-cyan-500" />
                  {translate("admin.ai.management.model_status")}
                </span>
                <span className="text-cyan-600 dark:text-emerald-400 font-medium">{translate("admin.ai.model_status.idle")}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                  <Cloud className="h-3 w-3 text-blue-500" />
                  {translate("admin.ai.management.backend_service")}
                </span>
                <span className="text-cyan-600 dark:text-emerald-400 font-medium">{translate("admin.ai.management.online")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文生图配置面板 */}
      <div className="rounded-none-none border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-cyan-500" />
            <h2 className="text-sm font-semibold">{translate("admin.ai.management.image_config")}</h2>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-none-none bg-cyan-500/10 text-cyan-600 dark:text-emerald-400 font-medium">Z-Image-Turbo</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 提供商选择 */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-900 dark:text-white font-bold uppercase tracking-wider">{translate("admin.ai.management.select_provider")}</label>
              <div className="space-y-2">
                {imageProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-none-none border transition-all text-left ${
                      selectedProvider === p.id
                        ? "border-emerald-500/40 bg-cyan-500/5"
                        : "border-border hover:border-emerald-500/20 hover:bg-muted/20"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-none-none flex items-center justify-center ${
                      p.status === "online" ? "bg-cyan-500/10" : "bg-muted"
                    }`}>
                      <Activity className={`h-4 w-4 ${p.status === "online" ? "text-cyan-500" : "text-slate-900 dark:text-white font-bold"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-slate-900 dark:text-white font-bold">{p.model}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-none-none font-medium ${
                      p.status === "online"
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-emerald-400"
                        : "bg-muted text-slate-900 dark:text-white font-bold"
                    }`}>
                      {p.status === "online" ? translate("admin.ai.management.online") : translate("admin.ai.management.offline")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 快速提示词 */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-medium text-slate-900 dark:text-white font-bold uppercase tracking-wider">{translate("admin.ai.management.preset_prompts")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.labelKey}
                    onClick={() => handlePreset(translate(preset.promptKey))}
                    className="flex items-start gap-3 p-3 rounded-none-none border border-border hover:border-emerald-500/30 hover:bg-cyan-500/5 transition-all text-left group"
                  >
                    <div className="w-6 h-6 rounded-none-none bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-3 w-3 text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{translate(preset.labelKey)}</p>
                      <p className="text-xs text-slate-900 dark:text-white font-bold mt-0.5 line-clamp-2">{translate(preset.promptKey)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
