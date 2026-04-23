/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:00:00
 * 描述: Agent 管理页面, 支持列表、注册、启停 - 三段式布局
 */
import React, { useState, useEffect, useRef } from 'react'
import { Bot, Plus, Play, Square, Loader2, RefreshCw, Activity, PanelLeftOpen, PanelLeftClose, List as ListIcon, Settings, Edit, Wrench, Sparkles, Cpu, MessageSquare, BrainCircuit, Calculator, Cloud, Code, Search } from 'lucide-react'
import { List } from 'react-window'
import { should_ellipsis } from '@/utils/ui_text'

/**
 * Agent 接口定义
 */
interface Agent {
  id: string
  name: string
  description: string
  model: string
  system_prompt: string
  icon: string
  status: 'running' | 'stopped' | 'error'
  category?: string
  created_at: string
}

/**
 * 图标选项列表
 */
const icon_options = [
  { value: 'Bot', label: 'Bot', component: Bot },
  { value: 'Settings', label: 'Settings', component: Settings },
  { value: 'Code', label: 'Code', component: Code },
  { value: 'Wrench', label: 'Wrench', component: Wrench },
  { value: 'Sparkles', label: 'Sparkles', component: Sparkles },
  { value: 'Cpu', label: 'Cpu', component: Cpu },
  { value: 'MessageSquare', label: 'MessageSquare', component: MessageSquare },
  { value: 'BrainCircuit', label: 'BrainCircuit', component: BrainCircuit },
  { value: 'Calculator', label: 'Calculator', component: Calculator },
  { value: 'Cloud', label: 'Cloud', component: Cloud },
]

/**
 * 分类选项列表
 */
const category_options = [
  { value: 'general', label: '通用助手' },
  { value: 'coding', label: '编程助手' },
  { value: 'writing', label: '写作助手' },
  { value: 'research', label: '研究助手' },
  { value: 'customer', label: '客户服务' },
  { value: 'other', label: '其他' },
]

/**
 * 模型选项列表
 */
const model_options = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'qwen-max', label: 'Qwen Max' },
]



/**
 * Agent 管理页面组件
 * 
 * 支持 Agent 列表展示、注册新 Agent、启停操作和状态检测
 */
