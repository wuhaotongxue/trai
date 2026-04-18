/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:00:00
 * 描述: Agent 管理页面，支持列表、注册、启停 - 三段式布局
 */
import React, { useState, useEffect } from 'react'
import { Bot, Plus, Play, Square, Loader2, RefreshCw, Activity, PanelLeftOpen, List, Settings, Edit, Wrench, Sparkles, Cpu, MessageSquare, BrainCircuit, Calculator, Cloud } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  model: string
  system_prompt: string
  icon: string
  status: 'running' | 'stopped' | 'error'
  created_at: string
}

const icon_options = [
  { value: 'Bot', label: 'Bot', component: Bot },
  { value: 'Wrench', label: 'Wrench', component: Wrench },
  { value: 'Sparkles', label: 'Sparkles', component: Sparkles },
  { value: 'Cpu', label: 'Cpu', component: Cpu },
  { value: 'MessageSquare', label: 'MessageSquare', component: MessageSquare },
  { value: 'BrainCircuit', label: 'BrainCircuit', component: BrainCircuit },
  { value: 'Calculator', label: 'Calculator', component: Calculator },
  { value: 'Cloud', label: 'Cloud', component: Cloud },
]

const model_options = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'qwen-max', label: 'Qwen Max' },
]

const AgentManagement: React.FC = () => {
  const [agents, set_agents] = useState<Agent[]>([])
  const [loading, set_loading] = useState(false)
  const [error, set_error] = useState('')
  const [checking_id, set_checking_id] = useState<string | null>(null)

  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_agent_id, set_active_agent_id] = useState<string>('')

  const [show_register_modal, set_show_register_modal] = useState(false)
  const [show_edit_modal, set_show_edit_modal] = useState(false)
  
  const [new_agent, set_new_agent] = useState({ name: '', description: '', model: 'gpt-4o', system_prompt: '', icon: 'Bot' })
  const [edit_agent, set_edit_agent] = useState<Agent | null>(null)
  const [registering, set_registering] = useState(false)
  const [updating, set_updating] = useState(false)

  const fetch_agents = async () => {
    set_loading(true)
    try {
      const res = await window.electron_api.agent_management_list()
      if (res.success) {
        const agent_list = res.data || []
        set_agents(agent_list)
        if (agent_list.length > 0 && !active_agent_id) {
          set_active_agent_id(agent_list[0].id)
        }
      } else {
        set_error(res.error || 'Failed to fetch agents')
      }
    } catch (err: any) {
      set_error(err.message || 'Failed to fetch agents')
    } finally {
      set_loading(false)
    }
  }

  useEffect(() => {
    fetch_agents()
  }, [])

  const handle_toggle = async (id: string, current_status: string) => {
    const action = current_status === 'running' ? 'stop' : 'start'
    try {
      const res = await window.electron_api.agent_management_toggle(id, action)
      if (res.success) {
        fetch_agents()
      } else {
        alert(res.error || 'Operation failed')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handle_check = async (id: string) => {
    set_checking_id(id)
    try {
      const res = await window.electron_api.agent_management_check(id)
      if (res.success) {
        fetch_agents()
        if (!res.data.is_normal) {
          alert('Agent status check failed. Please check logs.')
        }
      } else {
        alert(res.error || 'Check failed')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      set_checking_id(null)
    }
  }

  const handle_register = async () => {
    if (!new_agent.name || !new_agent.description || !new_agent.system_prompt) {
      alert('Please fill in all fields')
      return
    }
    set_registering(true)
    try {
      const res = await window.electron_api.agent_management_register(
        new_agent.name,
        new_agent.description,
        new_agent.model,
        new_agent.system_prompt,
        new_agent.icon
      )
      if (res.success) {
        set_show_register_modal(false)
        set_new_agent({ name: '', description: '', model: 'gpt-4o', system_prompt: '', icon: 'Bot' })
        fetch_agents()
      } else {
        alert(res.error || 'Register failed')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      set_registering(false)
    }
  }

  const handle_edit = async () => {
    if (!edit_agent) return
    if (!edit_agent.name || !edit_agent.description || !edit_agent.system_prompt) {
      alert('Please fill in all fields')
      return
    }
    set_updating(true)
    try {
      const res = await window.electron_api.agent_management_update(
        edit_agent.id,
        edit_agent.name,
        edit_agent.description,
        edit_agent.model,
        edit_agent.system_prompt,
        edit_agent.icon
      )
      if (res.success) {
        set_show_edit_modal(false)
        set_edit_agent(null)
        fetch_agents()
      } else {
        alert(res.error || 'Update failed')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      set_updating(false)
    }
  }

  const open_edit_modal = (agent: Agent) => {
    set_edit_agent({ ...agent })
    set_show_edit_modal(true)
  }

  const active_agent = agents.find(a => a.id === active_agent_id)

  const get_icon_component = (icon_name: string) => {
    const icon = icon_options.find(opt => opt.value === icon_name)
    return icon ? icon.component : Bot
  }

  const IconComponent = active_agent ? get_icon_component(active_agent.icon) : Bot

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>Agent 管理</h1>
        </div>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '200px' : '0px',
          minWidth: is_left_sidebar_open ? '180px' : '0px',
          maxWidth: is_left_sidebar_open ? '250px' : '0px',
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>Agent列表</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="Collapse"
              aria-label="Collapse"
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => set_show_register_modal(true)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0ea5e9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontWeight: 600,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={16} />
                新建 Agent
              </button>
            </div>

            <div style={{ marginBottom: '8px', padding: '0 4px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              已注册 Agent
            </div>
            {agents.map(agent => {
              const AgentIcon = get_icon_component(agent.icon)
              return (
                <div
                  key={agent.id}
                  onClick={() => set_active_agent_id(agent.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: active_agent_id === agent.id ? '#e0f2fe' : 'transparent',
                    color: active_agent_id === agent.id ? '#0369a1' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
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
                  <AgentIcon size={16} />
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              )
            })}
          </div>
        </div>

        <div style={{
          width: is_middle_sidebar_open ? '220px' : '0px',
          minWidth: is_middle_sidebar_open ? '200px' : '0px',
          maxWidth: is_middle_sidebar_open ? '300px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff',
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="Expand"
                  aria-label="Expand"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>操作面板</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="Collapse"
              aria-label="Collapse"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {active_agent ? (
              <div>
                <div style={{ marginBottom: '12px', padding: '0 4px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  状态操作
                </div>
                <button
                  onClick={() => handle_toggle(active_agent.id, active_agent.status)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: active_agent.status === 'running' ? '#fef2f2' : '#ecfdf5',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: active_agent.status === 'running' ? '#ef4444' : '#10b981',
                    fontWeight: 600,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {active_agent.status === 'running' ? <Square size={16} /> : <Play size={16} />}
                  {active_agent.status === 'running' ? '停止 Agent' : '启动 Agent'}
                </button>

                <button
                  onClick={() => handle_check(active_agent.id)}
                  disabled={checking_id === active_agent.id}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: checking_id === active_agent.id ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: '#475569',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {checking_id === active_agent.id ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                  {checking_id === active_agent.id ? '检测中...' : '检测状态'}
                </button>

                <button
                  onClick={() => open_edit_modal(active_agent)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#475569',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Edit size={16} />
                  编辑 Agent
                </button>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: '8px', padding: '0 4px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    基本信息
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500, color: '#64748b' }}>名称:</span> {active_agent.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500, color: '#64748b' }}>状态:</span>
                    <span style={{
                      color: active_agent.status === 'running' ? '#10b981' : active_agent.status === 'error' ? '#ef4444' : '#64748b',
                      fontWeight: 500,
                      marginLeft: '4px'
                    }}>
                      {active_agent.status === 'running' ? '运行中' : active_agent.status === 'stopped' ? '已停止' : '异常'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <span style={{ fontWeight: 500, color: '#64748b' }}>模型:</span> {active_agent.model}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '14px' }}>
                请选择一个 Agent
              </div>
            )}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!is_middle_sidebar_open && (
                <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                  {!is_left_sidebar_open && (
                    <button
                      onClick={() => set_is_left_sidebar_open(true)}
                      title="Expand"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <PanelLeftOpen size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => set_is_middle_sidebar_open(true)}
                    title="Expand"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <List size={18} />
                  </button>
                </div>
              )}
              <h2 style={{ color: '#0f172a', margin: 0, fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {active_agent ? active_agent.name : 'Agent 详情'}
              </h2>
            </div>
            <button
              onClick={fetch_agents}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                backgroundColor: loading ? '#f1f5f9' : 'transparent',
                border: '1px solid #e2e8f0', borderRadius: '6px',
                color: loading ? '#94a3b8' : '#475569', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {loading ? '刷新中...' : '刷新列表'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {active_agent ? (
              <div style={{ maxWidth: '100%' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0369a1'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {active_agent.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>模型</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active_agent.model}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>状态</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{
                          color: active_agent.status === 'running' ? '#10b981' : active_agent.status === 'error' ? '#ef4444' : '#64748b'
                        }}>
                          {active_agent.status === 'running' ? '运行中' : active_agent.status === 'stopped' ? '已停止' : '异常'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', color: '#475569', fontWeight: 500, marginBottom: '8px' }}>
                      系统提示词
                    </div>
                    <div style={{
                      padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px',
                      fontSize: '13px', color: '#475569', lineHeight: '1.6',
                      overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                    }}>
                      {active_agent.system_prompt || '暂无系统提示词'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '80px', fontSize: '14px' }}>
                请从左侧选择一个 Agent 查看详情
              </div>
            )}
          </div>
        </div>
      </div>

      {show_register_modal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px',
            width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>
              新建 Agent
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                Agent 名称
              </label>
              <input
                type="text"
                value={new_agent.name}
                onChange={(e) => set_new_agent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入 Agent 名称"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                描述
              </label>
              <input
                type="text"
                value={new_agent.description}
                onChange={(e) => set_new_agent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入 Agent 描述"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                图标
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {icon_options.map(opt => {
                  const IconOpt = opt.component
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set_new_agent(prev => ({ ...prev, icon: opt.value }))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: new_agent.icon === opt.value ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
                        backgroundColor: new_agent.icon === opt.value ? '#e0f2fe' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: new_agent.icon === opt.value ? '#0369a1' : '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (new_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = '#cbd5e1'
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (new_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }
                      }}
                    >
                      <IconOpt size={20} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                模型
              </label>
              <select
                value={new_agent.model}
                onChange={(e) => set_new_agent(prev => ({ ...prev, model: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                {model_options.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ padding: '10px 14px', fontSize: '14px' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                系统提示词
              </label>
              <textarea
                value={new_agent.system_prompt}
                onChange={(e) => set_new_agent(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="请输入系统提示词"
                rows={6}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s',
                  resize: 'vertical', minHeight: '120px', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => set_show_register_modal(false)}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff',
                  color: '#475569', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                取消
              </button>
              <button
                onClick={handle_register}
                disabled={registering}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: 'none', borderRadius: '6px',
                  backgroundColor: registering ? '#94a3b8' : '#0ea5e9',
                  color: '#ffffff', cursor: registering ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {registering ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    注册中...
                  </>
                ) : (
                  '注册'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {show_edit_modal && edit_agent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px',
            width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>
              编辑 Agent
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                Agent 名称
              </label>
              <input
                type="text"
                value={edit_agent.name}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="请输入 Agent 名称"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                描述
              </label>
              <input
                type="text"
                value={edit_agent.description}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="请输入 Agent 描述"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                图标
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {icon_options.map(opt => {
                  const IconOpt = opt.component
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set_edit_agent(prev => prev ? { ...prev, icon: opt.value } : null)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: edit_agent.icon === opt.value ? '2px solid #0ea5e9' : '2px solid #e2e8f0',
                        backgroundColor: edit_agent.icon === opt.value ? '#e0f2fe' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: edit_agent.icon === opt.value ? '#0369a1' : '#64748b',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (edit_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = '#cbd5e1'
                          e.currentTarget.style.backgroundColor = '#f1f5f9'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (edit_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = '#e2e8f0'
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }
                      }}
                    >
                      <IconOpt size={20} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                模型
              </label>
              <select
                value={edit_agent.model}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, model: e.target.value } : null)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                {model_options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                系统提示词
              </label>
              <textarea
                value={edit_agent.system_prompt}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, system_prompt: e.target.value } : null)}
                placeholder="请输入系统提示词"
                rows={6}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s',
                  resize: 'vertical', minHeight: '120px', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  set_show_edit_modal(false)
                  set_edit_agent(null)
                }}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff',
                  color: '#475569', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                取消
              </button>
              <button
                onClick={handle_edit}
                disabled={updating}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: 'none', borderRadius: '6px',
                  backgroundColor: updating ? '#94a3b8' : '#0ea5e9',
                  color: '#ffffff', cursor: updating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {updating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    更新中...
                  </>
                ) : (
                  '更新'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentManagement
