/**
 * admin_i18n_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Admin 后台管理界面专属的国际化上下文
 * 采用分层策略：
 * - 侧边栏/顶栏等通用翻译：使用本地内置，秒开
 * - 页面级翻译：从 API 按需加载
 * - 缓存：localStorage 缓存 30 分钟
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Locale, defaultLocale, localeNames, locales } from "@/i18n/config";
import { adminApi } from "@/lib/api_client";

// ===== 本地内置翻译（秒开，无需等待 API） =====
const LOCAL_ADMIN_TRANSLATIONS_ZH: Record<string, string> = {
  // 侧边栏
  "admin.overview": "概览",
  "admin.dashboard": "仪表盘",
  "admin.analytics": "分析",
  "admin.monitor": "监控",
  "admin.userManagement": "用户管理",
  "admin.users": "用户",
  "admin.sessions": "会话",
  "admin.businessFunctions": "业务功能",
  "admin.ai_assistant": "AI 助手",
  "admin.ai": "AI 管理",
  "admin.knowledge_base": "知识库",
  "admin.organization": "组织架构",
  "admin.client_release": "客户端发布",
  "admin.operations": "运营管理",
  "admin.quotas": "配额管理",
  "admin.notifications": "通知管理",
  "admin.logs": "日志管理",
  "admin.systemSettings": "系统设置",
  "admin.settings": "设置",
  "admin.i18n": "国际化",
  "admin.database": "数据库",
  "admin.network": "网络",
  // 通用描述
  "admin.dashboard.desc": "系统概览与数据统计",
  "admin.analytics.desc": "用户行为与系统性能分析",
  "admin.monitor.desc": "实时系统监控",
  "admin.users.desc": "管理所有用户账户",
  "admin.users.new.desc": "创建新用户账户",
  "admin.ai_assistant.desc": "管理 AI 助手配置",
  "admin.ai.desc": "AI 模型与参数配置",
  "admin.knowledge_base.desc": "管理知识内容",
  "admin.organization.desc": "管理企业组织结构",
  "admin.client_release.desc": "管理客户端版本发布",
  "admin.quotas.desc": "管理用户与系统配额",
  "admin.notifications.desc": "系统通知配置",
  "admin.logs.desc": "系统日志与审计",
  "admin.settings.desc": "系统基本配置",
  "admin.i18n.desc": "多语言翻译管理",
  "admin.database.desc": "数据库配置与管理",
  "admin.network.desc": "网络配置与安全",
  // 登录页
  "admin.login.title": "管理员登录",
  "admin.login.subtitle": "登录 TRAI 管理后台",
  "admin.login.header": "管理员登录",
  "admin.login.header_desc": "请使用管理员账户登录",
  "admin.login.username": "用户名",
  "admin.login.username_placeholder": "请输入用户名",
  "admin.login.password": "密码",
  "admin.login.password_placeholder": "请输入密码",
  "admin.login.show_password": "显示密码",
  "admin.login.hide_password": "隐藏密码",
  "admin.login.remember": "记住我",
  "admin.login.forgot": "忘记密码?",
  "admin.login.verifying": "验证中...",
  "admin.login.enter": "登 录",
  "admin.login.back": "返回首页",
  "admin.login.footer": "All rights reserved",
  "admin.login.error.failed": "登录失败",
  "admin.login.error.backend": "无法连接后端服务:",
  // 顶栏
  "admin.title": "管理后台",
  "admin.loading": "加载中...",
  "admin.sidebar.brand": "TRAI",
  "admin.sidebar.search_menu": "搜索菜单",
  "admin.sidebar.toggle_sidebar": "切换侧边栏",
  "admin.v2.0.0": "v2.0.0",
  "admin.systemNormal": "系统正常",
  "admin.topbar.ai_assistant": "AI 助手",
  "admin.topbar.switch_lang": "切换语言",
  "admin.topbar.switching": "切换中...",
  "admin.topbar.lang_switched": "语言已切换为",
  "admin.topbar.notifications": "通知",
  "admin.topbar.profile": "个人资料",
  "admin.topbar.account_settings": "账户设置",
  "admin.topbar.logout": "退出登录",
  "admin.topbar.refresh": "刷新",
  // 访问控制
  "admin.access_denied.title": "访问受限",
  "admin.access_denied.not_logged_in": "您尚未登录, 请先登录后再访问管理后台。",
  "admin.access_denied.admin_only": "您没有管理员权限, 无法访问此页面。",
  "admin.access_denied.back_to_home": "返回首页",
  "admin.access_denied.relogin": "重新登录",
};

const LOCAL_ADMIN_TRANSLATIONS_EN: Record<string, string> = {
  // Sidebar
  "admin.overview": "Overview",
  "admin.dashboard": "Dashboard",
  "admin.analytics": "Analytics",
  "admin.monitor": "Monitor",
  "admin.userManagement": "User Management",
  "admin.users": "Users",
  "admin.sessions": "Sessions",
  "admin.businessFunctions": "Business Functions",
  "admin.ai_assistant": "AI Assistant",
  "admin.ai": "AI Management",
  "admin.knowledge_base": "Knowledge Base",
  "admin.organization": "Organization",
  "admin.client_release": "Client Release",
  "admin.operations": "Operations",
  "admin.quotas": "Quotas",
  "admin.notifications": "Notifications",
  "admin.logs": "Logs",
  "admin.systemSettings": "System Settings",
  "admin.settings": "Settings",
  "admin.i18n": "Internationalization",
  "admin.database": "Database",
  "admin.network": "Network",
  // Descriptions
  "admin.dashboard.desc": "System overview and statistics",
  "admin.analytics.desc": "User behavior and system performance analysis",
  "admin.monitor.desc": "Real-time system monitoring",
  "admin.users.desc": "Manage all user accounts",
  "admin.users.new.desc": "Create new user account",
  "admin.ai_assistant.desc": "Manage AI assistant configuration",
  "admin.ai.desc": "AI model and parameter configuration",
  "admin.knowledge_base.desc": "Manage knowledge content",
  "admin.organization.desc": "Manage enterprise organization",
  "admin.client_release.desc": "Manage client version releases",
  "admin.quotas.desc": "Manage user and system quotas",
  "admin.notifications.desc": "System notification configuration",
  "admin.logs.desc": "System logs and audit",
  "admin.settings.desc": "System basic configuration",
  "admin.i18n.desc": "Multi-language translation management",
  "admin.database.desc": "Database configuration and management",
  "admin.network.desc": "Network configuration and security",
  // Login
  "admin.login.title": "Admin Login",
  "admin.login.subtitle": "Login to TRAI Admin Dashboard",
  "admin.login.header": "Admin Login",
  "admin.login.header_desc": "Please login with admin account",
  "admin.login.username": "Username",
  "admin.login.username_placeholder": "Please enter username",
  "admin.login.password": "Password",
  "admin.login.password_placeholder": "Please enter password",
  "admin.login.show_password": "Show password",
  "admin.login.hide_password": "Hide password",
  "admin.login.remember": "Remember me",
  "admin.login.forgot": "Forgot password?",
  "admin.login.verifying": "Verifying...",
  "admin.login.enter": "Login",
  "admin.login.back": "Back to home",
  "admin.login.footer": "All rights reserved",
  "admin.login.error.failed": "Login failed",
  "admin.login.error.backend": "Cannot connect to backend:",
  // Topbar
  "admin.title": "Admin Dashboard",
  "admin.loading": "Loading...",
  "admin.sidebar.brand": "TRAI",
  "admin.sidebar.search_menu": "Search menu",
  "admin.sidebar.toggle_sidebar": "Toggle sidebar",
  "admin.v2.0.0": "v2.0.0",
  "admin.systemNormal": "System Normal",
  "admin.topbar.ai_assistant": "AI Assistant",
  "admin.topbar.switch_lang": "Switch language",
  "admin.topbar.switching": "Switching...",
  "admin.topbar.lang_switched": "Language switched to",
  "admin.topbar.notifications": "Notifications",
  "admin.topbar.profile": "Profile",
  "admin.topbar.account_settings": "Account Settings",
  "admin.topbar.logout": "Logout",
  "admin.topbar.refresh": "Refresh",
  // Access Control
  "admin.access_denied.title": "Access Denied",
  "admin.access_denied.not_logged_in": "You are not logged in. Please login first to access the admin dashboard.",
  "admin.access_denied.admin_only": "You don't have admin privileges to access this page.",
  "admin.access_denied.back_to_home": "Back to home",
  "admin.access_denied.relogin": "Re-login",
};

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
      const localDict = locale === "en" ? LOCAL_ADMIN_TRANSLATIONS_EN : LOCAL_ADMIN_TRANSLATIONS_ZH;
      return localDict[key];
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
