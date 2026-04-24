/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 01:00:00
 * 描述: TRAI 桌面客户端登录页面，多语言、国际风格与深色主题
 */
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText, RotateCw, Sparkles, Globe, ChevronDown, Server, X, Check, Loader2 } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { use_log_store } from '@/store/log'
import TitleBar from '@/components/layout/title_bar'
import { use_locale_store } from '@/store/locale'
import { t, type Locale } from '@/i18n'

console.info('[login] Login component rendering...')

// 预定义服务器列表
const PREDEFINED_SERVERS = [
  { id: 'local', label_key: 'server_local', desc_key: 'server_local_desc', url: 'http://127.0.0.1:5666' },
  { id: 'remote', label_key: 'server_remote', desc_key: 'server_remote_desc', url: 'https://trai.tuoren.com:5666' },
  { id: 'production', label_key: 'server_production', desc_key: 'server_production_desc', url: 'https://trai.tuoren.com' },
]

// 服务器配置弹窗组件
interface ServerConfigModalProps {
  current_url: string
  on_select: (url: string) => void
  on_close: () => void
  locale: Locale
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ current_url, on_select, on_close, locale }) => {
  const [custom_url, set_custom_url] = useState('')
  const [selected_id, set_selected_id] = useState<string>('')
  const [testing_url, set_testing_url] = useState<string | null>(null)
  const [test_result, set_test_result] = useState<{ url: string; success: boolean } | null>(null)
  const modal_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 找到当前URL对应的预定义服务器
    const matched = PREDEFINED_SERVERS.find((s) => s.url === current_url)
    if (matched) {
      set_selected_id(matched.id)
    } else {
      set_selected_id('')
      set_custom_url(current_url)
    }
  }, [current_url])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modal_ref.current && !modal_ref.current.contains(e.target as Node)) {
        on_close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [on_close])

  const handle_select_preset = (server: typeof PREDEFINED_SERVERS[0]) => {
    set_selected_id(server.id)
    set_custom_url('')
  }

  const handle_custom_change = (value: string) => {
    set_custom_url(value)
    set_selected_id('')
  }

  const test_connection = async (url: string) => {
    set_testing_url(url)
    set_test_result(null)
    try {
      // 使用 fetch 测试连接（只检查响应头）
      const controller = new AbortController()
      const timeout_id = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timeout_id)
      set_test_result({ url, success: true })
    } catch {
      set_test_result({ url, success: false })
    }
    set_testing_url(null)
  }

  const get_final_url = () => {
    if (selected_id) {
      const server = PREDEFINED_SERVERS.find((s) => s.id === selected_id)
      return server?.url || ''
    }
    const normalized = custom_url.trim()
    if (!normalized) return ''
    return normalized.startsWith('http://') || normalized.startsWith('https://') ? normalized : `http://${normalized}`
  }

  const handle_save = () => {
    const url = get_final_url()
    if (url) {
      on_select(url)
    }
  }

  const current_display = selected_id
    ? PREDEFINED_SERVERS.find((s) => s.id === selected_id)?.url || ''
    : custom_url || current_url

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div
        ref={modal_ref}
        style={{
          backgroundColor: 'var(--ui_panel)',
          borderRadius: 'var(--ui_radius_lg)',
          border: '1px solid var(--ui_border)',
          boxShadow: 'var(--ui_shadow_lg)',
          width: '440px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* 标题栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--ui_border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="var(--ui_accent)" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ui_text)' }}>
              {t('server_config_title')}
            </span>
          </div>
          <button
            className="no-drag-region"
            type="button"
            onClick={on_close}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--ui_text_secondary)', padding: '4px', borderRadius: 'var(--ui_radius_sm)',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: '20px', maxHeight: 'calc(85vh - 140px)', overflow: 'auto' }}>
          {/* 当前服务器 */}
          <div style={{
            padding: '12px 16px', backgroundColor: 'var(--ui_accent_light)',
            borderRadius: 'var(--ui_radius_md)', marginBottom: '16px',
            border: '1px solid rgba(14,165,233,0.2)',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--ui_accent)', marginBottom: '4px', fontWeight: 500 }}>
              {t('server_current')}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ui_text)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {current_display || current_url}
            </div>
          </div>

          {/* 预定义服务器列表 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ui_text_secondary)', marginBottom: '10px', fontWeight: 500 }}>
              {t('server_select_or_input')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PREDEFINED_SERVERS.map((server) => {
                const is_selected = selected_id === server.id
                const is_testing = testing_url === server.url
                const test_res = test_result?.url === server.url ? test_result : null
                return (
                  <div
                    key={server.id}
                    onClick={() => handle_select_preset(server)}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: is_selected ? 'var(--ui_accent_light)' : 'var(--ui_panel_alt)',
                      border: `1.5px solid ${is_selected ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                      borderRadius: 'var(--ui_radius_md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => { if (!is_selected) e.currentTarget.style.borderColor = 'var(--ui_accent)' }}
                    onMouseLeave={(e) => { if (!is_selected) e.currentTarget.style.borderColor = 'var(--ui_border)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: `2px solid ${is_selected ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {is_selected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--ui_accent)' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--ui_text)', fontWeight: 500 }}>
                          {t(server.label_key)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ui_text_muted)', fontFamily: 'monospace' }}>
                          {t(server.desc_key)}
                        </div>
                      </div>
                    </div>
                    {is_selected && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void test_connection(server.url) }}
                        disabled={is_testing}
                        style={{
                          background: 'var(--ui_panel_hover)', border: '1px solid var(--ui_border)',
                          borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: is_testing ? 'not-allowed' : 'pointer',
                          fontSize: '11px', color: test_res ? (test_res.success ? 'var(--ui_success)' : 'var(--ui_danger)') : 'var(--ui_text_secondary)',
                          display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
                        }}
                      >
                        {is_testing ? <Loader2 size={12} className="animate-spin" /> : test_res ? (test_res.success ? <Check size={12} /> : <X size={12} />) : null}
                        {is_testing ? '...' : test_res ? (test_res.success ? 'OK' : 'FAIL') : 'Test'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 自定义输入 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--ui_text_secondary)', fontWeight: 500 }}>
              {t('server_address')}
            </label>
            <input
              type="text"
              value={custom_url}
              onChange={(e) => handle_custom_change(e.target.value)}
              placeholder={t('server_address_hint')}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 'var(--ui_radius_md)',
                border: `1.5px solid ${!selected_id && custom_url ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                boxSizing: 'border-box', outline: 'none', fontSize: '13px',
                fontFamily: 'monospace',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: !selected_id && custom_url ? '0 0 0 3px var(--ui_accent_light)' : 'none',
              }}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{
          display: 'flex', gap: '10px', padding: '16px 20px',
          borderTop: '1px solid var(--ui_border)',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={on_close}
            style={{
              padding: '8px 16px', borderRadius: 'var(--ui_radius_md)',
              border: '1px solid var(--ui_border)', backgroundColor: 'transparent',
              color: 'var(--ui_text_secondary)', fontSize: '13px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}
          >
            {t('server_cancel')}
          </button>
          <button
            type="button"
            onClick={handle_save}
            disabled={!get_final_url()}
            style={{
              padding: '8px 20px', borderRadius: 'var(--ui_radius_md)',
              border: 'none', backgroundColor: get_final_url() ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
              color: 'white', fontSize: '13px', fontWeight: 500, cursor: get_final_url() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Check size={14} />
            {t('server_save')}
          </button>
        </div>
      </div>
    </div>
  )
}

const Login: React.FC = () => {
  console.info('[login] Login function called')
  const [username, set_username] = useState('wuhao')
  const [password, set_password] = useState('Tr@@2026...')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('http://127.0.0.1:5666')
  const [api_loading, set_api_loading] = useState(true)
  const [remember_me, set_remember_me] = useState(true)
  const [show_logs, set_show_logs] = useState(false)
  const [is_logging_in, set_is_logging_in] = useState(false)
  const [logo_spinning, set_logo_spinning] = useState(false)
  const [spin_direction, set_spin_direction] = useState<'cw' | 'ccw'>('cw')
  const [active_input, set_active_input] = useState<string | null>(null)
  const [password_shake, set_password_shake] = useState(false)
  const [locale, set_locale] = useState<Locale>('zh')
  const [show_lang_menu, set_show_lang_menu] = useState(false)
  const [show_server_config, set_show_server_config] = useState(false)
  const lang_menu_ref = useRef<HTMLDivElement>(null)
  const [, force_update] = useState(0)
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)
  const { logs, add_log, clear_logs } = use_log_store()
  const log_card_ref = useRef<HTMLDivElement>(null)
  const last_submit_time = useRef(0)

  // 初始化语言配置：从配置读取或使用默认中文
  useEffect(() => {
    const init_locale = async () => {
      try {
        const res = await window.electron_api?.config_get('ui:locale', 'zh')
        const saved_locale = res?.success && res.data ? (res.data as Locale) : 'zh'
        use_locale_store.getState().set_locale(saved_locale)
        set_locale(saved_locale)
      } catch {
        use_locale_store.getState().set_locale('zh')
        set_locale('zh')
      }
    }
    void init_locale()
  }, [])

  // 监听语言状态变化并同步到本地 state
  useEffect(() => {
    const unsubscribe = use_locale_store.subscribe((state) => {
      force_update((n) => n + 1)
      set_locale(state.locale)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const load_config = async () => {
      try {
        if (window.electron_api?.config_get) {
          const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
          if (res.success && typeof res.data === 'string' && res.data.trim()) {
            set_api_url(res.data.trim())
            add_log(`服务器配置已加载: ${res.data.trim()}`)
          } else {
            add_log(`使用默认服务器: http://127.0.0.1:5666`)
          }
          const rm_res = await window.electron_api.config_get('remember_me', true)
          if (rm_res.success) set_remember_me(rm_res.data)
        }
      } catch (err: unknown) {
        add_log(`加载配置失败: ${String((err as Error)?.message || 'unknown')}`)
      } finally {
        set_api_loading(false)
      }
    }
    void load_config()
  }, [add_log])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(e.target as Node)) set_show_logs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 语言菜单点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (lang_menu_ref.current && !lang_menu_ref.current.contains(e.target as Node)) set_show_lang_menu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 全局点击切换旋转
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // 忽略标题栏按钮和表单元素
      if (target.closest('.no-drag-region')) return
      if (target.closest('input') || target.closest('form') || target.closest('button')) return
      // 随机选择旋转方向（真正随机）
      set_spin_direction(() => Math.random() > 0.5 ? 'cw' : 'ccw')
      set_logo_spinning((v) => !v)
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  const normalized_api_url = useMemo(() => {
    const raw = api_url.trim()
    if (!raw) return ''
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://${raw}`
  }, [api_url])

  const save_api_url = useCallback(async () => {
    if (!normalized_api_url) { set_error_msg('Server address cannot be empty'); return }
    try {
      const res = await window.electron_api.config_set('api_url', normalized_api_url)
      if (!res.success) { set_error_msg(res.error || 'Failed'); return }
      set_api_url(normalized_api_url)
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || 'Failed'))
    }
  }, [normalized_api_url])

  // 处理服务器选择
  const handle_server_select = useCallback(async (url: string) => {
    try {
      const res = await window.electron_api.config_set('api_url', url)
      if (res.success) {
        set_api_url(url)
        add_log(`服务器已切换: ${url}`)
        set_show_server_config(false)
      } else {
        add_log(`服务器切换失败: ${res.error}`)
      }
    } catch (err: unknown) {
      add_log(`服务器切换异常: ${String((err as Error)?.message || 'unknown')}`)
    }
  }, [add_log])

  const do_login = useCallback(async (u: string, p: string) => {
    add_log(`登录尝试: ${u} @ ${normalized_api_url}`)
    if (!api_loading) await save_api_url()
    const res = await window.electron_api.auth_login({ username: u, password: p })
    if (res.success && res.data) {
      await window.electron_api.config_set('remember_me', remember_me)
      const user_info = res.data.user
      login({ username: user_info.username || u, email: user_info.email || `${u}@trai.local`, role: user_info.role || 'user' })
      add_log(`登录成功: ${u}`)
      navigate('/')
    } else {
      const raw = String(res.error || '')
      add_log(`登录失败: ${raw}`)
      if (raw.includes('401') || raw.includes('密码错误')) {
        set_error_msg(t('password_error'))
        set_password_shake(true)
        setTimeout(() => set_password_shake(false), 600)
      }
      else set_error_msg(raw || t('login_error'))
    }
  }, [api_loading, normalized_api_url, remember_me, save_api_url, add_log, login, navigate])

  const handle_submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (Date.now() - last_submit_time.current < 1000) return
    last_submit_time.current = Date.now()
    if (!username || !password) { set_error_msg(t('empty_credentials')); return }
    set_is_logging_in(true); set_error_msg('')
    try { await do_login(username, password) }
    catch (err: unknown) { set_error_msg(String((err as Error)?.message || t('login_error'))) }
    finally { set_is_logging_in(false) }
  }, [username, password, do_login])

  console.info('[login] About to return JSX, username:', username, 'locale:', locale)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_panel)', overflow: 'hidden' }}>
      {/* 标题栏 */}
      <div className="drag-region" style={{ height: 'var(--titlebar_height)', width: '100%', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '8px', borderBottom: '1px solid var(--ui_border)', position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ui_text)' }}>TRAI</span>
          <button className="no-drag-region" type="button" onClick={() => window.location.reload()} style={{ background: 'transparent', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ui_text_secondary)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}>
            <RotateCw size={14} />
          </button>

          {/* 服务器配置按钮 */}
          <button
            className="no-drag-region"
            type="button"
            onClick={() => set_show_server_config(true)}
            title={t('server_config')}
            style={{
              background: 'transparent',
              border: '1px solid var(--ui_border)',
              borderRadius: 'var(--ui_radius_sm)',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--ui_text_secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}
          >
            <Server size={14} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="no-drag-region" type="button" onClick={() => set_show_logs(!show_logs)} style={{ background: show_logs ? 'var(--ui_accent_light)' : 'transparent', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: show_logs ? 'var(--ui_accent)' : 'var(--ui_text_secondary)', transition: 'all 0.2s' }}>
              <FileText size={14} />
            </button>
            {show_logs && (
              <div ref={log_card_ref} className="no-drag-region" style={{ position: 'absolute', top: '40px', left: '0', width: '400px', maxWidth: '90vw', maxHeight: '300px', backgroundColor: 'var(--ui_panel)', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_lg)', boxShadow: 'var(--ui_shadow_lg)', padding: '12px', overflow: 'auto', zIndex: 1000, animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>{t('system_logs')}</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[{ label: t('clear'), a: clear_logs }, { label: t('close'), a: () => set_show_logs(false) }].map(({ label, a }) => (
                      <button key={label} className="no-drag-region" type="button" onClick={a} style={{ background: 'var(--ui_panel_hover)', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '2px 8px', cursor: 'pointer', fontSize: '12px', color: 'var(--ui_text_secondary)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_active)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--ui_text_secondary)' }}>
                  {logs.length > 0 ? logs.map((log, i) => <div key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{log}</div>) : <div style={{ color: 'var(--ui_text_muted)' }}>{t('no_logs')}</div>}
                </div>
              </div>
            )}
          </div>

          {/* 语言切换 */}
          <div style={{ position: 'relative' }} ref={lang_menu_ref}>
            <button
              className="no-drag-region"
              type="button"
              title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
              onClick={() => set_show_lang_menu(!show_lang_menu)}
              style={{
                background: 'transparent',
                border: '1px solid var(--ui_border)',
                borderRadius: 'var(--ui_radius_sm)',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: 'var(--ui_text_secondary)',
                transition: 'all 0.2s',
                fontSize: '12px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}
            >
              <Globe size={13} />
              <span style={{ fontSize: '11px' }}>{locale === 'zh' ? '中文' : 'EN'}</span>
              <ChevronDown size={12} />
            </button>

            {show_lang_menu && (
              <div
                className="no-drag-region"
                style={{
                  position: 'absolute',
                  top: '34px',
                  left: '0',
                  backgroundColor: 'var(--ui_panel)',
                  border: '1px solid var(--ui_border)',
                  borderRadius: 'var(--ui_radius_md)',
                  boxShadow: 'var(--ui_shadow_md)',
                  padding: '4px',
                  zIndex: 1001,
                  minWidth: '120px',
                  animation: 'fadeInUp 0.15s ease',
                }}
              >
                {([
                  { locale: 'zh' as Locale, label: '中文', flag: 'CN' },
                  { locale: 'en' as Locale, label: 'English', flag: 'US' },
                ]).map(({ locale: l, label, flag }) => (
                  <button
                    key={l}
                    className="no-drag-region"
                    type="button"
                    onClick={() => {
                      set_locale(l)
                      use_locale_store.getState().set_locale(l)
                      window.electron_api.config_set('ui:locale', l).catch(() => {})
                      set_show_lang_menu(false)
                    }}
                    style={{
                      width: '100%',
                      background: locale === l ? 'var(--ui_accent_light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--ui_radius_sm)',
                      padding: '7px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: locale === l ? 'var(--ui_accent)' : 'var(--ui_text)',
                      fontSize: '13px',
                      fontWeight: locale === l ? 600 : 400,
                      transition: 'all 0.15s',
                      textAlign: 'left' as const,
                    }}
                    onMouseEnter={(e) => { if (locale !== l) e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}
                    onMouseLeave={(e) => { if (locale !== l) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <span style={{ fontSize: '14px' }}>{flag === 'CN' ? '\uD83C\uDDE8\uD83C\uDDF3' : '\uD83C\uDDFA\uD83C\uDDF8'}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 登录主体 - 左右比例调整为 1:1.2，左略小右略大 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧品牌区 */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg, #0c4a6e 0%, #0369a1 40%, #0284c7 70%, #0ea5e9 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 动态光晕 */}
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 1s' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: '60%', left: '15%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite 0.5s' }} />
          <div style={{ position: 'absolute', bottom: '25%', left: '60%', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }} />

          {/* 左侧装饰线条 */}
          <div style={{ position: 'absolute', top: '30%', left: '8%', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeInLeft 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
            <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* 右侧装饰线条 */}
          <div style={{ position: 'absolute', top: '30%', right: '8%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', animation: 'fadeInRight 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
            <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* 品牌核心 */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {/* Logo */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '22px',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: logo_spinning ? (spin_direction === 'cw' ? 'logoSpinCW 3s linear infinite' : 'logoSpinCCW 3s linear infinite') : 'none',
              transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <img src="./kity.png" alt="TRAI" style={{ width: '52px', height: '52px', borderRadius: '8px' }} />
            </div>

            {/* 旋转状态指示 */}
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.6)',
              marginTop: '4px', padding: '4px 12px',
              borderRadius: '12px',
              background: logo_spinning ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${logo_spinning ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {logo_spinning ? `旋转中 ${spin_direction === 'cw' ? '>' : '<'}` : '点击任意位置旋转'}
            </div>

            {/* 品牌名 */}
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '0.15em', textShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>TRAI</div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.02em' }}>{t('your_ai_platform')}</div>
          </div>

          {/* 底部标签 */}
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', animation: 'fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
            {['DeepSeek', 'Claude', 'GPT-4'].map((m, i) => (
              <div key={m} style={{ padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)', animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.6 + i * 0.1}s both`, transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧表单区 - 更宽更大 */}
        <div style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', backgroundColor: 'var(--ui_panel)', overflow: 'auto' }}>

          <div style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: 'var(--ui_panel)',
            borderRadius: '20px',
            border: '1px solid var(--ui_border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
            overflow: 'hidden',
            animation: 'fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
          }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--ui_accent), #0ea5e9, #38bdf8)' }} />

            <div style={{ padding: '36px 32px' }}>
              <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
                <h2 style={{ color: 'var(--ui_text)', margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700 }}>{t('login_welcome')}</h2>
                <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '13px' }}>{t('login_subtitle')}</p>
              </div>

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 用户名 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('username')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={username} onChange={(e) => set_username(e.target.value)} autoComplete="username"
                      onFocus={() => set_active_input('username')}
                      onBlur={() => set_active_input(null)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                        border: `1.5px solid ${active_input === 'username' ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                        backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                        boxSizing: 'border-box', outline: 'none', fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        boxShadow: active_input === 'username' ? '0 0 0 3px var(--ui_accent_light)' : 'none',
                        transform: active_input === 'username' ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      placeholder={t('enter_username')} />
                    {active_input === 'username' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                  </div>
                </div>

                {/* 密码 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={password_visible ? 'text' : 'password'} value={password} onChange={(e) => set_password(e.target.value)} autoComplete="current-password"
                      onFocus={() => set_active_input('password')}
                      onBlur={() => set_active_input(null)}
                      style={{
                        width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px',
                        border: `1.5px solid ${active_input === 'password' ? 'var(--ui_accent)' : password_shake ? 'var(--ui_danger)' : 'var(--ui_border)'}`,
                        backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                        boxSizing: 'border-box', outline: 'none', fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        boxShadow: active_input === 'password' ? '0 0 0 3px var(--ui_accent_light)' : password_shake ? '0 0 0 3px var(--ui_danger_light)' : 'none',
                        transform: active_input === 'password' ? 'translateY(-1px)' : 'translateY(0)',
                        animation: password_shake ? 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both' : 'none',
                      }}
                      placeholder={t('enter_password')} />
                    {active_input === 'password' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                    <button type="button" onClick={() => set_password_visible((v) => !v)} style={{
                      position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer',
                      color: password_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s, transform 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = password_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}>
                      {password_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* 错误提示 */}
                {error_msg && (
                  <div style={{
                    color: 'var(--ui_danger)', fontSize: '12px', padding: '10px 12px',
                    backgroundColor: 'var(--ui_danger_light)', borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--ui_danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      !
                    </div>
                    {error_msg}
                  </div>
                )}

                {/* 记住我 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <div
                      onClick={() => set_remember_me((v) => !v)}
                      style={{
                        width: '36px', height: '20px', borderRadius: '10px',
                        backgroundColor: remember_me ? 'var(--ui_accent)' : 'var(--ui_border)',
                        position: 'relative', cursor: 'pointer',
                        transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: remember_me ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: remember_me ? '18px' : '2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }} />
                    </div>
                    <span style={{ color: 'var(--ui_text_secondary)', fontSize: '12px' }}>{t('save_login_state')}</span>
                  </label>
                </div>

                {/* 登录按钮 */}
                <button type="submit" disabled={is_logging_in}
                  style={{
                    background: is_logging_in ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
                    color: 'white', padding: '13px', borderRadius: '10px', border: 'none',
                    cursor: is_logging_in ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: is_logging_in ? 'none' : '0 4px 16px rgba(14,165,233,0.35)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.35s both',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!is_logging_in) {
                      e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'
                      e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.45)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!is_logging_in) {
                      e.currentTarget.style.backgroundColor = 'var(--ui_accent)'
                      e.currentTarget.style.transform = 'scale(1) translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.35)'
                    }
                  }}
                  onMouseDown={(e) => {
                    if (!is_logging_in) {
                      e.currentTarget.style.transform = 'scale(0.98) translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(14,165,233,0.25)'
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!is_logging_in) {
                      e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.45)'
                    }
                  }}
                >
                  {!is_logging_in && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 3s ease infinite',
                    }} />
                  )}
                  {is_logging_in ? <><div className="typing-dots"><span /><span /><span /></div>{t('signing_in')}</> : <><Sparkles size={15} />{t('login')}</>}
                </button>

                {/* 分隔线 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)' }}>{t('or')}</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
                </div>

                {/* 企业微信登录 */}
                <button type="button"
                  style={{
                    background: 'var(--ui_panel_alt)', color: 'var(--ui_accent)', padding: '12px',
                    borderRadius: '10px', border: '1.5px solid var(--ui_border)',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.45s both',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ui_accent)'
                    e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'
                    e.currentTarget.style.transform = 'scale(1.01) translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ui_border)'
                    e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99) translateY(0)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.01) translateY(-1px)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z" /></svg>
                  {t('wecom_login')}
                </button>

                {/* 注册链接 */}
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
                  <span style={{ color: 'var(--ui_text_muted)', fontSize: '12px' }}>{t('no_account')}{' '}</span>
                  <span onClick={() => navigate('/register')} style={{
                    color: 'var(--ui_accent)', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    paddingBottom: '2px',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                      e.currentTarget.style.color = 'var(--ui_accent_hover)'
                      e.currentTarget.style.letterSpacing = '0.5px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                      e.currentTarget.style.color = 'var(--ui_accent)'
                      e.currentTarget.style.letterSpacing = 'normal'
                    }}
                  >{t('register_here')}</span>
                </div>

                {/* 服务器配置链接 */}
                <div style={{
                  textAlign: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--ui_border)',
                  animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.55s both',
                }}>
                  <span
                    onClick={() => set_show_server_config(true)}
                    style={{
                      color: 'var(--ui_text_muted)', fontSize: '11px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--ui_accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--ui_text_muted)'
                    }}
                  >
                    <Server size={12} />
                    {t('server_config')}: <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{api_url}</span>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 服务器配置弹窗 */}
      {show_server_config && (
        <ServerConfigModal
          current_url={api_url}
          on_select={handle_server_select}
          on_close={() => set_show_server_config(false)}
          locale={locale}
        />
      )}
    </div>
  )
}

export default Login
