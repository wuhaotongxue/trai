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

console.log('[app] app.tsx loading...')
console.log('[app] React imported:', React)
console.log('[app] RouterProvider imported:', RouterProvider)
console.log('[app] router imported:', router)
console.log('[app] setup_axios_interceptors imported:', setup_axios_interceptors)
console.log('[app] init_api_base_url imported:', init_api_base_url)
console.log('[app] use_auth_store imported:', use_auth_store)
console.log('[app] use_locale_store imported:', use_locale_store)

// 从 i18n.ts 导入翻译函数
import { translate } from '@/i18n'

async function init_i18n() {
  console.log('[app] init_i18n called')
  // 模拟初始化
  return Promise.resolve()
}

console.log('[app] translate function defined:', translate)
console.log('[app] init_i18n function defined:', init_i18n)

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
        backgroundColor: 'var(--ui_panel)',
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
  const [is_exiting, set_is_exiting] = useState(false)
  const login = use_auth_store((state) => state.login)
  const logout = use_auth_store((state) => state.logout)
  const locale = use_locale_store((state) => state.locale)
  const prev_locale_ref = useRef<string>('')
  const init_ref = useRef(false)

  // 监听需要登录事件
  useEffect(() => {
    if (!window.electron_api?.on_auth_need_login) {
      return
    }

    const cleanup = window.electron_api.on_auth_need_login(() => {
      logout()
      window.electron_api.config_set('access_token', null).catch(() => {})
      window.electron_api.config_set('refresh_token', null).catch(() => {})
      window.location.hash = '#/login'
    })

    return cleanup
  }, [logout])

  // 监听退出动画事件
  useEffect(() => {
    if (!window.electron_api?.on_app_quit_with_animation) {
      return
    }

    const cleanup = window.electron_api.on_app_quit_with_animation(() => {
      set_is_exiting(true)
      setTimeout(() => {
        void window.electron_api.config_set('_quit_anim_done', '1').catch(() => {})
      }, 400)
    })

    return cleanup
  }, [])

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

    const initialize_app = async () => {
      try {
        // 1. 初始化 API 地址（添加超时保护）
        console.log('[app] 开始初始化...')
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('API init timeout')), 3000))
          await Promise.race([init_api_base_url(), timeoutPromise])
          console.log('[app] API 地址初始化完成')
        } catch (e) {
          console.warn('[app] API 初始化超时，继续使用默认地址:', e)
        }
        setup_axios_interceptors()

        // 2. 加载语言偏好
        use_locale_store.getState().set_locale('zh')
        console.log('[app] locale set to zh')

        // 3. 初始化翻译数据
        await init_i18n()

        // 4. 检查自动登录（添加超时保护）
        if (window.electron_api) {
          try {
            const token_res = await window.electron_api.config_get('access_token', null)
            const has_token = token_res.data != null
            console.log('[app] Token 状态:', has_token ? '有Token' : '无Token')

            if (has_token) {
              try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth check timeout')), 3000))
                const me_res = await Promise.race([window.electron_api.auth_me(), timeoutPromise]) as { success: boolean; data?: { user?: { username?: string; email?: string; role?: string }; username?: string; email?: string; role?: string } } | { success: boolean; data?: null }
                if (me_res.success && me_res.data) {
                  const user_data = me_res.data.user || me_res.data
                  login({
                    username: user_data.username || 'user',
                    email: user_data.email || 'user@trai.local',
                    role: user_data.role || 'user'
                  })
                  console.log('[app] 自动登录成功')
                }
              } catch (auth_error) {
                console.warn('[app] 自动登录失败，将显示登录页面:', auth_error)
                await window.electron_api.config_set('access_token', null).catch(() => {})
                await window.electron_api.config_set('refresh_token', null).catch(() => {})
              }
            }
          } catch (e) {
            console.warn('[app] 获取Token状态失败:', e)
          }
        }
      } catch (err) {
        console.error('App initialization failed', err)
      } finally {
        console.log('[app] 初始化完成，显示主界面')
        set_initializing(false)
      }
    }

    void initialize_app()
  }, [login])

  if (initializing) {
    return <LoadingScreen />
  }

  return (
    <>
      <GlobalTransition is_transitioning={is_locale_transitioning} />
      <div className={is_exiting ? 'window-exit' : ''} style={{ height: '100%' }}>
        <RouterProvider router={router} />
      </div>
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
    backgroundColor: 'var(--ui_panel)',
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
      {translate('loading')}
    </div>
  </div>
)

export default App
