/**
 * i18n_provider.tsx
 * 国际化 Provider 包装组件
 */

"use client";

import { I18nProvider } from "@/i18n/i18n_context";

export function I18nProviderWrapper({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
