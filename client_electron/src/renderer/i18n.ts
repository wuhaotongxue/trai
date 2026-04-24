/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-24 16:30:00
 * 描述: TRAI 桌面客户端国际化模块，翻译数据从后端 API 获取
 */
export type Locale = 'zh' | 'en'

/**
 * 默认翻译 key 列表（后端未配置时的回退）
 */
const fallback_keys: Record<Locale, Record<string, string>> = {
  zh: {
    app_name: 'TRAI',
    loading: '正在加载...',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    logout: '退出',
    search: '搜索',
    upload: '上传',
    download: '下载',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    rename: '重命名',
    success: '成功',
    error: '错误',
    loading_data: '加载中...',
    no_data: '暂无数据',
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
    app_name: 'TRAI',
    loading: 'Loading...',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    logout: 'Logout',
    search: 'Search',
    upload: 'Upload',
    download: 'Download',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    rename: 'Rename',
    success: 'Success',
    error: 'Error',
    loading_data: 'Loading...',
    no_data: 'No data',
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
    if (translations && translations[key]) {
      return translations[key]
    }
  }

  return fallback_keys[locale][key] || key
}

export function use_locale(): [Locale, (l: Locale) => void] {
  return [locale_store.get(), locale_store.set]
}

export { locale_store }

export { locale_store as current_locale_store }

export function use_translation(): (key: string) => string {
  return t
}
