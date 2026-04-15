/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话测试页面(支持展示思维链)
 */
import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Wrench, ChevronDown, ChevronRight, Loader2, Send, Plus, MessageCircle, Trash2, SquareSquare, PanelLeftClose, PanelLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ToolStep {
  type: 'tool_start' | 'tool_result'
  tool_name: string
  content: string
  success?: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning_content?: string
  steps?: ToolStep[]
}

interface ChatSession {
  id: string
  title: string
  updated_at: number
  messages: ChatMessage[]
  agent_id?: string
}

interface Agent {
  id: string
  name: string
  status: string
}

const STORAGE_KEY = 'trai_chat_sessions'

const AgentChat: React.FC = () => {
  const [sessions, set_sessions] = useState<ChatSession[]>([])
  const [active_session_id, set_active_session_id] = useState<string>('')
  const [available_agents, set_available_agents] = useState<Agent[]>([])
  const [is_sidebar_open, set_is_sidebar_open] = useState(true)
  const [input, set_input] = useState('')
  const [loading, set_loading] = useState(false)
  const [expanded_steps, set_expanded_steps] = useState<Record<string, boolean>>({})
  const messages_end_ref = useRef<HTMLDivElement>(null)
  
  const active_session_id_ref = useRef<string>('')

  // 初始化会话与 Agent 列表
  useEffect(() => {
    const init_data = async () => {
      try {
        const res = await window.electron_api.agent_management_list()
        if (res.success && res.data) {
          set_available_agents(res.data.filter((a: Agent) => a.status === 'running'))
        }
      } catch (err) {
        console.error('Failed to load agents', err)
      }
      
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.length > 0) {
            set_sessions(parsed)
            set_active_session_id(parsed[0].id)
            active_session_id_ref.current = parsed[0].id
            return
          }
        }
      } catch (e) {
        console.error('加载历史会话失败', e)
      }
      create_new_session()
    }
    
    init_data()
  }, [])

  useEffect(() => {
    active_session_id_ref.current = active_session_id
  }, [active_session_id])

  const create_new_session = () => {
    const new_session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: '新会话',
      updated_at: Date.now(),
      messages: []
    }
    set_sessions(prev => {
      const updated = [new_session, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    set_active_session_id(new_session.id)
  }

  const delete_session = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    set_sessions(prev => {
      const updated = prev.filter(s => s.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      if (active_session_id === id) {
        if (updated.length > 0) {
          set_active_session_id(updated[0].id)
        } else {
          setTimeout(create_new_session, 0)
        }
      }
      return updated
    })
  }

  const update_active_session_messages = (updater: (prev: ChatMessage[]) => ChatMessage[], target_sid: string = active_session_id_ref.current) => {
    set_sessions(prev_sessions => {
      const updated = prev_sessions.map(s => {
        if (s.id === target_sid) {
          const new_msgs = updater(s.messages)
          let title = s.title
          if (title === '新会话' && new_msgs.length > 0) {
            const first_user_msg = new_msgs.find(m => m.role === 'user')
            if (first_user_msg) {
              title = first_user_msg.content.slice(0, 15) + (first_user_msg.content.length > 15 ? '...' : '')
            }
          }
          return { ...s, messages: new_msgs, title, updated_at: Date.now() }
        }
        return s
      })
      updated.sort((a, b) => b.updated_at - a.updated_at)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const active_session = sessions.find(s => s.id === active_session_id)
  const messages = active_session ? active_session.messages : []

  const scroll_to_bottom = () => {
    messages_end_ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scroll_to_bottom()
  }, [messages])

  useEffect(() => {
    if (window.electron_api?.on_agent_chat_chunk) {
      const cleanup = window.electron_api.on_agent_chat_chunk((_event: any, chunk: any) => {
        const target_sid = chunk.session_id || active_session_id_ref.current
        update_active_session_messages(prev_msgs => {
          const new_msgs = [...prev_msgs]
          if (new_msgs.length > 0) {
            const last_msg = { ...new_msgs[new_msgs.length - 1] }
            if (last_msg.role === 'assistant') {
              if (chunk.type === 'token' && chunk.content) {
                last_msg.content += chunk.content
              } else if (chunk.type === 'reasoning' && chunk.content) {
                last_msg.reasoning_content = (last_msg.reasoning_content || '') + chunk.content
              } else if (chunk.type === 'tool_execution_start') {
                last_msg.steps = last_msg.steps || []
                last_msg.steps.push({
                  type: 'tool_start',
                  tool_name: chunk.tool_name,
                  content: chunk.content
                })
              } else if (chunk.type === 'tool_execution_result') {
                last_msg.steps = last_msg.steps || []
                last_msg.steps.push({
                  type: 'tool_result',
                  tool_name: chunk.tool_name,
                  content: chunk.content,
                  success: chunk.success
                })
              }
              new_msgs[new_msgs.length - 1] = last_msg
            }
          }
          return new_msgs
        }, target_sid)
      })
      return cleanup
    }
  }, [])

  const update_session_agent = (agent_id: string) => {
    set_sessions(prev => {
      const updated = prev.map(s => s.id === active_session_id ? { ...s, agent_id } : s)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handle_send = async () => {
    if (!input.trim() || !active_session_id) return
    
    const user_msg = input.trim()
    set_input('')
    
    const current_sid = active_session_id
    const current_agent_id = active_session?.agent_id || (available_agents.length > 0 ? available_agents[0].id : undefined)

    update_active_session_messages(prev => [...prev, { role: 'user', content: user_msg }], current_sid)
    update_active_session_messages(prev => [...prev, { role: 'assistant', content: '', reasoning_content: '', steps: [] }], current_sid)
    
    set_loading(true)
    
    try {
      const res = await window.electron_api.agent_chat(current_sid, user_msg, current_agent_id)
      if (!res.success && !(res as any).is_canceled) {
        update_active_session_messages(prev => {
          const new_msgs = [...prev]
          new_msgs[new_msgs.length - 1] = { 
            role: 'assistant', 
            content: `[错误] ${res.error || '请求失败'}` 
          }
          return new_msgs
        }, current_sid)
      }
    } catch (err: any) {
      update_active_session_messages(prev => {
        const new_msgs = [...prev]
        new_msgs[new_msgs.length - 1] = { 
          role: 'assistant', 
          content: `[异常] ${err.message}` 
        }
        return new_msgs
      }, current_sid)
    } finally {
      // 只有当前活动的会话才取消loading状态（如果用户切换了会话，不应该影响）
      if (active_session_id_ref.current === current_sid) {
        set_loading(false)
      }
    }
  }

  const handle_stop = async () => {
    if (!active_session_id) return
    try {
      await window.electron_api.agent_stop(active_session_id)
      set_loading(false)
    } catch (err) {
      console.error('Stop failed', err)
    }
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handle_send()
    }
  }

  const toggle_step = (id: string) => {
    set_expanded_steps(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      {/* 左侧会话列表 */}
      <div style={{ 
        width: is_sidebar_open ? '260px' : '0px', 
        opacity: is_sidebar_open ? 1 : 0,
        backgroundColor: '#ffffff', 
        borderRight: is_sidebar_open ? '1px solid #e2e8f0' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{ padding: '16px', minWidth: '260px' }}>
          <button
            onClick={create_new_session}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
          >
            <Plus size={18} />
            新建会话
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '260px' }}>
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => set_active_session_id(s.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: active_session_id === s.id ? '#e0f2fe' : 'transparent',
                color: active_session_id === s.id ? '#0369a1' : '#475569',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <MessageCircle size={18} style={{ flexShrink: 0, color: active_session_id === s.id ? '#0ea5e9' : '#94a3b8' }} />
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: active_session_id === s.id ? 500 : 400 }}>
                {s.title}
              </div>
              <div 
                onClick={(e) => delete_session(e, s.id)}
                style={{ 
                  padding: '4px', 
                  borderRadius: '4px', 
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <Trash2 size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧聊天区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => set_is_sidebar_open(!is_sidebar_open)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              marginRight: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={is_sidebar_open ? '收起会话列表' : '展开会话列表'}
          >
            {is_sidebar_open ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>{active_session?.title || 'AI 助手'}</h1>
          <span style={{ marginLeft: '12px', padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>思维链测试</span>
          
          {available_agents.length > 0 && (
            <select 
              value={active_session?.agent_id || available_agents[0]?.id || ''}
              onChange={(e) => update_session_agent(e.target.value)}
              style={{
                marginLeft: 'auto', // Pushes to the right
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
              title="选择对话 Agent"
            >
              {available_agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '14px' }}>
                尝试询问:"今天北京天气怎么样?" 来测试天气工具和思维链.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                }}>
                  <div style={{
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {msg.role === 'user' ? (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px 12px 0 12px',
                        backgroundColor: '#0ea5e9',
                        color: '#ffffff',
                        lineHeight: '1.6',
                        fontSize: '14px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        position: 'relative'
                      }}>
                        <div style={{
                          maxHeight: (!expanded_steps[`user_msg_${idx}`] && msg.content.length > 300) ? '120px' : 'none',
                          overflow: 'hidden',
                          position: 'relative',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {msg.content}
                          {(!expanded_steps[`user_msg_${idx}`] && msg.content.length > 300) && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '40px',
                              background: 'linear-gradient(to bottom, transparent, #0ea5e9)'
                            }} />
                          )}
                        </div>
                        {msg.content.length > 300 && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation()
                              toggle_step(`user_msg_${idx}`)
                            }}
                            style={{
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              cursor: 'pointer',
                              borderTop: '1px dashed rgba(255, 255, 255, 0.2)',
                              paddingTop: '8px',
                              userSelect: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                          >
                            {expanded_steps[`user_msg_${idx}`] ? (
                              <><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> 收起</>
                            ) : (
                              <><ChevronDown size={14} /> 展开全文</>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {msg.reasoning_content && (
                          <div style={{ 
                            backgroundColor: '#f1f5f9', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                          }}>
                            <div 
                              onClick={() => toggle_step(`reasoning_${idx}`)}
                              style={{ 
                                padding: '10px 14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                backgroundColor: '#f8fafc',
                                color: '#475569',
                                fontSize: '13px',
                                userSelect: 'none'
                              }}
                            >
                              <MessageSquare size={14} style={{ marginRight: '8px', color: '#64748b' }} />
                              <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                思考过程
                                {loading && idx === messages.length - 1 && !msg.content && (
                                  <Loader2 size={14} className="animate-spin" style={{ color: '#0ea5e9' }} />
                                )}
                              </span>
                              {expanded_steps[`reasoning_${idx}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                            {expanded_steps[`reasoning_${idx}`] && (
                              <div style={{ 
                                padding: '12px 14px', 
                                whiteSpace: 'pre-wrap', 
                                color: '#334155',
                                fontSize: '13px',
                                borderTop: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                lineHeight: '1.6'
                              }}>
                                {msg.reasoning_content}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {msg.steps && msg.steps.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.steps.map((step, s_idx) => {
                              const step_id = `step_${idx}_${s_idx}`
                              const is_start = step.type === 'tool_start'
                              const is_success = step.success === true
                              const is_fail = step.success === false
                              
                              let border_color = '#e2e8f0'
                              let bg_color = '#ffffff'
                              let header_bg = '#f8fafc'
                              let icon_color = '#64748b'
                              let text_color = '#475569'
                              let status_text = '执行中...'
                              
                              if (is_start) {
                                border_color = '#bae6fd'
                                header_bg = '#f0f9ff'
                                icon_color = '#0284c7'
                                text_color = '#0369a1'
                              } else if (is_success) {
                                border_color = '#bbf7d0'
                                header_bg = '#f0fdf4'
                                icon_color = '#16a34a'
                                text_color = '#15803d'
                                status_text = '已完成'
                              } else if (is_fail) {
                                border_color = '#fecaca'
                                header_bg = '#fef2f2'
                                icon_color = '#dc2626'
                                text_color = '#b91c1c'
                                status_text = '失败'
                              }

                              return (
                                <div key={s_idx} style={{
                                  borderRadius: '8px',
                                  border: `1px solid ${border_color}`,
                                  backgroundColor: bg_color,
                                  overflow: 'hidden'
                                }}>
                                  <div 
                                    onClick={() => toggle_step(step_id)}
                                    style={{
                                      padding: '10px 14px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      backgroundColor: header_bg,
                                      fontSize: '13px',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <Wrench size={14} style={{ marginRight: '8px', color: icon_color }} />
                                    <span style={{ color: text_color, fontWeight: 500, marginRight: '8px' }}>
                                      {step.tool_name}
                                    </span>
                                    <span style={{ flex: 1, color: '#94a3b8', fontSize: '12px' }}>
                                      {is_start ? '调用工具' : '返回结果'}
                                    </span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: text_color, fontSize: '12px', marginRight: '8px' }}>
                                      {is_start && <Loader2 size={12} className="animate-spin" />}
                                      {is_success && <CheckCircle2 size={12} />}
                                      {is_fail && <XCircle size={12} />}
                                      <span>{status_text}</span>
                                    </div>
                                    
                                    <div style={{ color: '#94a3b8' }}>
                                      {expanded_steps[step_id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                  </div>
                                  
                                  {expanded_steps[step_id] && (
                                    <div style={{ 
                                      padding: '12px 14px', 
                                      whiteSpace: 'pre-wrap', 
                                      wordBreak: 'break-all',
                                      color: '#334155',
                                      fontSize: '13px',
                                      borderTop: `1px solid ${border_color}`,
                                      backgroundColor: '#ffffff',
                                      fontFamily: 'monospace',
                                      lineHeight: '1.5'
                                    }}>
                                      {step.content}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {msg.content && (
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '0 12px 12px 12px',
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            lineHeight: '1.6',
                            fontSize: '14px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            overflowX: 'auto',
                            position: 'relative'
                          }}>
                            <div style={{
                              maxHeight: (!expanded_steps[`assistant_msg_${idx}`] && msg.content.length > 500 && !(loading && idx === messages.length - 1)) ? '240px' : 'none',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({node, ...props}) => <h1 style={{fontSize: '1.5em', fontWeight: 'bold', margin: '12px 0 8px'}} {...props} />,
                                  h2: ({node, ...props}) => <h2 style={{fontSize: '1.3em', fontWeight: 'bold', margin: '12px 0 8px'}} {...props} />,
                                  h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', margin: '10px 0 6px'}} {...props} />,
                                  p: ({node, ...props}) => <p style={{margin: '0 0 10px 0'}} {...props} />,
                                  ul: ({node, ...props}) => <ul style={{margin: '0 0 10px 0', paddingLeft: '24px'}} {...props} />,
                                  ol: ({node, ...props}) => <ol style={{margin: '0 0 10px 0', paddingLeft: '24px'}} {...props} />,
                                  li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                                  a: ({node, ...props}) => <a style={{color: '#0ea5e9', textDecoration: 'none'}} {...props} />,
                                  blockquote: ({node, ...props}) => <blockquote style={{margin: '0 0 10px 0', padding: '8px 16px', borderLeft: '4px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#64748b'}} {...props} />,
                                  code: ({node, className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                      <pre style={{margin: '12px 0', padding: '16px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '8px', overflowX: 'auto'}}>
                                        <code className={className} {...props}>{children}</code>
                                      </pre>
                                    ) : (
                                      <code style={{backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', color: '#0ea5e9'}} {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  table: ({node, ...props}) => <table style={{width: '100%', marginBottom: '16px', borderCollapse: 'collapse'}} {...props} />,
                                  th: ({node, ...props}) => <th style={{borderBottom: '2px solid #e2e8f0', padding: '8px', textAlign: 'left', fontWeight: 'bold'}} {...props} />,
                                  td: ({node, ...props}) => <td style={{borderBottom: '1px solid #e2e8f0', padding: '8px'}} {...props} />
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                              {(!expanded_steps[`assistant_msg_${idx}`] && msg.content.length > 500 && !(loading && idx === messages.length - 1)) && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '60px',
                                  background: 'linear-gradient(to bottom, transparent, #ffffff)'
                                }} />
                              )}
                            </div>
                            {(msg.content.length > 500 && !(loading && idx === messages.length - 1)) && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggle_step(`assistant_msg_${idx}`)
                                }}
                                style={{
                                  marginTop: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  borderTop: '1px dashed #e2e8f0',
                                  paddingTop: '8px',
                                  userSelect: 'none'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#0ea5e9'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                              >
                                {expanded_steps[`assistant_msg_${idx}`] ? (
                                  <><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /> 收起</>
                                ) : (
                                  <><ChevronDown size={14} /> 展开全文</>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ 
                  padding: '12px 16px', 
                  borderRadius: '0 12px 12px 12px', 
                  backgroundColor: '#ffffff', 
                  color: '#64748b',
                  fontSize: '14px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI 正在思考中...</span>
                </div>
              </div>
            )}
            <div ref={messages_end_ref} />
          </div>
          
          <div style={{ 
            padding: '20px 24px', 
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {loading && (
              <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <button
                  onClick={handle_stop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    color: '#64748b',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.borderColor = '#fecaca'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <SquareSquare size={14} />
                  停止生成
                </button>
              </div>
            )}
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 12px',
              alignItems: 'flex-end',
              transition: 'border-color 0.2s',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
            }}>
              <textarea
                value={input}
                onChange={(e) => set_input(e.target.value)}
                onKeyDown={handle_key_down}
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
                  color: '#1e293b',
                  lineHeight: '1.5'
                }}
              />
              <button
                onClick={handle_send}
                disabled={loading || !input.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: loading || !input.trim() ? '#e2e8f0' : '#0ea5e9',
                  color: loading || !input.trim() ? '#94a3b8' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentChat
