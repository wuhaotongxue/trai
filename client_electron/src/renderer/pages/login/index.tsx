/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 22:30:00
 * 描述: TRAI 桌面客户端登录页面，支持多语言、国际风格与深色主题
 */
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText, RotateCw, Sparkles } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { use_log_store } from '@/store/log'
import TitleBar from '@/components/layout/title_bar'
import { t, current_locale_store } from '@/i18n'

const Login: React.FC = () => {
  const [username, set_username] = useState('wuhao')
  const [password, set_password] = useState('Tr@@2026...')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('https://trai.tuoren.com')
  const [api_loading, set_api_loading] = useState(true)
  const [api_saving, set_api_saving] = useState(false)
  const [remember_me, set_remember_me] = useState(true)
  const [show_logs, set_show_logs] = useState(false)
  const [is_logging_in, set_is_logging_in] = useState(false)
  const [, force_update] = useState(0)
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)
  const { logs, add_log, clear_logs } = use_log_store()
  const log_card_ref = useRef<HTMLDivElement>(null)
  const last_submit_time = useRef(0)

  useEffect(() => {
    const unsubscribe = current_locale_store.subscribe(() => force_update((n) => n + 1))
    return unsubscribe
  }, [])

  useEffect(() => {
    const load_config = async () => {
      try {
        if (window.electron_api?.config_get) {
          const res = await window.electron_api.config_get('api_url', 'https://trai.tuoren.com')
          if (res.success && typeof res.data === 'string' && res.data.trim()) {
            set_api_url(res.data.trim())
          }
          const rm_res = await window.electron_api.config_get('remember_me', true)
          if (rm_res.success) {
            set_remember_me(rm_res.data)
          }
        }
      } finally {
        set_api_loading(false)
      }
    }
    void load_config()
  }, [])

  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(event.target as Node)) {
        set_show_logs(false)
      }
    }
    document.addEventListener('mousedown', handle_click_outside)
    return () => document.removeEventListener('mousedown', handle_click_outside)
  }, [])

  const normalized_api_url = useMemo(() => {
    const raw = api_url.trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return `http://${raw}`
  }, [api_url])

  const save_api_url = useCallback(async () => {
    const next = normalized_api_url
    if (!next) {
      set_error_msg('Server address cannot be empty')
      return
    }
    set_api_saving(true)
    try {
      const res = await window.electron_api.config_set('api_url', next)
      if (!res.success) {
        set_error_msg(res.error || 'Failed to save server address')
        return
      }
      set_api_url(next)
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || 'Failed to save'))
    } finally {
      set_api_saving(false)
    }
  }, [normalized_api_url])

  const handle_wecom_login = useCallback(async () => {
    add_log(t('start_wecom_login'))
    try {
      if (!api_loading) await save_api_url()
      const res = await window.electron_api.auth_wecom_login()
      add_log(`WeCom login response: ${JSON.stringify(res, null, 2)}`)
      if (res.success && res.data) {
        await window.electron_api.config_set('remember_me', remember_me)
        const user_info = res.data.user
        add_log(`Login success: ${user_info.username || 'wecom_user'}`)
        login({
          username: user_info.username || 'wecom_user',
          email: user_info.email || 'wecom_user@trai.local',
          role: user_info.role || 'user'
        })
        navigate('/')
      } else {
        const raw = String(res.error || '')
        add_log(`WeCom login failed: ${raw}`)
        set_error_msg(raw || t('wecom_login_failed'))
      }
    } catch (err: unknown) {
      const raw = String((err as Error)?.message || '')
      add_log(`WeCom login error: ${raw}`)
      set_error_msg(raw || t('wecom_login_error'))
    }
  }, [api_loading, remember_me, save_api_url, add_log, login, navigate])

  const handle_submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - last_submit_time.current < 1000) {
      add_log('Action too frequent, blocked')
      return
    }
    last_submit_time.current = now

    if (!username || !password) {
      set_error_msg(t('empty_credentials'))
      add_log('Error: Username and password required')
      return
    }

    add_log(`Login attempt: username=${username}`)
    add_log(`Server: ${normalized_api_url}`)

    try {
      if (!api_loading) {
        add_log('Saving server address...')
        await save_api_url()
      }
      set_is_logging_in(true)
      add_log('Calling login API...')
      const res = await window.electron_api.auth_login({ username, password })
      add_log(`Response: ${JSON.stringify(res, null, 2)}`)
      if (res.success && res.data) {
        await window.electron_api.config_set('remember_me', remember_me)
        const user_info = res.data.user
        add_log(`Login success: ${user_info.username || username}`)
        login({
          username: user_info.username || username,
          email: user_info.email || `${username}@trai.local`,
          role: user_info.role || 'user'
        })
        navigate('/')
      } else {
        const raw = String(res.error || '')
        add_log(`Login failed: ${raw}`)
        if (raw.includes('401') || raw.includes('密码错误') || raw.includes('wrong')) {
          set_error_msg(t('password_error'))
        } else {
          set_error_msg(raw || t('login_failed'))
        }
      }
    } catch (err: unknown) {
      const raw = String((err as Error)?.message || '')
      add_log(`Login error: ${raw}`)
      if (raw.includes('401')) {
        set_error_msg(t('password_error'))
      } else {
        set_error_msg(raw || t('login_error'))
      }
    } finally {
      set_is_logging_in(false)
    }
  }, [username, password, api_loading, normalized_api_url, remember_me, save_api_url, add_log, login, navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      {/* 标题栏 */}
      <div
        className="drag-region"
        style={{
          height: 'var(--titlebar_height)',
          width: '100%',
          backgroundColor: 'var(--ui_panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '8px',
          fontSize: '12px',
          color: 'var(--ui_text)',
          boxSizing: 'border-box',
          borderBottom: '1px solid var(--ui_border)',
          position: 'relative',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>TRAI</span>
          <button
            className="no-drag-region"
            type="button"
            title="Refresh"
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid var(--ui_border)',
              borderRadius: 'var(--ui_radius_sm)',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ui_text_secondary)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <RotateCw size={14} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="no-drag-region"
              type="button"
              title={show_logs ? t('hide_logs') : t('show_logs')}
              onClick={() => set_show_logs(!show_logs)}
              style={{
                background: 'transparent',
                border: '1px solid var(--ui_border)',
                borderRadius: 'var(--ui_radius_sm)',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ui_text_secondary)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <FileText size={14} />
            </button>
            {show_logs && (
              <div
                ref={log_card_ref}
                className="no-drag-region"
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '0',
                  width: '400px',
                  maxWidth: '90vw',
                  maxHeight: '300px',
                  backgroundColor: 'var(--ui_panel)',
                  border: '1px solid var(--ui_border)',
                  borderRadius: 'var(--ui_radius_lg)',
                  boxShadow: 'var(--ui_shadow_lg)',
                  padding: '12px',
                  overflow: 'auto',
                  zIndex: 1000,
                  animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '4px 8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>{t('system_logs')}</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { label: t('refresh'), action: () => window.location.reload() },
                      { label: t('clear'), action: clear_logs },
                      { label: t('close'), action: () => set_show_logs(false) }
                    ].map(({ label, action }) => (
                      <button
                        key={label}
                        className="no-drag-region"
                        type="button"
                        onClick={action}
                        style={{
                          background: 'var(--ui_panel_hover)',
                          border: '1px solid var(--ui_border)',
                          borderRadius: 'var(--ui_radius_sm)',
                          padding: '2px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--ui_text_secondary)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_active)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: '0 8px', color: 'var(--ui_text_secondary)' }}>
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{log}</div>
                  )) : (
                    <div style={{ color: 'var(--ui_text_muted)' }}>{t('no_logs')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 登录区域 */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          display: 'flex',
          width: '100%',
          maxWidth: '920px',
          minHeight: '520px',
          backgroundColor: 'var(--ui_panel)',
          borderRadius: 'var(--ui_radius_xl)',
          border: '1px solid var(--ui_border)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          animation: 'pageLoadIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* 左侧品牌展示区 */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, var(--ui_accent) 0%, #0284c7 50%, #0369a1 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* 背景装饰圆 - 动态浮动 */}
            <div style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              animation: 'float 6s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              animation: 'float 8s ease-in-out infinite reverse',
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            }} />
            {/* 第三装饰圆 */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              animation: 'float 7s ease-in-out infinite 1s',
            }} />

            {/* 品牌图标 */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              position: 'relative',
              zIndex: 1,
              animation: 'subtleBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
            }}>
              <img src="./kity.png" alt="TRAI" style={{ width: '44px', height: '44px' }} />
            </div>

            <h1 style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'white',
              marginBottom: '12px',
              letterSpacing: '0.08em',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both',
            }}>TRAI</h1>

            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              lineHeight: '1.6',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both',
            }}>
              Your AI-Powered Intelligent Platform
            </p>

            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '32px',
              position: 'relative',
              zIndex: 1,
              animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.35s both',
            }}>
              {['DeepSeek', 'Claude', 'GPT-4'].map((model, i) => (
                <div key={model} style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  animation: `fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${0.4 + i * 0.08}s both`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {model}
                </div>
              ))}
            </div>
          </div>

          {/* 右侧表单区 */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 44px',
            minWidth: 0,
          }}>
            <div style={{ marginBottom: '32px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
              <h2 style={{ color: 'var(--ui_text)', margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700 }}>{t('login')}</h2>
              <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '14px' }}>
                Welcome back. Please sign in to continue.
              </p>
            </div>

            <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 用户名 */}
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.18s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => set_username(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--ui_radius_md)',
                    border: '1px solid var(--ui_border)',
                    backgroundColor: 'var(--ui_panel)',
                    color: 'var(--ui_text)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontSize: '14px',
                    transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)'; e.target.style.transform = 'translateY(-1px)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)' }}
                  placeholder={t('enter_username')}
                  autoComplete="username"
                />
              </div>

              {/* 密码 */}
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.26s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  {t('password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={password_visible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => set_password(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 42px 11px 14px',
                      borderRadius: 'var(--ui_radius_md)',
                      border: '1px solid var(--ui_border)',
                      backgroundColor: 'var(--ui_panel)',
                      color: 'var(--ui_text)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontSize: '14px',
                      transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)'; e.target.style.transform = 'translateY(-1px)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)' }}
                    placeholder={t('enter_password')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => set_password_visible((v) => !v)}
                    title={password_visible ? 'Hide' : 'Show'}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: 'var(--ui_text_muted)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}
                  >
                    {password_visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error_msg && (
                <div style={{
                  color: 'var(--ui_danger)',
                  fontSize: '13px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--ui_danger_light)',
                  borderRadius: 'var(--ui_radius_md)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  lineHeight: '1.5',
                  animation: 'fadeInUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  {error_msg}
                </div>
              )}

              {/* 记住我 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.34s both' }}>
                <input
                  type="checkbox"
                  id="remember_me"
                  checked={remember_me}
                  onChange={(e) => set_remember_me(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--ui_accent)',
                    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onChangeCapture={(e) => { (e.target as HTMLInputElement).style.transform = 'scale(1.1)' }}
                  onMouseUp={(e) => { (e.target as HTMLInputElement).style.transform = 'scale(1)' }}
                />
                <label htmlFor="remember_me" style={{ color: 'var(--ui_text_secondary)', fontSize: '13px', cursor: 'pointer' }}>
                  {t('save_login_state')}
                </label>
              </div>

              {/* 主登录按钮 */}
              <button
                type="submit"
                disabled={is_logging_in}
                style={{
                  background: is_logging_in ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: 'var(--ui_radius_md)',
                  border: 'none',
                  cursor: is_logging_in ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: is_logging_in ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.35)',
                  animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.42s both',
                }}
                onMouseEnter={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14, 165, 233, 0.45)' } }}
                onMouseLeave={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.35)' } }}
              >
                {is_logging_in ? (
                  <>
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {t('login')}
                  </>
                )}
              </button>

              {/* 分隔线 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0', animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
                <span style={{ fontSize: '12px', color: 'var(--ui_text_muted)' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
              </div>

              {/* 企业微信登录 */}
              <button
                type="button"
                onClick={handle_wecom_login}
                style={{
                  background: 'var(--ui_panel)',
                  color: 'var(--ui_accent)',
                  padding: '12px',
                  borderRadius: 'var(--ui_radius_md)',
                  border: '1.5px solid var(--ui_accent)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.58s both',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.022-.12-.038-.173l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.405-.01-.815-.018-1.229-.018l.008.006zm-2.897 3.09c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.857 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
                {t('wecom_login')}
              </button>

              {/* 注册链接 */}
              <div style={{ textAlign: 'center', marginTop: '4px', animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.66s both' }}>
                <span
                  style={{ color: 'var(--ui_accent)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onClick={() => navigate('/register')}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent_hover)'; e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.textDecoration = 'none' }}
                >
                  {t('no_account')}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
