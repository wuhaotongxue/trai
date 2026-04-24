/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-24 16:30:00
 * 描述: TRAI 桌面客户端国际化模块，翻译数据从后端 API 获取
 */
export type Locale = 'zh' | 'en'

/**
 * 默认翻译 key（后端未配置时的回退）
 */
const fallback_keys: Record<Locale, Record<string, string>> = {
  zh: {
    'client.loading': '正在加载...',
    'client.confirm': '确认',
    'client.cancel': '取消',
    'client.save': '保存',
    'client.close': '关闭',
    'client.logout': '退出',
    'client.search': '搜索',
    'client.dashboard': '仪表盘',
    'client.settings': '设置',
    'client.chat': '智能对话',
    'client.knowledge_base': '知识库',
    'client.tools': '工具箱',
    'client.feedback': '反馈',
    'client.login': '登录',
    'client.register': '注册',
    'client.username': '用户名',
    'client.password': '密码',
    'client.email': '邮箱',
    // 简单 key 兼容
    loading: '正在加载...',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    logout: '退出',
    search: '搜索',
    dashboard: '仪表盘',
    settings: '设置',
    chat: '智能对话',
    knowledge_base: '知识库',
    tools: '工具箱',
    feedback: '反馈',
    login: '登录',
    register: '注册',
    username: '用户名',
    password: '密码',
    email: '邮箱',
  },
  en: {
    'client.loading': 'Loading...',
    'client.confirm': 'Confirm',
    'client.cancel': 'Cancel',
    'client.save': 'Save',
    'client.close': 'Close',
    'client.logout': 'Logout',
    'client.search': 'Search',
    'client.dashboard': 'Dashboard',
    'client.settings': 'Settings',
    'client.chat': 'Chat',
    'client.knowledge_base': 'Knowledge Base',
    'client.tools': 'Tools',
    'client.feedback': 'Feedback',
    'client.login': 'Sign In',
    'client.register': 'Register',
    'client.username': 'Username',
    'client.password': 'Password',
    'client.email': 'Email',
    // 简单 key 兼容
    loading: 'Loading...',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    logout: 'Logout',
    search: 'Search',
    dashboard: 'Dashboard',
    settings: 'Settings',
    chat: 'Chat',
    knowledge_base: 'Knowledge Base',
    tools: 'Tools',
    feedback: 'Feedback',
    login: 'Sign In',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    email: 'Email',
  },
}

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
 * 初始化翻译（从后端 API 拉取）
 */
export async function init_i18n(): Promise<void> {
  if (!window.electron_api?.i18n_get_all_translations) {
    console.warn('i18n API not available, using fallback translations')
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
    console.warn('Failed to fetch translations from API, using fallback:', error)
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

  // 回退到本地默认值
  const fallbacks = fallback_keys[locale]
  if (fallbacks[key]) return fallbacks[key]
  const simple_key = key.split('.').pop()
  if (simple_key && fallbacks[simple_key]) return fallbacks[simple_key]
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
