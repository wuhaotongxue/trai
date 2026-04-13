/**
 * 文件名: main_layout.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端主页面布局
 */
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './sidebar'
import { use_auth_store } from '@/store/auth'

const MainLayout: React.FC = () => {
  const is_authenticated = use_auth_store((state) => state.is_authenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (!is_authenticated) {
      navigate('/login')
    }
  }, [is_authenticated, navigate])

  if (!is_authenticated) {
    return null
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
