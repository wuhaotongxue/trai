/**
 * 文件名: tool_steps.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 23:55:00
 * 描述: 工具调用步骤展示组件
 */
import React from 'react'
import { Wrench, CheckCircle2, XCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { ToolStep } from '../types'

interface ToolStepsProps {
  steps: ToolStep[]
  idx: number
  expanded_steps: Record<string, boolean>
  toggle_step: (id: string) => void
}

const ToolSteps: React.FC<ToolStepsProps> = ({ steps, idx, expanded_steps, toggle_step }) => {
  const valid_steps = steps.filter(step => {
    if (!step.tool_name || !step.tool_name.trim()) return false
    if (step.content && step.content.trim() === '{}') return false
    return true
  })

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

  const has_any_success = unique_steps.some(step =>
    step.type === 'tool_result' && step.success === true
  )

  return (
    <div style={{
      borderRadius: '8px',
      border: '1px solid var(--ui_border)',
      overflow: 'hidden',
      backgroundColor: 'var(--ui_panel)',
    }}>
      <div
        onClick={() => toggle_step(`all_steps_${idx}`)}
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: 'var(--ui_panel_alt)',
          fontSize: '13px',
          userSelect: 'none',
        }}
      >
        <Wrench size={14} style={{ marginRight: '8px', color: has_any_success ? 'var(--ui_success)' : 'var(--ui_text_muted)' }} />
        <span style={{ color: 'var(--ui_text)', fontWeight: 500 }}>
          工具调用 {has_any_success ? '✅' : ''}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ui_text_muted)' }}>
          {expanded_steps[`all_steps_${idx}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {expanded_steps[`all_steps_${idx}`] && (
        <div style={{ borderTop: '1px solid var(--ui_border)' }}>
          {unique_steps.map((step, s_idx) => {
            const step_id = `step_${idx}_${s_idx}`
            const is_start = step.type === 'tool_start'
            const is_success = step.success === true
            const is_fail = step.success === false

            const has_success_result = unique_steps.some(s =>
              s.type === 'tool_result' && s.tool_name === step.tool_name && s.success === true
            )
            const has_fail_result = unique_steps.some(s =>
              s.type === 'tool_result' && s.tool_name === step.tool_name && s.success === false
            )

            let border_color = 'var(--ui_border)'
            let icon_color = 'var(--ui_text_muted)'
            let status_text = '执行中...'

            if (is_start && has_success_result) {
              border_color = 'var(--ui_success)'
              icon_color = 'var(--ui_success)'
              status_text = '已完成'
            } else if (is_start && has_fail_result) {
              border_color = 'var(--ui_danger)'
              icon_color = 'var(--ui_danger)'
              status_text = '失败'
            } else if (is_success) {
              border_color = 'var(--ui_success)'
              icon_color = 'var(--ui_success)'
              status_text = '已完成'
            } else if (is_fail) {
              border_color = 'var(--ui_danger)'
              icon_color = 'var(--ui_danger)'
              status_text = '失败'
            }

            return (
              <div key={s_idx} style={{
                borderBottom: s_idx < unique_steps.length - 1 ? '1px solid var(--ui_border)' : 'none',
              }}>
                <div
                  onClick={() => toggle_step(step_id)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'var(--ui_panel)',
                    fontSize: '13px',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ color: 'var(--ui_text)', fontWeight: 500, marginRight: '8px' }}>
                    {step.tool_name}
                  </span>
                  <span style={{ flex: 1, color: 'var(--ui_text_muted)', fontSize: '12px' }}>
                    {is_start ? '调用工具' : '返回结果'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)', fontSize: '12px', marginRight: '8px' }}>
                    {is_start && !has_success_result && !has_fail_result && <Loader2 size={12} className="animate-spin" />}
                    {(is_success || (is_start && has_success_result)) && <CheckCircle2 size={12} />}
                    {(is_fail || (is_start && has_fail_result)) && <XCircle size={12} />}
                    <span>{status_text}</span>
                  </div>
                  <div style={{ color: 'var(--ui_text_muted)' }}>
                    {expanded_steps[step_id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>

                {expanded_steps[step_id] && (
                  <div style={{
                    padding: '12px 14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: 'var(--ui_text)',
                    fontSize: '13px',
                    borderTop: `1px solid ${border_color}`,
                    backgroundColor: 'var(--ui_panel)',
                    fontFamily: 'monospace',
                    lineHeight: '1.5',
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
}

export default ToolSteps
