/**
 * i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: 国际化上下文 provider
 * 采用分层策略：
 * - 登录/注册/首页：使用本地内置翻译，无需网络请求
 * - 动态内容：从 API 获取并缓存
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Locale, defaultLocale, localeNames, locales } from "./config";
import { publicApi } from "@/lib/api_client";
import { LOCAL_TRANSLATIONS } from "./local_translations";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translate: (key: string) => string;
  localeName: string;
  loading: boolean;
  refreshTranslations: () => Promise<void>;
};

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  translate: (key: string) => key,
  localeName: localeNames[defaultLocale],
  loading: false,
  refreshTranslations: async () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

const STORAGE_KEY = "trai-locale";
const CACHE_KEY = "trai-i18n-cache";
const CACHE_EXPIRY_KEY = "trai-i18n-cache-expiry";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 分钟过期

// 缓存结构
interface CacheData {
  zh: Record<string, string>;
  en: Record<string, string>;
}

// 获取缓存
function getCache(): CacheData | null {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry, 10)) {
      return null; // 缓存过期
    }
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    return null;
  }
  return null;
}

// 设置缓存
function setCache(data: CacheData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_EXPIRY_MS).toString());
  } catch {
    // localStorage 满时忽略
  }
}

// 合并本地翻译和 API 翻译（API 翻译优先）
function mergeTranslations(
  local: Record<string, string>,
  api: Record<string, string>
): Record<string, string> {
  return { ...local, ...api };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [loading, setLoading] = useState(false);
  const [apiTranslations, setApiTranslations] = useState<Record<Locale, Record<string, string>>>({
    zh: {},
    en: {},
  });

  // 优先使用本地翻译，API 翻译作为补充
  const getMergedTranslations = useCallback(
    (loc: Locale): Record<string, string> => {
      const local = LOCAL_TRANSLATIONS[loc] || LOCAL_TRANSLATIONS[defaultLocale];
      const api = apiTranslations[loc] || {};
      return mergeTranslations(local, api);
    },
    [apiTranslations]
  );

  const fetchTranslations = useCallback(async () => {
    // 先尝试从缓存读取
    const cached = getCache();
    if (cached) {
      setApiTranslations(cached);
      return;
    }

    setLoading(true);
    try {
      const results: Record<Locale, Record<string, string>> = { zh: {}, en: {} };
      for (const loc of locales) {
        try {
          const res = await publicApi.getTranslations(loc);
          if (res.translations && Object.keys(res.translations).length > 0) {
            results[loc] = res.translations;
          }
        } catch {
          // 单个语言失败不影响其他语言
        }
      }
      setApiTranslations(results);
      setCache(results);
    } catch {
      setApiTranslations({ zh: {}, en: {} });
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
    // 只在首次加载时请求 API 翻译
    fetchTranslations();
  }, [fetchTranslations]);

  const refreshTranslations = useCallback(async () => {
    // 清除缓存并重新获取
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
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

  const translate = useCallback(
    (key: string): string => {
      const localDict = LOCAL_TRANSLATIONS[locale] as Record<string, string> | undefined;
      const fallbackDict = LOCAL_TRANSLATIONS[defaultLocale] as Record<string, string> | undefined;
      const merged = getMergedTranslations(locale);
      return merged[key] || localDict?.[key] || fallbackDict?.[key] || key;
    },
    [locale, getMergedTranslations]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        translate,
        localeName: localeNames[locale],
        loading,
        refreshTranslations,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}
