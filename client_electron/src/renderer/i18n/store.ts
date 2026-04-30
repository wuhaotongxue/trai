/**
 * 文件名: store.ts
 * 作者: wuhao
 * 日期: 2026-04-25 03:12:00
 * 描述: TRAI 桌面客户端国际化状态管理模块，优先使用本地翻译，运行时翻译作为补充
 */
import type { Locale } from './types'
import { use_locale_store } from '@/store/locale'
import { zh as local_zh } from './zh'
import { en as local_en } from './en'

/**
 * 初始化翻译（从后端 API 拉取）
 */
export async function init_i18n(): Promise<void> {
  if (!window.electron_api?.i18n_get_all_translations) {
    return
  }

  try {
    const res = await window.electron_api.i18n_get_all_translations()
    if (res.success && res.data) {
      set_runtime_translations(res.data)
    }
  } catch {
    // 静默处理
  }
}

// 本地翻译数据
const LOCAL_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  zh: local_zh,
  en: local_en,
}

// 运行时翻译缓存（从后端 API 获取，用于覆盖本地翻译）
let runtime_translations: { zh: Record<string, string>; en: Record<string, string> } | null = null

/**
 * 设置运行时翻译数据（由主进程 IPC 调用后传入）
 */
export function set_runtime_translations(data: { zh: Record<string, string>; en: Record<string, string> } | null) {
  runtime_translations = data
}

/**
 * 翻译函数：优先使用本地翻译，其次使用运行时翻译
 */
function do_translate(locale: Locale, key: string): string {
  // 1. 先查找本地翻译
  const local = LOCAL_TRANSLATIONS[locale]
  if (local && local[key]) {
    return local[key]
  }
  // 2. 再查找运行时翻译
  if (runtime_translations) {
    const translations_obj = runtime_translations[locale]
    if (translations_obj && translations_obj[key]) {
      return translations_obj[key]
    }
    // 尝试简单 key
    const simple_key = key.split('.').pop()
    if (simple_key && translations_obj[simple_key]) {
      return translations_obj[simple_key]
    }
  }
  // 3. 没有翻译时返回原始 key
  return key
}

// 响应式翻译 Hook - 在组件中使用
export function use_t(): (key: string) => string {
  const locale = use_locale_store((state) => state.locale)
  return (key: string) => do_translate(locale, key)
}

// 获取翻译文本
export function t(key: string): string {
  const locale = use_locale_store.getState().locale
  return do_translate(locale, key)
}

// 翻译函数别名（符合 skill 规范，禁止使用单字母函数名）
export { t as translate }

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
