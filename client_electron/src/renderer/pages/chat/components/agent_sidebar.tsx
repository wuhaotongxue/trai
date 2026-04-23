/**
 * 文件名: agent_sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: Agent 列表侧边栏组件
 */
import React from 'react'
import { Cpu, Code, Calculator, Cloud, Settings, PanelLeftClose } from 'lucide-react'
import { should_ellipsis } from '@/utils/ui_text'
import type { Agent } from '../types'

interface AgentSidebarProps {
  agents: Agent[]
  active_agent_id: string
  is_open: boolean
  on_toggle: () => void
  on_select: (id: string) => void
}

const get_agent_icon = (name: string) => {
  const name_lower = name.toLowerCase()
  if (name_lower.includes('code') || name_lower.includes('代码')) return <Code size={16} />
  if (name_lower.includes('calculator') || name_lower.includes('计算')) return <Calculator size={16} />
  if (name_lower.includes('weather') || name_lower.includes('天气')) return <Cloud size={16} />
  if (name_lower.includes('default') || name_lower.includes('默认')) return <Settings size={16} />
  return <Cpu size={16} />
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  agents,
  active_agent_id,
  is_open,
  on_toggle,
  on_select,
}) => {
  return (
    <div style={{
      width: is_open ? '12%' : '0px',
      minWidth: is_open ? '120px' : '0px',
      opacity: is_open ? 1 : 0,
      backgroundColor: 'var(--ui_panel)',
      borderRight: is_open ? '1px solid var(--ui_border)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      flexShrink: 1,
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--ui_border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>智能助手</span>
        <button
          type="button"
          onClick={on_toggle}
          title="收起 Agent 栏"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ui_text_muted)', borderRadius: '4px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '180px', boxSizing: 'border-box' }}>
        {agents.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>
            暂无可用 Agent
          </div>
        ) : (
          agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => on_select(agent.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: active_agent_id === agent.id ? 'var(--ui_accent)' : 'transparent',
                color: active_agent_id === agent.id ? '#ffffff' : 'var(--ui_text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: active_agent_id === agent.id ? 600 : 400,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (active_agent_id !== agent.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }}
              onMouseLeave={(e) => {
                if (active_agent_id !== agent.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {get_agent_icon(agent.name)}
                <span style={
                  should_ellipsis(agent.name)
                    ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    : { whiteSpace: 'nowrap' }
                }>
                  {agent.name}
                </span>
              </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  agent.status === 'running' ? 'var(--ui_success)' :
                  agent.status === 'stopped' ? 'var(--ui_text_muted)' : 'var(--ui_danger)',
              }} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AgentSidebar
