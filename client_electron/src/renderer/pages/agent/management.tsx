/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:00:00
 * 描述: Agent 管理页面, 支持列表、注册、启停 - 三段式布局
 */
import React, { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { Agent, AgentFormData, icon_options, category_options } from './types'
import AgentListPanel from './agent_list_panel'
import AgentActionPanel from './agent_action_panel'
import AgentFormModal from './agent_form_modal'
import { AgentDetailView } from './agent_detail_view'

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

        if (agent_list.length === 0) {
          agent_list = get_default_agents()
        }

        set_agents(agent_list)
        if (agent_list.length > 0 && !active_agent_id) {
          set_active_agent_id(agent_list[0].id)
        }
      } else {
        set_error(res.error || 'Failed to fetch agents')
      }
    } catch (err: any) {
      set_agents(get_default_agents())
      if (get_default_agents().length > 0 && !active_agent_id) {
        set_active_agent_id(get_default_agents()[0].id)
      }
      set_error(err.message || 'Failed to fetch agents, using default data')
    } finally {
      set_loading(false)
    }
  }

  /**
   * 获取默认 Agent 列表
   */
  const get_default_agents = (): Agent[] => [
    {
      id: '1',
      name: '通用助手',
      description: '一个全能型AI助手，可以处理各种问题',
      model: 'gpt-4o',
      system_prompt: '你是一个友好、专业的全能型AI助手，你可以回答各种问题，帮助用户解决困难，请用清晰、简洁、有帮助的方式回复。',
      icon: 'Bot',
      status: 'running' as const,
      category: 'general',
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
    },
  ]

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
  const handle_register = async (form_data: AgentFormData) => {
    set_registering(true)
    try {
      const res = await window.electron_api.agent_management_register(
        form_data.name,
        form_data.description,
        form_data.model,
        form_data.system_prompt,
        form_data.icon,
        form_data.category,
      )
      if (res.success) {
        set_show_register_modal(false)
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
  const handle_edit = async (form_data: AgentFormData) => {
    if (!edit_agent) return
    set_updating(true)
    try {
      const res = await window.electron_api.agent_management_update(
        edit_agent.id,
        form_data.name,
        form_data.description,
        form_data.model,
        form_data.system_prompt,
        form_data.icon,
        form_data.category,
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
    set_edit_agent(agent)
    set_show_edit_modal(true)
  }

  /**
   * 过滤后的 Agent 列表
   */
  const filtered_agents = agents
    .filter((agent) => active_category === 'all' || agent.category === active_category)
    .filter((agent) => {
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
      const current_agent_in_filtered = filtered_agents.find((a) => a.id === active_agent_id)
      if (!current_agent_in_filtered) {
        set_active_agent_id(filtered_agents[0].id)
      }
    } else {
      set_active_agent_id('')
    }
  }, [filtered_agents, active_agent_id])

  /**
   * 当前选中的 Agent
   */
  const active_agent = agents.find((a) => a.id === active_agent_id)

  /**
   * 获取图标组件
   * @param icon_name 图标名称
   * @returns 图标组件
   */
  const get_icon_component = (icon_name: string) => {
    const icon = icon_options.find((opt) => opt.value === icon_name)
    return icon ? icon.component : Bot
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--ui_bg)',
        position: 'relative',
      }}
    >
      <div
        className="drag-region"
        style={{
          padding: '20px 24px',
          backgroundColor: 'var(--ui_panel)',
          borderBottom: '1px solid var(--ui_border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>Agent 管理</span>
        </div>
      </div>

      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <AgentListPanel
          filtered_agents={filtered_agents}
          active_agent_id={active_agent_id}
          is_left_sidebar_open={is_left_sidebar_open}
          active_category={active_category}
          search_query={search_query}
          on_category_change={set_active_category}
          on_search_change={set_search_query}
          on_agent_select={set_active_agent_id}
          on_register_click={() => set_show_register_modal(true)}
          on_close_sidebar={() => set_is_left_sidebar_open(false)}
          get_icon_component={get_icon_component}
        />

        <AgentActionPanel
          active_agent={active_agent}
          checking_id={checking_id}
          on_toggle={handle_toggle}
          on_check={handle_check}
          on_edit={open_edit_modal}
          is_left_sidebar_open={is_left_sidebar_open}
          is_middle_sidebar_open={is_middle_sidebar_open}
          on_left_sidebar_toggle={() => set_is_left_sidebar_open(!is_left_sidebar_open)}
          on_middle_sidebar_toggle={() => set_is_middle_sidebar_open(!is_middle_sidebar_open)}
        />

        <AgentDetailView
          active_agent={active_agent}
          loading={loading}
          on_refresh={fetch_agents}
          get_icon_component={get_icon_component}
          category_options={category_options}
        />
      </div>

      {show_register_modal && (
        <AgentFormModal
          mode="register"
          on_close={() => set_show_register_modal(false)}
          on_submit={handle_register}
          is_loading={registering}
        />
      )}

      {show_edit_modal && edit_agent && (
        <AgentFormModal
          mode="edit"
          agent={edit_agent}
          on_close={() => {
            set_show_edit_modal(false)
            set_edit_agent(null)
          }}
          on_submit={handle_edit}
          is_loading={updating}
        />
      )}
    </div>
  )
}

export default AgentManagement
