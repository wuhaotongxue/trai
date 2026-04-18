/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: 图生图页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState } from 'react'
import { ImagePlus, Loader2, Upload, Palette, ChevronRight, Image } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'

interface StylePreset {
  id: string
  name: string
  prompt: string
}

const ImageToImage: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [source_url, set_source_url] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_style, set_active_style] = useState<string>('')

  const style_presets: StylePreset[] = [
    { id: 'cyberpunk', name: '赛博朋克', prompt: '将图片转换为赛博朋克风格，霓虹灯，未来感' },
    { id: 'anime', name: '动漫风格', prompt: '将图片转换为日本动漫风格，色彩鲜艳' },
    { id: 'watercolor', name: '水彩画', prompt: '将图片转换为水彩画风格，柔和的色彩' },
    { id: 'oil_painting', name: '油画', prompt: '将图片转换为古典油画风格，厚重的笔触' }
  ]

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

  const apply_style = (style: StylePreset) => {
    set_prompt(style.prompt)
    set_active_style(style.id)
  }

  const middlePanel = (
    <>
      {style_presets.map(style => (
        <button
          key={style.id}
          onClick={() => apply_style(style)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_style === style.id ? '#f0f9ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_style === style.id ? '#0ea5e9' : '#475569',
            fontWeight: active_style === style.id ? '600' : 'normal',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={14} />
            {style.name}
          </div>
          {active_style === style.id && <ChevronRight size={14} />}
        </button>
      ))}
    </>
  )

  return (
    <ThreePanelLayout
      title="图生图"
      middlePanelTitle="图生预设"
      middlePanel={middlePanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600, fontSize: '14px' }}>参考图片 URL</label>
            <input
              type="text"
              value={source_url}
              onChange={(e) => set_source_url(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                outline: 'none', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600, fontSize: '14px' }}>修改描述</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="例如: 将图片转换为赛博朋克风格..."
              style={{
                width: '100%', height: '80px', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                resize: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim() || !source_url.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() || !source_url.trim() ? '#94a3b8' : '#0ea5e9', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() || !source_url.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginTop: '16px', fontSize: '13px', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '16px' }}>
          <div style={{ 
            flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', boxSizing: 'border-box'
          }}>
            {source_url ? (
              <img src={source_url} alt="Source" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={36} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '14px' }}>参考图预览</span>
              </div>
            )}
          </div>

          <div style={{ 
            flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', boxSizing: 'border-box'
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', gap: '8px' }}>
                <Loader2 size={28} className="animate-spin" />
                <span style={{ fontSize: '14px' }}>生成中...</span>
              </div>
            ) : result_url ? (
              <img src={result_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ImagePlus size={36} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '14px' }}>结果图预览</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default ImageToImage
