/**
 * page.tsx
 * 配额配置页面
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Edit2, Image, RefreshCw, Save, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { request } from "@/lib/api_client";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";

const PLAN_FEATURES = {
  free: [
    "admin.quotas.free_agent",
    "admin.quotas.free_session",
    "admin.quotas.free_vision",
    "admin.quotas.free_upload",
  ],
  pro: [
    "admin.quotas.pro_agent",
    "admin.quotas.pro_unlimited_session",
    "admin.quotas.pro_vision",
    "admin.quotas.pro_upload",
    "admin.quotas.pro_support",
  ],
  vip: [
    "admin.quotas.vip_agent",
    "admin.quotas.vip_unlimited_session",
    "admin.quotas.vip_vision",
    "admin.quotas.vip_upload",
    "admin.quotas.vip_manager",
    "admin.quotas.vip_sla",
  ],
};

const plans = [
  {
    nameKey: "admin.quotas.free_plan",
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-50",
    text: "text-slate-500",
    priceKey: "admin.quotas.price_free",
    descKey: "admin.quotas.free_desc",
    featuresKey: PLAN_FEATURES.free,
    limits: { agent_calls: 50, sessions: 20, messages_per_session: 10, upload_size: 10, image_gen: 5 },
  },
  {
    nameKey: "admin.quotas.pro_plan",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-500",
    priceKey: "admin.quotas.price_pro",
    descKey: "admin.quotas.pro_desc",
    popular: true,
    featuresKey: PLAN_FEATURES.pro,
    limits: { agent_calls: 500, sessions: -1, messages_per_session: -1, upload_size: 100, image_gen: 50 },
  },
  {
    nameKey: "admin.quotas.vip_plan",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    text: "text-amber-500",
    priceKey: "admin.quotas.price_vip",
    descKey: "admin.quotas.vip_desc",
    featuresKey: PLAN_FEATURES.vip,
    limits: { agent_calls: -1, sessions: -1, messages_per_session: -1, upload_size: 1024, image_gen: 200 },
  },
];

interface ImageGenConfig {
  provider: string;
  default_model: string;
  modelscope_model: string;
  openai_model: string;
  api_base_url: string;
  api_key_configured: boolean;
}

export default function QuotasPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const [imageConfig, setImageConfig] = useState<ImageGenConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useAdminToast();

  // 初始化时加载翻译
  useEffect(() => {
    void loadNamespace('admin');
  }, []);

  const fetchImageConfig = async () => {
    try {
      const config = await request<ImageGenConfig>("/admin/image_gen_config");
      setImageConfig(config);
    } catch {
      console.error("Fetch image config failed");
    }
  };

  useEffect(() => {
    void fetchImageConfig();
  }, []);

  const handleSaveImageConfig = async () => {
    if (!imageConfig) return;
    setLoading(true);
    try {
      await request("/admin/image_gen_config", {
        method: "PUT",
        body: JSON.stringify({
          provider: imageConfig.provider,
          default_model: imageConfig.default_model,
          modelscope_model: imageConfig.modelscope_model,
          openai_model: imageConfig.openai_model,
          api_base_url: imageConfig.api_base_url,
        }),
      });
      toast({ message: translate("admin.quotas.config_updated"), variant: "success" });
    } catch (e: any) {
      toast({ message: e.message || translate("admin.quotas.config_failed"), variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const globalConfigFields = [
    { labelKey: "admin.quotas.agent_limit", value: "50", descKey: "admin.quotas.agent_limit_desc", placeholderKey: "admin.quotas.agent_limit_placeholder" },
    { labelKey: "admin.quotas.session_limit", value: "20", descKey: "admin.quotas.session_limit_desc", placeholderKey: "admin.quotas.session_limit_placeholder" },
    { labelKey: "admin.quotas.msg_per_session", value: "10", descKey: "admin.quotas.msg_per_session_desc", placeholderKey: "admin.quotas.session_limit_placeholder" },
  ];

  return (
    <div className="space-y-5 page-enter">
      {/* 顶部标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          {translate("admin.quotas.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{translate("admin.quotas.subtitle")}</p>
      </div>

      {/* 套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.nameKey}
            className={`border-0 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group ${plan.popular ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
          >
            <div className={`h-1.5 bg-gradient-to-r ${plan.color}`} />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{translate(plan.nameKey)}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{translate(plan.descKey)}</p>
                </div>
                {plan.popular && (
                  <span className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {translate("admin.quotas.popular")}
                  </span>
                )}
              </div>
              <p className={`text-xl font-bold mt-2 ${plan.text}`}>{translate(plan.priceKey)}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.featuresKey.map((fKey) => (
                <div key={fKey} className="flex items-center gap-2 text-xs text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  {translate(fKey)}
                </div>
              ))}
              <Button size="sm" className={`w-full h-9 mt-2 text-sm gap-2 ${plan.popular ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" : ""}`} variant={plan.popular ? "default" : "outline"}>
                <Edit2 className="h-3.5 w-3.5" />
                {translate("admin.quotas.edit_quota")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速配置区 */}
      <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            {translate("admin.quotas.global_config")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{translate("admin.quotas.global_desc")}</p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {globalConfigFields.map((field) => (
              <div key={field.labelKey} className="space-y-2">
                <Label className="text-sm font-medium text-foreground/80">{translate(field.labelKey)}</Label>
                <Input className="h-10 rounded-lg" defaultValue={field.value} placeholder={translate(field.placeholderKey)} />
                <p className="text-xs text-muted-foreground">{translate(field.descKey)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <Button size="sm" className="h-9 gap-2 text-sm shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500">
              <Save className="h-4 w-4" />
              {translate("admin.quotas.save_global")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 图像生成配置 */}
      <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Image className="h-4 w-4 text-emerald-500" />
              {translate("admin.quotas.image_config")}
              <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-normal ml-2">ModelScope</span>
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => void fetchImageConfig()}>
              <RefreshCw className="h-3.5 w-3.5" />
              {translate("admin.quotas.refresh")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{translate("admin.quotas.image_config_desc")}</p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">{translate("admin.quotas.provider")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                value={imageConfig?.provider || "modelscope"}
                onChange={(e) => setImageConfig((prev) => prev ? { ...prev, provider: e.target.value } : prev)}
              >
                <option value="modelscope">{translate("admin.quotas.option.modelscope")}</option>
                <option value="openai">{translate("admin.quotas.option.openai")}</option>
                <option value="api">{translate("admin.quotas.custom_api")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">{translate("admin.quotas.default_model")}</Label>
              <Input
                className="h-10 rounded-lg"
                value={imageConfig?.default_model || "Z-Image-Turbo"}
                onChange={(e) => setImageConfig((prev) => prev ? { ...prev, default_model: e.target.value } : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">{translate("admin.quotas.modelscope_model")}</Label>
              <Input
                className="h-10 rounded-lg"
                value={imageConfig?.modelscope_model || "Z-Image-Turbo"}
                onChange={(e) => setImageConfig((prev) => prev ? { ...prev, modelscope_model: e.target.value } : prev)}
              />
              <p className="text-xs text-muted-foreground">{translate("admin.quotas.modelscope_desc")}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">{translate("admin.quotas.openai_model")}</Label>
              <Input
                className="h-10 rounded-lg"
                value={imageConfig?.openai_model || "dall-e-3"}
                onChange={(e) => setImageConfig((prev) => prev ? { ...prev, openai_model: e.target.value } : prev)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium text-foreground/80">{translate("admin.quotas.custom_api")}</Label>
              <Input
                className="h-10 rounded-lg"
                placeholder="https://api.openai.com/v1"
                value={imageConfig?.api_base_url || ""}
                onChange={(e) => setImageConfig((prev) => prev ? { ...prev, api_base_url: e.target.value } : prev)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <Button size="sm" className="h-9 gap-2 text-sm shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" onClick={() => void handleSaveImageConfig()} disabled={loading}>
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-4 w-4" />}
              {translate("admin.quotas.save_config")}
            </Button>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${imageConfig?.api_key_configured ? "bg-emerald-500" : "bg-red-500"}`} />
              {translate("admin.quotas.api_key")} {imageConfig?.api_key_configured ? translate("admin.quotas.api_key_configured") : translate("admin.quotas.api_key_not_configured")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
