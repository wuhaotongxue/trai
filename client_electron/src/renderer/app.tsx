/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:10:00
 * 描述: TRAI 桌面客户端根组件，包含初始化逻辑与路由管理
 */
import React, { useEffect, useState, useRef } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/index'
import { setup_axios_interceptors, init_api_base_url } from './utils/axios_interceptor'
import { use_auth_store } from './store/auth'
import { use_locale_store } from './store/locale'
import { t } from './i18n'

// 语言切换动画
const GlobalTransition: React.FC<{ is_transitioning: boolean }> = ({ is_transitioning }) => {
  const [opacity, set_opacity] = useState(0)

  useEffect(() => {
    if (is_transitioning) {
      set_opacity(0)
    } else {
      requestAnimationFrame(() => set_opacity(1))
    }
  }, [is_transitioning])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--ui_bg)',
        opacity,
        pointerEvents: is_transitioning ? 'all' : 'none',
        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999,
        display: is_transitioning ? 'block' : 'none',
      }}
    />
  )
}

const App: React.FC = () => {
  const [initializing, set_initializing] = useState(true)
  const [is_locale_transitioning, set_is_locale_transitioning] = useState(false)
  const login = use_auth_store((state) => state.login)
  const logout = use_auth_store((state) => state.logout)
  const locale = use_locale_store((state) => state.locale)
  const prev_locale_ref = useRef<string>('')
  const init_ref = useRef(false)

  // 监听需要登录事件
  useEffect(() => {
    if (!window.electron_api?.on) {
      return
    }

    const cleanup = window.electron_api.on('auth:need-login', () => {
      logout()
      window.electron_api.config_set('access_token', null).catch(() => {})
      window.electron_api.config_set('refresh_token', null).catch(() => {})
      window.location.hash = '#/login'
    })

    return cleanup
  }, [logout])

  // 语言切换动画
  useEffect(() => {
    if (prev_locale_ref.current && prev_locale_ref.current !== locale) {
      set_is_locale_transitioning(true)
      setTimeout(() => {
        set_is_locale_transitioning(false)
      }, 250)
    }
    prev_locale_ref.current = locale
  }, [locale])

  useEffect(() => {
    // 初始化
    if (init_ref.current) return
    init_ref.current = true

    // 先初始化 API 地址，再设置拦截器
    init_api_base_url().then(() => {
      setup_axios_interceptors()
    })

    const check_auto_login = async () => {
      try {
        if (!window.electron_api) {
          set_initializing(false)
          return
        }

        // 检查 access token 和 refresh token
        const token_res = await window.electron_api.config_get('access_token', null)
        const has_token = token_res.data != null

        if (!has_token) {
          set_initializing(false)
          return
        }

        // 有 token 则验证
        try {
          const me_res = await window.electron_api.auth_me()
          if (me_res.success && me_res.data) {
            const user_data = me_res.data.user || me_res.data
            login({
              username: user_data.username || 'user',
              email: user_data.email || 'user@trai.local',
              role: user_data.role || 'user'
            })
          }
        } catch (auth_error) {
          await window.electron_api.config_set('access_token', null)
          await window.electron_api.config_set('refresh_token', null)
        }
      } catch (err) {
        console.error('Auto login check failed', err)
      } finally {
        set_initializing(false)
      }
    }

    void check_auto_login()
  }, [login])

  if (initializing) {
    return <LoadingScreen />
  }

  return (
    <>
      <GlobalTransition is_transitioning={is_locale_transitioning} />
      <RouterProvider router={router} />
    </>
  )
}

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
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ui_text)', letterSpacing: '0.15em' }}>TRAI</span>
    </div>
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
    <div style={{
      fontSize: '13px',
      color: 'var(--ui_text_muted)',
      animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
    }}>
      {t('loading')}
    </div>
  </div>
)

export default App
