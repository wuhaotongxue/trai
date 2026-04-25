/**
 * page.tsx
 * 系统设置页面
 */

"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Database, Save, Settings, Shield, Lock, KeyRound, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminI18n } from "@/contexts/admin_i18n_context";
import { useAdminToast } from "@/contexts/admin_toast_context";
type Tab = "general" | "security" | "notifications" | "advanced";

export default function SettingsPage() {
  const { translate, loadNamespace } = useAdminI18n();
  const { toast } = useAdminToast();
  const [tab, setTab] = useState<Tab>("general");
  const [saved, setSaved] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<Record<string, boolean>>({
    "notification_reg": true,
    "notification_error": true,
    "notification_quota": true,
    "notification_daily": false,
  });

  // 初始化时加载翻译
  useEffect(() => {
    void loadNamespace('admin');
  }, []);

  const tabs = [
    { id: "general" as Tab, labelKey: "admin.settings.general", icon: Settings },
    { id: "security" as Tab, labelKey: "admin.settings.security", icon: Shield },
    { id: "notifications" as Tab, labelKey: "admin.settings.notifications", icon: Bell },
    { id: "advanced" as Tab, labelKey: "admin.settings.advanced", icon: Database },
  ];

  const handleSave = () => {
    toast({ message: translate("admin.settings.saved"), variant: "success" });
  };

  const toggleNotification = (key: string) => {
    setActiveNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generalFields = [
    { labelKey: "admin.settings.system_name", value: "TRAI 管理后台", disabled: false },
    { labelKey: "admin.settings.system_version", value: "v2.0.0", disabled: true },
    { labelKey: "admin.settings.api_address", value: "trai.tuoren.com", disabled: false },
    { labelKey: "admin.settings.env_mode", value: "production", disabled: false },
    { labelKey: "admin.settings.timezone", value: "Asia/Shanghai (UTC+8)", disabled: false },
    { labelKey: "admin.settings.default_lang", value: "zh-cn", disabled: false },
  ];

  const securityFields = [
    { labelKey: "admin.settings.current_password", type: "password", value: "••••••••", placeholder: "" },
    { labelKey: "admin.settings.new_password", type: "password", value: "", placeholder: "admin.settings.new_password_placeholder" },
    { labelKey: "admin.settings.session_timeout", type: "number", value: "30", placeholder: "" },
    { labelKey: "admin.settings.fail_login_lock", type: "number", value: "5", placeholder: "" },
  ];

  const notificationItems = [
    { key: "notification_reg", labelKey: "admin.settings.notification_reg", descKey: "admin.settings.notification_reg_desc", color: "blue", icon: KeyRound },
    { key: "notification_error", labelKey: "admin.settings.notification_error", descKey: "admin.settings.notification_error_desc", color: "red", icon: AlertTriangle },
    { key: "notification_quota", labelKey: "admin.settings.notification_quota", descKey: "admin.settings.notification_quota_desc", color: "amber", icon: Shield },
    { key: "notification_daily", labelKey: "admin.settings.notification_daily", descKey: "admin.settings.notification_daily_desc", color: "emerald", icon: Database },
  ];

  const advancedFields = [
    { labelKey: "admin.settings.db_connection", value: "postgresql://localhost:5432/trai", type: "text" },
    { labelKey: "admin.settings.redis_connection", value: "redis://localhost:6379", type: "text" },
    { labelKey: "admin.settings.openai_key", value: "sk-••••••••••••", type: "password" },
    { labelKey: "admin.settings.log_level", value: "INFO", type: "text" },
  ];

  return (
    <div className="space-y-5 page-enter">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-500" />
            </div>
            {translate("admin.settings.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{translate("admin.settings.subtitle")}</p>
        </div>
        <Button size="sm" className="h-9 gap-2 text-sm shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" onClick={handleSave}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? translate("admin.settings.saved") : translate("admin.settings.save_all")}
        </Button>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1.5 w-fit border border-border/40 backdrop-blur-sm">
        {tabs.map((t_item) => (
          <button
            key={t_item.id}
            onClick={() => setTab(t_item.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t_item.id
                ? "bg-card text-foreground shadow-md border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <t_item.icon className={`h-4 w-4 ${tab === t_item.id ? "text-blue-500" : ""}`} />
            {translate(t_item.labelKey)}
          </button>
        ))}
      </div>

      {/* 基础配置 */}
      {tab === "general" && (
        <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              {translate("admin.settings.general")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {generalFields.map((field) => (
                <div key={field.labelKey} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">{translate(field.labelKey)}</Label>
                  <Input
                    className="h-10 rounded-lg border-border/60 bg-background/50"
                    defaultValue={field.value}
                    disabled={field.disabled}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? translate("admin.settings.saved") : translate("admin.settings.save_config")}
              </Button>
              {saved && (
                <span className="text-xs text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {translate("admin.settings.saved_cloud")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 安全设置 */}
      {tab === "security" && (
        <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              {translate("admin.settings.security")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {securityFields.map((field) => (
                <div key={field.labelKey} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">{translate(field.labelKey)}</Label>
                  <Input
                    className="h-10 rounded-lg border-border/60 bg-background/50"
                    type={field.type}
                    defaultValue={field.value}
                    placeholder={field.placeholder ? translate(field.placeholder) : ""}
                  />
                </div>
              ))}
            </div>

            {/* 安全提示 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/90">{translate("admin.settings.security_advice")}</p>
                <p className="text-xs text-muted-foreground mt-1">{translate("admin.settings.security_advice_desc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? translate("admin.settings.saved") : translate("admin.settings.save_security")}
              </Button>
              {saved && (
                <span className="text-xs text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {translate("admin.settings.saved_cloud")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知配置 */}
      {tab === "notifications" && (
        <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-500" />
              {translate("admin.settings.notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-transparent hover:border-border/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 text-${item.color}-500`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/90">{translate(item.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{translate(item.descKey)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    activeNotifications[item.key] ? "bg-blue-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      activeNotifications[item.key] ? "left-[26px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? translate("admin.settings.saved") : translate("admin.settings.save_notification")}
              </Button>
              {saved && (
                <span className="text-xs text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {translate("admin.settings.saved_cloud")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 高级设置 */}
      {tab === "advanced" && (
        <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-500" />
              {translate("admin.settings.advanced")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {advancedFields.map((field) => (
                <div key={field.labelKey} className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">{translate(field.labelKey)}</Label>
                  <Input
                    className="h-10 rounded-lg border-border/60 bg-background/50 font-mono text-xs"
                    type={field.type}
                    defaultValue={field.value}
                  />
                </div>
              ))}
            </div>

            {/* 警告信息 */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/90">{translate("admin.settings.danger_warning")}</p>
                <p className="text-xs text-muted-foreground mt-1">{translate("admin.settings.danger_warning_desc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button size="sm" className="h-9 gap-2 text-sm shadow-sm" onClick={handleSave}>
                {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Save className="h-4 w-4" />}
                {saved ? translate("admin.settings.saved") : translate("admin.settings.save_advanced")}
              </Button>
              {saved && (
                <span className="text-xs text-emerald-500 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {translate("admin.settings.saved_cloud")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
