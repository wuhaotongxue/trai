/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 22:05:00
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
    gap: '16px',
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
      animation: 'fadeInScale 0.4s ease',
    }}>
      <img src="./kity.png" alt="TRAI" style={{ width: '36px', height: '36px' }} />
    </div>
    {/* 品牌名 */}
    <div style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ui_text)', letterSpacing: '0.1em' }}>TRAI</span>
    </div>
    {/* 加载指示器 */}
    <div style={{
      display: 'flex',
      gap: '6px',
      animation: 'fadeIn 0.4s ease 0.2s both',
    }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--ui_accent)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
    {/* 加载文字 */}
    <div style={{
      fontSize: '13px',
      color: 'var(--ui_text_muted)',
      animation: 'fadeIn 0.4s ease 0.3s both',
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
