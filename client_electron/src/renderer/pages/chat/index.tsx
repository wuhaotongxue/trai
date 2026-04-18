/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:45:00
 * 描述: 客户端 Agent 对话测试页面(支持展示思维链)
 */
import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Wrench, ChevronDown, ChevronRight, Loader2, Send, Plus, MessageCircle, Trash2, SquareSquare, PanelLeftClose, PanelLeftOpen, MessageSquarePlus, Paperclip, X, Database, Bot, List } from 'lucide-react'
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
  kb_id?: string
}

interface Agent {
  id: string
  name: string
  status: string
}

interface KnowledgeBase {
  id: string
  name: string
}

const STORAGE_KEY = 'trai_chat_sessions'

const AgentChat: React.FC = () => {
  const [sessions, set_sessions] = useState<ChatSession[]>([])
  const [active_session_id, set_active_session_id] = useState<string>('')
  const [available_agents, set_available_agents] = useState<Agent[]>([])
  const [available_kbs, set_available_kbs] = useState<KnowledgeBase[]>([])
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_agent_id, set_active_agent_id] = useState<string>('')
  const [input, set_input] = useState('')
  const [loading, set_loading] = useState(false)
  const [expanded_steps, set_expanded_steps] = useState<Record<string, boolean>>({})
  const messages_end_ref = useRef<HTMLDivElement>(null)
  
  const active_session_id_ref = useRef<string>('')

  // 初始化会话与 Agent/知识库 列表
  useEffect(() => {
    const init_data = async () => {
      try {
        const res = await window.electron_api.agent_management_list()
        if (res.success && res.data) {
          // 只显示运行中的 Agent
          const running_agents = res.data.filter((a: Agent) => a.status === 'running')
          set_available_agents(running_agents)
          // 默认选择第一个 Agent（如果有）
          if (running_agents.length > 0) {
            set_active_agent_id(running_agents[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load agents', err)
      }
      
      try {
        if (window.electron_api.kb_list_indices) {
          const res = await window.electron_api.kb_list_indices()
          if (res.success) {
            const idx_source = res.data?.data?.items || res.data?.items || res.data?.data || res.data || []
            const idx_items: any[] = Array.isArray(idx_source) ? idx_source : []
            set_available_kbs(idx_items.map((it: any) => ({
              id: String(it.index_id || it.indexId || it.IndexId || it.id || it.Id || ''),
              name: String(it.index_name || it.indexName || it.IndexName || it.name || it.Name || '')
            })).filter(k => k.id && k.name))
          }
        }
      } catch (err) {
        console.error('Failed to load kbs', err)
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
      messages: [],
      agent_id: active_agent_id
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
    const is_current_session = active_session_id === id
    const new_sessions = sessions.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(new_sessions))
    set_sessions(new_sessions)
    if (is_current_session) {
      if (new_sessions.length > 0) {
        set_active_session_id(new_sessions[0].id)
      } else {
        create_new_session()
      }
    }
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
                // 只添加有真实工具名的事件
                if (chunk.tool_name && chunk.tool_name.trim()) {
                  last_msg.steps = last_msg.steps || []
                  last_msg.steps.push({
                    type: 'tool_start',
                    tool_name: chunk.tool_name,
                    content: chunk.content
                  })
                }
              } else if (chunk.type === 'tool_execution_result') {
                // 只添加有真实工具名的事件
                if (chunk.tool_name && chunk.tool_name.trim()) {
                  last_msg.steps = last_msg.steps || []
                  last_msg.steps.push({
                    type: 'tool_result',
                    tool_name: chunk.tool_name,
                    content: chunk.content,
                    success: chunk.success
                  })
                }
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
    set_active_agent_id(agent_id)
    set_sessions(prev => {
      const updated = prev.map(s => s.id === active_session_id ? { ...s, agent_id } : s)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const update_session_kb = (kb_id: string) => {
    set_sessions(prev => {
      const updated = prev.map(s => s.id === active_session_id ? { ...s, kb_id: kb_id === 'none' ? undefined : kb_id } : s)
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
    const current_kb_id = active_session?.kb_id

    update_active_session_messages(prev => [...prev, { role: 'user', content: user_msg }], current_sid)
    update_active_session_messages(prev => [...prev, { role: 'assistant', content: '', reasoning_content: '', steps: [] }], current_sid)
    
    set_loading(true)
    
    try {
      const res = await window.electron_api.agent_chat(current_sid, user_msg, current_agent_id, current_kb_id)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>AI 对话</h1>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '18%' : '0px',
          minWidth: is_left_sidebar_open ? '100px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#f1f5f9',
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>智能助手</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起 Agent 栏"
              aria-label="收起 Agent 栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '180px', boxSizing: 'border-box' }}>
            {available_agents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>暂无可用 Agent</div>
            ) : (
              available_agents.map(agent => (
                <div 
                  key={agent.id}
                  onClick={() => {
                    set_active_agent_id(agent.id)
                    update_session_agent(agent.id)
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: active_agent_id === agent.id ? '#e0f2fe' : 'transparent',
                    color: active_agent_id === agent.id ? '#0369a1' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontWeight: active_agent_id === agent.id ? 600 : 400,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (active_agent_id !== agent.id) e.currentTarget.style.backgroundColor = '#e2e8f0'
                  }}
                  onMouseLeave={(e) => {
                    if (active_agent_id !== agent.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} />
                    {agent.name}
                  </div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 
                      agent.status === 'running' ? '#10b981' : 
                      agent.status === 'stopped' ? '#94a3b8' : '#ef4444'
                  }} />
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          width: is_middle_sidebar_open ? '20%' : '0px',
          minWidth: is_middle_sidebar_open ? '120px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff',
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开 Agent 栏"
                  aria-label="展开 Agent 栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>对话记录</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起会话列表"
              aria-label="收起会话列表"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={18} />
            </button>
          </div>
          
          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', minWidth: '200px', boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={create_new_session}
              aria-label="新建会话"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', backgroundColor: 'transparent', color: '#0ea5e9', border: '1px dashed #0ea5e9',
                borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={14} /> 新建会话
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>暂无会话</div>
            ) : (
              sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => set_active_session_id(s.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: active_session_id === s.id ? '#e0f2fe' : 'transparent',
                    color: active_session_id === s.id ? '#0369a1' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontWeight: active_session_id === s.id ? 600 : 400,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = '#f1f5f9'
                  }}
                  onMouseLeave={(e) => {
                    if (active_session_id !== s.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <MessageCircle size={16} />
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              ))
            )}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '16px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            {!is_middle_sidebar_open && (
              <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '12px', gap: '4px' }}>
                {!is_left_sidebar_open && (
                  <button
                    onClick={() => set_is_left_sidebar_open(true)}
                    title="展开 Agent 栏"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PanelLeftOpen size={20} />
                  </button>
                )}
                <button
                  onClick={() => set_is_middle_sidebar_open(true)}
                  title="展开会话栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <List size={20} />
                </button>
              </div>
            )}
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>{active_session?.title || 'AI 助手'}</h1>
            <span className="no-drag-region" style={{ marginLeft: '12px', padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px' }}>思维链测试</span>
            
            <div className="no-drag-region" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {available_kbs.length > 0 && (
                <select 
                  value={active_session?.kb_id || 'none'}
                  onChange={(e) => update_session_kb(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px', lineHeight: '1.5',
                    outline: 'none', cursor: 'pointer', fontWeight: 500, maxWidth: '300px', minWidth: '200px', textOverflow: 'ellipsis'
                  }}
                  title="选择知识库(可选)"
                >
                  <option value="none">无知识库</option>
                  {available_kbs.map(k => (
                    <option key={k.id} value={k.id} style={{ padding: '10px 14px', fontSize: '14px' }}>{k.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
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
                        
                        {(() => {
                          // 过滤步骤，只保留有意义的
                          const valid_steps = (msg.steps || []).filter(step => {
                            if (!step.tool_name || !step.tool_name.trim()) return false
                            // 过滤掉空内容的结果
                            if (step.content && step.content.trim() === '{}') return false
                            return true
                          })

                          // 去重：只保留每个工具的最后一个结果
                          const unique_steps: ToolStep[] = []
                          const tool_latest: Record<string, ToolStep> = {}
                          
                          for (const step of valid_steps.reverse()) {
                            const key = `${step.tool_name}_${step.type}`
                            if (!tool_latest[key]) {
                              tool_latest[key] = step
                              unique_steps.unshift(step)
                            }
                          }

                          if (unique_steps.length === 0) return null

                          // 找出最后的成功结果
                          const has_any_success = unique_steps.some(step => 
                            step.type === 'tool_result' && step.success === true
                          )

                          return (
                            <div style={{ 
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff'
                            }}>
                              <div 
                                onClick={() => toggle_step(`all_steps_${idx}`)}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  backgroundColor: '#f8fafc',
                                  fontSize: '13px',
                                  userSelect: 'none'
                                }}
                              >
                                <Wrench size={14} style={{ marginRight: '8px', color: has_any_success ? '#16a34a' : '#64748b' }} />
                                <span style={{ color: '#475569', fontWeight: 500 }}>
                                  工具调用 {has_any_success ? '✅' : ''}
                                </span>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                                  {expanded_steps[`all_steps_${idx}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                              </div>
                              
                              {expanded_steps[`all_steps_${idx}`] && (
                                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                                  {unique_steps.map((step, s_idx) => {
                                    const step_id = `step_${idx}_${s_idx}`
                                    const is_start = step.type === 'tool_start'
                                    const is_success = step.success === true
                                    const is_fail = step.success === false
                                    
                                    let border_color = '#e2e8f0'
                                    let header_bg = '#ffffff'
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
                                        borderBottom: s_idx < unique_steps.length - 1 ? '1px solid #e2e8f0' : 'none'
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
                            </div>
                          )
                        })()}
                        
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
            padding: '16px 24px', 
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
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
              
              {/* 工具栏：发送按钮 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
    </div>
    </div>
  )
}

export default AgentChat

