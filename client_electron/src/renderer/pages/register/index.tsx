/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 21:50:00
 * 描述: TRAI 桌面客户端注册页面，支持多语言、国际风格与深色主题
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import TitleBar from '@/components/layout/title_bar'
import { t } from '@/i18n'

const Register: React.FC = () => {
  const [username, set_username] = useState('')
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const [is_registering, set_is_registering] = useState(false)
  const navigate = useNavigate()

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !email || !password) {
      set_error_msg(t('empty_credentials'))
      return
    }

    if (password !== confirm_password) {
      set_error_msg(t('password_mismatch'))
      return
    }

    set_is_registering(true)
    set_error_msg('')

    try {
      const res = await window.electron_api.auth_register({ username, email, password })
      if (res.success) {
        navigate('/login')
      } else {
        set_error_msg(res.error || t('register_failed'))
      }
    } catch (err: unknown) {
      set_error_msg(String((err as Error)?.message || t('register_error')))
    } finally {
      set_is_registering(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{
          display: 'flex',
          width: '100%',
          maxWidth: '920px',
          minHeight: '560px',
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
              Create Your AI-Powered Account
            </p>
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
              <h2 style={{ color: 'var(--ui_text)', margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700 }}>{t('register')}</h2>
              <p style={{ color: 'var(--ui_text_muted)', margin: 0, fontSize: '14px' }}>
                Join us today. Start creating with AI.
              </p>
            </div>

            <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.22s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => set_email(e.target.value)}
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
                  placeholder={t('enter_email')}
                  autoComplete="email"
                />
              </div>

              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.26s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => set_password(e.target.value)}
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
                  placeholder={t('enter_password')}
                  autoComplete="new-password"
                />
              </div>

              <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                <label style={{ color: 'var(--ui_text_secondary)', display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  {t('confirm_password')}
                </label>
                <input
                  type="password"
                  value={confirm_password}
                  onChange={(e) => set_confirm_password(e.target.value)}
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
                  placeholder={t('reenter_password')}
                  autoComplete="new-password"
                />
              </div>

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

              <button
                type="submit"
                disabled={is_registering}
                style={{
                  background: is_registering ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: 'var(--ui_radius_md)',
                  border: 'none',
                  cursor: is_registering ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: is_registering ? 'none' : '0 4px 16px rgba(14, 165, 233, 0.35)',
                  animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.38s both',
                }}
                onMouseEnter={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent_hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(14, 165, 233, 0.45)' } }}
                onMouseLeave={(e) => { if (!is_registering) { e.currentTarget.style.backgroundColor = 'var(--ui_accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.35)' } }}
              >
                {is_registering ? (
                  <>
                    <div className="typing-dots">
                      <span /><span /><span />
                    </div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {t('register')}
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '4px', animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.46s both' }}>
                <span
                  style={{ color: 'var(--ui_accent)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onClick={() => navigate('/login')}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent_hover)'; e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_accent)'; e.currentTarget.style.textDecoration = 'none' }}
                >
                  {t('have_account')}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
