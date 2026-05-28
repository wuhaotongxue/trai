/**
 * page.tsx
 * TRAI 联系我们页
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, Mail, Phone, MapPin, CheckCircle2, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n_context";

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const contactTypes = [
  { key: "contact.type.presale" },
  { key: "contact.type.tech" },
  { key: "contact.type.business" },
  { key: "contact.type.purchase" },
  { key: "contact.type.channel" },
  { key: "contact.type.other" },
];

export default function ContactPage() {
  const { translate } = useI18n();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedType, setSelectedType] = useState("other");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = translate("contact.error_name_required");
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = translate("contact.error_email_invalid");
    }

    if (formData.company.trim() && formData.company.trim().length > 15) {
      newErrors.company = translate("contact.error_company_too_long");
    }

    if (!formData.message.trim()) {
      newErrors.message = translate("contact.error_message_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, translate]);

  const handleSubmit = async () => {
    setSubmitError("");
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await fetch("/api_trai/v1/contact/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email || null,
            company: formData.company || null,
            contact_type: selectedType,
            content: formData.message,
          }),
        });

        if (response.ok) {
          setSent(true);
          setFormData({ name: "", email: "", company: "", message: "" });
          setTimeout(() => setSent(false), 6000);
        } else {
          const data = await response.json();
          setSubmitError(data.detail || translate("contact.submit_failed"));
        }
      } catch {
        setSubmitError(translate("contact.network_error"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Hero */}
        <section className="pt-32 pb-16 bg-slate-100 dark:bg-slate-900 border-b-4 border-slate-900 dark:border-white">
          <div className="container mx-auto px-4 text-center max-w-7xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-slate-900 dark:border-white bg-cyan-300 dark:bg-cyan-600 text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                <Phone className="h-4 w-4" />
                {translate("contact.title")}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-5 tracking-tight uppercase">
                {translate("contact.hero.title")}
              </h1>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
                {translate("contact.hero.desc")}
              </p>
            </Reveal>
          </div>
        </section>

        {/* 联系表单 + 信息 */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* 左侧: 联系信息 */}
              <div className="lg:col-span-2 space-y-8">
                <Reveal delay={100}>
                  <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8 border-b-4 border-slate-900 dark:border-white pb-4">{translate("contact.contact_info")}</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all">
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-cyan-300 dark:bg-cyan-600 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{translate("contact.email")}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{translate("contact.email_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all">
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-emerald-300 dark:bg-emerald-600 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{translate("contact.phone")}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{translate("contact.phone_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all">
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-indigo-300 dark:bg-indigo-600 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{translate("contact.address")}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{translate("contact.address_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 border-4 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] dark:hover:shadow-[2px_2px_0px_0px_#ffffff] transition-all">
                      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-rose-300 dark:bg-rose-600 border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{translate("contact.response_time")}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{translate("contact.response_time_value")}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div className="bg-slate-100 dark:bg-slate-800 border-4 border-slate-900 dark:border-white p-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle className="h-8 w-8 text-slate-900 dark:text-white" />
                      <p className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.wechat_title")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-3 bg-white border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden">
                          <Image
                            src="/weixin.jpg"
                            alt={translate("contact.wechat_contact")}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{translate("contact.wechat_contact")}</p>
                      </div>
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-3 bg-white border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden">
                          <Image
                            src="/gongzhonghao.jpg"
                            alt={translate("contact.wechat_official")}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{translate("contact.wechat_official")}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* 右侧: 表单 */}
              <div className="lg:col-span-3">
                <Reveal delay={300}>
                  {sent && (
                    <div className="mb-6 p-4 bg-emerald-300 dark:bg-emerald-600 border-4 border-slate-900 dark:border-white text-slate-900 dark:text-white flex items-center gap-3 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] animate-bounce">
                      <CheckCircle2 className="h-6 w-6" />
                      <span className="font-black uppercase tracking-widest text-lg">{translate("contact.submit_success")}</span>
                    </div>
                  )}
                  <div className="bg-white dark:bg-slate-800 border-4 border-slate-900 dark:border-white p-8 shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]">
                    <h2 className="text-3xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8 border-b-4 border-slate-900 dark:border-white pb-4">{translate("contact.send_title")}</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.name_label")} *</Label>
                          <Input
                            className={`h-12 border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400 focus-visible:shadow-[4px_4px_0px_0px_#22d3ee] transition-all rounded-none ${errors.name ? "border-rose-500 focus-visible:border-rose-500 focus-visible:shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                            placeholder={translate("contact.name_placeholder")}
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                          />
                          {errors.name && (
                            <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.email_label")}</Label>
                          <Input
                            className={`h-12 border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400 focus-visible:shadow-[4px_4px_0px_0px_#22d3ee] transition-all rounded-none ${errors.email ? "border-rose-500 focus-visible:border-rose-500 focus-visible:shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                            type="email"
                            placeholder="YOUR@EMAIL.COM"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                          />
                          {errors.email && (
                            <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.company_label")}</Label>
                        <Input
                          className={`h-12 border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400 focus-visible:shadow-[4px_4px_0px_0px_#22d3ee] transition-all rounded-none ${errors.company ? "border-rose-500 focus-visible:border-rose-500 focus-visible:shadow-[4px_4px_0px_0px_#f43f5e]" : ""}`}
                          placeholder={translate("contact.company_placeholder")}
                          value={formData.company}
                          onChange={(e) => handleChange("company", e.target.value)}
                        />
                        {errors.company && (
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.company}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.type_label")}</Label>
                        <div className="flex flex-wrap gap-3">
                          {contactTypes.map((type) => {
                            const isSelected = selectedType === type.key.replace("contact.type.", "");
                            return (
                              <button
                                key={type.key}
                                type="button"
                                onClick={() => setSelectedType(type.key.replace("contact.type.", ""))}
                                className={`px-4 py-2 border-2 font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] dark:hover:shadow-[1px_1px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                                  isSelected
                                    ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900"
                                    : "bg-white dark:bg-slate-800 border-slate-900 dark:border-white text-slate-900 dark:text-white"
                                }`}
                              >
                                {translate(type.key)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{translate("contact.message_label")} *</Label>
                        <textarea
                          className={`w-full min-h-[160px] border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold p-4 resize-none focus:outline-none focus:border-cyan-400 focus:shadow-[4px_4px_0px_0px_#22d3ee] transition-all rounded-none ${
                            errors.message
                              ? "border-rose-500 focus:border-rose-500 focus:shadow-[4px_4px_0px_0px_#f43f5e]"
                              : ""
                          }`}
                          placeholder={translate("contact.message_placeholder")}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                        />
                        {errors.message && (
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.message}
                          </p>
                        )}
                      </div>
                      {submitError && (
                        <div className="p-4 bg-rose-300 dark:bg-rose-600 border-4 border-slate-900 dark:border-white text-slate-900 dark:text-white font-black uppercase tracking-wider flex items-center gap-3 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                          <AlertCircle className="h-6 w-6" />
                          {submitError}
                        </div>
                      )}
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-14 px-8 text-lg font-black uppercase tracking-widest bg-cyan-400 dark:bg-cyan-600 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] hover:bg-cyan-300 dark:hover:bg-cyan-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none gap-3 w-full md:w-auto mt-4"
                      >
                        {loading ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            <span>SUBMITTING</span>
                          </>
                        ) : sent ? (
                          <>
                            <CheckCircle2 className="h-6 w-6" />
                            <span>{translate("contact.sent")}</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-6 w-6" />
                            <span>{translate("contact.send_btn")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
