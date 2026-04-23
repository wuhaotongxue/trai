/**
 * 文件名: chat_input.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: 聊天输入框组件
 */
import React, { useRef } from 'react'
import { Plus, Send, SquareSquare, Paperclip, X } from 'lucide-react'

interface ChatInputProps {
  input: string
  on_change: (v: string) => void
  on_send: () => void
  on_key_down: (e: React.KeyboardEvent) => void
  on_file_change: (e: React.ChangeEvent<HTMLInputElement>) => void
  on_remove_file: (index: number) => void
  on_stop: () => void
  uploaded_files: Array<{ name: string; type: string; data: string }>
  loading: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  on_change,
  on_send,
  on_key_down,
  on_file_change,
  on_remove_file,
  on_stop,
  uploaded_files,
  loading,
}) => {
  const file_ref = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      padding: '16px 24px',
      backgroundColor: 'var(--ui_panel)',
      borderTop: '1px solid var(--ui_border)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {loading && (
        <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button
            onClick={on_stop}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 16px',
              backgroundColor: 'var(--ui_panel)',
              border: '1px solid var(--ui_border)',
              borderRadius: '16px',
              color: 'var(--ui_text_muted)',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ui_danger)'
              e.currentTarget.style.borderColor = 'var(--ui_danger)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ui_text_muted)'
              e.currentTarget.style.borderColor = 'var(--ui_border)'
            }}
          >
            <SquareSquare size={14} />
            停止生成
          </button>
        </div>
      )}

      {uploaded_files.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {uploaded_files.map((file, index) => (
            <div key={index} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--ui_panel_alt)',
              border: '1px solid var(--ui_border)',
              borderRadius: '16px',
              fontSize: '12px',
            }}>
              <Paperclip size={14} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </span>
              <button
                onClick={() => on_remove_file(index)}
                style={{
                  background: 'none', border: 'none', color: 'var(--ui_text_muted)',
                  cursor: 'pointer', padding: '2px',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '12px',
        backgroundColor: 'var(--ui_panel_alt)',
        border: '1px solid var(--ui_border)',
        borderRadius: '12px',
        padding: '8px 12px',
        alignItems: 'center',
        transition: 'border-color 0.2s',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)',
      }}>
        <input
          type="file"
          ref={file_ref}
          style={{ display: 'none' }}
          multiple
          onChange={on_file_change}
        />
        <button
          onClick={() => file_ref.current?.click()}
          disabled={loading}
          style={{
            background: 'none', border: 'none',
            color: loading ? 'var(--ui_text_muted)' : 'var(--ui_text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px', borderRadius: '6px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <Plus size={20} />
        </button>

        <textarea
          value={input}
          onChange={(e) => on_change(e.target.value)}
          onKeyDown={on_key_down}
          placeholder="追问 Agent..."
          disabled={loading}
          style={{
            flex: 1,
            minHeight: '24px',
            maxHeight: '120px',
            padding: '8px 4px',
            backgroundColor: 'transparent',
            border: 'none',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            color: 'var(--ui_text)',
            lineHeight: '1.5',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={on_send}
            disabled={loading || (!input.trim() && uploaded_files.length === 0)}
            style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: loading || (!input.trim() && uploaded_files.length === 0) ? 'var(--ui_border)' : 'var(--ui_accent)',
              color: loading || (!input.trim() && uploaded_files.length === 0) ? 'var(--ui_text_muted)' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || (!input.trim() && uploaded_files.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
