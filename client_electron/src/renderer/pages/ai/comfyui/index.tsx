/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 15:28:00
 * 描述: ComfyUI 工作流界面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState } from 'react'
import { Bot, Loader2, RefreshCw, ChevronRight, Workflow, Image, Settings } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis } from '@/utils/ui_text'

interface WorkflowPreset {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const ComfyUI: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result, set_result] = useState<any>(null)
  const [error, set_error] = useState('')
  const [active_workflow, set_active_workflow] = useState<string>('')

  const workflow_presets: WorkflowPreset[] = [
    { id: 'text2img', name: '文生图工作流', description: '基础文本到图像生成工作流', icon: <Image size={14} /> },
    { id: 'img2img', name: '图生图工作流', description: '基于参考图的图像生成工作流', icon: <Workflow size={14} /> },
    { id: 'upscale', name: '超分辨率工作流', description: '图像放大和增强工作流', icon: <Settings size={14} /> }
  ]

  const handle_generate = async () => {
    if (!prompt.trim()) {
      set_error('请输入提示词')
      return
    }

    set_loading(true)
    set_error('')
    set_result(null)

    try {
      const res = await window.electron_api.ai_generate_comfyui(prompt)
      if (res.success) {
        set_result(res.data)
      } else {
        set_error(res.error || '生成失败')
      }
    } catch (err: any) {
      set_error(err.message || '未知错误')
    } finally {
      set_loading(false)
    }
  }

  const select_workflow = (workflow: WorkflowPreset) => {
    set_active_workflow(workflow.id)
  }

  const middlePanel = (
    <>
      {workflow_presets.map(workflow => (
        <button
          key={workflow.id}
          onClick={() => select_workflow(workflow)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_workflow === workflow.id ? 'var(--ui_accent)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_workflow === workflow.id ? 'white' : 'var(--ui_text)',
            fontWeight: active_workflow === workflow.id ? '600' : 'normal',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {workflow.icon}
            <span
              style={
                should_ellipsis(workflow.name)
                  ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                  : { whiteSpace: 'nowrap' }
              }
            >
              {workflow.name}
            </span>
          </div>
          {active_workflow === workflow.id && <ChevronRight size={14} />}
        </button>
      ))}
    </>
  )

  return (
    <ThreePanelLayout
      title="ComfyUI 工作流"
      middlePanelTitle="工作预设"
      middlePanel={middlePanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--ui_text)', fontWeight: 600, fontSize: '14px' }}>提交生成任务</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="请输入正向提示词, 例如: A beautiful landscape with mountains..."
              style={{
                width: '100%',
                height: '80px',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--ui_border)',
                outline: 'none',
                resize: 'none',
                fontSize: '14px',
                lineHeight: '1.5',
                boxSizing: 'border-box',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handle_generate}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: 'var(--ui_accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? <Loader2 size={18} className="anim_spin" /> : <Bot size={18} />}
              {loading ? '生成中...' : '提交任务'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--ui_danger)', color: 'white', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ 
          flex: 1, minHeight: 0, marginTop: '16px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed var(--ui_border)', boxSizing: 'border-box'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--ui_text_muted)', gap: '10px' }}>
              <Loader2 size={32} className="anim_spin" />
              <span style={{ fontSize: '14px' }}>ComfyUI 正在处理任务...</span>
            </div>
          ) : result ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', marginBottom: '16px', flexShrink: 0 }}>
                <span style={{ color: 'var(--ui_text_muted)' }}>任务 ID:</span>
                <span style={{ fontWeight: 500, color: 'var(--ui_text)' }}>{result.task_id}</span>
                <span style={{ padding: '3px 10px', backgroundColor: 'var(--ui_success)', color: 'white', borderRadius: '14px', fontSize: '12px', fontWeight: 600 }}>
                  {result.status === 'completed' ? '已完成' : result.status}
                </span>
              </div>
              
              {result.image_url && (
                <div style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={result.image_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--ui_text_muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Bot size={48} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '14px' }}>选择工作流并提交任务后, 结果将在这里展示</span>
            </div>
          )}
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default ComfyUI
