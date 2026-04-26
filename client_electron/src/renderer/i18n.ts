/**
 * 文件名: i18n.ts
 * 作者: wuhao
 * 日期: 2026-04-25 03:16:00
 * 描述: TRAI 桌面客户端国际化模块主入口
 */

// 直接使用硬编码的中文文本，不使用翻译函数
export type Locale = 'zh' | 'en'

// 翻译函数
export function t(key: string): string {
  const translations: Record<string, string> = {
    // 服务器配置
    server_local: '本地服务器',
    server_local_desc: '127.0.0.1:5666',
    server_remote: '远程服务器',
    server_remote_desc: 'trai.tuoren.com:5666',
    server_production: '生产环境',
    server_production_desc: 'trai.tuoren.com',
    server_config_title: '服务器配置',
    server_current: '当前服务器',
    server_select_or_input: '选择或输入服务器地址',
    server_address: '服务器地址',
    server_address_hint: '例如: http://127.0.0.1:5666',
    server_cancel: '取消',
    server_save: '保存',
    server_config: '服务器配置',

    // 系统日志
    system_logs: '系统日志',
    clear: '清空',
    close: '关闭',
    no_logs: '暂无日志',

    // 品牌
    your_ai_platform: '您的 AI 平台',

    // 登录页面
    login_welcome: '欢迎回来',
    login_subtitle: '请登录您的账户以继续',
    username: '用户名',
    enter_username: '请输入用户名',
    password: '密码',
    enter_password: '请输入密码',
    password_error: '密码错误',
    save_login_state: '记住登录状态',
    signing_in: '正在登录...',
    login: '登录',
    or: '或',
    wecom_login: '企业微信登录',
    no_account: '还没有账户？',
    register_here: '立即注册',
    empty_credentials: '请填写用户名和密码',
    login_error: '登录失败',

    // 注册页面
    email: '邮箱',
    enter_email: '请输入邮箱地址',
    confirm_password: '确认密码',
    reenter_password: '请再次输入密码',
    password_mismatch: '两次密码不一致',
    register: '注册',
    register_failed: '注册失败',
    register_error: '注册失败，请稍后重试',

    // 导航
    navigation: '导航',
    not_logged_in: '未登录',
    dashboard: '仪表盘',
    overview: '概览',
    agent: '智能体',
    management: '管理',
    knowledge_base: '知识库',
    files: '文件',
    ai_creation: 'AI 创作',
    chat: '聊天',
    text_to_image: '文本生成图片',
    image_to_image: '图片生成图片',
    music_generation: '音乐生成',
    video_generation: '视频生成',
    tools: '工具',
    tool: '工具',
    media_center: '媒体中心',
    player: '播放器',
    media_processing: '媒体处理',
    feedback: '反馈',
    settings: '设置',
    logout: '退出登录',
    app_name: 'TRAI',

    // 标题栏
    switch_to_light: '切换到亮色模式',
    switch_to_dark: '切换到深色模式',
    refresh: '刷新',
    show_logs: '显示日志',
    hide_logs: '隐藏日志',
    caps_lock_on: '大写锁定已开启',
    caps_lock_off: '大写锁定已关闭',

    // 反馈页面
    feedback: '反馈',
    feedback_title: '意见反馈',
    feedback_subtitle: '请告诉我们您的想法，帮助我们改进产品',
    feedback_type: '反馈类型',
    bug_report: 'Bug 报告',
    feature_request: '功能建议',
    other: '其他',
    feedback_content: '反馈内容',
    enter_feedback: '请输入您的反馈内容',
    contact_info: '联系方式',
    enter_contact: '请留下您的联系方式（可选）',
    submit: '提交',
    submitting: '提交中...',
    submit_success: '提交成功',
    submit_failed: '提交失败，请稍后重试',

    // 开发中页面
    under_development: '开发中',
    coming_soon: '即将上线',
    page_under_development: '该页面正在开发中，敬请期待！',

    // 仪表盘页面
    dashboard: '仪表盘',
    welcome_back: '欢迎回来',
    quick_actions: '快捷操作',
    recent_activities: '最近活动',
    system_status: '系统状态',
    storage_usage: '存储使用情况',
    cpu_usage: 'CPU 使用情况',
    memory_usage: '内存使用情况',
    network_usage: '网络使用情况',

    // 媒体页面
    media: '媒体',
    media_center: '媒体中心',
    upload_media: '上传媒体',
    media_library: '媒体库',
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    recent_uploads: '最近上传',
    search_media: '搜索媒体',
    no_media: '暂无媒体',

    // 注册页面
    register: '注册',
    create_account: '创建账户',
    register_subtitle: '请填写以下信息创建您的账户',
    username: '用户名',
    enter_username: '请输入用户名',
    email: '邮箱',
    enter_email: '请输入邮箱地址',
    password: '密码',
    enter_password: '请输入密码',
    confirm_password: '确认密码',
    reenter_password: '请再次输入密码',
    password_mismatch: '两次密码不一致',
    register: '注册',
    registering: '注册中...',
    register_success: '注册成功',
    register_failed: '注册失败',
    register_error: '注册失败，请稍后重试',
    already_have_account: '已有账户？',
    login_here: '立即登录',

    // 三面板布局
    three_panel_layout: '三面板布局',
    left_panel: '左侧面板',
    center_panel: '中间面板',
    right_panel: '右侧面板',
  }
  return translations[key] || key
}

// 初始化翻译数据（空函数，保持接口兼容）
export async function init_i18n(): Promise<void> {
  // 直接返回，不需要从 API 获取翻译数据
}

// 设置运行时翻译数据（空函数，保持接口兼容）
export function set_runtime_translations(data: { zh: Record<string, string>; en: Record<string, string> } | null) {
  // 直接返回，不需要设置运行时翻译数据
}

// 反应式翻译 Hook - 在组件中使用
export function use_t(): (key: string) => string {
  return (key: string) => t(key)
}

// 获取当前语言环境
export function get_locale(): Locale {
  return 'zh' // 固定返回中文
}

// 设置语言环境
export function set_locale(locale: Locale) {
  // 直接返回，不需要设置语言环境
}

// 兼容性导出
export const use_locale = () => ({
  locale: 'zh',
  set_locale: (locale: Locale) => {}
})

// 导出动画组件（空实现，保持接口兼容）
export const AnimatedTranslation = (props: any) => props.children
export const Trans = (props: any) => props.children
export const TranslationWrapper = (props: any) => props.children

