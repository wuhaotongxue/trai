/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-25 03:12:00
 * 描述: TRAI 桌面客户端国际化模块，翻译数据从后端 API 获取
 */
export type Locale = 'zh' | 'en'

/**
 * 运行时翻译缓存（从后端 API 获取）
 */
let runtime_translations: { zh: Record<string, string>; en: Record<string, string> } | null = null

/**
 * locale 状态管理
 */
const locale_store = {
  locale: 'zh' as Locale,
  listeners: new Set<() => void>(),
  get(): Locale {
    return this.locale
  },
  set(locale: Locale) {
    this.locale = locale
    this.listeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  },
}

/**
 * 设置运行时翻译数据（由主进程 IPC 调用后传入）
 */
export function set_runtime_translations(data: { zh: Record<string, string>; en: Record<string, string> } | null) {
  runtime_translations = data
}

/**
 * 初始化翻译（从后端 API 拉取）
 */
export async function init_i18n(): Promise<void> {
  if (!window.electron_api?.i18n_get_all_translations) {
    console.warn('i18n API not available')
    return
  }

  try {
    const res = await window.electron_api.i18n_get_all_translations()
    if (res.success && res.data) {
      runtime_translations = res.data
      console.log('i18n initialized from API:', {
        zh: Object.keys(res.data.zh).length,
        en: Object.keys(res.data.en).length,
      })
    }
  } catch (error) {
    console.warn('Failed to fetch translations from API:', error)
  }
}

/**
 * 获取翻译文本
 */
export function t(key: string): string {
  const locale = locale_store.get()

  if (runtime_translations) {
    const translations = locale === 'zh' ? runtime_translations.zh : runtime_translations.en
    if (translations) {
      // 优先尝试原格式（如 client.login）
      if (translations[key]) {
        return translations[key]
      }
      // 尝试简单 key 格式（如 login）
      const simple_key = key.split('.').pop()
      if (simple_key && translations[simple_key]) {
        return translations[simple_key]
      }
    }
  }

  // 没有翻译时返回原始 key
  return key
}

export function use_locale(): [Locale, (l: Locale) => void] {
  return [locale_store.get(), locale_store.set]
}

export { locale_store }

export { locale_store as current_locale_store }

export function use_translation(): (key: string) => string {
  return t
}
