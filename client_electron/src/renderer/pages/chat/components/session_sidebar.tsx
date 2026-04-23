/**
 * 文件名: session_sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: 会话列表侧边栏组件
 */
import React, { useState } from 'react'
import { Plus, MessageCircle, Trash2, Edit2, PanelLeftOpen, List } from 'lucide-react'
import type { ChatSession } from '../types'

interface SessionSidebarProps {
  sessions: ChatSession[]
  active_session_id: string
  is_open: boolean
  left_open: boolean
  on_toggle: () => void
  on_toggle_left: () => void
  on_select: (id: string) => void
  on_create: () => void
  on_delete: (e: React.MouseEvent, id: string) => void
  on_edit: (e: React.MouseEvent, session: ChatSession) => void
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  active_session_id,
  is_open,
  left_open,
  on_toggle,
  on_toggle_left,
  on_select,
  on_create,
  on_delete,
  on_edit,
}) => {
  const [editing_id, set_editing_id] = useState('')
  const [edit_name, set_edit_name] = useState('')

  const handle_confirm = (sid: string, name: string, on_cb: (e: React.MouseEvent, s: ChatSession) => void, s: ChatSession) => {
    if (!name.trim()) return
    on_cb({ stopPropagation: () => {} } as React.MouseEvent, s)
    set_editing_id('')
    set_edit_name('')
  }

  const handle_cancel = () => {
    set_editing_id('')
    set_edit_name('')
  }

  return (
    <div style={{
      width: is_open ? '12%' : '0px',
      minWidth: is_open ? '120px' : '0px',
      opacity: is_open ? 1 : 0,
      backgroundColor: 'var(--ui_panel)',
      borderRight: is_open ? '1px solid var(--ui_border)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      flexShrink: 1,
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--ui_border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
          {!left_open && (
            <button
              type="button"
              onClick={on_toggle_left}
              title="展开 Agent 栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>对话记录</span>
        </div>
        <button
          type="button"
          onClick={on_toggle}
          title="收起会话列表"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ui_text_muted)', borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <List size={18} />
        </button>
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--ui_border)', boxSizing: 'border-box' }}>
        <button
          type="button"
          onClick={on_create}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '8px', backgroundColor: 'transparent', color: 'var(--ui_accent)',
            border: '1px dashed var(--ui_accent)',
            borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ui_accent)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--ui_accent)'
          }}
        >
          <Plus size={14} /> 会话
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box' }}>
        {sessions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>
            暂无会话
          </div>
        ) : (
          sessions.map(s => {
            const is_editing = editing_id === s.id
            return (
              <div
                key={s.id}
                onClick={() => !is_editing && on_select(s.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: active_session_id === s.id ? 'var(--ui_accent)' : 'transparent',
                  color: active_session_id === s.id ? '#ffffff' : 'var(--ui_text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: active_session_id === s.id ? 600 : 400,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                }}
                onMouseLeave={(e) => {
                  if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <MessageCircle size={16} />
                {is_editing ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      autoFocus
                      value={edit_name}
                      onChange={(e) => set_edit_name(e.target.value.slice(0, 4))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handle_confirm(s.id, edit_name, on_edit, s)
                        if (e.key === 'Escape') handle_cancel()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      maxLength={4}
                      style={{
                        width: '100%', padding: '4px 8px',
                        border: '1px solid var(--ui_accent)',
                        borderRadius: '4px', fontSize: '13px',
                        outline: 'none', boxSizing: 'border-box',
                        backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--ui_text_muted)' }}>
                      不超过4个字符,勿用标点符号
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {s.title.length > 4 ? s.title.slice(0, 4) + '...' : s.title}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          set_editing_id(s.id)
                          set_edit_name(s.title.slice(0, 4))
                        }}
                        style={{
                          padding: '4px', borderRadius: '4px', color: 'var(--ui_text_muted)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_accent)'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'var(--ui_text_muted)'
                        }}
                      >
                        <Edit2 size={14} />
                      </div>
                      <div
                        onClick={(e) => on_delete(e, s.id)}
                        style={{
                          padding: '4px', borderRadius: '4px', color: 'var(--ui_text_muted)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_danger)'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'var(--ui_text_muted)'
                        }}
                      >
                        <Trash2 size={14} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SessionSidebar
