/**
 * 文件名: sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 左侧侧边栏导航组件
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Settings, LogOut, User, Menu, Wrench, MessageSquare, Image as ImageIcon, Music, Video, ImagePlus as ImagePlusIcon, ChevronDown, ChevronRight, Bot, Cpu, MessageSquarePlus, Database, LayoutDashboard, FileText, FolderOpen, Compass } from 'lucide-react'
import { use_auth_store } from '@/store/auth'

/**
 * 侧边栏组件
 */
const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = use_auth_store((state) => state.logout)
  const user = use_auth_store((state) => state.user)
  const [collapsed, set_collapsed] = useState(false)
  const [expanded_groups, set_expanded_groups] = useState<Record<string, boolean>>({ ai: true, tools: true })
  const [version, set_version] = useState('1.0.0')

  useEffect(() => {
    const load_version = async () => {
      if (window.electron_api?.app_get_version) {
        try {
          const v = await window.electron_api.app_get_version()
          set_version(v)
        } catch (e) {
          console.error('Failed to get app version', e)
        }
      }
    }
    load_version()
  }, [])

  /**
   * 处理登出
   */
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

  /**
   * 切换分组展开状态
   * @param id 分组ID
   */
  const toggle_group = (id: string) => {
    if (collapsed) {
      set_collapsed(false)
      set_expanded_groups(prev => ({ ...prev, [id]: true }))
    } else {
      set_expanded_groups(prev => ({ ...prev, [id]: !prev[id] }))
    }
  }

  const nav_items = [
    {
      id: 'dashboard',
      label: '仪表盘',
      icon: <Home size={20} />,
      children: [
        { path: '/dashboard', label: '概览', icon: <LayoutDashboard size={18} /> }
      ]
    },
    {
      id: 'agent',
      label: '智能体',
      icon: <Cpu size={20} />,
      children: [
        { path: '/agent/management', label: '管理', icon: <Bot size={18} /> }
      ]
    },
    {
      id: 'knowledge',
      label: '知识库',
      icon: <Database size={20} />,
      children: [
        { path: '/knowledge_base', label: '文件', icon: <FolderOpen size={18} /> }
      ]
    },
    {
      id: 'ai',
      label: 'AI 创作',
      icon: <Bot size={20} />,
      children: [
        { path: '/chat', label: '智能对话', icon: <MessageSquare size={18} /> },
        { path: '/ai/text_to_image', label: '文生图像', icon: <ImageIcon size={18} /> },
        { path: '/ai/image_to_image', label: '图生图像', icon: <ImagePlusIcon size={18} /> },
        { path: '/ai/music', label: '音乐生成', icon: <Music size={18} /> },
        { path: '/ai/video', label: '视频生成', icon: <Video size={18} /> }
      ]
    },
    {
      id: 'tools',
      label: '工具箱',
      icon: <Wrench size={20} />,
      children: [
        { path: '/tools', label: '工具', icon: <FileText size={18} /> }
      ]
    },
    { path: '/feedback', label: '反馈', icon: <MessageSquarePlus size={20} /> },
    { path: '/settings', label: '设置', icon: <Settings size={20} /> }
  ]

  type LucideIconElement = React.ReactElement<{ color?: string }>

  return (
    <div className="no-drag-region" style={{ width: collapsed ? '56px' : '12%', minWidth: collapsed ? '56px' : '160px', maxWidth: collapsed ? '56px' : '220px', flexShrink: 1, transition: 'width 0.2s ease', backgroundColor: 'var(--ui_panel_alt)', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--ui_border)' }}>
      <div style={{ padding: collapsed ? '20px 0' : '20px 24px', borderBottom: '1px solid var(--ui_border)', display: 'flex', flexDirection: 'column', alignItems: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: collapsed ? '0' : '16px' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="var(--ui_text_muted)" />
              <span style={{ fontSize: '12px', color: 'var(--ui_text_muted)', fontWeight: '600' }}>导航菜单</span>
            </div>
          )}
          <Menu size={20} color="var(--ui_text)" style={{ cursor: 'pointer' }} onClick={() => set_collapsed(!collapsed)} />
        </div>
        
        {!collapsed && (
          <div style={{ color: '#202020', margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold' }}>
            {user?.username === 'admin' ? (
              <img src="./kity.png" alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ backgroundColor: '#0078d4', borderRadius: '50%', padding: '6px', display: 'flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="#ffffff" />
              </div>
            )}
            {user?.username || '未登录'}
          </div>
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
                    color: is_group_active && collapsed ? '#0078d4' : 'var(--ui_text_muted)',
                    backgroundColor: is_group_active && collapsed ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!(is_group_active && collapsed)) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    if (!(is_group_active && collapsed)) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px' }}>
                    {item.icon}
                    {!collapsed && <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    is_expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </div>

                {!collapsed && is_expanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {item.children.map(child => {
                      const is_child_active = location.pathname === child.path
                      const child_icon = React.isValidElement<{ color?: string }>(child.icon)
                        ? React.cloneElement(child.icon as LucideIconElement, { color: is_child_active ? '#0078d4' : 'var(--ui_text_muted)' })
                        : null

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
                            color: is_child_active ? '#0078d4' : 'var(--ui_text_muted)',
                            backgroundColor: is_child_active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!is_child_active) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                          }}
                          onMouseLeave={(e) => {
                            if (!is_child_active) e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {child_icon}
                          <span style={{ fontSize: '13px', fontWeight: is_child_active ? '600' : 'normal', whiteSpace: 'nowrap' }}>{child.label}</span>
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
                color: is_active ? '#0078d4' : 'var(--ui_text)',
                backgroundColor: is_active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!is_active) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              }}
              onMouseLeave={(e) => {
                if (!is_active) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {item.icon}
              {!collapsed && <span style={{ fontSize: '13px', fontWeight: is_active ? '600' : 'normal', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          )
        })}
        <div
          onClick={handle_logout}
          title={collapsed ? '退出' : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '12px',
            color: 'var(--ui_text)', cursor: 'pointer',
            padding: collapsed ? '12px 0' : '10px 16px',
            borderRadius: '6px',
            transition: 'background-color 0.15s ease',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          {!collapsed && <span style={{ fontSize: '13px' }}>退出</span>}
        </div>
      </div>

      {/* 版本号 */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}>
        {!collapsed ? (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>v{version}</span>
        ) : (
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>v1</span>
        )}
      </div>

    </div>
  )
}

export default Sidebar
