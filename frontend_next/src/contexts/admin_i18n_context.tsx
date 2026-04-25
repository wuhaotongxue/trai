/**
 * admin_i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Admin 后台管理界面专属的国际化上下文，
 * 翻译全部从 /admin/i18n 接口获取，按需加载。
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Locale, defaultLocale, localeNames, locales } from "@/i18n/config";
import { adminApi } from "@/lib/api_client";

type AdminI18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translate: (key: string) => string;
  localeName: string;
  loading: boolean;
  refreshing: boolean;
  refreshTranslations: () => Promise<void>;
  /** 请求加载某个命名空间的翻译（按需加载） */
  loadNamespace: (namespace: string) => Promise<void>;
};

const AdminI18nContext = createContext<AdminI18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  translate: (key: string) => key,
  localeName: localeNames[defaultLocale],
  loading: false,
  refreshing: false,
  refreshTranslations: async () => {},
  loadNamespace: async () => {},
});

export function useAdminI18n() {
  return useContext(AdminI18nContext);
}

const STORAGE_KEY = "trai-admin-locale";

// 缓存已加载的命名空间
const loadedNamespaces = new Set<string>();

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef<Set<string>>(new Set());

  // 按需加载单个命名空间
  const loadNamespace = useCallback(async (namespace: string) => {
    if (loadedNamespaces.has(namespace) || loadingRef.current.has(namespace)) {
      return;
    }
    loadingRef.current.add(namespace);
    try {
      const res = await adminApi.listI18n({ locale, namespace, limit: 1000 });
      if (res.items && res.items.length > 0) {
        setTranslations((prev) => {
          const next = { ...prev };
          for (const item of res.items) {
            // 存储时使用完整的 namespace.key 格式，与前端 translate 调用格式保持一致
            next[`${item.namespace}.${item.key}`] = item.value;
          }
          return next;
        });
        loadedNamespaces.add(namespace);
      }
    } catch (e) {
      console.error(`[i18n] 加载 namespace ${namespace} 失败:`, e);
    } finally {
      loadingRef.current.delete(namespace);
    }
  }, [locale]);

  // 语言切换时重新加载当前语言的翻译
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  // 语言变化时重新加载当前语言
  useEffect(() => {
    // 清空缓存，重新加载
    loadedNamespaces.clear();
    setTranslations({});
  }, [locale]);

  // 初始化：恢复语言选择
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const refreshTranslations = useCallback(async () => {
    setRefreshing(true);
    loadedNamespaces.clear();
    setTranslations({});
    setRefreshing(false);
  }, []);

  const translate = useCallback(
    (key: string): string => {
      return translations[key] || key;
    },
    [translations]
  );

  return (
    <AdminI18nContext.Provider
      value={{
        locale,
        setLocale,
        translate,
        localeName: localeNames[locale],
        loading,
        refreshing,
        refreshTranslations,
        loadNamespace,
      }}
    >
      {children}
    </AdminI18nContext.Provider>
  );
}
