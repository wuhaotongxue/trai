/**
 * 文件名: main_layout.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 22:05:00
 * 描述: TRAI 桌面客户端主布局组件，整合标题栏、侧边栏与内容区域
 */
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './sidebar'
import TitleBar from './title_bar'
import PageTransition from './page_transition'
import { use_auth_store } from '@/store/auth'
import { translate } from '@/i18n'

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
    const handle_need_login = () => {
      logout()
      navigate('/login')
    }
    const cleanup = window.electron_api.on_auth_need_login(handle_need_login)
    return cleanup
  }, [logout, navigate])

  if (!is_authenticated) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_panel)', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--ui_panel)',
          minHeight: 0,
        }}>
          <PageTransition>
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <Outlet />
            </div>
          </PageTransition>
        </div>
      </div>
      {/* 底部状态栏 - 在整个页面最下方，左侧占位与侧边栏对齐 */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--ui_panel)',
        borderTop: '1px solid var(--ui_border)',
        height: 'var(--footer_height)',
        minHeight: 'var(--footer_height)',
        flexShrink: 0,
        transition: 'background-color var(--ui_transition_normal), border-color var(--ui_transition_normal)',
      }}>
        {/* 左侧占位 - 与侧边栏宽度对齐 */}
        <div style={{ width: 'var(--sidebar_width)', minWidth: 'var(--sidebar_width)', maxWidth: 'var(--sidebar_width)', flexShrink: 0, height: '100%' }} />
        {/* 状态栏内容 */}
        <div style={{
          flex: 1,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--ui_text_muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--ui_success)', display: 'inline-block', boxShadow: '0 0 4px var(--ui_success)' }} />
              {translate('app_name')}
            </span>
            <span style={{ color: 'var(--ui_border)' }}>|</span>
            <span>{translate('footer_contact')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--ui_accent)' }}>TRAI</span>
            <span style={{ fontWeight: 400, color: 'var(--ui_text_muted)' }}>Desktop Client</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout
