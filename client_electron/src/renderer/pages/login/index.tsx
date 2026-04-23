/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 01:00:00
 * 描述: TRAI 桌面客户端登录页面，多语言、国际风格与深色主题
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
    const handler = (e: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(e.target as Node)) set_show_logs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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

  const do_login = useCallback(async (u: string, p: string) => {
    add_log(`Login: ${u} @ ${normalized_api_url}`)
    if (!api_loading) await save_api_url()
    const res = await window.electron_api.auth_login({ username: u, password: p })
    if (res.success && res.data) {
      await window.electron_api.config_set('remember_me', remember_me)
      const user_info = res.data.user
      login({ username: user_info.username || u, email: user_info.email || `${u}@trai.local`, role: user_info.role || 'user' })
      navigate('/')
    } else {
      const raw = String(res.error || '')
      if (raw.includes('401') || raw.includes('密码错误')) set_error_msg(t('password_error'))
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      {/* 标题栏 */}
      <div className="drag-region" style={{ height: 'var(--titlebar_height)', width: '100%', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '8px', borderBottom: '1px solid var(--ui_border)', position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ui_text)' }}>TRAI</span>
          <button className="no-drag-region" type="button" onClick={() => window.location.reload()} style={{ background: 'transparent', border: '1px solid var(--ui_border)', borderRadius: 'var(--ui_radius_sm)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ui_text_secondary)', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_secondary)' }}>
            <RotateCw size={14} />
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
        </div>
      </div>

      {/* 登录主体 - 全屏两栏 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧品牌区 - 精简优雅，留白充足 */}
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

          {/* 品牌核心 */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {/* Logo */}
            <div style={{ width: '88px', height: '88px', borderRadius: '22px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <img src="./kity.png" alt="TRAI" style={{ width: '52px', height: '52px' }} />
            </div>
            {/* 品牌名 */}
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '0.15em', textShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>TRAI</div>
            {/* 标语 */}
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.02em' }}>{t('your_ai_platform')}</div>
          </div>

          {/* 底部装饰线 */}
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', animation: 'fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
            {['DeepSeek', 'Claude', 'GPT-4'].map((m, i) => (
              <div key={m} style={{ padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.15)', animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.6 + i * 0.1}s both`, transition: 'transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧表单区 - 居中卡片，有视觉重量 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', backgroundColor: 'var(--ui_bg)', overflow: 'auto' }}>

          {/* 表单卡片 */}
          <div style={{
            width: '100%', maxWidth: '400px',
            backgroundColor: 'var(--ui_panel)',
            borderRadius: '20px',
            border: '1px solid var(--ui_border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
            overflow: 'hidden',
            animation: 'fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
          }}>
            {/* 卡片顶部强调条 */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--ui_accent), #0ea5e9, #38bdf8)' }} />

            <div style={{ padding: '32px 28px' }}>
              {/* 标题 */}
              <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
                <h2 style={{ color: 'var(--ui_text)', margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700 }}>{t('login_welcome')}</h2>
                <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '13px' }}>{t('login_subtitle')}</p>
              </div>

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 用户名 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('username')}</label>
                  <input type="text" value={username} onChange={(e) => set_username(e.target.value)} autoComplete="username"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                    placeholder={t('enter_username')} />
                </div>

                {/* 密码 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={password_visible ? 'text' : 'password'} value={password} onChange={(e) => set_password(e.target.value)} autoComplete="current-password"
                      style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                      placeholder={t('enter_password')} />
                    <button type="button" onClick={() => set_password_visible((v) => !v)} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--ui_text_muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)' }}>
                      {password_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* 错误提示 */}
                {error_msg && (
                  <div style={{ color: 'var(--ui_danger)', fontSize: '12px', padding: '10px 12px', backgroundColor: 'var(--ui_danger_light)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>!</span>
                    {error_msg}
                  </div>
                )}

                {/* 记住我 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                  <input type="checkbox" id="remember_me" checked={remember_me} onChange={(e) => set_remember_me(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--ui_accent)' }} />
                  <label htmlFor="remember_me" style={{ color: 'var(--ui_text_secondary)', fontSize: '12px', cursor: 'pointer' }}>{t('save_login_state')}</label>
                </div>

                {/* 登录按钮 */}
                <button type="submit" disabled={is_logging_in}
                  style={{ background: is_logging_in ? 'var(--ui_text_muted)' : 'var(--ui_accent)', color: 'white', padding: '13px', borderRadius: '10px', border: 'none', cursor: is_logging_in ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: is_logging_in ? 'none' : '0 4px 16px rgba(14,165,233,0.35)', transition: 'all 0.25s', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.35s both', transform: is_logging_in ? 'scale(1)' : 'scale(1)' }}
                  onMouseEnter={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14,165,233,0.45)' } }}
                  onMouseLeave={(e) => { if (!is_logging_in) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.35)' } }}
                  onMouseDown={(e) => { if (!is_logging_in) e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { if (!is_logging_in) e.currentTarget.style.transform = 'scale(1.02)' }}
                >
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
                  style={{ background: 'var(--ui_panel_alt)', color: 'var(--ui_accent)', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.45s both' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ui_accent)'; e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'; e.currentTarget.style.transform = 'scale(1.01)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ui_border)'; e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'; e.currentTarget.style.transform = 'scale(1)' }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)' }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.01)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z" /></svg>
                  {t('wecom_login')}
                </button>

                {/* 注册链接 */}
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
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
    </div>
  )
}

export default Login
