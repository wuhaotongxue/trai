/**
 * i18n.ts
 * 国际化配置
 * 支持中文(默认)和英文
 */

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh";

export const localeNames: Record<Locale, string> = {
  zh: "中文",
  en: "English",
};

export const localeFlags: Record<Locale, string> = {
  zh: "🇨🇳",
  en: "🇺🇸",
};
