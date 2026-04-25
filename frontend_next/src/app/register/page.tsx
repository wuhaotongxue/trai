/**
 * page.tsx
 * TRAI 注册页
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, Shield, Zap, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api_client";
import { useI18n } from "@/i18n/i18n_context";
import { LanguageSwitcher } from "@/components/website/language_switcher";

const benefits = [
  { icon: Zap, key: "register.benefit.1" },
  { icon: Globe, key: "register.benefit.2" },
  { icon: Shield, key: "register.benefit.3" },
];

function validatePassword(p: string): boolean {
  return p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);
}

export default function RegisterPage() {
  const { translate } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: typeof fieldErrors = {};

    if (form.username.length < 3) errors.username = translate("register.validation.username_min");
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errors.username = translate("register.validation.username_format");
    if (!form.email.includes("@")) errors.email = translate("register.validation.email_invalid");
    if (!validatePassword(form.password)) errors.password = translate("register.validation.password_weak");

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: form.username,
        password: form.password,
        email: form.email,
      });
      setRegisteredEmail(form.email);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || translate("register.error.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

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

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              {translate("register.hero.title1")}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                {translate("register.hero.title2")}
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              {translate("register.hero.subtitle")}
            </p>
          </div>

          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b.key} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3.5 border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <b.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/90 font-medium">{translate(b.key)}</span>
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
              &ldquo;{translate("register.testimonial.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs font-semibold">{translate("register.testimonial.avatar")}</div>
              <div>
                <p className="text-xs font-medium text-white">{translate("register.testimonial.name")}</p>
                <p className="text-xs text-white/50">{translate("register.testimonial.role")}</p>
              </div>
            </div>
          </div>

        </div>

        <div className="relative text-xs text-white/40">
          {translate("register.footer.brand")}
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo - 移动端 */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">TRAI</span>
            </div>
            <LanguageSwitcher />
          </div>

          {success ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{translate("register.success.title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {translate("register.success.email_sent")} <span className="font-medium text-foreground">{registeredEmail}</span>
                </p>
                <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400 text-left">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{translate("register.success.awaiting_review")}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full h-12 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20">
                    {translate("register.success.back_to_login")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <button onClick={() => { setSuccess(false); setForm({ username: "", email: "", password: "" }); }} className="w-full h-11 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {translate("register.success.register_another")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">{translate("register.form.title")}</h2>
                <p className="text-sm text-muted-foreground mt-2">{translate("register.form.subtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground/80">{translate("register.form.username")}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={translate("register.form.username_placeholder")}
                    value={form.username}
                    onChange={setField("username")}
                    className={`h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm ${fieldErrors.username ? "border-red-500/60 focus:border-red-500" : ""}`}
                    autoComplete="username"
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.username}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">{translate("register.form.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={translate("register.form.email_placeholder")}
                    value={form.email}
                    onChange={setField("email")}
                    className={`h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm ${fieldErrors.email ? "border-red-500/60 focus:border-red-500" : ""}`}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/80">{translate("register.form.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={translate("register.form.password_placeholder")}
                      value={form.password}
                      onChange={setField("password")}
                      className={`h-12 rounded-xl border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm pr-12 ${fieldErrors.password ? "border-red-500/60 focus:border-red-500" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* 密码强度指示 */}
                {form.password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {validatePassword(form.password) ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {translate("register.form.password_strong")}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {translate("register.form.password_weak")}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !form.username || !form.email || !form.password}
                  className="w-full h-12 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      {translate("register.form.registering")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {translate("register.form.register")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative flex items-center justify-center mt-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <span className="relative px-3 bg-background text-xs text-muted-foreground">{translate("register.form.has_account")}</span>
              </div>

              <Link href="/login">
                <Button variant="outline" className="w-full h-12 text-sm font-medium rounded-xl mt-5">
                  {translate("register.form.login_now")}
                </Button>
              </Link>

              <p className="text-center text-xs text-muted-foreground/60 mt-5">
                {translate("register.form.agree_terms_1")}{" "}
                <Link href="/terms" className="underline hover:text-foreground transition-colors">{translate("register.form.terms")}</Link>
                {" "}{translate("register.form.and")}{" "}
                <Link href="/privacy" className="underline hover:text-foreground transition-colors">{translate("register.form.privacy")}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
