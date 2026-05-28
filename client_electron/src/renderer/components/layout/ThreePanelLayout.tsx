/**
 * 文件名: ThreePanelLayout.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:25:00
 * 描述: 通用三段式布局组件 - 自适应布局，支持平滑展开收起动画
 */
import React, { useState } from 'react'
import { PanelLeftOpen, PanelLeftClose, List } from 'lucide-react'
import { translate } from '@/i18n'

interface ThreePanelLayoutProps {
  title: string
  titleIcon?: React.ReactNode
  leftPanelTitle?: string
  leftPanel?: React.ReactNode
  leftPanelDefaultOpen?: boolean
  middlePanelTitle?: string
  middlePanel?: React.ReactNode
  middlePanelDefaultOpen?: boolean
  rightPanelTitle?: string
  titleExtra?: React.ReactNode
  contentPadding?: string | number
  children: React.ReactNode
}

const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  title,
  titleIcon,
  leftPanelTitle,
  leftPanel,
  leftPanelDefaultOpen = true,
  middlePanelTitle,
  middlePanel,
  middlePanelDefaultOpen = true,
  rightPanelTitle,
  titleExtra,
  contentPadding = '20px',
  children,
}) => {
  const [is_left_open, set_is_left_open] = useState(leftPanelDefaultOpen)
  const [is_middle_open, set_is_middle_open] = useState(middlePanelDefaultOpen)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ui_panel)', minHeight: 0, flexShrink: 0 }}>
      {/* 顶部标题栏 */}
      <div className="drag-region" style={{
        padding: '16px 24px',
        backgroundColor: 'var(--ui_panel)',
        borderBottom: '2px solid var(--ui_border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background-color var(--ui_transition_normal)',
        animation: 'fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {titleIcon}
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>{title}</span>
        </div>
        {titleExtra && <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{titleExtra}</div>}
      </div>

      {/* 内容区域 */}
      <div className="no-drag-region" style={{ display: 'flex', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ui_panel)' }}>
        {leftPanel && (
          <div style={{
            width: is_left_open ? '180px' : '0px',
            minWidth: is_left_open ? '180px' : '0px',
            opacity: is_left_open ? 1 : 0,
            backgroundColor: 'var(--ui_panel)',
            borderRight: is_left_open ? '2px solid var(--ui_border)' : 'none',
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, border-color 0.3s ease',
            overflow: 'hidden', flexShrink: 1,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {leftPanelTitle && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>{leftPanelTitle}</span>
              )}
              <button
                type="button"
                onClick={() => set_is_left_open(false)}
                title={translate('collapse')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ui_text_muted)', borderRadius: '6px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {leftPanel}
            </div>
          </div>
        )}

        {middlePanel && (
          <div style={{
            width: is_middle_open ? '180px' : '0px',
            minWidth: is_middle_open ? '180px' : '0px',
            opacity: is_middle_open ? 1 : 0,
            backgroundColor: 'var(--ui_panel)',
            borderRight: is_middle_open ? '2px solid var(--ui_border)' : 'none',
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, border-color 0.3s ease',
            overflow: 'hidden', flexShrink: 1,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {leftPanel && !is_left_open && (
                  <button
                    type="button"
                    onClick={() => set_is_left_open(true)}
                    title={translate('expand')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--ui_text_muted)', borderRadius: '6px',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}
                  >
                    <PanelLeftOpen size={18} />
                  </button>
                )}
                {middlePanelTitle && (
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>{middlePanelTitle}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => set_is_middle_open(false)}
                title={translate('collapse')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ui_text_muted)', borderRadius: '6px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}
              >
                <List size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {middlePanel}
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* 右侧内容区标题栏 */}
          <div className="drag-region" style={{
            padding: '12px 16px',
            backgroundColor: 'var(--ui_panel)',
            borderBottom: '2px solid var(--ui_border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background-color var(--ui_transition_normal)',
          }}>
            <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {leftPanel && !is_left_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_open(true)}
                  title={translate('expand')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '6px',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              {middlePanel && !is_middle_open && (
                <button
                  type="button"
                  onClick={() => set_is_middle_open(true)}
                  title={translate('expand')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '6px',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}
                >
                  <List size={18} />
                </button>
              )}
              {rightPanelTitle && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>{rightPanelTitle}</span>
              )}
            </div>
          </div>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            padding: contentPadding,
            minHeight: 0,
            animation: 'fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.08s both',
          }}>
            <div style={{
              flex: 1,
              backgroundColor: 'var(--ui_panel)',
              borderRadius: 'var(--ui_radius_lg)',
              boxShadow: 'var(--ui_shadow_card)',
              border: '2px solid var(--ui_border)',
              overflow: 'auto', minWidth: 0,
            }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThreePanelLayout
