/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 15:28:00
 * 描述: ComfyUI 工作流界面
 */
import React, { useState } from 'react'
import { Bot, Loader2, RefreshCw } from 'lucide-react'

const ComfyUI: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result, set_result] = useState<any>(null)
  const [error, set_error] = useState('')

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} color="#0ea5e9" />
          ComfyUI 工作流
        </h1>
      </div>

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '16px' }}>提交生成任务</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="请输入正向提示词，例如：A beautiful landscape with mountains..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                resize: 'vertical',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handle_generate}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                {loading ? '生成中...' : '提交任务'}
              </button>
            </div>
          </div>
          
          {error && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} color="#10b981" />
              生成结果
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>任务 ID:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{result.task_id}</span>
                <span style={{ padding: '2px 8px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                  {result.status === 'completed' ? '已完成' : result.status}
                </span>
              </div>
              
              {result.image_url && (
                <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={result.image_url} alt="Generated" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComfyUI
