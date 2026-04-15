/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: AI 视频页面
 */
import React, { useState } from 'react'
import { Video, Loader2 } from 'lucide-react'

const AiVideo: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')

  const handle_generate = async () => {
    if (!prompt.trim()) return
    set_loading(true)
    set_error('')
    set_result_url('')
    
    try {
      const res = await window.electron_api.ai_generate_video(prompt)
      if (res.success && res.data?.video_url) {
        set_result_url(res.data.video_url)
      } else {
        set_error(res.error || '生成失败，请重试')
      }
    } catch (err: any) {
      set_error(err.message || '网络异常')
    } finally {
      set_loading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>AI 视频生成</h1>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>描述你想生成的视频画面</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="例如: 镜头从高空俯冲穿过赛博朋克城市的街道，霓虹灯闪烁，飞行器穿梭..."
              style={{
                width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                resize: 'vertical', outline: 'none', fontSize: '14px', fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() ? '#94a3b8' : '#0ea5e9', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 500, transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div style={{ 
            width: '100%', minHeight: '400px', backgroundColor: '#f1f5f9', borderRadius: '8px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #cbd5e1' 
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
                <span>AI 正在渲染视频，请稍候...</span>
              </div>
            ) : result_url ? (
              <video controls src={result_url} style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', backgroundColor: '#000' }}>
                您的浏览器不支持 video 标签。
              </video>
            ) : (
              <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Video size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <span>生成的视频将在这里展示</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default AiVideo
