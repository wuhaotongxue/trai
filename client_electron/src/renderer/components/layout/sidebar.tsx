/**
 * 文件名: sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 左侧侧边栏导航组件
 */
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Settings, LogOut, User } from 'lucide-react'
import { use_auth_store } from '@/store/auth'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = use_auth_store((state) => state.logout)
  const user = use_auth_store((state) => state.user)

  const handle_logout = () => {
    logout()
    navigate('/login')
  }

  const nav_items = [
    { path: '/', label: '仪表盘', icon: <Home size={20} /> },
    { path: '/settings', label: '系统设置', icon: <Settings size={20} /> }
  ]

  return (
    <div style={{ width: '240px', backgroundColor: '#1e293b', height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #334155' }}>
        <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={24} />
          {user?.username || '未登录'}
        </h2>
        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', paddingLeft: '32px' }}>
          {user?.email || ''}
        </div>
      </div>
      
      <div style={{ flex: 1, padding: '16px 0' }}>
        {nav_items.map(item => {
          const is_active = location.pathname === item.path
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: is_active ? '#38bdf8' : '#94a3b8',
                backgroundColor: is_active ? '#0f172a' : 'transparent',
                borderRight: is_active ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: is_active ? 'bold' : 'normal' }}>{item.label}</span>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '24px', borderTop: '1px solid #334155' }}>
        <div
          onClick={handle_logout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', cursor: 'pointer', padding: '12px' }}
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
