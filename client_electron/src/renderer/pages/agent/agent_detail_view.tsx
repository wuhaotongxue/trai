/**
 * 文件名: agent_detail_view.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Agent 详情视图组件
 */
import React from 'react'
import { Loader2, RefreshCw, Bot, Settings, Code, Wrench, Sparkles, Cpu, MessageSquare, BrainCircuit, Calculator, Cloud } from 'lucide-react'

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

const icon_map: Record<string, React.ComponentType<{ size?: number | string }>> = {
  Bot, Settings, Code, Wrench, Sparkles, Cpu, MessageSquare, BrainCircuit, Calculator, Cloud,
}

interface AgentDetailViewProps {
  active_agent: Agent | undefined
  loading: boolean
  on_refresh: () => void
  get_icon_component: (icon_name: string) => React.ComponentType<{ size?: number | string }>
  category_options: { value: string; label: string }[]
}

export const AgentDetailView: React.FC<AgentDetailViewProps> = ({
  active_agent,
  loading,
  on_refresh,
  get_icon_component,
  category_options
}) => {
  const IconComponent = active_agent ? get_icon_component(active_agent.icon) : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        className="drag-region"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--ui_panel)',
          borderBottom: '1px solid var(--ui_border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            color: 'var(--ui_text)',
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
          }}
        >
          {active_agent ? active_agent.name : 'Agent 详情'}
        </h2>
        <button
          onClick={on_refresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            backgroundColor: loading ? 'var(--ui_border)' : 'transparent',
            border: '1px solid var(--ui_border)',
            borderRadius: '4px',
            color: loading ? 'var(--ui_text_muted)' : 'var(--ui_text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
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
          {loading ? <Loader2 size={16} className="anim_spin" /> : <RefreshCw size={16} />}
          {loading ? '刷新中...' : '刷新列表'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {active_agent ? (
          <div style={{ maxWidth: '100%' }}>
            <div
              style={{
                backgroundColor: 'var(--ui_panel)',
                borderRadius: '12px',
                border: '1px solid var(--ui_border)',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ui_accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  {IconComponent && <IconComponent size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      color: 'var(--ui_text_muted)',
                      lineHeight: '1.6',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {active_agent.description || '暂无描述'}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--ui_panel_alt)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>模型</div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--ui_text)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {active_agent.model}
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--ui_panel_alt)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>状态</div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--ui_text)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span
                      style={{
                        color:
                          active_agent.status === 'running'
                            ? 'var(--ui_success)'
                            : active_agent.status === 'error'
                              ? 'var(--ui_danger)'
                              : 'var(--ui_text_muted)',
                      }}
                    >
                      {active_agent.status === 'running' ? '运行中' : active_agent.status === 'stopped' ? '已停止' : '异常'}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--ui_panel_alt)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>分类</div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--ui_text)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {category_options.find((c) => c.value === active_agent.category)?.label || '未分类'}
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--ui_text_muted)',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  系统提示词
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--ui_panel_alt)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--ui_text)',
                    lineHeight: '1.6',
                    overflow: 'auto',
                    maxHeight: '120px',
                  }}
                >
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
  )
}
