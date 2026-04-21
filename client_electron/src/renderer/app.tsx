/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: UI 渲染层主组件
 */
import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { setup_axios_interceptors } from './utils/axios_interceptor'
import { use_auth_store } from './store/auth'

/**
 * 主应用组件
 */
const App: React.FC = () => {
  const [initializing, set_initializing] = useState(true)
  const login = use_auth_store((state) => state.login)

  useEffect(() => {
    setup_axios_interceptors()

    const check_auto_login = async () => {
      try {
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

    check_auto_login()
  }, [login])

  if (initializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f3f3' }}>
        <div style={{ color: '#666', fontSize: '14px' }}>正在加载应用...</div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

/**
 * 主应用组件导出
 */
export default App
