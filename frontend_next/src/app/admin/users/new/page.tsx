/**
 * page.tsx
 * 新增用户页面
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";
import { adminApi } from "@/lib/api_client";

export default function NewUserPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    plan: "free",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化时加载翻译
  useEffect(() => {
    void loadNamespace('admin');
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = translate("admin.users.new.name_required");
    if (!form.email.trim()) newErrors.email = translate("admin.users.new.email_required");
    else if (!form.email.includes("@")) newErrors.email = translate("admin.users.new.email_invalid");
    if (!form.password) newErrors.password = translate("admin.users.new.password_required");
    else if (form.password.length < 6) newErrors.password = translate("admin.users.new.password_min");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await adminApi.createUser({ name: form.name, email: form.email, password: form.password, plan: form.plan });
      toast({ message: translate("admin.users.new.saved"), variant: "success" });
      setTimeout(() => { window.location.href = "/admin/users"; }, 800);
    } catch (e: any) {
      toast({ message: e.message || translate("admin.users.error.operation_failed"), variant: "error" });
      setSaving(false);
    }
  };

  const quickActions = [
    { labelKey: "admin.users.new.batch_import", icon: UserPlus, action: () => toast({ message: translate("admin.users.new.coming_soon"), variant: "info" }) },
    { labelKey: "admin.users.new.invite_link", icon: Mail, action: () => navigator.clipboard?.writeText(window.location.origin).then(() => toast({ message: translate("admin.users.new.link_copied"), variant: "success" })).catch(() => toast({ message: translate("admin.users.error.operation_failed"), variant: "error" })) },
    { labelKey: "admin.users.new.import_csv", icon: UserPlus, action: () => toast({ message: translate("admin.users.new.coming_soon"), variant: "info" }) },
  ];

  const planOptions = [
    { value: "free", labelKey: "admin.users.new.plan_free", descKey: "admin.users.new.plan_free_desc" },
    { value: "pro", labelKey: "admin.users.new.plan_pro", descKey: "admin.users.new.plan_pro_desc" },
    { value: "vip", labelKey: "admin.users.new.plan_vip", descKey: "admin.users.new.plan_vip_desc" },
  ];

  return (
    <div className="space-y-5">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white font-bold hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {translate("admin.users.new.back")}
        </Link>
        <span className="text-slate-900 dark:text-white font-bold/50">/</span>
        <span className="text-sm text-foreground font-medium">{translate("admin.users.new.title")}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{translate("admin.users.new.title")}</h1>
          <p className="text-sm text-slate-900 dark:text-white font-bold mt-0.5">{translate("admin.users.new.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左侧: 表单 */}
        <div className="lg:col-span-2 space-y-5">
          {/* 基本信息 */}
          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.users.new.basic_info")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    {translate("admin.users.new.name_label")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-10 rounded-none-none ${errors.name ? "border-red-400 focus:ring-red-100" : ""}`}
                    placeholder={translate("admin.users.new.name_required")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">
                    {translate("admin.users.new.email_label")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    className={`h-10 rounded-none-none ${errors.email ? "border-red-400 focus:ring-red-100" : ""}`}
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/80">
                  {translate("admin.users.new.password_label")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  className={`h-10 rounded-none-none ${errors.password ? "border-red-400 focus:ring-red-100" : ""}`}
                  placeholder={translate("admin.users.new.password_min")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {errors.password ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>
                ) : (
                  <p className="text-xs text-slate-900 dark:text-white font-bold">{translate("admin.users.new.password_hint")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 套餐配置 */}
          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.users.new.plan_config")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {planOptions.map((plan) => (
                  <button
                    key={plan.value}
                    onClick={() => setForm({ ...form, plan: plan.value })}
                    className={`p-4 rounded-none-none border-2 text-left transition-all ${
                      form.plan === plan.value
                        ? plan.value === "free"
                          ? "border-border bg-muted/25"
                          : plan.value === "pro"
                          ? "border-blue-500/60 bg-blue-500/10 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] shadow-blue-500/10"
                          : "border-amber-500/60 bg-amber-500/10 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] shadow-amber-500/10"
                        : "border-border/60 hover:border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-bold ${
                        form.plan === plan.value
                          ? plan.value === "free" ? "text-foreground/80" : plan.value === "pro" ? "text-blue-400" : "text-amber-400"
                          : "text-slate-900 dark:text-white font-bold"
                      }`}>{translate(plan.labelKey)}</p>
                      {form.plan === plan.value && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-slate-900 dark:text-white font-bold">{translate(plan.descKey)}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="h-10 px-6 font-semibold rounded-none-none shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] shadow-blue-500/20 gap-2"
              onClick={handleSave}
            >
              {saving ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-400 animate-spin" />{translate("admin.users.new.creating")}</>
              ) : (
                <><Save className="h-4 w-4" />{translate("admin.users.new.create_btn")}</>
              )}
            </Button>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="h-10 px-6 rounded-none-none border-border">
                {translate("admin.users.new.cancel")}
              </Button>
            </Link>
          </div>
        </div>

        {/* 右侧: 说明 */}
        <div className="space-y-4">
          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.users.new.instructions_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-900 dark:text-white font-bold leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-none bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">1</div>
                <p>{translate("admin.users.new.instruction1")}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-none bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">2</div>
                <p>{translate("admin.users.new.instruction2")}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-none bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-center font-bold">3</div>
                <p>{translate("admin.users.new.instruction3")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">{translate("admin.users.new.quick_actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((item) => (
                <button
                  key={item.labelKey}
                  onClick={item.action}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-none-none bg-muted/25 hover:bg-muted/40 text-xs font-medium text-foreground/80 transition-colors text-left"
                >
                  <item.icon className="h-3.5 w-3.5 text-slate-900 dark:text-white font-bold" />
                  {translate(item.labelKey)}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
