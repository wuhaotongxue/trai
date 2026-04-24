/**
 * language_switcher.tsx
 * 语言切换组件
 */

"use client";

import { useI18n } from "@/i18n/i18n_context";
import { Locale, locales, localeNames } from "@/i18n/config";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, localeName } = useI18n();

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
        title="切换语言 / Switch Language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline text-xs font-medium">{localeName}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-200/20 dark:shadow-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              "w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors",
              l === locale
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10"
            )}
          >
            <span className="text-base">{l === "zh" ? "🇨🇳" : "🇺🇸"}</span>
            <span className="flex-1 text-left">{localeNames[l]}</span>
            {l === locale && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
