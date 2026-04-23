/**
 * 文件名: message_bubble.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: 聊天消息气泡组件
 */
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, Paperclip } from 'lucide-react'
import type { ChatMessage } from '../types'

interface MessageBubbleProps {
  msg: ChatMessage
  idx: number
  expanded_steps: Record<string, boolean>
  toggle_step: (id: string) => void
  loading: boolean
  is_last: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  idx,
  expanded_steps,
  toggle_step,
  loading,
  is_last,
}) => {
  const is_user = msg.role === 'user'

  if (is_user) {
    return (
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px 12px 0 12px',
        backgroundColor: 'var(--ui_accent)',
        color: '#ffffff',
        lineHeight: '1.6',
        fontSize: '14px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        maxWidth: '85%',
        alignSelf: 'flex-end',
        animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{
          maxHeight: (!expanded_steps[`user_msg_${idx}`] && msg.content.length > 300) ? '120px' : 'none',
          overflow: 'hidden',
          position: 'relative',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {msg.content}
          {(!expanded_steps[`user_msg_${idx}`] && msg.content.length > 300) && (
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0, height: '40px',
              background: 'linear-gradient(to bottom, transparent, var(--ui_accent))',
            }} />
          )}
        </div>
        {msg.files && msg.files.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {msg.files.map((file, fi) => (
              <div key={fi} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px', fontSize: '12px',
              }}>
                <Paperclip size={14} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {(file.data.length * 0.75 / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}
        {msg.content.length > 300 && (
          <div
            onClick={(e) => { e.stopPropagation(); toggle_step(`user_msg_${idx}`) }}
            style={{
              marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer', borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
              paddingTop: '8px', userSelect: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)' }}
          >
            {expanded_steps[`user_msg_${idx}`]
              ? <><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> 收起</>
              : <><ChevronDown size={14} /> 展开全文</>
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '85%',
      alignSelf: 'flex-start',
      animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {msg.content && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '0 12px 12px 12px',
          backgroundColor: 'var(--ui_panel)',
          color: 'var(--ui_text)',
          lineHeight: '1.6',
          fontSize: '14px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--ui_border)',
          overflowX: 'auto',
          position: 'relative',
        }}>
          <div style={{
            maxHeight: (!expanded_steps[`assistant_msg_${idx}`] && msg.content.length > 500 && !(loading && is_last)) ? '240px' : 'none',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '12px 0 8px', color: 'var(--ui_text)' }} {...props} />,
                h2: ({node, ...props}) => <h2 style={{ fontSize: '1.3em', fontWeight: 'bold', margin: '12px 0 8px', color: 'var(--ui_text)' }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0 6px', color: 'var(--ui_text)' }} {...props} />,
                p: ({node, ...props}) => <p style={{ margin: '0 0 10px 0', color: 'var(--ui_text)' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ margin: '0 0 10px 0', paddingLeft: '24px', color: 'var(--ui_text)' }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ margin: '0 0 10px 0', paddingLeft: '24px', color: 'var(--ui_text)' }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: '4px', color: 'var(--ui_text)' }} {...props} />,
                a: ({node, ...props}) => <a style={{ color: 'var(--ui_accent)', textDecoration: 'none' }} {...props} />,
                blockquote: ({node, ...props}) => <blockquote style={{ margin: '0 0 10px 0', padding: '8px 16px', borderLeft: '4px solid var(--ui_border)', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text_muted)' }} {...props} />,
                code: ({node, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return match ? (
                    <pre style={{ margin: '12px 0', padding: '16px', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)', borderRadius: '8px', overflowX: 'auto' }}>
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code style={{ backgroundColor: 'var(--ui_panel_alt)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', color: 'var(--ui_accent)' }} {...props}>
                      {children}
                    </code>
                  )
                },
                table: ({node, ...props}) => <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }} {...props} />,
                th: ({node, ...props}) => <th style={{ borderBottom: '2px solid var(--ui_border)', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: 'var(--ui_text)' }} {...props} />,
                td: ({node, ...props}) => <td style={{ borderBottom: '1px solid var(--ui_border)', padding: '8px', color: 'var(--ui_text)' }} {...props} />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {(!expanded_steps[`assistant_msg_${idx}`] && msg.content.length > 500 && !(loading && is_last)) && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                background: 'linear-gradient(to bottom, transparent, var(--ui_panel))',
              }} />
            )}
          </div>
          {(msg.content.length > 500 && !(loading && is_last)) && (
            <div
              onClick={(e) => { e.stopPropagation(); toggle_step(`assistant_msg_${idx}`) }}
              style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '4px', fontSize: '12px', color: 'var(--ui_text_muted)',
                cursor: 'pointer', borderTop: '1px dashed var(--ui_border)',
                paddingTop: '8px', userSelect: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ui_accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ui_text_muted)' }}
            >
              {expanded_steps[`assistant_msg_${idx}`]
                ? <><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> 收起</>
                : <><ChevronDown size={14} /> 展开全文</>
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBubble
