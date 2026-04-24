/**
 * 文件名: sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:10:00
 * 描述: TRAI 桌面客户端左侧侧边栏导航组件，支持折叠、国际化与深色主题
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Settings, LogOut, User, Menu, Wrench, MessageSquare,
  Image as ImageIcon, Music, Video, ImagePlus as ImagePlusIcon,
  ChevronDown, ChevronRight, Bot, Cpu, MessageSquarePlus,
  Database, LayoutDashboard, FileText, FolderOpen, Compass,
  Sparkles, Wand2
} from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { t, type Locale } from '@/i18n'
import { use_locale_store } from '@/store/locale'

type NavChild = {
  path: string
  label_key: string
  icon: React.ReactNode
}

type NavItem = {
  id: string
  label_key: string
  icon: React.ReactNode
  children?: NavChild[]
  path?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label_key: 'dashboard',
    icon: <Home size={20} />,
    children: [{ path: '/dashboard', label_key: 'overview', icon: <LayoutDashboard size={18} /> }]
  },
  {
    id: 'agent',
    label_key: 'agent',
    icon: <Cpu size={20} />,
    children: [{ path: '/agent/management', label_key: 'management', icon: <Bot size={18} /> }]
  },
  {
    id: 'knowledge',
    label_key: 'knowledge_base',
    icon: <Database size={20} />,
    children: [{ path: '/knowledge_base', label_key: 'files', icon: <FolderOpen size={18} /> }]
  },
  {
    id: 'ai',
    label_key: 'ai_creation',
    icon: <Sparkles size={20} />,
    children: [
      { path: '/chat', label_key: 'chat', icon: <MessageSquare size={18} /> },
      { path: '/ai/text_to_image', label_key: 'text_to_image', icon: <Wand2 size={18} /> },
      { path: '/ai/image_to_image', label_key: 'image_to_image', icon: <ImagePlusIcon size={18} /> },
      { path: '/ai/music', label_key: 'music_generation', icon: <Music size={18} /> },
      { path: '/ai/video', label_key: 'video_generation', icon: <Video size={18} /> }
    ]
  },
  {
    id: 'tools',
    label_key: 'tools',
    icon: <Wrench size={20} />,
    children: [{ path: '/tools', label_key: 'tool', icon: <FileText size={18} /> }]
  },
  {
    id: 'media',
    label_key: 'media_center',
    icon: <Video size={20} />,
    children: [
      { path: '/media', label_key: 'player', icon: <Music size={18} /> },
      { path: '/media/processor', label_key: 'media_processing', icon: <Wrench size={18} /> }
    ]
  },
  { id: 'feedback', label_key: 'feedback', icon: <MessageSquarePlus size={20} />, path: '/feedback' },
  { id: 'settings', label_key: 'settings', icon: <Settings size={20} />, path: '/settings' }
]

const SIDEBAR_STYLES = {
  container: {
    width: 'var(--sidebar_width)',
    minWidth: 'var(--sidebar_width)',
    maxWidth: 'var(--sidebar_width)',
    flexShrink: 0,
    backgroundColor: 'var(--ui_panel)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid var(--ui_border)',
    transition: 'width var(--ui_transition_normal)',
    overflow: 'hidden',
  },
  containerCollapsed: {
    width: 'var(--sidebar_collapsed)',
    minWidth: 'var(--sidebar_collapsed)',
    maxWidth: 'var(--sidebar_collapsed)',
  },
  header: {
    padding: '20px 16px',
    borderBottom: '1px solid var(--ui_border)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  headerCollapsed: {
    padding: '20px 0',
    alignItems: 'center' as const,
  },
  navSection: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid var(--ui_border)',
    display: 'flex',
    alignItems: 'center',
  },
  footerCollapsed: {
    padding: '12px 0',
    justifyContent: 'center' as const,
  },
  logoText: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--ui_sidebar_accent)',
    letterSpacing: '0.05em',
  },
  versionText: {
    fontSize: '11px',
    color: 'var(--ui_text_muted)',
  },
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = use_auth_store((state) => state.logout)
  const user = use_auth_store((state) => state.user)
  const [collapsed, set_collapsed] = useState(false)
  const [expanded_groups, set_expanded_groups] = useState<Record<string, boolean>>({ dashboard: true, ai: true, tools: true, knowledge: true, agent: true, media: true })
  const [version, set_version] = useState('1.0.0')
  const [, force_update] = useState(0)

  useEffect(() => {
    const unsubscribe = use_locale_store.subscribe(() => force_update((n) => n + 1))
    return unsubscribe
  }, [])

  useEffect(() => {
    const load_version = async () => {
      if (window.electron_api?.app_get_version) {
        try {
          const v = await window.electron_api.app_get_version()
          set_version(v)
        } catch {
          // version remains default
        }
      }
    }
    void load_version()
  }, [])

  const handle_logout = useCallback(async () => {
    try {
      // 添加退出动画效果
      const content = document.querySelector('.main-content')
      if (content) {
        (content as HTMLElement).style.opacity = '0'
        (content as HTMLElement).style.transform = 'scale(0.98)'
        ;(content as HTMLElement).style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      }

      if (window.electron_api?.auth_logout) {
        await window.electron_api.auth_logout()
      }
    } catch (error) {
      console.error('logout error:', error)
    } finally {
      // 延迟跳转，等待动画完成
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 300)
    }
  }, [logout, navigate])

  const toggle_group = useCallback((id: string) => {
    if (collapsed) {
      set_collapsed(false)
      set_expanded_groups((prev) => ({ ...prev, [id]: true }))
    } else {
      set_expanded_groups((prev) => ({ ...prev, [id]: !prev[id] }))
    }
  }, [collapsed])

  const is_collapsed = collapsed

  return (
    <div
      className="no-drag-region"
      style={{
        ...SIDEBAR_STYLES.container,
        ...(is_collapsed ? SIDEBAR_STYLES.containerCollapsed : {}),
      }}
    >
      {/* 顶部区域 */}
      <div style={{ ...SIDEBAR_STYLES.header, ...(is_collapsed ? SIDEBAR_STYLES.headerCollapsed : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: is_collapsed ? 'center' : 'space-between' }}>
          {!is_collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} color="var(--ui_sidebar_accent)" />
              <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('navigation')}
              </span>
            </div>
          )}
          <button
            className="no-drag-region"
            type="button"
            title={is_collapsed ? 'Expand' : 'Collapse'}
            onClick={() => set_collapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--ui_radius_sm)',
              color: 'var(--ui_text_muted)',
              transition: 'background-color var(--ui_transition_fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Menu size={18} />
          </button>
        </div>

        {!is_collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: 'var(--ui_panel_hover)', borderRadius: 'var(--ui_radius_md)' }}>
            {user?.username === 'admin' ? (
              <img
                src="./kity.png"
                alt="avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--ui_sidebar_accent_light)' }}
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--ui_accent), var(--ui_sidebar_accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={16} color="white" />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ui_text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username || t('not_logged_in')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ui_text_muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 导航列表 */}
      <div style={SIDEBAR_STYLES.navSection}>
        {NAV_ITEMS.map((item, nav_idx) => {
          if (item.children) {
            const is_group_active = item.children.some((child) => location.pathname === child.path)
            const is_expanded = expanded_groups[item.id]

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', animation: `fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${nav_idx * 0.04}s both` }}>
                {/* 分组标题 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle_group(item.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggle_group(item.id) }}
                  title={is_collapsed ? t(item.label_key as any) : undefined}
                  style={{
                    padding: is_collapsed ? '10px 0' : '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: is_collapsed ? 'center' : 'space-between',
                    borderRadius: 'var(--ui_radius_sm)',
                    color: is_group_active ? 'var(--ui_sidebar_accent)' : 'var(--ui_text_secondary)',
                    backgroundColor: is_group_active ? 'var(--ui_sidebar_accent_light)' : 'transparent',
                    transition: 'background-color var(--ui_transition_fast), color var(--ui_transition_fast)',
                    marginBottom: is_collapsed ? '0' : '2px',
                    fontWeight: is_group_active ? 600 : 500,
                    fontSize: '13px',
                    userSelect: 'none' as const,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!is_group_active) {
                      e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'
                      e.currentTarget.style.color = 'var(--ui_text)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!is_group_active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--ui_text_secondary)'
                    }
                  }}
                >
                  {is_group_active && !is_collapsed && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '16px', borderRadius: '0 2px 2px 0',
                      backgroundColor: 'var(--ui_accent)',
                    }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: is_collapsed ? '0' : '10px' }}>
                    <span style={{ opacity: is_group_active ? 1 : 0.8 }}>{item.icon}</span>
                    {!is_collapsed && <span style={{ whiteSpace: 'nowrap' }}>{t(item.label_key as any)}</span>}
                  </div>
                  {!is_collapsed && (
                    is_expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </div>

                {/* 子菜单 */}
                {!is_collapsed && is_expanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '8px', animation: 'fadeInUp 0.2s ease' }}>
                    {item.children.map((child) => {
                      const is_child_active = location.pathname === child.path
                      return (
                        <div
                          key={child.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(child.path)}
                          onKeyDown={(e) => { if (e.key === 'Enter') navigate(child.path) }}
                          style={{
                            padding: '7px 12px 7px 36px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            borderRadius: 'var(--ui_radius_sm)',
                            color: is_child_active ? 'var(--ui_sidebar_accent)' : 'var(--ui_text_secondary)',
                            backgroundColor: is_child_active ? 'var(--ui_sidebar_accent_light)' : 'transparent',
                            transition: 'background-color var(--ui_transition_fast), color var(--ui_transition_fast)',
                            fontWeight: is_child_active ? 600 : 400,
                            fontSize: '13px',
                            userSelect: 'none' as const,
                          }}
                          onMouseEnter={(e) => {
                            if (!is_child_active) {
                              e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'
                              e.currentTarget.style.color = 'var(--ui_text)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!is_child_active) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = 'var(--ui_text_secondary)'
                            }
                          }}
                        >
                          <span style={{ opacity: is_child_active ? 1 : 0.75 }}>{child.icon}</span>
                          <span style={{ whiteSpace: 'nowrap' }}>{t(child.label_key as any)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // 单项菜单
          const is_active = location.pathname === item.path
          return (
            <div
              key={item.path}
              role="button"
              tabIndex={0}
              onClick={() => navigate(item.path as string)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(item.path as string) }}
              title={is_collapsed ? t(item.label_key as any) : undefined}
              style={{
                padding: is_collapsed ? '10px 0' : '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: is_collapsed ? 'center' : 'flex-start',
                gap: is_collapsed ? '0' : '10px',
                borderRadius: 'var(--ui_radius_sm)',
                color: is_active ? 'var(--ui_sidebar_accent)' : 'var(--ui_text_secondary)',
                backgroundColor: is_active ? 'var(--ui_sidebar_accent_light)' : 'transparent',
                transition: 'background-color var(--ui_transition_fast), color var(--ui_transition_fast)',
                fontWeight: is_active ? 600 : 400,
                fontSize: '13px',
                userSelect: 'none' as const,
                position: 'relative',
                animation: `fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${NAV_ITEMS.indexOf(item) * 0.04}s both`,
              }}
              onMouseEnter={(e) => {
                if (!is_active) {
                  e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'
                  e.currentTarget.style.color = 'var(--ui_text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!is_active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--ui_text_secondary)'
                }
              }}
            >
              {is_active && !is_collapsed && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '16px', borderRadius: '0 2px 2px 0',
                  backgroundColor: 'var(--ui_accent)',
                }} />
              )}
              <span style={{ opacity: is_active ? 1 : 0.8 }}>{item.icon}</span>
              {!is_collapsed && <span style={{ whiteSpace: 'nowrap' }}>{t(item.label_key as any)}</span>}
            </div>
          )
        })}

        {/* 退出登录 */}
        <div
          role="button"
          tabIndex={0}
          onClick={handle_logout}
          onKeyDown={(e) => { if (e.key === 'Enter') handle_logout() }}
          title={is_collapsed ? t('logout') : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: is_collapsed ? 'center' : 'flex-start',
            gap: is_collapsed ? '0' : '10px',
            color: 'var(--ui_text_muted)',
            cursor: 'pointer',
            padding: is_collapsed ? '10px 0' : '8px 12px',
            borderRadius: 'var(--ui_radius_sm)',
            transition: 'background-color var(--ui_transition_fast), color var(--ui_transition_fast)',
            fontSize: '13px',
            marginTop: '4px',
            userSelect: 'none' as const,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ui_danger_light)'
            e.currentTarget.style.color = 'var(--ui_danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--ui_text_muted)'
          }}
        >
          <LogOut size={18} />
          {!is_collapsed && <span>{t('logout')}</span>}
        </div>
      </div>

      {/* 版本号 */}
      <div style={{ ...SIDEBAR_STYLES.footer, ...(is_collapsed ? SIDEBAR_STYLES.footerCollapsed : {}) }}>
        <span style={SIDEBAR_STYLES.versionText}>
          {t('app_name')} v{version}
        </span>
      </div>
    </div>
  )
}

export default Sidebar
