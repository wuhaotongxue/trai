/**
 * 文件名: sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 左侧侧边栏导航组件
 */
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Settings, LogOut, User, Menu, Wrench, MessageSquare } from 'lucide-react'
import { use_auth_store } from '@/store/auth'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = use_auth_store((state) => state.logout)
  const user = use_auth_store((state) => state.user)
  const [collapsed, set_collapsed] = useState(false)

  const handle_logout = async () => {
    try {
      if (window.electron_api?.auth_logout) {
        await window.electron_api.auth_logout()
      }
    } catch (error) {
      console.error('logout error:', error)
    } finally {
      logout()
      navigate('/login')
    }
  }

  const nav_items = [
    { path: '/', label: '仪表盘', icon: <Home size={20} /> },
    { path: '/chat', label: 'AI 对话', icon: <MessageSquare size={20} /> },
    { path: '/tools', label: '工具箱', icon: <Wrench size={20} /> },
    { path: '/settings', label: '系统设置', icon: <Settings size={20} /> }
  ]

  return (
    <div className="no-drag-region" style={{ width: collapsed ? '68px' : '260px', transition: 'width 0.2s ease', backgroundColor: 'rgba(255, 255, 255, 0.5)', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(0, 0, 0, 0.05)' }}>
      <div style={{ padding: collapsed ? '16px 0' : '16px 24px', borderBottom: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', alignItems: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: collapsed ? '0' : '16px' }}>
          {!collapsed && <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)', fontWeight: '600' }}>导航菜单</span>}
          <Menu size={20} color="#202020" style={{ cursor: 'pointer' }} onClick={() => set_collapsed(!collapsed)} />
        </div>
        
        {!collapsed && (
          <>
            <h2 style={{ color: '#202020', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#0078d4', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                <User size={16} color="#ffffff" />
              </div>
              {user?.username || '未登录'}
            </h2>
            <div style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '12px', marginTop: '8px', paddingLeft: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </>
        )}
      </div>
      
      <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {nav_items.map(item => {
          const is_active = location.pathname === item.path
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                padding: collapsed ? '12px 0' : '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '12px',
                borderRadius: '6px',
                color: is_active ? '#0078d4' : '#202020',
                backgroundColor: is_active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!is_active) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
              }}
              onMouseLeave={(e) => {
                if (!is_active) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {item.icon}
              {!collapsed && <span style={{ fontSize: '14px', fontWeight: is_active ? '600' : 'normal' }}>{item.label}</span>}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <div
          onClick={handle_logout}
          title={collapsed ? '退出登录' : undefined}
          style={{ 
            display: 'flex', alignItems: 'center', 
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '12px', 
            color: '#202020', cursor: 'pointer', 
            padding: collapsed ? '12px 0' : '10px 16px', 
            borderRadius: '6px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          {!collapsed && <span style={{ fontSize: '14px' }}>退出登录</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
