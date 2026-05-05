/**
 * page.tsx
 * TRAI 登录页
 */

"use client";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api_client";
import { useI18n } from "@/i18n/i18n_context";
import { LanguageSwitcher } from "@/components/website/language_switcher";

const features = [
  { icon: Zap, key: "login.feature.1" },
  { icon: Shield, key: "login.feature.2" },
  { icon: Globe, key: "login.feature.3" },
  { icon: Sparkles, key: "login.feature.4" },
];

function LoginForm() {
  const { translate } = useI18n();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    (typeof window !== "undefined"
      ? window.location.protocol === "https:"
        ? `${window.location.protocol}//${window.location.hostname}/api_trai/v1`
        : `${window.location.protocol}//${window.location.hostname}:5666/api_trai/v1`
      : "http://localhost:5666/api_trai/v1");

  useEffect(() => {
    setMounted(true);
    const err = searchParams.get("error");
    const reason = searchParams.get("reason");
    if (reason === "quota_exceeded") {
      setErrorMessage(translate("login.error.quota_exceeded"));
    } else if (err === "not_bound") {
      setErrorMessage(translate("login.error.not_bound"));
    } else if (err === "account_disabled") {
      setErrorMessage(translate("login.error.account_disabled"));
    } else if (err === "auth_failed" || err === "wecom_auth_failed") {
      setErrorMessage(translate("login.error.wecom_failed"));
    }
  }, [searchParams, translate]);

  const lastSubmitTime = useRef(0);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000) return;
    lastSubmitTime.current = now;
    if (loading) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await authApi.login({ username: email, password });
      Cookies.set("token", res.access_token);
      Cookies.set("refresh_token", res.refresh_token);
      if (res.user && res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/agent";
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : translate("login.error.failed");
      if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
        setErrorMessage(`${translate("login.error.backend")} ${apiBase}`);
      } else if (message.includes("403") || message.includes("待审核") || message.includes("禁用")) {
        setErrorMessage(message.includes("403") ? translate("login.error.account_disabled_2") : message);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl" />
          {/* 网格背景 */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">TRAI</span>
              <span className="block text-xs text-white/60 -mt-0.5">AI Agent Platform</span>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* 核心内容 */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              让 AI 替你<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                完成工作
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              企业级 AI 助手平台,支持多工具调用,自动纠错,VLM 视觉理解与流式交互
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.key} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">{translate(f.key)}</span>
              </div>
            ))}
          </div>

          {/* 评价 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-white/80 italic leading-relaxed mb-3">
              &ldquo;{translate("login.testimonial.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-semibold">{translate("login.testimonial.avatar")}</div>
              <div>
                <p className="text-xs font-medium text-white">{translate("login.testimonial.name")}</p>
                <p className="text-xs text-white/50">{translate("login.testimonial.role")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="relative text-xs text-white/40">
          {translate("login.footer.brand")}
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo - 移动端显示 */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">TRAI</span>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{translate("login.form.title")}</h2>
            <p className="text-sm text-muted-foreground mt-2">{translate("login.form.subtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">{translate("login.form.username")}</Label>
              <Input
                id="email"
                type="text"
                placeholder={translate("login.form.username_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">{translate("login.form.password")}</Label>
                <Link href="/forgot_password" className="text-xs text-blue-500 hover:text-blue-600 transition-colors">
                  {translate("login.form.forgot_password")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={translate("login.form.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {translate("login.form.logging_in")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {translate("login.form.login")}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <span className="relative px-3 bg-background text-xs text-muted-foreground">{translate("login.form.other_methods")}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border/60 bg-background hover:bg-muted/40 transition-all text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.523 3.952 1.464l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.478 2.543 12s4.478 10 10.002 10c3.31 0 5.954-1.193 8.033-3.152l-3.033-2.609z" />
                </svg>
                {translate("login.form.google")}
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border/60 bg-background hover:bg-muted/40 transition-all text-sm font-medium text-foreground/70 hover:text-foreground"
                onClick={async () => {
                  try {
                    const res = await fetch(`${apiBase}/auth/wecom/url`);
                    const data = await res.json();
                    if (data && data.url) {
                      window.location.href = data.url;
                    }
                  } catch {
                    setErrorMessage(translate("login.error.wecom_url_failed"));
                  }
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.996 22.46c-5.772 0-10.45-4.679-10.45-10.45S6.224 1.56 11.996 1.56c5.771 0 10.45 4.678 10.45 10.45s-4.679 10.45-10.45 10.45zm0-19.46c-4.968 0-8.988 4.02-8.988 8.988s4.02 8.989 8.988 8.989c4.968 0 8.988-4.021 8.988-8.989S16.964 3 11.996 3zm-2.85 13.568v-7.14h1.764v5.617h3.693v1.523H9.146zm2.85-8.54c-.642 0-1.162-.52-1.162-1.163 0-.641.52-1.162 1.162-1.162.641 0 1.162.521 1.162 1.162 0 .642-.52 1.163-1.162 1.163z" />
                </svg>
                {translate("login.form.wecom")}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {translate("login.form.no_account")}{" "}
            <Link href="/register" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
              {translate("login.form.register_now")}
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/60 mt-4">
            {translate("login.form.agree_terms_1")}{" "}
            <Link href="/terms" className="underline hover:text-foreground transition-colors">{translate("login.form.terms")}</Link>
            {" "}{translate("login.form.and")}{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">{translate("login.form.privacy")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
