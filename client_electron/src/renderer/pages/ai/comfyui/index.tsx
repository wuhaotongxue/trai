/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 15:28:00
 * 描述: ComfyUI 工作流界面 - 三段式布局
 */
import React, { useState } from 'react'
import { Bot, Loader2, RefreshCw, Sparkles, ChevronRight, Workflow, Image, Settings, PanelLeftOpen, List } from 'lucide-react'

interface WorkflowPreset {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const ComfyUI: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>ComfyUI 工作流</h1>
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
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>AI 能力</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起AI能力栏"
              aria-label="收起AI能力栏"
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
            <button
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#0ea5e9',
                fontWeight: 600,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} />
              ComfyUI
            </button>
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
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '200px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开AI能力栏"
                  aria-label="展开AI能力栏"
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
              <span style={{ fontSize: '14px', fontWeight: 600 }}>工作流预设</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起工作流预设栏"
              aria-label="收起工作流预设栏"
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
            {workflow_presets.map(workflow => (
              <button
                key={workflow.id}
                onClick={() => select_workflow(workflow)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_workflow === workflow.id ? '#f0f9ff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: active_workflow === workflow.id ? '#0ea5e9' : '#475569',
                  fontWeight: active_workflow === workflow.id ? '600' : 'normal',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {workflow.icon}
                  {workflow.name}
                </div>
                {active_workflow === workflow.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '16px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            {!is_middle_sidebar_open && (
              <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                {!is_left_sidebar_open && (
                  <button
                    onClick={() => set_is_left_sidebar_open(true)}
                    title="展开AI能力栏"
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
                  title="展开工作流预设栏"
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
            <span style={{ fontSize: '14px', color: '#64748b' }}>ComfyUI 工作流</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '20px' }}>提交生成任务</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <textarea
                  value={prompt}
                  onChange={(e) => set_prompt(e.target.value)}
                  placeholder="请输入正向提示词，例如：A beautiful landscape with mountains..."
                  style={{
                    width: '100%',
                    minHeight: '160px',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    resize: 'vertical',
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handle_generate}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px 32px',
                      backgroundColor: '#0ea5e9',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '15px',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20} />}
                    {loading ? '生成中...' : '提交任务'}
                  </button>
                </div>
              </div>
              
              {error && (
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '10px', fontSize: '15px' }}>
                  {error}
                </div>
              )}
            </div>

            {result && (
              <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={20} color="#10b981" />
                  生成结果
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '15px' }}>
                    <span style={{ color: '#64748b' }}>任务 ID:</span>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{result.task_id}</span>
                    <span style={{ padding: '4px 12px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
                      {result.status === 'completed' ? '已完成' : result.status}
                    </span>
                  </div>
                  
                  {result.image_url && (
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                      <img src={result.image_url} alt="Generated" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComfyUI
