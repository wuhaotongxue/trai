/**
 * page.tsx
 * 忘记密码页面
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n_context";

export default function ForgotPasswordPage() {
  const { translate } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!email) { setError(translate("forgot_password.error_empty")); return; }
    if (!email.includes("@")) { setError(translate("forgot_password.error_invalid")); return; }
    setLoading(true);
    setError("");
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 font-sans">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-cyan-300 dark:bg-cyan-900 border-r-4 border-slate-900 dark:border-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center">
            <Bot className="h-8 w-8 text-slate-900 dark:text-white" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-widest uppercase">TRAI</span>
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest">AI Agent Platform</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6 uppercase tracking-widest">
              {translate("forgot_password.brand_line1")}<br />
              <span className="bg-emerald-300 dark:bg-emerald-600 px-2 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] mt-2 inline-block">
                {translate("forgot_password.brand_line2")}
              </span>
            </h1>
            <p className="text-slate-800 dark:text-slate-300 text-lg font-bold leading-relaxed max-w-sm">
              {translate("forgot_password.brand_desc")}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { step: "01", text: translate("forgot_password.step1") },
              { step: "02", text: translate("forgot_password.step2") },
              { step: "03", text: translate("forgot_password.step3") },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white p-4 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <div className="w-12 h-12 bg-indigo-300 dark:bg-indigo-600 border-2 border-slate-900 dark:border-white flex items-center justify-center shrink-0">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{item.step}</span>
                </div>
                <span className="text-base text-slate-900 dark:text-white font-bold uppercase tracking-wider">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm font-bold text-slate-800 dark:text-slate-400 uppercase tracking-widest">
          {translate("forgot_password.footer")}
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo - 移动端 */}
          <div className="lg:hidden flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-cyan-300 dark:bg-cyan-600 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center">
              <Bot className="h-8 w-8 text-slate-900 dark:text-white" />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-widest uppercase">TRAI</span>
          </div>

          {sent ? (
            <div className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-emerald-300 dark:bg-emerald-600 border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] flex items-center justify-center mx-auto transform rotate-3">
                <CheckCircle2 className="h-12 w-12 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">{translate("forgot_password.sent_title")}</h2>
                <p className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                  {translate("forgot_password.sent_desc").replace("{email}", email)}
                </p>
              </div>
              <div className="p-6 border-4 border-slate-900 dark:border-white bg-indigo-50 dark:bg-indigo-900 text-sm font-bold text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 mt-0.5 shrink-0 text-indigo-500" />
                  <p className="leading-relaxed">{translate("forgot_password.not_received")} <a href="mailto:support@trai.ai" className="underline decoration-2 underline-offset-4">support@trai.ai</a></p>
                </div>
              </div>
              <div className="space-y-4">
                <Button variant="outline" className="w-full h-14 border-4 border-slate-900 dark:border-white rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all gap-3" onClick={() => { setSent(false); setEmail(""); }}>
                  <ArrowLeft className="h-5 w-5" />
                  {translate("forgot_password.back_input")}
                </Button>
                <Link href="/login" className="block">
                  <Button className="w-full h-14 border-4 border-slate-900 dark:border-white rounded-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                    {translate("forgot_password.back_login")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <div className="w-16 h-16 bg-cyan-300 dark:bg-cyan-600 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center mb-6">
                  <Mail className="h-8 w-8 text-slate-900 dark:text-white" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{translate("forgot_password.title")}</h2>
                <p className="text-base font-bold text-slate-600 dark:text-slate-400 mt-3">{translate("forgot_password.subtitle")}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{translate("forgot_password.email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={translate("forgot_password.email_placeholder")}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="h-14 border-4 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400 focus-visible:shadow-[4px_4px_0px_0px_#22d3ee] transition-all"
                  />
                  {error && (
                    <p className="text-sm font-bold text-rose-500 flex items-center gap-2 mt-2"><AlertCircle className="h-4 w-4" />{error}</p>
                  )}
                </div>

                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full h-16 text-lg font-black uppercase tracking-widest border-4 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white rounded-none shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:bg-cyan-400 dark:hover:bg-cyan-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-none border-4 border-slate-900/30 border-t-slate-900 animate-spin" />
                      {translate("forgot_password.sending")}
                    </span>
                  ) : translate("forgot_password.send_btn")}
                </Button>

                <div className="p-6 border-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                  {translate("forgot_password.hint")}
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-10">
            <Link href="/login" className="inline-flex items-center gap-2 text-base font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              {translate("forgot_password.back_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
