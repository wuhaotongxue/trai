/**
 * 文件名: store.ts
 * 作者: wuhao
 * 日期: 2026-04-24 18:38:00
 * 描述: TRAI 桌面客户端国际化状态管理模块
 */

import type { Locale } from './types'
import { zh } from './zh'
import { en } from './en'
import { use_locale_store } from '@/store/locale'

export const translations = {
  zh,
  en,
} as const

type ZhKeys = keyof typeof zh
type EnKeys = keyof typeof en
export type TranslationKey = ZhKeys | EnKeys

// 获取翻译文本
export function t(key: string): string {
  const locale = use_locale_store.getState().locale
  const translations_obj = translations[locale]
  return (translations_obj as Record<string, string>)[key] ?? key
}

// 响应式翻译 Hook - 在组件中使用
export function use_t(): (key: string) => string {
  const locale = use_locale_store((state) => state.locale)
  return (key: string) => {
    const translations_obj = translations[locale]
    return (translations_obj as Record<string, string>)[key] ?? key
  }
}

// 获取当前语言
export function get_locale(): Locale {
  return use_locale_store.getState().locale
}

// 设置语言
export function set_locale(locale: Locale) {
  use_locale_store.getState().set_locale(locale)
}

// 兼容旧 API
export { use_locale_store as use_locale }
