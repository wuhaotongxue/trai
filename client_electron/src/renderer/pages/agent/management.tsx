/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:00:00
 * 描述: Agent 管理页面，支持列表、注册、启停 - 三段式布局
 */
import React, { useState, useEffect } from 'react'
import { Bot, Plus, Play, Square, Loader2, RefreshCw, Activity, PanelLeftOpen, List, Settings } from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  model: string
  status: 'running' | 'stopped' | 'error'
  created_at: string
}

const AgentManagement: React.FC = () => {
  const [agents, set_agents] = useState<Agent[]>([])
  const [loading, set_loading] = useState(false)
  const [error, set_error] = useState('')
  const [checking_id, set_checking_id] = useState<string | null>(null)
  
  // 三段式布局折叠状态
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_agent_id, set_active_agent_id] = useState<string>('')
  
  // 注册模态框状态
  const [show_modal, set_show_modal] = useState(false)
  const [new_agent, set_new_agent] = useState({ name: '', description: '', model: 'gpt-4o', system_prompt: '' })
  const [registering, set_registering] = useState(false)

  const fetch_agents = async () => {
    set_loading(true)
    try {
      const res = await window.electron_api.agent_management_list()
      if (res.success) {
        const agent_list = res.data || []
        set_agents(agent_list)
        // 默认选择第一个 agent
        if (agent_list.length > 0 && !active_agent_id) {
          set_active_agent_id(agent_list[0].id)
        }
      } else {
        set_error(res.error || '获取失败')
      }
    } catch (err: any) {
      set_error(err.message || '获取失败')
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
        alert(res.error || '操作失败')
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
        // 刷新列表以获取最新状态
        fetch_agents()
        if (!res.data.is_normal) {
          alert('检测到 Agent 运行异常！请检查日志。')
        }
      } else {
        alert(res.error || '检测失败')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      set_checking_id(null)
    }
  }

  const handle_register = async () => {
    if (!new_agent.name || !new_agent.description || !new_agent.system_prompt) {
      alert('请填写完整信息')
      return
    }
    set_registering(true)
    try {
      const res = await window.electron_api.agent_management_register(
        new_agent.name, new_agent.description, new_agent.model, new_agent.system_prompt
      )
      if (res.success) {
        set_show_modal(false)
        set_new_agent({ name: '', description: '', model: 'gpt-4o', system_prompt: '' })
        fetch_agents()
      } else {
        alert(res.error || '注册失败')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      set_registering(false)
    }
  }

  const active_agent = agents.find(a => a.id === active_agent_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>Agent 管理</h1>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧边栏 - Agent 分类/管理 */}
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
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Agent 管理</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起"
              aria-label="收起"
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
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => set_show_modal(true)}
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
            {agents.map(agent => (
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
                <Bot size={16} />
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agent.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中间边栏 - 快速操作/状态 */}
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
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '200px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开"
                  aria-label="展开"
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
              <span style={{ fontSize: '14px', fontWeight: 600 }}>操作</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起"
              aria-label="收起"
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
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
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

        {/* 右侧主内容区 */}
        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '16px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!is_middle_sidebar_open && (
                <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                  {!is_left_sidebar_open && (
                    <button
                      onClick={() => set_is_left_sidebar_open(true)}
                      title="展开"
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
                    title="展开"
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
              <h2 style={{ color: '#0f172a', margin: 0, fontSize: '16px', fontWeight: 600 }}>
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
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {active_agent ? (
              <div style={{ maxWidth: '800px' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1e293b', fontWeight: 600 }}>
                      {active_agent.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                      {active_agent.description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>模型</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{active_agent.model}</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>状态</div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
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
                      padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px',
                      fontSize: '13px', color: '#475569', lineHeight: '1.6',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                    }}>
                      {/* 这里应该显示完整的 system_prompt，但当前 Agent 接口可能没有返回 */}
                      （系统提示词内容）
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

      {/* 注册模态框 */}
      {show_modal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px',
            width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
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
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                模型
              </label>
              <select
                value={new_agent.model}
                onChange={(e) => set_new_agent(prev => ({ ...prev, model: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                  backgroundColor: '#f8fafc', transition: 'border-color 0.2s', cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
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
                  resize: 'vertical', minHeight: '120px', fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => set_show_modal(false)}
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
    </div>
  )
}

export default AgentManagement
