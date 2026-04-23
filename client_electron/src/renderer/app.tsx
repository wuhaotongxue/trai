/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:10:00
 * 描述: TRAI 桌面客户端根组件，负责初始化配置与自动登录
 */
import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { setup_axios_interceptors } from './utils/axios_interceptor'
import { use_auth_store } from './store/auth'
import { t } from './i18n'

const LoadingScreen: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--ui_bg)',
    gap: '20px',
  }}>
    {/* Logo */}
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, var(--ui_accent), #0284c7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
      animation: 'fadeInScale 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <img src="./kity.png" alt="TRAI" style={{ width: '36px', height: '36px' }} />
    </div>
    {/* Brand */}
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ui_text)', letterSpacing: '0.15em' }}>TRAI</span>
    </div>
    {/* Progress bar */}
    <div style={{
      width: '120px',
      height: '3px',
      backgroundColor: 'var(--ui_border)',
      borderRadius: '2px',
      overflow: 'hidden',
      animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
    }}>
      <div style={{
        height: '100%',
        backgroundColor: 'var(--ui_accent)',
        borderRadius: '2px',
        animation: 'loadingProgress 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }} />
    </div>
    {/* Loading text */}
    <div style={{
      fontSize: '13px',
      color: 'var(--ui_text_muted)',
      animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
    }}>
      {t('loading')}
    </div>
  </div>
)

const App: React.FC = () => {
  const [initializing, set_initializing] = useState(true)
  const login = use_auth_store((state) => state.login)

  useEffect(() => {
    setup_axios_interceptors()

    const check_auto_login = async () => {
      try {
        if (!window.electron_api) {
          console.warn('Not in Electron environment, skipping auto login')
          set_initializing(false)
          return
        }

        const res = await window.electron_api.config_get('remember_me', true)
        const remember_me = res.data !== false

        if (remember_me) {
          const me_res = await window.electron_api.auth_me()
          if (me_res.success && me_res.data) {
            const user_data = me_res.data.user || me_res.data
            login({
              username: user_data.username || 'user',
              email: user_data.email || 'user@trai.local',
              role: user_data.role || 'user'
            })
          }
        }
      } catch (err) {
        console.error('Auto login failed', err)
      } finally {
        set_initializing(false)
      }
    }

    void check_auto_login()
  }, [login])

  if (initializing) {
    return <LoadingScreen />
  }

  return <RouterProvider router={router} />
}

export default App
