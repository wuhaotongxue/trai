/**
 * page.tsx
 * TRAI 注册页
 * - Neo-Brutalism 风格
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
  { icon: Zap, key: "register.benefit.1", color: "bg-slate-100" },
  { icon: Globe, key: "register.benefit.2", color: "bg-slate-100" },
  { icon: Shield, key: "register.benefit.3", color: "bg-slate-100" },
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

    if (form.username.length < 3) errors.username = translate("register.validation.username_min") || "用户名至少3个字符";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errors.username = translate("register.validation.username_format") || "用户名只能包含字母数字下划线";
    if (!form.email.includes("@")) errors.email = translate("register.validation.email_invalid") || "无效的邮箱格式";
    if (!validatePassword(form.password)) errors.password = translate("register.validation.password_weak") || "密码太弱";

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
    } catch (e) {
      const err = e as Error;
      setError(err.message || (translate("register.error.failed") || "注册失败"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-900 selection:bg-slate-100 selection:text-slate-900">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-100 p-12 border-r-4 border-slate-900 dark:border-white relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} />

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

        <div className="relative space-y-10 z-10">
          <div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-widest leading-tight mb-6 bg-white inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] transform -rotate-1">
              {translate("register.hero.title1") || "加入 TRAI"}
            </h1>
            <br />
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest leading-tight bg-slate-100 inline-block px-4 py-2 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] transform rotate-1 mt-4">
              {translate("register.hero.title2") || "开启 AI 之旅"}
            </h2>
            <p className="text-slate-900 text-xl font-bold leading-relaxed max-w-md mt-6">
              {translate("register.hero.subtitle") || "注册即可获取免费调用额度，体验强大的 AI 能力。"}
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.key} className={`flex items-center gap-4 ${b.color} border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] px-4 py-3 transform transition-transform hover:translate-x-2`}>
                <b.icon className="h-6 w-6 text-slate-900" />
                <span className="text-lg text-slate-900 font-black uppercase tracking-wider">{translate(b.key) || b.key.split('.').pop()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm font-bold text-slate-900 uppercase tracking-widest z-10">
          {translate("register.footer.brand") || "© 2026 TRAI AI PLATFORM"}
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo - 移动端 */}
          <div className="lg:hidden flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center">
                <Bot className="h-6 w-6 text-slate-900" />
              </div>
              <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-widest">TRAI</span>
            </Link>
            <LanguageSwitcher />
          </div>

          {success ? (
            <div className="text-center space-y-8 py-8 border-4 border-slate-900 dark:border-white p-8 bg-white dark:bg-slate-800 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
              <div className="w-20 h-20 bg-slate-100 border-4 border-slate-900 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#0f172a] transform -rotate-6">
                <CheckCircle2 className="h-10 w-10 text-slate-900" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">{translate("register.success.title") || "注册成功"}</h2>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  {translate("register.success.email_sent") || "确认邮件已发送至"}{" "}
                  <span className="font-black text-slate-900 dark:text-white bg-cyan-200 px-2 border-2 border-slate-900">{registeredEmail}</span>
                </p>
                <div className="mt-6 p-4 bg-slate-100 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] text-slate-900 text-left font-bold">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-6 w-6 shrink-0" />
                    <p>{translate("register.success.awaiting_review") || "请等待管理员审核，审核通过后即可登录。"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Link href="/login">
                  <Button className="w-full h-16 text-xl font-black uppercase tracking-widest bg-slate-100 text-slate-900 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-slate-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none">
                    {translate("register.success.back_to_login") || "返回登录"}
                    <ArrowRight className="h-6 w-6 ml-3" />
                  </Button>
                </Link>
                <button onClick={() => { setSuccess(false); setForm({ username: "", email: "", password: "" }); }} className="w-full h-12 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                  {translate("register.success.register_another") || "注册其他账号"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{translate("register.form.title") || "创建账号"}</h2>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-2">{translate("register.form.subtitle") || "几步操作即可开启 AI 体验"}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">{translate("register.form.username") || "用户名"}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={translate("register.form.username_placeholder") || "字母、数字或下划线"}
                    value={form.username}
                    onChange={setField("username")}
                    className={`h-14 rounded-none border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${fieldErrors.username ? "border-rose-500 focus-visible:border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                    autoComplete="username"
                  />
                  {fieldErrors.username && (
                    <p className="text-sm font-bold text-cyan-500 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{fieldErrors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">{translate("register.form.email") || "邮箱"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={translate("register.form.email_placeholder") || "你的电子邮箱"}
                    value={form.email}
                    onChange={setField("email")}
                    className={`h-14 rounded-none border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${fieldErrors.email ? "border-rose-500 focus-visible:border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-sm font-bold text-cyan-500 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">{translate("register.form.password") || "密码"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={translate("register.form.password_placeholder") || "至少 8 位，包含字母和数字"}
                      value={form.password}
                      onChange={setField("password")}
                      className={`h-14 rounded-none border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-indigo-500 focus-visible:shadow-[4px_4px_0px_0px_#6366f1] transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-white pr-12 ${fieldErrors.password ? "border-rose-500 focus-visible:border-rose-500 shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white hover:text-indigo-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-sm font-bold text-cyan-500 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{fieldErrors.password}</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-slate-100 border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
                    <span className="text-slate-900 text-xl font-black">!</span>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">{error}</p>
                  </div>
                )}

                {/* 密码强度指示 */}
                {form.password && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {validatePassword(form.password) ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-cyan-500 bg-emerald-100 px-2 py-1 border-2 border-emerald-500 shadow-[2px_2px_0px_0px_#10b981]">
                          <CheckCircle2 className="h-4 w-4" />
                          {translate("register.form.password_strong") || "密码强度合格"}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-bold text-cyan-500 bg-cyan-100 px-2 py-1 border-2 border-cyan-500 shadow-[2px_2px_0px_0px_#f59e0b]">
                          <AlertCircle className="h-4 w-4" />
                          {translate("register.form.password_weak") || "密码需包含字母和数字，且至少8位"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !form.username || !form.email || !form.password}
                  className="w-full h-16 text-xl font-black uppercase tracking-widest bg-slate-100 text-slate-900 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] hover:bg-slate-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-none animate-spin" />
                      {translate("register.form.registering") || "注册中..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {translate("register.form.register") || "立即注册"}
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative flex items-center justify-center my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-4 border-slate-900 dark:border-white" />
                </div>
                <span className="relative px-4 bg-white dark:bg-slate-900 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  {translate("register.form.has_account") || "已经有账号？"}
                </span>
              </div>

              <Link href="/login">
                <Button variant="outline" className="w-full h-14 text-lg font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:bg-slate-100 dark:hover:bg-slate-700 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none">
                  {translate("register.form.login_now") || "前往登录"}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
