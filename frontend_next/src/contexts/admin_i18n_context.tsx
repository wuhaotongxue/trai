/* eslint-disable */
/**
 * admin_i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Admin 后台管理界面专属的国际化上下文
 * 翻译数据来源: src/i18n/admin/zh.ts & en.ts
 * 采用分层策略：
 * - 侧边栏/顶栏等通用翻译：使用本地内置，秒开
 * - 页面级翻译：从 API 按需加载
 * - 缓存：localStorage 缓存 30 分钟
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Locale, defaultLocale, localeNames, locales } from "@/i18n/config";
import { adminApi } from "@/lib/api_client";
import { ADMIN_TRANSLATIONS } from "@/i18n/admin";

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
const API_CACHE_KEY = "trai-admin-api-cache";
const API_CACHE_EXPIRY_KEY = "trai-admin-api-cache-expiry";
const API_CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 分钟

// 缓存已加载的命名空间（内存缓存）
const loadedNamespaces = new Set<string>();

// 获取 API 缓存
function getApiCache(): Record<string, string> | null {
  try {
    const expiry = localStorage.getItem(API_CACHE_EXPIRY_KEY);
    if (!expiry || Date.now() > parseInt(expiry, 10)) {
      return null;
    }
    const cached = localStorage.getItem(API_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    return null;
  }
  return null;
}

// 设置 API 缓存
function setApiCache(data: Record<string, string>): void {
  try {
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(API_CACHE_EXPIRY_KEY, (Date.now() + API_CACHE_EXPIRY_MS).toString());
  } catch {
    // localStorage 满时忽略
  }
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [apiTranslations, setApiTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef<Set<string>>(new Set());

  // 获取本地翻译
  const getLocalTranslation = useCallback(
    (key: string): string | undefined => {
      const localDict = locale === "en" ? ADMIN_TRANSLATIONS.en : ADMIN_TRANSLATIONS.zh;
      return localDict[key as keyof typeof localDict];
    },
    [locale]
  );

  // 按需加载单个命名空间
  const loadNamespace = useCallback(
    async (namespace: string) => {
      if (loadedNamespaces.has(namespace) || loadingRef.current.has(namespace)) {
        return;
      }
      loadingRef.current.add(namespace);
      setLoading(true);
      try {
        const res = await adminApi.listI18n({ locale, namespace, limit: 1000 });
        if (res.items && res.items.length > 0) {
          setApiTranslations((prev) => {
            const next = { ...prev };
            for (const item of res.items) {
              // 存储时使用完整的 namespace.key 格式
              next[`${item.namespace}.${item.key}`] = item.value;
            }
            return next;
          });
          // 更新缓存
          const newData = { ...apiTranslations };
          for (const item of res.items) {
            newData[`${item.namespace}.${item.key}`] = item.value;
          }
          setApiCache(newData);
          loadedNamespaces.add(namespace);
        }
      } catch (e) {
        console.error(`[i18n] 加载 namespace ${namespace} 失败:`, e);
      } finally {
        loadingRef.current.delete(namespace);
        setLoading(false);
      }
    },
    [locale, apiTranslations]
  );

  // 语言切换
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  // 语言变化时清空 API 翻译缓存，重新加载
  useEffect(() => {
    loadedNamespaces.clear();
    setApiTranslations({});
    // 从缓存恢复
    const cached = getApiCache();
    if (cached) {
      setApiTranslations(cached);
    }
  }, [locale]);

  // 初始化：恢复语言选择
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
    }
    // 从缓存恢复
    const cached = getApiCache();
    if (cached) {
      setApiTranslations(cached);
    }
  }, []);

  const refreshTranslations = useCallback(async () => {
    setRefreshing(true);
    loadedNamespaces.clear();
    setApiTranslations({});
    localStorage.removeItem(API_CACHE_KEY);
    localStorage.removeItem(API_CACHE_EXPIRY_KEY);
    setRefreshing(false);
  }, []);

  const translate = useCallback(
    (key: string): string => {
      // 1. 优先使用本地内置翻译（秒开）
      const local = getLocalTranslation(key);
      if (local !== undefined) {
        return local;
      }
      // 2. 使用 API 翻译
      return apiTranslations[key] || key;
    },
    [getLocalTranslation, apiTranslations]
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
