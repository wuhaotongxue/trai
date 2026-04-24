/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:15:00
 * 描述: 客户端 Agent 对话测试页面(支持展示思维链)
 */
import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Loader2, PanelLeftOpen, List, ChevronDown, ChevronRight } from 'lucide-react'
import { STORAGE_KEY, type ChatSession, type Agent, type KnowledgeBase } from './types'
import AgentSidebar from './components/agent_sidebar'
import SessionSidebar from './components/session_sidebar'
import MessageBubble from './components/message_bubble'
import ToolSteps from './components/tool_steps'
import ChatInput from './components/chat_input'

const AgentChat: React.FC = () => {
  const [sessions, set_sessions] = useState<ChatSession[]>([])
  const [active_session_id, set_active_session_id] = useState<string>('')
  const [available_agents, set_available_agents] = useState<Agent[]>([])
  const [available_kbs, set_available_kbs] = useState<KnowledgeBase[]>([])
  const [is_left_open, set_is_left_open] = useState(true)
  const [is_middle_open, set_is_middle_open] = useState(true)
  const [active_agent_id, set_active_agent_id] = useState<string>('')
  const [input, set_input] = useState('')
  const [loading, set_loading] = useState(false)
  const [expanded_steps, set_expanded_steps] = useState<Record<string, boolean>>({})
  const [uploaded_files, set_uploaded_files] = useState<Array<{ name: string; type: string; data: string }>>([])
  const file_input_ref = useRef<HTMLInputElement>(null)
  const messages_end_ref = useRef<HTMLDivElement>(null)
  const active_session_id_ref = useRef<string>('')

  const active_session = sessions.find(s => s.id === active_session_id)
  const messages = active_session ? active_session.messages : []

  useEffect(() => {
    const init_data = async () => {
      try {
        const res = await window.electron_api.agent_management_list()
        if (res.success && res.data) {
          const running = res.data.filter((a: Agent) => a.status === 'running')
          set_available_agents(running)
          if (running.length > 0) set_active_agent_id(running[0].id)
        }
      } catch { /* ignore */ }

      try {
        if (window.electron_api.kb_list_indices) {
          const res = await window.electron_api.kb_list_indices()
          if (res.success) {
            const items: any[] = Array.isArray(res.data) ? res.data : []
            set_available_kbs(items.map((it: any) => ({
              id: String(it.index_id || it.indexName || it.id || ''),
              name: String(it.index_name || it.indexName || it.name || ''),
            })).filter((k: { id: string; name: string }) => k.id && k.name))
          }
        }
      } catch { /* ignore */ }

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
      } catch { /* ignore */ }

      create_new_session()
    }
    init_data()
  }, [])

  useEffect(() => {
    active_session_id_ref.current = active_session_id
  }, [active_session_id])

  const create_new_session = () => {
    const s: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: '新会话',
      updated_at: Date.now(),
      messages: [],
      agent_id: active_agent_id,
    }
    set_sessions(prev => {
      const updated = [s, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    set_active_session_id(s.id)
  }

  const delete_session = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const is_current = active_session_id === id
    const new_sessions = sessions.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(new_sessions))
    set_sessions(new_sessions)
    if (is_current) {
      if (new_sessions.length > 0) set_active_session_id(new_sessions[0].id)
      else create_new_session()
    }
  }

  const handle_file_upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const new_files: Array<{ name: string; type: string; data: string }> = []
    let processed = 0
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          new_files.push({ name: file.name, type: file.type, data: event.target.result as string })
        }
        processed++
        if (processed === files.length) set_uploaded_files(prev => [...prev, ...new_files])
      }
      reader.readAsDataURL(file)
    })
    if (file_input_ref.current) file_input_ref.current.value = ''
  }

  const remove_file = (index: number) => {
    set_uploaded_files(prev => prev.filter((_, i) => i !== index))
  }

  const update_session = (updater: (prev: typeof sessions) => typeof sessions) => {
    set_sessions(prev => {
      const updated = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const update_messages = (msg_updater: (msgs: any[]) => any[], sid?: string) => {
    const target = sid || active_session_id_ref.current
    update_session(prev => prev.map(s => {
      if (s.id !== target) return s
      const new_msgs = msg_updater(s.messages)
      let title = s.title
      if (title === '新会话' && new_msgs.length > 0) {
        const first = new_msgs.find((m: any) => m.role === 'user')
        if (first) title = first.content.slice(0, 15) + (first.content.length > 15 ? '...' : '')
      }
      return { ...s, messages: new_msgs, title, updated_at: Date.now() }
    }).sort((a, b) => b.updated_at - a.updated_at))
  }

  const scroll_to_bottom = () => {
    messages_end_ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scroll_to_bottom() }, [messages])

  useEffect(() => {
    if (!window.electron_api?.on_agent_chat_chunk) return
    const cleanup = window.electron_api.on_agent_chat_chunk((_event: any, chunk: any) => {
      const target_sid = chunk.session_id || active_session_id_ref.current
      update_messages(prev_msgs => {
        const new_msgs = [...prev_msgs]
        if (new_msgs.length === 0) return new_msgs
        const last = { ...new_msgs[new_msgs.length - 1] }
        if (last.role !== 'assistant') return new_msgs
        if (chunk.type === 'token' && chunk.content) last.content += chunk.content
        else if (chunk.type === 'reasoning' && chunk.content) {
          last.reasoning_content = (last.reasoning_content || '') + chunk.content
        } else if (chunk.type === 'tool_execution_start' && chunk.tool_name?.trim()) {
          last.steps = last.steps || []
          last.steps.push({ type: 'tool_start', tool_name: chunk.tool_name, content: chunk.content })
        } else if (chunk.type === 'tool_execution_result' && chunk.tool_name?.trim()) {
          last.steps = last.steps || []
          last.steps.push({ type: 'tool_result', tool_name: chunk.tool_name, content: chunk.content, success: chunk.success })
        }
        new_msgs[new_msgs.length - 1] = last
        return new_msgs
      }, target_sid)
    })
    return cleanup
  }, [])

  const handle_send = async () => {
    if (!input.trim() && uploaded_files.length === 0) return
    const user_msg = input.trim()
    set_input('')
    const current_sid = active_session_id
    const current_agent = active_session?.agent_id || available_agents[0]?.id
    const files = uploaded_files
    set_uploaded_files([])

    update_messages(msgs => [...msgs, { role: 'user', content: user_msg, files }], current_sid)
    update_messages(msgs => [...msgs, { role: 'assistant', content: '', reasoning_content: '', steps: [] }], current_sid)
    set_loading(true)

    try {
      const res = await window.electron_api.agent_chat(current_sid, user_msg, current_agent, active_session?.kb_id, files)
      if (!res.success && !(res as any).is_canceled) {
        update_messages(msgs => {
          const copy = [...msgs]
          copy[copy.length - 1] = { role: 'assistant', content: `[错误] ${res.error || '请求失败'}` }
          return copy
        }, current_sid)
      }
    } catch (err: any) {
      update_messages(msgs => {
        const copy = [...msgs]
        copy[copy.length - 1] = { role: 'assistant', content: `[异常] ${err.message}` }
        return copy
      }, current_sid)
    } finally {
      if (active_session_id_ref.current === current_sid) set_loading(false)
    }
  }

  const handle_stop = async () => {
    if (!active_session_id) return
    try {
      await window.electron_api.agent_stop(active_session_id)
      set_loading(false)
    } catch { /* ignore */ }
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handle_send()
    }
  }

  const toggle_step = (id: string) => {
    set_expanded_steps(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_bg)', position: 'relative' }}>
      <div className="drag-region" style={{
        padding: '20px 24px', backgroundColor: 'var(--ui_panel)',
        borderBottom: '1px solid var(--ui_border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>智能对话</span>
        </div>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <AgentSidebar
          agents={available_agents}
          active_agent_id={active_agent_id}
          is_open={is_left_open}
          on_toggle={() => set_is_left_open(v => !v)}
          on_select={(id) => {
            set_active_agent_id(id)
            update_session(prev => prev.map(s => s.id === active_session_id ? { ...s, agent_id: id } : s))
          }}
        />

        <SessionSidebar
          sessions={sessions}
          active_session_id={active_session_id}
          is_open={is_middle_open}
          left_open={is_left_open}
          on_toggle={() => set_is_middle_open(v => !v)}
          on_toggle_left={() => set_is_left_open(v => !v)}
          on_select={set_active_session_id}
          on_create={create_new_session}
          on_delete={delete_session}
          on_edit={(e, s) => {
            const inp = (e as any).currentTarget?.closest('[data-edit]')?.querySelector('input')
            const name = inp?.value?.trim() || s.title
            if (!name) return
            update_session(prev => prev.map(x => x.id === s.id ? { ...x, title: name } : x))
          }}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{
            padding: '12px 16px', backgroundColor: 'var(--ui_panel)',
            borderBottom: '1px solid var(--ui_border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!is_middle_open && (
                <button
                  onClick={() => set_is_middle_open(true)}
                  title="展开会话栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <List size={20} />
                </button>
              )}
              {!is_left_open && (
                <button
                  onClick={() => set_is_left_open(true)}
                  title="展开 Agent 栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <PanelLeftOpen size={20} />
                </button>
              )}
              <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>
                {active_session?.title || 'AI 助手'}
              </span>
            </div>

            <div className="no-drag-region" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {available_kbs.length > 0 && (
                <select
                  value={active_session?.kb_id || 'none'}
                  onChange={(e) => update_session(prev => prev.map(s => s.id === active_session_id ? { ...s, kb_id: e.target.value === 'none' ? undefined : e.target.value } : s))}
                  style={{
                    padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--ui_border)',
                    backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)',
                    fontSize: '14px', outline: 'none', cursor: 'pointer',
                    maxWidth: '300px', minWidth: '200px',
                  }}
                >
                  <option value="none">无知识库</option>
                  {available_kbs.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              flex: 1, overflowY: 'auto', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '24px',
              minWidth: 0, backgroundColor: 'var(--ui_bg)',
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '24px', marginTop: '48px', animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--ui_accent), #0284c7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
                    animation: 'subtleBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both',
                  }}>
                    <MessageSquare size={28} color="white" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--ui_text)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                      开始与 AI 对话
                    </div>
                    <div style={{ color: 'var(--ui_text_muted)', fontSize: '13px', lineHeight: 1.6 }}>
                      试试这样问：<span style={{ color: 'var(--ui_accent)', fontWeight: 500 }}>今天北京天气怎么样？</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both' }}>
                    {[
                      '帮我写一段 Python 代码',
                      '解释一下什么是机器学习',
                      '推荐几本好书',
                    ].map((tip, ti) => (
                      <button
                        key={ti}
                        type="button"
                        onClick={() => set_input(tip)}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: 'var(--ui_panel)',
                          border: '1px solid var(--ui_border)',
                          borderRadius: '20px',
                          color: 'var(--ui_text_secondary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'
                          e.currentTarget.style.borderColor = 'var(--ui_accent)'
                          e.currentTarget.style.color = 'var(--ui_accent)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_panel)'
                          e.currentTarget.style.borderColor = 'var(--ui_border)'
                          e.currentTarget.style.color = 'var(--ui_text_secondary)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {tip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {msg.role === 'assistant' && msg.reasoning_content && (
                      <div style={{
                        backgroundColor: 'var(--ui_panel_alt)',
                        borderRadius: '8px', border: '1px solid var(--ui_border)', overflow: 'hidden',
                        maxWidth: '85%',
                      }}>
                        <div
                          onClick={() => toggle_step(`reasoning_${idx}`)}
                          style={{
                            padding: '10px 14px', display: 'flex', alignItems: 'center',
                            cursor: 'pointer', backgroundColor: 'var(--ui_panel)',
                            color: 'var(--ui_text)', fontSize: '13px', userSelect: 'none',
                          }}
                        >
                          <MessageSquare size={14} style={{ marginRight: '8px', color: 'var(--ui_text_muted)' }} />
                          <span style={{ flex: 1 }}>思考过程</span>
                          {loading && idx === messages.length - 1 && !msg.content && (
                            <Loader2 size={14} className="anim_spin" style={{ color: 'var(--ui_accent)' }} />
                          )}
                          {expanded_steps[`reasoning_${idx}`]
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />
                          }
                        </div>
                        {expanded_steps[`reasoning_${idx}`] && (
                          <div style={{
                            padding: '12px 14px', whiteSpace: 'pre-wrap',
                            color: 'var(--ui_text)', fontSize: '13px',
                            borderTop: '1px solid var(--ui_border)',
                            backgroundColor: 'var(--ui_panel)', lineHeight: '1.6',
                          }}>
                            {msg.reasoning_content}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.role === 'assistant' && (msg.steps?.length ?? 0) > 0 && (
                      <div style={{ maxWidth: '85%', animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        <ToolSteps
                          steps={msg.steps!}
                          idx={idx}
                          expanded_steps={expanded_steps}
                          toggle_step={toggle_step}
                        />
                      </div>
                    )}

                    <MessageBubble
                      msg={msg}
                      idx={idx}
                      expanded_steps={expanded_steps}
                      toggle_step={toggle_step}
                      loading={loading}
                      is_last={idx === messages.length - 1}
                    />
                  </div>
                ))
              )}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: '0 12px 12px 12px',
                    backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text_muted)',
                    fontSize: '14px', border: '1px solid var(--ui_border)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <Loader2 size={16} className="anim_spin" />
                    <span>AI 正在思考中...</span>
                  </div>
                </div>
              )}

              <div ref={messages_end_ref} />
            </div>

            <ChatInput
              input={input}
              on_change={set_input}
              on_send={handle_send}
              on_key_down={handle_key_down}
              on_file_change={handle_file_upload}
              on_remove_file={remove_file}
              on_stop={handle_stop}
              uploaded_files={uploaded_files}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentChat
