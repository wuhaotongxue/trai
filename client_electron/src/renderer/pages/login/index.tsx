/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:35:00
 * 描述: TRAI 桌面客户端登录页面，多语言、国际风格与深色主题
 */
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText, RotateCw, Sparkles, Shield, Zap, Database, Image, Code2, MessageSquare, ArrowRight } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { use_log_store } from '@/store/log'
import TitleBar from '@/components/layout/title_bar'
import { t, current_locale_store } from '@/i18n'

const FEATURES = [
  { icon: <MessageSquare size={18} />, en: 'AI Agents', zh: 'AI 智能助手', desc: '多模型对话支持' },
  { icon: <Zap size={18} />, en: 'Real-time Thinking', zh: '实时思维链', desc: '展示推理过程' },
  { icon: <Database size={18} />, en: 'Knowledge Base', zh: '知识库管理', desc: '文档上传检索' },
  { icon: <Code2 size={18} />, en: 'Code Assistant', zh: '代码助手', desc: '多语言代码生成' },
  { icon: <Image size={18} />, en: 'Image Generation', zh: '图片生成', desc: '文生图创作' },
  { icon: <Shield size={18} />, en: 'Multi-modal', zh: '多模态处理', desc: '音视频字幕' },
]

const Login: React.FC = () => {
  const [username, set_username] = useState('wuhao')
  const [password, set_password] = useState('Tr@@2026...')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('https://trai.tuoren.com')
  const [api_loading, set_api_loading] = useState(true)
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
          if (rm_res.success) set_remember_me(rm_res.data)
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
    return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://${raw}`
  }, [api_url])

  const save_api_url = useCallback(async () => {
    if (!normalized_api_url) { set_error_msg('Server address cannot be empty'); return }
    try {
      const res = await window.electron_api.config_set('api_url', normalized_api_url)
      if (!res.success) { set_error_msg(res.error || 'Failed to save'); return }
      set_api_url(normalized_api_url)
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || 'Failed'))
    }
  }, [normalized_api_url])

  const do_login = useCallback(async (u: string, p: string) => {
    add_log(`Login: ${u} @ ${normalized_api_url}`)
    if (!api_loading) await save_api_url()
    const res = await window.electron_api.auth_login({ username: u, password: p })
    add_log(`Response: ${JSON.stringify(res, null, 2)}`)
    if (res.success && res.data) {
      await window.electron_api.config_set('remember_me', remember_me)
      const user_info = res.data.user
      login({ username: user_info.username || u, email: user_info.email || `${u}@trai.local`, role: user_info.role || 'user' })
      navigate('/')
    } else {
      const raw = String(res.error || '')
      add_log(`Failed: ${raw}`)
      if (raw.includes('401') || raw.includes('密码错误')) set_error_msg(t('password_error'))
        else set_error_msg(raw || t('login_error'))
    }
  }, [api_loading, normalized_api_url, remember_me, save_api_url, add_log, login, navigate])

  const handle_submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - last_submit_time.current < 1000) { add_log('Throttled'); return }
    last_submit_time.current = now
    if (!username || !password) { set_error_msg(t('empty_credentials')); return }
    set_is_logging_in(true)
    set_error_msg('')
    try { await do_login(username, password) }
    catch (err: unknown) { set_error_msg(String((err as Error)?.message || t('login_error'))) }
    finally { set_is_logging_in(false) }
  }, [username, password, do_login])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      {/* 标题栏 */}
      <div className="drag-region" style={{ height: 'var(--titlebar_height)', width: '100%', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '8px', fontSize: '12px', color: 'var(--ui_text)', boxSizing: 'border-box', borderBottom: '1px solid var(--ui_border)', position: 'relative', zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>TRAI</span>
          <button className="no-drag-region" type="button" title="Refresh" onClick={() => window.location.reload()} style={{ background: 'transparent', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ui_text_secondary)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}>
            <RotateCw size={14} />
          </button>
          <div style={{ position: 'relative' }}>
            <button className="no-drag-region" type="button" title={show_logs ? t('hide_logs') : t('show_logs')} onClick={() => set_show_logs(!show_logs)} style={{ background: show_logs ? 'var(--ui_accent_light)' : 'transparent', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: show_logs ? 'var(--ui_accent)' : 'var(--ui_text_secondary)', transition: 'all 0.2s' }}>
              <FileText size={14} />
            </button>
            {show_logs && (
              <div ref={log_card_ref} className="no-drag-region" style={{ position: 'absolute', top: '40px', left: '0', width: '400px', maxWidth: '90vw', maxHeight: '300px', backgroundColor: 'var(--ui_panel)', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_lg)', boxShadow: 'var(--ui_shadow_lg)', padding: '12px', overflow: 'auto', zIndex: 1000, animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>{t('system_logs')}</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[{ label: t('refresh'), a: () => window.location.reload() }, { label: t('clear'), a: clear_logs }, { label: t('close'), a: () => set_show_logs(false) }].map(({ label, a }) => (
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
        </div>
      </div>

      {/* 登录主体 */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '860px', minHeight: '520px', backgroundColor: 'var(--ui_panel)', borderRadius: 'var(--ui_radius_xl)', border: '1px solid var(--ui_border)', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', overflow: 'hidden', animation: 'pageLoadIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>

          {/* 左侧品牌 + 功能区 */}
          <div style={{ flex: 1, background: 'linear-gradient(145deg, var(--ui_accent) 0%, #0284c7 50%, #0369a1 100%)', display: 'flex', flexDirection: 'column', padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
            {/* 装饰圆 */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', animation: 'float 6s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'float 8s ease-in-out infinite reverse' }} />
            <div style={{ position: 'absolute', top: '40%', left: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animation: 'float 7s ease-in-out infinite 1s' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '-20px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', animation: 'float 9s ease-in-out infinite 2s' }} />

            {/* 品牌 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'subtleBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}>
                <img src="./kity.png" alt="TRAI" style={{ width: '28px', height: '28px' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '0.1em', textShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>TRAI</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{t('your_ai_platform')}</div>
              </div>
            </div>

            {/* 功能特性列表 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 1 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', cursor: 'default', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.15 + i * 0.07}s both` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateX(0)' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.9)', flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{f.en}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{f.zh}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{f.desc}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                </div>
              ))}
            </div>

            {/* 底部 */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '16px', position: 'relative', zIndex: 1 }}>
              {['DeepSeek', 'Claude', 'GPT-4'].map((m, i) => (
                <div key={m} style={{ padding: '4px 10px', borderRadius: '16px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', color: 'white', fontSize: '11px', fontWeight: 500, animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.55 + i * 0.08}s both`, transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* 右侧表单 */}
          <div style={{ flex: 0.9, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 36px', minWidth: 0 }}>
            <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.05s both' }}>
              <h2 style={{ color: 'var(--ui_text)', margin: '0 0 4px 0', fontSize: '22px', fontWeight: 700 }}>{t('login_welcome')}</h2>
              <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '13px' }}>{t('login_subtitle')}</p>
            </div>

            <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 500 }}>{t('username')}</label>
                <input type="text" value={username} onChange={(e) => set_username(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--ui_radius_md)', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)'; e.target.style.transform = 'translateY(-1px)' }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)' }}
                  placeholder={t('enter_username')} autoComplete="username" />
              </div>

              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 500 }}>{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <input type={password_visible ? 'text' : 'password'} value={password} onChange={(e) => set_password(e.target.value)}
                    style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: 'var(--ui_radius_md)', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)'; e.target.style.transform = 'translateY(-1px)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none'; e.target.style.transform = 'translateY(0)' }}
                    placeholder={t('enter_password')} autoComplete="current-password" />
                  <button type="button" onClick={() => set_password_visible((v) => !v)} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--ui_text_muted)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)' }}>
                    {password_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error_msg && (
                <div style={{ color: 'var(--ui_danger)', fontSize: '12px', padding: '9px 12px', backgroundColor: 'var(--ui_danger_light)', borderRadius: 'var(--ui_radius_md)', border: '1px solid rgba(239,68,68,0.2)', lineHeight: 1.5, animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  {error_msg}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                <input type="checkbox" id="remember_me" checked={remember_me} onChange={(e) => set_remember_me(e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--ui_accent)' }} />
                <label htmlFor="remember_me" style={{ color: 'var(--ui_text_secondary)', fontSize: '12px', cursor: 'pointer' }}>{t('save_login_state')}</label>
              </div>

              <button type="submit" disabled={is_logging_in}
                style={{ background: is_logging_in ? 'var(--ui_text_muted)' : 'var(--ui_accent)', color: 'white', padding: '12px', borderRadius: 'var(--ui_radius_md)', border: 'none', cursor: is_logging_in ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: is_logging_in ? 'none' : '0 4px 16px rgba(14,165,233,0.35)', transition: 'all 0.25s', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both' }}
                onMouseEnter={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14,165,233,0.45)' } }}
                onMouseLeave={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.35)' } }}
              >
                {is_logging_in ? <><div className="typing-dots"><span /><span /><span /></div>{t('signing_in')}</> : <><Sparkles size={15} />{t('login')}</>}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)' }}>{t('or')}</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--ui_border)' }} />
              </div>

              <button type="button"
                style={{ background: 'var(--ui_panel)', color: 'var(--ui_accent)', padding: '12px', borderRadius: 'var(--ui_radius_md)', border: '1.5px solid var(--ui_accent)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.25s', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.35s both' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z" /></svg>
                {t('wecom_login')}
              </button>

              <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both' }}>
                <span style={{ color: 'var(--ui_text_muted)', fontSize: '12px' }}>{t('no_account')}{' '}</span>
                <span onClick={() => navigate('/register')} style={{ color: 'var(--ui_accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                >{t('register_here')}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
