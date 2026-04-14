/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: 图生图页面
 */
import React, { useState } from 'react'
import { ImagePlus, Loader2, Upload } from 'lucide-react'

const ImageToImage: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [source_url, set_source_url] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')

  const handle_generate = async () => {
    if (!prompt.trim() || !source_url.trim()) return
    set_loading(true)
    set_error('')
    set_result_url('')
    
    try {
      const res = await window.electron_api.ai_generate_image_to_image(prompt, source_url)
      if (res.success && res.data?.image_url) {
        set_result_url(res.data.image_url)
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
      <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>图生图</h1>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>参考图片 URL (这里暂用 URL 模拟上传)</label>
            <input
              type="text"
              value={source_url}
              onChange={(e) => set_source_url(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                outline: 'none', fontSize: '14px', fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>修改描述</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="例如: 将图片转换为赛博朋克风格..."
              style={{
                width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                resize: 'vertical', outline: 'none', fontSize: '14px', fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim() || !source_url.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() || !source_url.trim() ? '#94a3b8' : '#0ea5e9', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() || !source_url.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 500, transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', minHeight: '300px' }}>
            <div style={{ 
              flex: 1, backgroundColor: '#f1f5f9', borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #cbd5e1' 
            }}>
              {source_url ? (
                <img src={source_url} alt="Source" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Upload size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <span style={{ fontSize: '14px' }}>参考图预览</span>
                </div>
              )}
            </div>

            <div style={{ 
              flex: 1, backgroundColor: '#f1f5f9', borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #cbd5e1' 
            }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                  <Loader2 size={24} className="animate-spin" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '14px' }}>生成中...</span>
                </div>
              ) : result_url ? (
                <img src={result_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ImagePlus size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <span style={{ fontSize: '14px' }}>结果图预览</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ImageToImage
