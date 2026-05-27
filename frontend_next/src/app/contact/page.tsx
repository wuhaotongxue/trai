/**
 * page.tsx
 * TRAI 联系我们页
 */

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Send, Mail, Phone, MapPin, CheckCircle2, Clock, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/website/navbar";
import { Footer } from "@/components/website/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n_context";

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
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-32 pb-16 bg-amber-400">
          <div className="container mx-auto px-4 text-center max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-none bg-blue-50 text-blue-600 text-sm font-medium mb-6">
              <Phone className="h-4 w-4" />
              {translate("contact.title")}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
              {translate("contact.hero.title")}
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              {translate("contact.hero.desc")}
            </p>
          </div>
        </section>

        {/* 联系表单 + 信息 */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* 左侧: 联系信息 */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">{translate("contact.contact_info")}</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.email")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.email_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.phone")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.phone_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.address")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.address_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.response_time")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.response_time_value")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-none p-5 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-2">{translate("contact.quick_title")}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{translate("contact.quick_desc")}</p>
                </div>

                {/* 微信二维码 */}
                <div className="bg-amber-400 rounded-none p-5 border border-green-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-semibold text-slate-800">{translate("contact.wechat_title")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="relative w-28 h-28 mx-auto mb-2 bg-white rounded-none shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden">
                        <Image
                          src="/weixin.jpg"
                          alt={translate("contact.wechat_contact")}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs text-slate-600">{translate("contact.wechat_contact")}</p>
                    </div>
                    <div className="text-center">
                      <div className="relative w-28 h-28 mx-auto mb-2 bg-white rounded-none shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden">
                        <Image
                          src="/gongzhonghao.jpg"
                          alt={translate("contact.wechat_official")}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs text-slate-600">{translate("contact.wechat_official")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧: 表单 */}
              <div className="lg:col-span-3">
                {sent && (
                  <div className="mb-4 p-4 rounded-none bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 animate-pulse">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium">{translate("contact.submit_success")}</span>
                  </div>
                )}
                <div className="bg-white rounded-none border border-slate-200 p-6 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">{translate("contact.send_title")}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">{translate("contact.name_label")} *</Label>
                        <Input
                          className={`h-10 rounded-none ${errors.name ? "border-red-500 focus:ring-red-100" : ""}`}
                          placeholder={translate("contact.name_placeholder")}
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">{translate("contact.email_label")}</Label>
                        <Input
                          className={`h-10 rounded-none ${errors.email ? "border-red-500 focus:ring-red-100" : ""}`}
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.company_label")}</Label>
                      <Input
                        className={`h-10 rounded-none ${errors.company ? "border-red-500 focus:ring-red-100" : ""}`}
                        placeholder={translate("contact.company_placeholder")}
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                      />
                      {errors.company && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.company}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.type_label")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactTypes.map((type) => (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() => setSelectedType(type.key.replace("contact.type.", ""))}
                            className={`px-3 py-1.5 rounded-none text-xs font-medium border transition-all ${
                              selectedType === type.key.replace("contact.type.", "")
                                ? "bg-blue-500 border-blue-500 text-white"
                                : "border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                            }`}
                          >
                            {translate(type.key)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.message_label")} *</Label>
                      <textarea
                        className={`w-full min-h-[120px] rounded-none border p-3 text-sm resize-none focus:outline-none focus:ring-2 transition-all ${
                          errors.message
                            ? "border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"
                        }`}
                        placeholder={translate("contact.message_placeholder")}
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.message}
                        </p>
                      )}
                    </div>
                    {submitError && (
                      <div className="p-3 rounded-none bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {submitError}
                      </div>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="h-10 px-6 font-semibold rounded-none shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] shadow-blue-500/20 gap-2 w-full md:w-auto"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⟳</span>
                          <span>提交中</span>
                        </>
                      ) : sent ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>{translate("contact.sent")}</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>{translate("contact.send_btn")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
