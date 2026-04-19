/**
 * 文件名: ThreePanelLayout.tsx
 * 作者: wuhao
 * 日期: 2026-04-19
 * 描述: 通用三段式布局组件 - 自适应布局
 *       左侧面板(可选) + 中间面板(可选) + 右侧内容区
 *       全局 Sidebar 由 MainLayout 提供, 此组件不再重复
 */
import React, { useState } from 'react'
import { PanelLeftOpen, List } from 'lucide-react'

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

  const hover_btn_style = {
    background: 'none' as const, border: 'none', cursor: 'pointer', padding: '4px',
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
  }

  const hover_btn_lg_style = {
    background: 'none' as const, border: 'none', cursor: 'pointer', padding: '8px',
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* 顶部标题栏 - 横跨整个宽度 */}
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {titleIcon}
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{title}</span>
        </div>
        {titleExtra && <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{titleExtra}</div>}
      </div>
      
      {/* 内容区域 */}
      <div className="no-drag-region" style={{ display: 'flex', flex: 1, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        {leftPanel && (
          <div style={{
            width: is_left_open ? '18%' : '0px',
            minWidth: is_left_open ? '100px' : '0px',
            opacity: is_left_open ? 1 : 0,
            backgroundColor: '#ffffff',
            borderRight: is_left_open ? '1px solid #e2e8f0' : 'none',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            flexShrink: 1
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {leftPanelTitle && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{leftPanelTitle}</span>
              )}
              <button
                type="button"
                onClick={() => set_is_left_open(false)}
                title="收起"
                aria-label="收起左侧面板"
                style={{ ...hover_btn_style, marginLeft: 'auto' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {leftPanel}
            </div>
          </div>
        )}

        {middlePanel && (
          <div style={{
            width: is_middle_open ? '20%' : '0px',
            minWidth: is_middle_open ? '120px' : '0px',
            opacity: is_middle_open ? 1 : 0,
            backgroundColor: '#ffffff',
            borderRight: is_middle_open ? '1px solid #e2e8f0' : 'none',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            flexShrink: 1
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {leftPanel && !is_left_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_open(true)}
                  title="展开左侧面板"
                  aria-label="展开左侧面板"
                  style={{ ...hover_btn_style }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              {middlePanelTitle && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{middlePanelTitle}</span>
              )}
              <button
                type="button"
                onClick={() => set_is_middle_open(false)}
                title="收起"
                aria-label="收起中间面板"
                style={{ ...hover_btn_style, marginLeft: 'auto' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
          <div className="drag-region" style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {leftPanel && !is_left_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_open(true)}
                  title="展开左侧面板"
                  aria-label="展开左侧面板"
                  style={{ ...hover_btn_lg_style }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={20} />
                </button>
              )}
              {middlePanel && !is_middle_open && (
                <button
                  type="button"
                  onClick={() => set_is_middle_open(true)}
                  title="展开中间面板"
                  aria-label="展开中间面板"
                  style={{ ...hover_btn_lg_style }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <List size={20} />
                </button>
              )}
              {rightPanelTitle && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{rightPanelTitle}</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', padding: contentPadding }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThreePanelLayout
