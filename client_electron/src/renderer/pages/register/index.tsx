/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 01:00:00
 * 描述: TRAI 桌面客户端注册页面，多语言、国际风格与深色主题
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import TitleBar from '@/components/layout/title_bar'
import { translate } from '@/i18n'

const Register: React.FC = () => {
  const [username, set_username] = useState('')
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const [is_registering, set_is_registering] = useState(false)
  const [pwd_visible, set_pwd_visible] = useState(false)
  const [confirm_pwd_visible, set_confirm_pwd_visible] = useState(false)
  const [logo_spinning, set_logo_spinning] = useState(false)
  const [spin_direction, set_spin_direction] = useState<'cw' | 'ccw'>('cw')
  const [active_input, set_active_input] = useState<string | null>(null)
  const [form_shake, set_form_shake] = useState(false)
  const navigate = useNavigate()

  const pwd_strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strength_labels = ['', '弱', '中等', '强']
  const strength_colors = ['', '#ef4444', '#f59e0b', '#22c55e']

  // 全局点击切换旋转
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input') || target.closest('form') || target.closest('button')) return
      set_spin_direction(() => Math.random() > 0.5 ? 'cw' : 'ccw')
      set_logo_spinning((v) => !v)
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      set_error_msg(translate('empty_credentials'))
      set_form_shake(true)
      setTimeout(() => set_form_shake(false), 600)
      return
    }
    if (password !== confirm_password) {
      set_error_msg(translate('password_mismatch'))
      set_form_shake(true)
      setTimeout(() => set_form_shake(false), 600)
      return
    }
    set_is_registering(true); set_error_msg('')
    try {
      const res = await window.electron_api.auth_register({ username, email, password })
      if (res.success) navigate('/login')
      else set_error_msg(res.error || translate('register_failed'))
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || translate('register_error')))
    } finally {
      set_is_registering(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_panel)', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧品牌区 */}
        <div style={{ flex: 1, background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* 动态光晕 */}
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradientranslate(circle, rgba(14,165,233,0.25) 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradientranslate(circle, rgba(56,189,248,0.2) 0%, transparent 70%)', animation: 'pulse 7s ease-in-out infinite 2s' }} />
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradientranslate(circle, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradientranslate(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 1s' }} />
          <div style={{ position: 'absolute', bottom: '30%', left: '20%', width: '70px', height: '70px', borderRadius: '50%', background: 'radial-gradientranslate(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', animation: 'float 7s ease-in-out infinite' }} />

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
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              animation: logo_spinning ? (spin_direction === 'cw' ? 'logoSpinCW 3s linear infinite' : 'logoSpinCCW 3s linear infinite') : 'none',
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

            <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '0.15em', textShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>TRAI</div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>Build Your AI-Powered Account</div>
          </div>

          {/* 底部标签 */}
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', animation: 'fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both' }}>
            {['DeepSeek', 'Claude', 'GPT-4'].map((m, i) => (
              <div key={m} style={{
                padding: '5px 14px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                color: 'white', fontSize: '12px', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.12)',
                animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.6 + i * 0.1}s both`,
                transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
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
            borderRadius: '20px', border: '1px solid var(--ui_border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
          }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--ui_accent), #0ea5e9, #38bdf8)' }} />
            <div style={{ padding: '36px 32px' }}>
              <div style={{ marginBottom: '28px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
                <h2 style={{ color: 'var(--ui_text)', margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700 }}>{translate('register')}</h2>
                <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '13px' }}>Join us today. Start creating with AI.</p>
              </div>

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 用户名 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{translate('username')}</label>
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
                      placeholder={translate('enter_username')} />
                    {active_input === 'username' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                  </div>
                </div>

                {/* 邮箱 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.22s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{translate('email')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type="email" value={email} onChange={(e) => set_email(e.target.value)} autoComplete="email"
                      onFocus={() => set_active_input('email')}
                      onBlur={() => set_active_input(null)}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                        border: `1.5px solid ${active_input === 'email' ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                        backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                        boxSizing: 'border-box', outline: 'none', fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        boxShadow: active_input === 'email' ? '0 0 0 3px var(--ui_accent_light)' : 'none',
                        transform: active_input === 'email' ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      placeholder={translate('enter_email')} />
                    {active_input === 'email' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                  </div>
                </div>

                {/* 密码 */}
                <div style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.24s both' }}>
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{translate('password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={pwd_visible ? 'text' : 'password'} value={password} onChange={(e) => set_password(e.target.value)} autoComplete="new-password"
                      onFocus={() => set_active_input('password')}
                      onBlur={() => set_active_input(null)}
                      style={{
                        width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px',
                        border: `1.5px solid ${active_input === 'password' ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                        backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                        boxSizing: 'border-box', outline: 'none', fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        boxShadow: active_input === 'password' ? '0 0 0 3px var(--ui_accent_light)' : 'none',
                        transform: active_input === 'password' ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      placeholder={translate('enter_password')} />
                    {active_input === 'password' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                    <button type="button" onClick={() => set_pwd_visible((v) => !v)} style={{
                      position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer',
                      color: pwd_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s, transform 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = pwd_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}>
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
                  <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 500 }}>{translate('confirm_password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={confirm_pwd_visible ? 'text' : 'password'} value={confirm_password} onChange={(e) => set_confirm_password(e.target.value)} autoComplete="new-password"
                      onFocus={() => set_active_input('confirm')}
                      onBlur={() => set_active_input(null)}
                      style={{
                        width: '100%', padding: '12px 44px 12px 14px', borderRadius: '10px',
                        border: `1.5px solid ${confirm_password && password !== confirm_password ? 'var(--ui_danger)' : active_input === 'confirm' ? 'var(--ui_accent)' : 'var(--ui_border)'}`,
                        backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)',
                        boxSizing: 'border-box', outline: 'none', fontSize: '14px',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        boxShadow: confirm_password && password !== confirm_password ? '0 0 0 3px var(--ui_danger_light)' : active_input === 'confirm' ? '0 0 0 3px var(--ui_accent_light)' : 'none',
                        transform: active_input === 'confirm' ? 'translateY(-1px)' : 'translateY(0)',
                      }}
                      placeholder={translate('reenter_password')} />
                    {active_input === 'confirm' && (
                      <div style={{ position: 'absolute', left: '14px', bottom: '-4px', width: '30px', height: '3px', borderRadius: '2px', background: 'var(--ui_accent)', animation: 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    )}
                    <button type="button" onClick={() => set_confirm_pwd_visible((v) => !v)} style={{
                      position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer',
                      color: confirm_pwd_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s, transform 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = confirm_pwd_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)' }}>
                      {confirm_pwd_visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {confirm_password && password !== confirm_password && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--ui_danger)', animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--ui_danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>!</div>
                      两次密码不一致
                    </div>
                  )}
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
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--ui_danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>!</div>
                    {error_msg}
                  </div>
                )}

                {/* 注册按钮 */}
                <button type="submit" disabled={is_registering}
                  style={{
                    background: is_registering ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
                    color: 'white', padding: '13px', borderRadius: '10px', border: 'none',
                    cursor: is_registering ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: is_registering ? 'none' : '0 4px 16px rgba(14,165,233,0.35)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.32s both',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.45)' } }}
                  onMouseLeave={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.35)' } }}
                  onMouseDown={(e) => { if (!is_registering) { e.currentTarget.style.transform = 'scale(0.98) translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(14,165,233,0.25)' } }}
                  onMouseUp={(e) => { if (!is_registering) { e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.45)' } }}
                >
                  {!is_registering && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 3s ease infinite',
                    }} />
                  )}
                  {is_registering ? (
                    <><div className="typing-dots"><span /><span /><span /></div>Creating...</>
                  ) : (
                    <><Sparkles size={15} />{translate('register')}</>
                  )}
                </button>

                {/* 登录链接 */}
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.38s both' }}>
                  <span style={{ color: 'var(--ui_text_muted)', fontSize: '12px' }}>Already have an account?{' '}</span>
                  <span onClick={() => navigate('/login')} style={{
                    color: 'var(--ui_accent)', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    paddingBottom: '2px',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = 'var(--ui_accent_hover)'; e.currentTarget.style.letterSpacing = '0.5px' }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.letterSpacing = 'normal' }}
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
