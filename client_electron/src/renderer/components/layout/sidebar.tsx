/**
 * 文件名: sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 左侧侧边栏导航组件
 */
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Settings, LogOut, User, Menu, Wrench, MessageSquare, Image, Music, Video, ImagePlus, ChevronDown, ChevronRight, Bot, Cpu, MessageSquarePlus, FileEdit, Database } from 'lucide-react'
import { use_auth_store } from '@/store/auth'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = use_auth_store((state) => state.logout)
  const user = use_auth_store((state) => state.user)
  const [collapsed, set_collapsed] = useState(false)
  const [expanded_groups, set_expanded_groups] = useState<Record<string, boolean>>({ ai: true, tools: true })

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

  const toggle_group = (id: string) => {
    if (collapsed) {
      set_collapsed(false)
      set_expanded_groups(prev => ({ ...prev, [id]: true }))
    } else {
      set_expanded_groups(prev => ({ ...prev, [id]: !prev[id] }))
    }
  }

  const nav_items = [
    { path: '/', label: '仪表盘', icon: <Home size={20} /> },
    {
      id: 'agent',
      label: '智能体生态',
      icon: <Cpu size={20} />,
      children: [
        { path: '/agent/management', label: 'Agent 管理', icon: <Cpu size={18} /> },
      ]
    },
    { path: '/knowledge-base', label: '知识库管理', icon: <Database size={20} /> },
    {
      id: 'ai',
      label: 'AI 创作',
      icon: <Bot size={20} />,
      children: [
        { path: '/chat', label: 'AI 对话', icon: <MessageSquare size={18} /> },
        { path: '/ai/text-to-image', label: '文生图', icon: <Image size={18} /> },
        { path: '/ai/image-to-image', label: '图生图', icon: <ImagePlus size={18} /> },
        { path: '/ai/music', label: 'AI 音乐', icon: <Music size={18} /> },
        { path: '/ai/video', label: 'AI 视频', icon: <Video size={18} /> },
        { path: '/ai/report', label: 'AI 周报', icon: <FileEdit size={18} /> }
      ]
    },
    {
      id: 'tools',
      label: '实用工具',
      icon: <Wrench size={20} />,
      children: [
        { path: '/tools', label: '工具箱', icon: <Wrench size={18} /> }
      ]
    },
    { path: '/feedback', label: '用户反馈', icon: <MessageSquarePlus size={20} /> },
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
            <div style={{ color: '#202020', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}>
              {user?.username === 'admin' ? (
                <img src="./kity.png" alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ backgroundColor: '#0078d4', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                  <User size={16} color="#ffffff" />
                </div>
              )}
              {user?.username || '未登录'}
            </div>
            <div style={{ color: 'rgba(0, 0, 0, 0.5)', fontSize: '12px', marginTop: '8px', paddingLeft: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </>
        )}
      </div>
      
      <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {nav_items.map(item => {
          if (item.children) {
            const is_group_active = item.children.some(child => location.pathname === child.path)
            const is_expanded = expanded_groups[item.id]

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  onClick={() => toggle_group(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    padding: collapsed ? '12px 0' : '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderRadius: '6px',
                    color: is_group_active && collapsed ? '#0078d4' : '#64748b',
                    backgroundColor: is_group_active && collapsed ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!(is_group_active && collapsed)) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                  }}
                  onMouseLeave={(e) => {
                    if (!(is_group_active && collapsed)) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px' }}>
                    {item.icon}
                    {!collapsed && <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    is_expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </div>

                {!collapsed && is_expanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {item.children.map(child => {
                      const is_child_active = location.pathname === child.path
                      return (
                        <div
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          style={{
                            padding: '8px 16px 8px 48px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: '6px',
                            color: is_child_active ? '#0078d4' : '#475569',
                            backgroundColor: is_child_active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!is_child_active) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                          }}
                          onMouseLeave={(e) => {
                            if (!is_child_active) e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {child.icon}
                          <span style={{ fontSize: '13px', fontWeight: is_child_active ? '600' : 'normal' }}>{child.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Single item
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
