/**
 * 文件名: chat_input.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:25:00
 * 描述: 聊天输入框组件，支持快速命令、字符统计与多模态文件上传
 */
import React, { useRef, useState, useCallback } from 'react'
import { Plus, Send, SquareSquare, Paperclip, X, Zap, CornerDownLeft } from 'lucide-react'

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

const QUICK_COMMANDS = [
  { label: '天气查询', insert: '今天北京天气怎么样？' },
  { label: '写代码', insert: '帮我写一段 Python 代码，实现' },
  { label: '总结内容', insert: '请帮我总结一下这段内容：' },
  { label: '图片识别', insert: '请描述这张图片的内容' },
]

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
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  const [show_cmds, set_show_cmds] = useState(false)

  const insert_quick = useCallback((text: string) => {
    on_change(input ? `${input} ${text}` : text)
    set_show_cmds(false)
    textarea_ref.current?.focus()
  }, [input, on_change])

  const handle_send = () => {
    if (!loading && (input.trim() || uploaded_files.length > 0)) {
      on_send()
      set_show_cmds(false)
    }
  }

  const can_send = !loading && (input.trim().length > 0 || uploaded_files.length > 0)

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: 'var(--ui_panel)',
      borderTop: '1px solid var(--ui_border)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* 停止生成按钮 */}
      {loading && (
        <div style={{ position: 'absolute', top: '-44px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
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
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_danger)'; e.currentTarget.style.borderColor = 'var(--ui_danger)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.borderColor = 'var(--ui_border)' }}
          >
            <SquareSquare size={14} />
            停止生成
          </button>
        </div>
      )}

      {/* 快速命令 */}
      {!loading && input.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <Zap size={13} style={{ color: 'var(--ui_accent)', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                onClick={() => insert_quick(cmd.insert)}
                style={{
                  padding: '3px 10px',
                  backgroundColor: 'var(--ui_panel_alt)',
                  border: '1px solid var(--ui_border)',
                  borderRadius: '12px',
                  color: 'var(--ui_text_secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'
                  e.currentTarget.style.borderColor = 'var(--ui_accent)'
                  e.currentTarget.style.color = 'var(--ui_accent)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
                  e.currentTarget.style.borderColor = 'var(--ui_border)'
                  e.currentTarget.style.color = 'var(--ui_text_secondary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 文件已上传 */}
      {uploaded_files.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {uploaded_files.map((file, index) => (
            <div key={index} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--ui_accent_light)',
              border: '1px solid var(--ui_accent)',
              borderRadius: '16px',
              fontSize: '12px',
              color: 'var(--ui_accent)',
              animation: 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <Paperclip size={12} />
              <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </span>
              <button
                onClick={() => on_remove_file(index)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--ui_accent)', cursor: 'pointer', padding: '1px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入框主体 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        backgroundColor: 'var(--ui_panel_alt)',
        border: '1px solid var(--ui_border)',
        borderRadius: '12px',
        padding: '6px 8px',
        alignItems: 'flex-end',
        transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
        onFocus={() => {}}
      >
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
          title="添加附件"
          style={{
            background: 'none', border: 'none',
            color: loading ? 'var(--ui_text_muted)' : 'var(--ui_text_secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px 4px', borderRadius: '6px', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = 'var(--ui_border)'; e.currentTarget.style.color = 'var(--ui_accent)' } }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = loading ? 'var(--ui_text_muted)' : 'var(--ui_text_secondary)' }}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textarea_ref}
          value={input}
          onChange={(e) => on_change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handle_send()
            } else {
              on_key_down(e)
            }
          }}
          onFocus={() => set_show_cmds(false)}
          placeholder="输入消息，或使用上方快捷命令..."
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            minHeight: '28px',
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
            overflowY: 'auto',
          }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {input.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)' }}>
              {input.length}
            </span>
          )}
          <button
            onClick={handle_send}
            disabled={!can_send}
            title={input.length > 0 ? '发送 (Enter)' : '请输入内容'}
            style={{
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: can_send ? 'var(--ui_accent)' : 'var(--ui_border)',
              color: can_send ? 'white' : 'var(--ui_text_muted)',
              border: 'none',
              borderRadius: '8px',
              cursor: can_send ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: can_send ? 'scale(1)' : 'scale(0.95)',
              boxShadow: can_send ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => { if (can_send) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.4)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = can_send ? '0 2px 8px rgba(14, 165, 233, 0.3)' : 'none' }}
          >
            {can_send ? <Send size={16} /> : <CornerDownLeft size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
