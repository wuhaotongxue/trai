/**
 * page.tsx
 * 作者: wuhao
 * 日期: 2026-04-23
 * 描述: 管理员登录页
 */

"use client";
import Cookies from "js-cookie";

import Link from "next/link";
import { useState, useRef } from "react";
import { Bot, Eye, EyeOff, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api_client";
import { ThemeToggle } from "@/components/website/theme_toggle";
import { useI18n } from "@/i18n/i18n_context";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);
  const { t } = useI18n();
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    (typeof window !== "undefined"
      ? window.location.protocol === "https:"
        ? `${window.location.protocol}//${window.location.hostname}/api_trai/v1`
        : `${window.location.protocol}//${window.location.hostname}:5666/api_trai/v1`
      : "http://localhost:5666/api_trai/v1");

  const lastSubmitTime = useRef(0);

  const handleLogin = async () => {
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000) return;
    lastSubmitTime.current = now;
    if (loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      Cookies.set("token", res.access_token);
      Cookies.set("refresh_token", res.refresh_token);
      localStorage.setItem("trai-admin-locale", "zh");
      window.location.href = "/admin";
    } catch (e: any) {
      const message = e?.message || t("admin.login.error.failed");
      if (message.toLowerCase().includes("fetch")) {
        setErrorMessage(`${t("admin.login.error.backend")} ${apiBase}`);
      } else {
        setErrorMessage(message);
      }
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-[#080c1a] dark:via-[#0d1220] dark:to-[#080c1a] p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* 右上角主题切换 */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-shadow">
              <Bot className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-5 tracking-tight">{t("admin.login.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t("admin.login.subtitle")}</p>
        </div>

        <div className="bg-background/90 backdrop-blur-md rounded-3xl border border-border shadow-2xl shadow-blue-500/5 overflow-hidden">
          {/* 头部标识 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t("admin.login.header")}</h2>
              <p className="text-blue-100/70 text-xs">{t("admin.login.header_desc")}</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-foreground/80">{t("admin.login.username")}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t("admin.login.username_placeholder")}
                className={`h-11 rounded-xl ${shakeError ? "border-red-400 animate-shake" : ""}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">{t("admin.login.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("admin.login.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  className={`h-11 rounded-xl pr-10 ${shakeError ? "border-red-400 animate-shake" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? t("admin.login.hide_password") : t("admin.login.show_password")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" id="admin-remember" className="rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span>{t("admin.login.remember")}</span>
              </label>
              <button className="text-xs text-blue-500 hover:underline">{t("admin.login.forgot")}</button>
            </div>

            {errorMessage && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-[10px] font-bold">!</span>
                </div>
                {errorMessage}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  {t("admin.login.verifying")}
                </>
              ) : (
                <>
                  {t("admin.login.enter")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors">
                {t("admin.login.back")}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          TRAI Admin System v2.0.0 · {t("admin.login.footer")}
        </p>
      </div>
    </div>
  );
}
