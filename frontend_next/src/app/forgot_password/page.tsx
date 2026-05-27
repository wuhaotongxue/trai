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
    <div className="flex min-h-screen bg-background">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-none blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-slate-100/10 rounded-none blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-none bg-white/15  flex items-center justify-center shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">TRAI</span>
            <span className="block text-xs text-white/60 -mt-0.5">AI Agent Platform</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              {translate("forgot_password.brand_line1")}<br />
              <span className="text-transparent bg-clip-text bg-slate-100">
                {translate("forgot_password.brand_line2")}
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              {translate("forgot_password.brand_desc")}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { step: "01", text: translate("forgot_password.step1") },
              { step: "02", text: translate("forgot_password.step2") },
              { step: "03", text: translate("forgot_password.step3") },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 bg-white/10  rounded-none px-5 py-3.5 border border-white/10">
                <div className="w-9 h-9 rounded-none bg-white/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <span className="text-sm text-white/90 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/40">
          {translate("forgot_password.footer")}
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo - 移动端 */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TRAI</span>
          </div>

          {sent ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 rounded-none bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{translate("forgot_password.sent_title")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {translate("forgot_password.sent_desc").replace("{email}", email)}
                </p>
              </div>
              <div className="p-4 rounded-none bg-blue-500/5 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400 text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{translate("forgot_password.not_received")} <a href="mailto:support@trai.ai" className="underline">support@trai.ai</a></p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-11 rounded-none gap-2" onClick={() => { setSent(false); setEmail(""); }}>
                  <ArrowLeft className="h-4 w-4" />
                  {translate("forgot_password.back_input")}
                </Button>
                <Link href="/login" className="block">
                  <Button className="w-full h-11 rounded-none text-sm font-medium">
                    {translate("forgot_password.back_login")}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-none bg-blue-500/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{translate("forgot_password.title")}</h2>
                <p className="text-sm text-muted-foreground mt-2">{translate("forgot_password.subtitle")}</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">{translate("forgot_password.email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={translate("forgot_password.email_placeholder")}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="h-12 rounded-none border-border/60 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                  />
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>
                  )}
                </div>

                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full h-12 text-sm font-semibold rounded-none shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-none border-2 border-white/30 border-t-white animate-spin" />
                      {translate("forgot_password.sending")}
                    </span>
                  ) : translate("forgot_password.send_btn")}
                </Button>

                <div className="p-4 rounded-none bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                  {translate("forgot_password.hint")}
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {translate("forgot_password.back_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
