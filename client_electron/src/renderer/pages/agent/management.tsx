/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:00:00
 * 描述: Agent 管理页面，支持列表、注册、启停
 */
import React, { useState, useEffect } from 'react'
import { Bot, Plus, Play, Square, Loader2, RefreshCw, Activity } from 'lucide-react'

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
  
  // 注册模态框状态
  const [show_modal, set_show_modal] = useState(false)
  const [new_agent, set_new_agent] = useState({ name: '', description: '', model: 'gpt-4o', system_prompt: '' })
  const [registering, set_registering] = useState(false)

  const fetch_agents = async () => {
    set_loading(true)
    try {
      const res = await window.electron_api.agent_management_list()
      if (res.success) {
        set_agents(res.data || [])
      } else {
        set_error(res.error || '获取失败')
      }
    } catch (err: any) {
      set_error(err.message)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>Agent 管理</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetch_agents}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px',
              cursor: 'pointer', fontSize: '13px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
          </button>
          <button
            onClick={() => set_show_modal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
              backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500
            }}
          >
            <Plus size={16} /> 注册 Agent
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {error && <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {agents.map(agent => (
            <div key={agent.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>{agent.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{agent.id}</div>
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                  backgroundColor: agent.status === 'running' ? '#dcfce7' : agent.status === 'error' ? '#fee2e2' : '#f1f5f9',
                  color: agent.status === 'running' ? '#16a34a' : agent.status === 'error' ? '#ef4444' : '#64748b'
                }}>
                  {agent.status === 'running' ? '运行中' : agent.status === 'error' ? '异常' : '已停止'}
                </div>
              </div>
              
              <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px 0', minHeight: '42px' }}>
                {agent.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ padding: '2px 8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>{agent.model}</span>
                <span>创建于 {new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button
                  onClick={() => handle_check(agent.id)}
                  disabled={checking_id === agent.id}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: checking_id === agent.id ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '13px',
                    backgroundColor: '#f8fafc', color: '#475569'
                  }}
                >
                  {checking_id === agent.id ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />} 状态检测
                </button>
                <button
                  onClick={() => handle_toggle(agent.id, agent.status)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                    backgroundColor: agent.status === 'running' ? '#fef2f2' : '#f0fdf4',
                    color: agent.status === 'running' ? '#dc2626' : '#16a34a'
                  }}
                >
                  {agent.status === 'running' ? <><Square size={14} /> 停止</> : <><Play size={14} /> 启动</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 注册弹窗 */}
      {show_modal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '500px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px' }}>注册新 Agent</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#334155' }}>Agent 名称</label>
                <input 
                  type="text" value={new_agent.name} onChange={e => set_new_agent({...new_agent, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  placeholder="例如: 数据分析助手"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#334155' }}>基础模型</label>
                <select 
                  value={new_agent.model} onChange={e => set_new_agent({...new_agent, model: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="claude-3-opus">claude-3-opus</option>
                  <option value="qwen-max">qwen-max</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#334155' }}>功能描述</label>
                <input 
                  type="text" value={new_agent.description} onChange={e => set_new_agent({...new_agent, description: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} 
                  placeholder="一句话描述该 Agent 的专长"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#334155' }}>系统提示词 (System Prompt)</label>
                <textarea 
                  value={new_agent.system_prompt} onChange={e => set_new_agent({...new_agent, system_prompt: e.target.value})}
                  style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} 
                  placeholder="你是一个专业的数据分析师..."
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => set_show_modal(false)}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
              >取消</button>
              <button 
                onClick={handle_register}
                disabled={registering}
                style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: registering ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {registering && <Loader2 size={14} className="animate-spin" />} 确认注册
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentManagement