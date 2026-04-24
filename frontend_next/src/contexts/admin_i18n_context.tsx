/**
 * admin_i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Admin 后台管理界面专属的国际化上下文，
 * 翻译全部从 /admin/i18n 接口获取。
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Locale, defaultLocale, localeNames, locales } from "@/i18n/config";
import { adminApi } from "@/lib/api_client";

type AdminI18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localeName: string;
  loading: boolean;
  refreshing: boolean;
  refreshTranslations: () => Promise<void>;
};

const AdminI18nContext = createContext<AdminI18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string) => key,
  localeName: localeNames[defaultLocale],
  loading: true,
  refreshing: false,
  refreshTranslations: async () => {},
});

export function useAdminI18n() {
  return useContext(AdminI18nContext);
}

const STORAGE_KEY = "trai-admin-locale";

// 加载中兜底翻译（防止页面完全空白）
const FALLBACK_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  zh: {},
  en: {},
};

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [dbTranslations, setDbTranslations] = useState<Record<Locale, Record<string, string>>>(FALLBACK_TRANSLATIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTranslations = useCallback(async () => {
    const results: Record<Locale, Record<string, string>> = { zh: {}, en: {} };
    try {
      await Promise.all(
        locales.map(async (loc) => {
          const res = await adminApi.listI18n({ locale: loc, limit: 1000 });
          if (res.items && res.items.length > 0) {
            for (const item of res.items) {
              const fullKey = `${item.namespace}.${item.key}`;
              results[loc][fullKey] = item.value;
            }
          }
        })
      );
      setDbTranslations(results);
    } catch {
      // 失败时保留已有数据
    }
  }, []);

  // 初始化：恢复语言选择 + 加载翻译
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && locales.includes(saved)) {
        setLocaleState(saved);
      }
      await fetchTranslations();
      setLoading(false);
    };
    init();
  }, [fetchTranslations]);

  const refreshTranslations = useCallback(async () => {
    setRefreshing(true);
    await fetchTranslations();
    setRefreshing(false);
  }, [fetchTranslations]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      localStorage.setItem(STORAGE_KEY, newLocale);
    },
    []
  );

  const t = useCallback(
    (key: string): string => {
      return dbTranslations[locale]?.[key] || dbTranslations[defaultLocale]?.[key] || key;
    },
    [dbTranslations, locale]
  );

  return (
    <AdminI18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeName: localeNames[locale],
        loading,
        refreshing,
        refreshTranslations,
      }}
    >
      {children}
    </AdminI18nContext.Provider>
  );
}
