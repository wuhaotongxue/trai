/**
 * page.tsx
 * TRAI 登录页
 * - Neo-Brutalism 风格
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
  { icon: Zap, key: "login.feature.1", color: "bg-cyan-300 dark:bg-cyan-600" },
  { icon: Shield, key: "login.feature.2", color: "bg-emerald-300 dark:bg-emerald-600" },
  { icon: Globe, key: "login.feature.3", color: "bg-indigo-300 dark:bg-indigo-600" },
  { icon: Sparkles, key: "login.feature.4", color: "bg-cyan-300 dark:bg-cyan-600" },
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

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api_trai/v1";

  useEffect(() => {
    setMounted(true);
    const err = searchParams.get("error");
    const reason = searchParams.get("reason");
    if (reason === "quota_exceeded") {
      setErrorMessage(translate("login.error.quota_exceeded") || "配额超限");
    } else if (err === "not_bound") {
      setErrorMessage(translate("login.error.not_bound") || "账号未绑定");
    } else if (err === "account_disabled") {
      setErrorMessage(translate("login.error.account_disabled") || "账号已禁用");
    } else if (err === "auth_failed" || err === "wecom_auth_failed") {
      setErrorMessage(translate("login.error.wecom_failed") || "企微登录失败");
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
      const message = e instanceof Error ? e.message : (translate("login.error.failed") || "登录失败");
      if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
        setErrorMessage(`${translate("login.error.backend") || "后端未响应"} ${apiBase}`);
      } else if (message.includes("403") || message.includes("待审核") || message.includes("禁用")) {
        setErrorMessage(message.includes("403") ? (translate("login.error.account_disabled_2") || "账号待审核或禁用") : message);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-900 selection:bg-slate-100 selection:text-slate-900">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-100 p-12 border-r-4 border-slate-900 dark:border-white relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Logo */}
        <div className="relative flex items-center justify-between z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] flex items-center justify-center transition-transform hover:-translate-y-1">
              <Bot className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 uppercase tracking-widest">TRAI</span>
            </div>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* 核心内容 */}
        <div className="relative space-y-10 z-10">
          <div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-widest leading-tight mb-6 bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] transform -rotate-1">
              让 AI 替你工作
            </h1>
            <p className="text-slate-900 text-xl font-bold leading-relaxed max-w-md bg-cyan-200 inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] transform rotate-1 mt-4">
              企业级 AI 助手平台，支持多工具调用、自动纠错、视觉理解与流式交互。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.key} className={`flex items-center gap-4 ${f.color} border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] px-4 py-3 transform transition-transform hover:-translate-y-1`}>
                <f.icon className="h-6 w-6 text-slate-900" />
                <span className="text-lg text-slate-900 font-black uppercase tracking-wider">{translate(f.key) || f.key.split('.').pop()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 */}
        <div className="relative text-sm font-bold text-slate-900 uppercase tracking-widest z-10">
          {translate("login.footer.brand") || "© 2026 TRAI AI PLATFORM"}
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo - 移动端显示 */}
          <div className="lg:hidden flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center">
                <Bot className="h-6 w-6 text-slate-900" />
              </div>
              <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-widest">TRAI</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{translate("login.form.title") || "欢迎回来"}</h2>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-2">{translate("login.form.subtitle") || "请登录您的账号"}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">{translate("login.form.username") || "账号"}</Label>
              <Input
                id="email"
                type="text"
                placeholder={translate("login.form.username_placeholder") || "邮箱/用户名"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-none border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">{translate("login.form.password") || "密码"}</Label>
                <Link href="/forgot_password" className="text-sm font-bold text-cyan-500 hover:text-cyan-600 uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-rose-500">
                  {translate("login.form.forgot_password") || "忘记密码？"}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={translate("login.form.password_placeholder") || "输入密码"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-none border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-slate-100 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                <span className="text-slate-900 text-xl font-black">!</span>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full h-16 text-xl font-black uppercase tracking-widest bg-slate-100 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] hover:bg-slate-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-none animate-spin" />
                  {translate("login.form.logging_in") || "登录中..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {translate("login.form.login") || "登录"}
                  <ArrowRight className="h-6 w-6" />
                </span>
              )}
            </Button>

            <div className="relative flex items-center justify-center my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-4 border-slate-900 dark:border-white" />
              </div>
              <span className="relative px-4 bg-white dark:bg-slate-900 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {translate("login.form.other_methods") || "其他登录方式"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 h-14 bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-slate-900 dark:text-white font-black uppercase tracking-widest hover:-translate-y-1 transition-transform"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.523 3.952 1.464l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.478 2.543 12s4.478 10 10.002 10c3.31 0 5.954-1.193 8.033-3.152l-3.033-2.609z" />
                </svg>
                {translate("login.form.google") || "Google"}
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-3 h-14 bg-blue-500 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] text-white font-black uppercase tracking-widest hover:-translate-y-1 transition-transform"
                onClick={async () => {
                  try {
                    const res = await fetch(`${apiBase}/auth/wecom/url`);
                    const data = await res.json();
                    if (data && data.url) {
                      window.location.href = data.url;
                    }
                  } catch {
                    setErrorMessage(translate("login.error.wecom_url_failed") || "获取企微登录链接失败");
                  }
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.996 22.46c-5.772 0-10.45-4.679-10.45-10.45S6.224 1.56 11.996 1.56c5.771 0 10.45 4.678 10.45 10.45s-4.679 10.45-10.45 10.45zm0-19.46c-4.968 0-8.988 4.02-8.988 8.988s4.02 8.989 8.988 8.989c4.968 0 8.988-4.021 8.988-8.989S16.964 3 11.996 3zm-2.85 13.568v-7.14h1.764v5.617h3.693v1.523H9.146zm2.85-8.54c-.642 0-1.162-.52-1.162-1.163 0-.641.52-1.162 1.162-1.162.641 0 1.162.521 1.162 1.162 0 .642-.52 1.163-1.162 1.163z" />
                </svg>
                {translate("login.form.wecom") || "企业微信"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-400 mt-8 uppercase tracking-widest">
            {translate("login.form.no_account") || "没有账号？"}{" "}
            <Link href="/register" className="text-slate-900 dark:text-white bg-slate-100 px-2 py-1 border-2 border-slate-900 hover:bg-slate-50 transition-colors shadow-[2px_2px_0px_0px_#0f172a]">
              {translate("login.form.register_now") || "立即注册"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-slate-900 border-t-cyan-400 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
