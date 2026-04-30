/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-25 03:16:00
 * 描述: TRAI 桌面客户端国际化模块主入口，桥接到 i18n/store.ts
 */
import { zh as local_zh } from './i18n/zh'
import { en as local_en } from './i18n/en'
import { use_locale_store } from './store/locale'

// 本地翻译数据
const LOCAL_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  zh: local_zh,
  en: local_en,
}

function do_translate(locale: Locale, key: string): string {
  const local = LOCAL_TRANSLATIONS[locale]
  if (local && local[key]) {
    return local[key]
  }
  return key
}

export type Locale = 'zh' | 'en'

export function t(key: string): string {
  return do_translate(use_locale_store.getState().locale, key)
}

export function translate(key: string): string {
  return do_translate(use_locale_store.getState().locale, key)
}

export async function init_i18n(): Promise<void> {
  // 空实现，保持接口兼容
}

export function set_runtime_translations(data: { zh: Record<string, string>; en: Record<string, string> } | null) {
  // 空实现，保持接口兼容
}

export function get_locale(): Locale {
  return use_locale_store.getState().locale
}

export function set_locale(locale: Locale) {
  use_locale_store.getState().set_locale(locale)
}

export const use_locale = use_locale_store

export const AnimatedTranslation = (props: any) => props.children
export const Trans = (props: any) => props.children
export const TranslationWrapper = (props: any) => props.children
