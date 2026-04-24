/**
 * i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: 国际化上下文 provider，所有翻译从后端数据库 API 动态加载
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Locale, defaultLocale, localeNames, locales } from "./config";
import { publicApi } from "@/lib/api_client";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localeName: string;
  loading: boolean;
  refreshTranslations: () => Promise<void>;
};

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string) => key,
  localeName: localeNames[defaultLocale],
  loading: true,
  refreshTranslations: async () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

const STORAGE_KEY = "trai-locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [dbTranslations, setDbTranslations] = useState<Record<Locale, Record<string, string>>>({
    zh: {},
    en: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const results: Record<Locale, Record<string, string>> = { zh: {}, en: {} };
      for (const loc of locales) {
        const res = await publicApi.getTranslations(loc);
        if (res.translations && Object.keys(res.translations).length > 0) {
          results[loc] = res.translations;
        }
      }
      setDbTranslations(results);
    } catch {
      setDbTranslations({ zh: {}, en: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  // 恢复语言选择 + 初始加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
    }
    fetchTranslations();
  }, [fetchTranslations]);

  const refreshTranslations = useCallback(async () => {
    await fetchTranslations();
  }, [fetchTranslations]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    },
    []
  );

  const t = useCallback(
    (key: string): string => {
      return (
        dbTranslations[locale]?.[key] ||
        dbTranslations[defaultLocale]?.[key] ||
        key
      );
    },
    [dbTranslations, locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeName: localeNames[locale],
        loading,
        refreshTranslations,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
