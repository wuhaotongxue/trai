/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话测试页面，支持展示思维链 (CoT)
 */
import React, { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
}

const AgentChat: React.FC = () => {
  const [messages, set_messages] = useState<ChatMessage[]>([])
  const [input, set_input] = useState('')
  const [loading, set_loading] = useState(false)
  const messages_end_ref = useRef<HTMLDivElement>(null)
  
  // 简单的 session_id
  const [session_id] = useState(`session_${Date.now()}`)

  const scroll_to_bottom = () => {
    messages_end_ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scroll_to_bottom()
  }, [messages])

  const handle_send = async () => {
    if (!input.trim()) return
    
    const user_msg = input.trim()
    set_input('')
    set_messages(prev => [...prev, { role: 'user', content: user_msg }])
    set_loading(true)
    
    try {
      const res = await window.electron_api.agent_chat(session_id, user_msg)
      if (res.success && res.data) {
        set_messages(prev => [...prev, { 
          role: 'assistant', 
          content: res.data.content,
          reasoning_content: res.data.reasoning_content
        }])
      } else {
        set_messages(prev => [...prev, { 
          role: 'assistant', 
          content: `[错误]: ${res.error || '请求失败'}` 
        }])
      }
    } catch (err: any) {
      set_messages(prev => [...prev, { 
        role: 'assistant', 
        content: `[异常]: ${err.message}` 
      }])
    } finally {
      set_loading(false)
    }
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handle_send()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ color: '#202020', marginTop: 0, marginBottom: '16px' }}>AI 助手 (支持思维链测试)</h1>
      
      <div style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 聊天记录区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.4)', marginTop: '40px' }}>
              尝试询问：“今天北京天气怎么样？” 来测试天气工具和思维链。
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' 
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? '#0078d4' : '#f3f2f1',
                  color: msg.role === 'user' ? '#ffffff' : '#202020',
                  lineHeight: '1.5'
                }}>
                  {msg.reasoning_content && (
                    <details style={{ 
                      marginBottom: '12px', 
                      padding: '8px', 
                      backgroundColor: 'rgba(0,0,0,0.05)', 
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}>
                      <summary style={{ cursor: 'pointer', color: 'rgba(0,0,0,0.6)' }}>🤔 思考过程</summary>
                      <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0.7)' }}>
                        {msg.reasoning_content}
                      </div>
                    </details>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f3f2f1', color: 'rgba(0,0,0,0.5)' }}>
                AI 正在思考中...
              </div>
            </div>
          )}
          <div ref={messages_end_ref} />
        </div>
        
        {/* 输入区 */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '12px'
        }}>
          <textarea
            value={input}
            onChange={(e) => set_input(e.target.value)}
            onKeyDown={handle_key_down}
            placeholder="输入您的问题，按 Enter 发送..."
            disabled={loading}
            style={{
              flex: 1,
              height: '40px',
              minHeight: '40px',
              maxHeight: '120px',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(0,0,0,0.1)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handle_send}
            disabled={loading || !input.trim()}
            style={{
              padding: '0 24px',
              backgroundColor: loading || !input.trim() ? '#cccccc' : '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentChat
