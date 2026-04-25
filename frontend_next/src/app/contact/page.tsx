/**
 * page.tsx
 * TRAI 联系我们页
 */

"use client";

import { useState } from "react";
import { Send, Mail, Phone, MapPin, CheckCircle2, Clock } from "lucide-react";
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

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 text-center max-w-7xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
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
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.email")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.email_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.phone")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.phone_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.address")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.address_value")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">{translate("contact.response_time")}</p>
                        <p className="text-sm text-slate-700 font-medium">{translate("contact.response_time_value")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-2">{translate("contact.quick_title")}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{translate("contact.quick_desc")}</p>
                </div>
              </div>

              {/* 右侧: 表单 */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">{translate("contact.send_title")}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">{translate("contact.name_label")} *</Label>
                        <Input className="h-10 rounded-lg" placeholder={translate("contact.name_placeholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">{translate("contact.email_label")} *</Label>
                        <Input className="h-10 rounded-lg" type="email" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.company_label")}</Label>
                      <Input className="h-10 rounded-lg" placeholder={translate("contact.company_placeholder")} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.type_label")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {contactTypes.map((type) => (
                          <button
                            key={type.key}
                            type="button"
                            className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                          >
                            {translate(type.key)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{translate("contact.message_label")} *</Label>
                      <textarea
                        className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        placeholder={translate("contact.message_placeholder")}
                      />
                    </div>
                    <Button
                      onClick={handleSubmit}
                      className="h-10 px-6 font-semibold rounded-lg shadow-md shadow-blue-500/20 gap-2 w-full md:w-auto"
                    >
                      {sent ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Send className="h-4 w-4" />}
                      {sent ? translate("contact.sent") : translate("contact.send_btn")}
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
