/**
 * 文件名: main_layout.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端主页面布局
 */
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './sidebar'
import TitleBar from './title_bar'
import { use_auth_store } from '@/store/auth'

/**
 * 主布局组件
 */
const MainLayout: React.FC = () => {
  const is_authenticated = use_auth_store((state) => state.is_authenticated)
  const logout = use_auth_store((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (!is_authenticated) {
      navigate('/login')
    }
  }, [is_authenticated, navigate])

  useEffect(() => {
    // 监听 Token 过期事件
    const handle_need_login = () => {
      logout()
      navigate('/login')
    }

    // 添加 IPC 监听器
    window.electron_api.on('auth:need-login', handle_need_login)

    // 清理监听器
    return () => {
      window.electron_api.off('auth:need-login', handle_need_login)
    }
  }, [logout, navigate])

  if (!is_authenticated) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f3f3', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f3f3f3', borderBottom: '1px solid #cbd5e1' }}>
          <Outlet />
        </div>
      </div>
      <div style={{ padding: '8px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
        <span>TRAI</span>
        <span>|</span>
        <span>开发联系: wuhaotongxue@gmail.com</span>
      </div>
    </div>
  )
}

/**
 * 主布局组件导出
 */
export default MainLayout