const AgentManagement: React.FC = () => {
  /**
   * Agent 列表
   */
  const [agents, set_agents] = useState<Agent[]>([])
  /**
   * 加载状态
   */
  const [loading, set_loading] = useState(false)
  /**
   * 错误信息
   */
  const [error, set_error] = useState('')
  /**
   * 当前正在检测状态的 Agent ID
   */
  const [checking_id, set_checking_id] = useState<string | null>(null)

  /**
   * 左侧边栏是否打开
   */
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  /**
   * 中间边栏是否打开
   */
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  /**
   * 当前选中的 Agent ID
   */
  const [active_agent_id, set_active_agent_id] = useState<string>('')
  /**
   * 当前选中的分类
   */
  const [active_category, set_active_category] = useState<string>('all')
  /**
   * 搜索关键词
   */
  const [search_query, set_search_query] = useState<string>('')

  /**
   * 是否显示注册模态框
   */
  const [show_register_modal, set_show_register_modal] = useState(false)
  /**
   * 是否显示编辑模态框
   */
  const [show_edit_modal, set_show_edit_modal] = useState(false)
  
  /**
   * 新 Agent 表单数据
   */
  const [new_agent, set_new_agent] = useState({ name: '', description: '', model: 'gpt-4o', system_prompt: '', icon: 'Bot', category: 'general' })
  /**
   * 当前编辑的 Agent
   */
  const [edit_agent, set_edit_agent] = useState<Agent | null>(null)
  /**
   * 是否正在注册
   */
  const [registering, set_registering] = useState(false)
  /**
   * 是否正在更新
   */
  const [updating, set_updating] = useState(false)

  /**
   * 获取 Agent 列表
   */
  const fetch_agents = async () => {
    set_loading(true)
    try {
      const res = await window.electron_api.agent_management_list()
      if (res.success) {
        let agent_list = res.data || []
        
        // 如果没有Agent数据，添加默认Agent
        if (agent_list.length === 0) {
          agent_list = [
            {
              id: '1',
              name: '通用助手',
              description: '一个全能型AI助手，可以处理各种问题',
              model: 'gpt-4o',
              system_prompt: '你是一个友好、专业的全能型AI助手，你可以回答各种问题，帮助用户解决困难，请用清晰、简洁、有帮助的方式回复。',
              icon: 'Bot',
              status: 'running' as const,
              category: 'general',
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              name: '编程助手',
              description: '专业的编程助手，可以帮助解决代码问题',
              model: 'gpt-4-turbo',
              system_prompt: '你是一个专业的编程助手，精通各种编程语言和框架，能够帮助用户解决代码问题，提供最佳实践建议。',
              icon: 'Code',
              status: 'stopped' as const,
              category: 'coding',
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              name: '研究助手',
              description: '专注于研究领域的AI助手',
              model: 'claude-3-opus',
              system_prompt: '你是一个专业的研究助手，能够帮助用户进行文献分析、研究设计和数据解读，提供深入的研究见解。',
              icon: 'BrainCircuit',
              status: 'running' as const,
              category: 'research',
              created_at: new Date().toISOString()
            },
            {
              id: '4',
              name: '写作助手',
              description: '帮助用户提升写作能力的AI助手',
              model: 'gpt-3.5-turbo',
              system_prompt: '你是一个专业的写作助手，能够帮助用户提升写作质量，提供修改建议和创意灵感。',
              icon: 'MessageSquare',
              status: 'stopped' as const,
              category: 'writing',
              created_at: new Date().toISOString()
            }
          ] as Agent[]
        }
        
        set_agents(agent_list)
        if (agent_list.length > 0 && !active_agent_id) {
          set_active_agent_id(agent_list[0].id)
        }
      } else {
        set_error(res.error || 'Failed to fetch agents')
      }
    } catch (err: any) {
      // 如果API调用失败，使用默认Agent数据
      const default_agents: Agent[] = [
        {
          id: '1',
          name: '通用助手',
          description: '一个全能型AI助手，可以处理各种问题',
          model: 'gpt-4o',
          system_prompt: '你是一个友好、专业的全能型AI助手，你可以回答各种问题，帮助用户解决困难，请用清晰、简洁、有帮助的方式回复。',
          icon: 'Bot',
          status: 'running' as const,
          category: 'general',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '编程助手',
          description: '专业的编程助手，可以帮助解决代码问题',
          model: 'gpt-4-turbo',
          system_prompt: '你是一个专业的编程助手，精通各种编程语言和框架，能够帮助用户解决代码问题，提供最佳实践建议。',
          icon: 'Code',
          status: 'stopped' as const,
          category: 'coding',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: '研究助手',
          description: '专注于研究领域的AI助手',
          model: 'claude-3-opus',
          system_prompt: '你是一个专业的研究助手，能够帮助用户进行文献分析、研究设计和数据解读，提供深入的研究见解。',
          icon: 'BrainCircuit',
          status: 'running' as const,
          category: 'research',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: '写作助手',
          description: '帮助用户提升写作能力的AI助手',
          model: 'gpt-3.5-turbo',
          system_prompt: '你是一个专业的写作助手，能够帮助用户提升写作质量，提供修改建议和创意灵感。',
          icon: 'MessageSquare',
          status: 'stopped' as const,
          category: 'writing',
          created_at: new Date().toISOString()
        }
      ]
      set_agents(default_agents)
      if (default_agents.length > 0 && !active_agent_id) {
        set_active_agent_id(default_agents[0].id)
      }
      set_error(err.message || 'Failed to fetch agents, using default data')
    } finally {
      set_loading(false)
    }
  }

  /**
   * 组件挂载时获取 Agent 列表
   */
  useEffect(() => {
    fetch_agents()
  }, [])

  /**
   * 切换 Agent 状态（启动/停止）
   * @param id Agent ID
   * @param current_status 当前状态
   */
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

  /**
   * 检测 Agent 状态
   * @param id Agent ID
   */
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

  /**
   * 注册新 Agent
   */
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
        new_agent.icon,
        new_agent.category
      )
      if (res.success) {
        set_show_register_modal(false)
        set_new_agent({ name: '', description: '', model: 'gpt-4o', system_prompt: '', icon: 'Bot', category: 'general' })
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

  /**
   * 编辑 Agent
   */
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
        edit_agent.icon,
        edit_agent.category
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

  /**
   * 打开编辑模态框
   * @param agent 要编辑的 Agent
   */
  const open_edit_modal = (agent: Agent) => {
    set_edit_agent({ ...agent })
    set_show_edit_modal(true)
  }

  /**
   * 过滤后的 Agent 列表
   */
  const filtered_agents = agents
    .filter(agent => 
      active_category === 'all' || agent.category === active_category
    )
    .filter(agent => {
      if (!search_query) return true
      const query = search_query.toLowerCase()
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query) ||
        agent.model.toLowerCase().includes(query)
      )
    })

  /**
   * 当筛选条件变化时，更新活跃 Agent ID
   */
  useEffect(() => {
    if (filtered_agents.length > 0) {
      // 如果当前活跃的 Agent 不在筛选列表中，选择第一个
      const current_agent_in_filtered = filtered_agents.find(a => a.id === active_agent_id)
      if (!current_agent_in_filtered) {
        set_active_agent_id(filtered_agents[0].id)
      }
    } else {
      // 如果筛选列表为空，清空活跃 Agent ID
      set_active_agent_id('')
    }
  }, [filtered_agents, active_agent_id])

  /**
   * 当前选中的 Agent
   */
  const active_agent = agents.find(a => a.id === active_agent_id)

  /**
   * 获取图标组件
   * @param icon_name 图标名称
   * @returns 图标组件
   */
  const get_icon_component = (icon_name: string) => {
    const icon = icon_options.find(opt => opt.value === icon_name)
    return icon ? icon.component : Bot
  }

  /**
   * 当前活跃 Agent 的图标组件
   */
  const IconComponent = active_agent ? get_icon_component(active_agent.icon) : Bot

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_bg)', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>Agent 管理</span>
        </div>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '12%' : '0px',
          minWidth: is_left_sidebar_open ? '120px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: 'var(--ui_panel)',
          borderRight: is_left_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 1,
          boxShadow: is_left_sidebar_open ? '2px 0 8px rgba(0,0,0,0.05)' : 'none'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>智能体</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="Collapse"
              aria-label="Collapse"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--ui_border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>分类</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => set_active_category('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: active_category === 'all' ? 'var(--ui_accent)' : 'transparent',
                  color: active_category === 'all' ? 'white' : 'var(--ui_text)',
                  border: '1px solid var(--ui_border)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (active_category !== 'all') {
                    e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (active_category !== 'all') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                全部
              </button>
              {category_options.map(category => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => set_active_category(category.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: active_category === category.value ? 'var(--ui_accent)' : 'transparent',
                    color: active_category === category.value ? 'white' : 'var(--ui_text)',
                    border: '1px solid var(--ui_border)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (active_category !== category.value) {
                      e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (active_category !== category.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--ui_border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px', fontWeight: 500 }}>搜索</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="搜索智能体..."
                value={search_query}
                onChange={(e) => set_search_query(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 32px',
                  fontSize: '12px',
                  border: '1px solid var(--ui_border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ui_panel_alt)',
                  color: 'var(--ui_text)',
                  outline: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ui_text_muted)' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', padding: '12px', boxSizing: 'border-box' }}>
            {filtered_agents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>暂无Agent</div>
            ) : (
              <div style={{ height: '100%', overflow: 'auto' }}>
                {filtered_agents.map((agent, index) => {
                  const AgentIcon = get_icon_component(agent.icon)
                  const is_active = active_agent_id === agent.id
                  
                  const handle_click = () => set_active_agent_id(agent.id)
                  const handle_mouse_enter = (e: React.MouseEvent<HTMLDivElement>) => {
                    if (!is_active) {
                      e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                    }
                  }
                  const handle_mouse_leave = (e: React.MouseEvent<HTMLDivElement>) => {
                    if (!is_active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }
                  
                  return (
                    <div
                      key={agent.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '6px',
                        backgroundColor: is_active ? 'var(--ui_accent)' : 'transparent',
                        color: is_active ? 'white' : 'var(--ui_text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        fontSize: '13px',
                        fontWeight: is_active ? 600 : 400,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxSizing: 'border-box',
                        transform: 'translateY(0)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onClick={handle_click}
                      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                        handle_mouse_enter(e)
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                        handle_mouse_leave(e)
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <AgentIcon size={16} />
                      <div
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {agent.name}
                      </div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          agent.status === 'running' ? 'var(--ui_success)' :
                          agent.status === 'stopped' ? 'var(--ui_text_muted)' : 'var(--ui_danger)'
                      }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid var(--ui_border)', boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => set_show_register_modal(true)}
              aria-label="新建 Agent"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', backgroundColor: 'transparent', color: 'var(--ui_accent)', border: '1px dashed var(--ui_accent)',
                borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={14} /> Agent
            </button>
          </div>
        </div>

        <div style={{
          width: is_middle_sidebar_open ? '12%' : '0px',
          minWidth: is_middle_sidebar_open ? '120px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: 'var(--ui_panel)',
          borderRight: is_middle_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 1,
          boxShadow: is_middle_sidebar_open ? '2px 0 8px rgba(0,0,0,0.05)' : 'none'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="Expand"
                  aria-label="Expand"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>操作</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="Collapse"
              aria-label="Collapse"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ListIcon size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {active_agent ? (
              <div>
                <div style={{ marginBottom: '12px', padding: '0 4px', fontSize: '12px', color: 'var(--ui_text_muted)', fontWeight: 500 }}>
                  状态操作
                </div>
                <button
                  onClick={() => handle_toggle(active_agent.id, active_agent.status)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: active_agent.status === 'running' ? 'var(--ui_danger)' : 'var(--ui_success)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: 600,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
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
                    backgroundColor: 'var(--ui_panel_alt)',
                    border: '1px solid var(--ui_border)',
                    borderRadius: '6px',
                    cursor: checking_id === active_agent.id ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: 'var(--ui_text)',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (checking_id !== active_agent.id) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (checking_id !== active_agent.id) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
                    }
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
                    backgroundColor: 'var(--ui_panel_alt)',
                    border: '1px solid var(--ui_border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--ui_text)',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
                  }}
                >
                  <Edit size={16} />
                  编辑 Agent
                </button>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--ui_border)' }}>
                  <div style={{ marginBottom: '8px', padding: '0 4px', fontSize: '12px', color: 'var(--ui_text_muted)', fontWeight: 500 }}>
                    基本信息
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ui_text)', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--ui_text_muted)' }}>名称:</span> {active_agent.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ui_text)', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--ui_text_muted)' }}>状态:</span>
                    <span style={{
                      color: active_agent.status === 'running' ? 'var(--ui_success)' : active_agent.status === 'error' ? 'var(--ui_danger)' : 'var(--ui_text_muted)',
                      fontWeight: 500,
                      marginLeft: '4px'
                    }}>
                      {active_agent.status === 'running' ? '运行中' : active_agent.status === 'stopped' ? '已停止' : '异常'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ui_text)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--ui_text_muted)' }}>模型:</span> {active_agent.model}
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
          <div className="drag-region" style={{ padding: '12px 16px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!is_middle_sidebar_open && (
                <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                  {!is_left_sidebar_open && (
                    <button
                      onClick={() => set_is_left_sidebar_open(true)}
                      title="Expand"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <PanelLeftOpen size={18} />
                    </button>
                  )}
                  <button
                      onClick={() => set_is_middle_sidebar_open(true)}
                      title="Expand"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ListIcon size={18} />
                    </button>
                </div>
              )}
              <h2 style={{ color: 'var(--ui_text)', margin: 0, fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {active_agent ? active_agent.name : 'Agent 详情'}
              </h2>
            </div>
            <button
              onClick={fetch_agents}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px',
                backgroundColor: loading ? 'var(--ui_border)' : 'transparent',
                border: '1px solid var(--ui_border)', borderRadius: '4px',
                color: loading ? 'var(--ui_text_muted)' : 'var(--ui_text)', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                  e.currentTarget.style.borderColor = 'var(--ui_border)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--ui_border)'
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
                <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '12px', border: '1px solid var(--ui_border)', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--ui_accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text_muted)', lineHeight: '1.6', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {active_agent.description || '暂无描述'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>模型</div>
                      <div style={{ fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active_agent.model}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>状态</div>
                      <div style={{ fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{
                          color: active_agent.status === 'running' ? 'var(--ui_success)' : active_agent.status === 'error' ? 'var(--ui_danger)' : 'var(--ui_text_muted)'
                        }}>
                          {active_agent.status === 'running' ? '运行中' : active_agent.status === 'stopped' ? '已停止' : '异常'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>分类</div>
                      <div style={{ fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {category_options.find(c => c.value === active_agent.category)?.label || '未分类'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--ui_text_muted)', fontWeight: 500, marginBottom: '8px' }}>
                      系统提示词
                    </div>
                    <div style={{
                      padding: '12px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '8px',
                      fontSize: '13px', color: 'var(--ui_text)', lineHeight: '1.6',
                      overflow: 'auto', maxHeight: '120px'
                    }}>
                      {active_agent.system_prompt || '暂无系统提示词'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--ui_text_muted)', marginTop: '80px', fontSize: '14px' }}>
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
            backgroundColor: 'var(--ui_panel)', borderRadius: '12px', padding: '24px',
            width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 600 }}>
              新建 Agent
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                Agent 名称
              </label>
              <input
                type="text"
                value={new_agent.name}
                onChange={(e) => set_new_agent(prev => ({ ...prev, name: e.target.value.slice(0, 4) }))}
                placeholder="请输入 Agent 名称"
                maxLength={4}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
              <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginTop: '6px' }}>
                提示: 名称不超过4个汉字或字符, 请勿使用标点符号和特殊字符
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: new_agent.name.length >= 4 ? 'var(--ui_danger)' : 'var(--ui_text_muted)', marginTop: '4px' }}>
                {new_agent.name.length}/4
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                描述
              </label>
              <input
                type="text"
                value={new_agent.description}
                onChange={(e) => set_new_agent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入 Agent 描述"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
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
                        border: new_agent.icon === opt.value ? '2px solid var(--ui_accent)' : '2px solid var(--ui_border)',
                        backgroundColor: new_agent.icon === opt.value ? 'var(--ui_accent)' : 'var(--ui_panel_alt)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: new_agent.icon === opt.value ? 'white' : 'var(--ui_text)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (new_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = 'var(--ui_border)'
                          e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (new_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = 'var(--ui_border)'
                          e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                分类
              </label>
              <select
                value={new_agent.category}
                onChange={(e) => set_new_agent(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              >
                {category_options.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ padding: '10px 14px', fontSize: '14px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                模型
              </label>
              <select
                value={new_agent.model}
                onChange={(e) => set_new_agent(prev => ({ ...prev, model: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              >
                {model_options.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ padding: '10px 14px', fontSize: '14px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                系统提示词
              </label>
              <textarea
                value={new_agent.system_prompt}
                onChange={(e) => set_new_agent(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="请输入系统提示词"
                rows={6}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s',
                  resize: 'vertical', minHeight: '120px', fontFamily: 'inherit', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => set_show_register_modal(false)}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: '1px solid var(--ui_border)', borderRadius: '6px', backgroundColor: 'var(--ui_panel)',
                  color: 'var(--ui_text)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel)'}
              >
                取消
              </button>
              <button
                onClick={handle_register}
                disabled={registering}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: 'none', borderRadius: '6px',
                  backgroundColor: registering ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
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
            backgroundColor: 'var(--ui_panel)', borderRadius: '12px', padding: '24px',
            width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--ui_text)', fontWeight: 600 }}>
              编辑 Agent
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                Agent 名称
              </label>
              <input
                type="text"
                value={edit_agent.name}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="请输入 Agent 名称"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                描述
              </label>
              <input
                type="text"
                value={edit_agent.description}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="请输入 Agent 描述"
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
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
                        border: edit_agent.icon === opt.value ? '2px solid var(--ui_accent)' : '2px solid var(--ui_border)',
                        backgroundColor: edit_agent.icon === opt.value ? 'var(--ui_accent)' : 'var(--ui_panel_alt)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: edit_agent.icon === opt.value ? 'white' : 'var(--ui_text)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (edit_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = 'var(--ui_border)'
                          e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (edit_agent.icon !== opt.value) {
                          e.currentTarget.style.borderColor = 'var(--ui_border)'
                          e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                分类
              </label>
              <select
                value={edit_agent.category || 'general'}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, category: e.target.value } : null)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              >
                {category_options.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                模型
              </label>
              <select
                value={edit_agent.model}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, model: e.target.value } : null)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s', cursor: 'pointer', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              >
                {model_options.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--ui_text)', fontWeight: 500 }}>
                系统提示词
              </label>
              <textarea
                value={edit_agent.system_prompt}
                onChange={(e) => set_edit_agent(prev => prev ? { ...prev, system_prompt: e.target.value } : null)}
                placeholder="请输入系统提示词"
                rows={6}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none',
                  backgroundColor: 'var(--ui_panel_alt)', transition: 'border-color 0.2s',
                  resize: 'vertical', minHeight: '120px', fontFamily: 'inherit', boxSizing: 'border-box',
                  color: 'var(--ui_text)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
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
                  border: '1px solid var(--ui_border)', borderRadius: '6px', backgroundColor: 'var(--ui_panel)',
                  color: 'var(--ui_text)', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel)'}
              >
                取消
              </button>
              <button
                onClick={handle_edit}
                disabled={updating}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: 'none', borderRadius: '6px',
                  backgroundColor: updating ? 'var(--ui_text_muted)' : 'var(--ui_accent)',
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
