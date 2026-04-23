/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 01:00:00
 * 描述: TRAI 桌面客户端注册页面，多语言、国际风格与深色主题
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import TitleBar from '@/components/layout/title_bar'
import { t } from '@/i18n'

const Register: React.FC = () => {
  const [username, set_username] = useState('')
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const [is_registering, set_is_registering] = useState(false)
  const [pwd_visible, set_pwd_visible] = useState(false)
  const [confirm_pwd_visible, set_confirm_pwd_visible] = useState(false)
  const navigate = useNavigate()

  const pwd_strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strength_labels = ['', '弱', '中等', '强']
  const strength_colors = ['', '#ef4444', '#f59e0b', '#22c55e']

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) { set_error_msg(t('empty_credentials')); return }
    if (password !== confirm_password) { set_error_msg(t('password_mismatch')); return }
    set_is_registering(true); set_error_msg('')
    try {
      const res = await window.electron_api.auth_register({ username, email, password })
      if (res.success) navigate('/login')
      else set_error_msg(res.error || t('register_failed'))
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || t('register_error')))
    } finally {
      set_is_registering(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧品牌区 */}
        <div style={{ flex: 1, background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', animation: 'pulse 7s ease-in-out infinite 2s' }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '22px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <img src="./kity.png" alt="TRAI" style={{ width: '52px', height: '52px' }} />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '0.15em', textShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>TRAI</div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>Build Your AI-Powered Account</div>
          </div>

          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', animation: 'fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
            {['DeepSeek', 'Claude', 'GPT-4'].map((m, i) => (
              <div key={m} style={{ padding: '5px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.12)', animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.6 + i * 0.1}s both`, transition: 'transform 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧表单区 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', backgroundColor: 'var(--ui_bg)', overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--ui_panel)', borderRadius: '20px', border: '1px solid var(--ui_border)', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--ui_accent), #0ea5e9, #38bdf8)' }} />
            <div style={{ padding: '32px 28px' }}>
              <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
                <h2 style={{ color: 'var(--ui_text)', margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700 }}>{t('register')}</h2>
                <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '13px' }}>Join us today. Start creating with AI.</p>
              </div>

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 用户名 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('username')}</label>
                  <input type="text" value={username} onChange={(e) => set_username(e.target.value)} autoComplete="username"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                    placeholder={t('enter_username')} />
                </div>

                {/* 邮箱 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.22s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => set_email(e.target.value)} autoComplete="email"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                    placeholder={t('enter_email')} />
                </div>

                {/* 密码 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.24s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={pwd_visible ? 'text' : 'password'} value={password} onChange={(e) => set_password(e.target.value)} autoComplete="new-password"
                      style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px', border: '1.5px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                      placeholder={t('enter_password')} />
                    <button type="button" onClick={() => set_pwd_visible((v) => !v)} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--ui_text_muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)' }}>
                      {pwd_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                        {[1, 2, 3].map(level => (
                          <div key={level} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: level <= pwd_strength ? strength_colors[pwd_strength] : 'var(--ui_border)', transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: strength_colors[pwd_strength], fontWeight: 500 }}>{strength_labels[pwd_strength]}</span>
                    </div>
                  )}
                </div>

                {/* 确认密码 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.26s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{t('confirm_password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={confirm_pwd_visible ? 'text' : 'password'} value={confirm_password} onChange={(e) => set_confirm_password(e.target.value)} autoComplete="new-password"
                      style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px', border: `1.5px solid ${confirm_password && password !== confirm_password ? 'var(--ui_danger)' : 'var(--ui_border)'}`, backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px var(--ui_accent_light)' }}
                      onBlur={(e) => { e.target.style.borderColor = confirm_password && password !== confirm_password ? 'var(--ui_danger)' : 'var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                      placeholder={t('reenter_password')} />
                    <button type="button" onClick={() => set_confirm_pwd_visible((v) => !v)} style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--ui_text_muted)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)' }}>
                      {confirm_pwd_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirm_password && password !== confirm_password && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--ui_danger)', animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>两次密码不一致</div>
                  )}
                </div>

                {/* 错误提示 */}
                {error_msg && (
                  <div style={{ color: 'var(--ui_danger)', fontSize: '12px', padding: '10px 12px', backgroundColor: 'var(--ui_danger_light)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>!</span>
                    {error_msg}
                  </div>
                )}

                {/* 注册按钮 */}
                <button type="submit" disabled={is_registering}
                  style={{ background: is_registering ? 'var(--ui_text_muted)' : 'var(--ui_accent)', color: 'white', padding: '13px', borderRadius: '10px', border: 'none', cursor: is_registering ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: is_registering ? 'none' : '0 4px 16px rgba(14,165,233,0.35)', transition: 'all 0.25s', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.32s both' }}
                  onMouseEnter={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14,165,233,0.45)' } }}
                  onMouseLeave={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.35)' } }}
                  onMouseDown={(e) => { if (!is_registering) e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={(e) => { if (!is_registering) e.currentTarget.style.transform = 'scale(1.02)' }}
                >
                  {is_registering ? (
                    <><div className="typing-dots"><span /><span /><span /></div>Creating...</>
                  ) : (
                    <><Sparkles size={15} />{t('register')}</>
                  )}
                </button>

                {/* 登录链接 */}
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.38s both' }}>
                  <span style={{ color: 'var(--ui_text_muted)', fontSize: '12px' }}>Already have an account?{' '}</span>
                  <span onClick={() => navigate('/login')} style={{ color: 'var(--ui_accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                  >Sign In</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
