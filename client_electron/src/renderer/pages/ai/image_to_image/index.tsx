/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: 图生图页面 - 三段式布局
 */
import React, { useState } from 'react'
import { ImagePlus, Loader2, Upload, Sparkles, Palette, ChevronRight, Image, PanelLeftOpen, List } from 'lucide-react'

interface StylePreset {
  id: string
  name: string
  prompt: string
}

const ImageToImage: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>图生图</h1>
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
              图生图
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
              <span style={{ fontSize: '14px', fontWeight: 600 }}>风格预设</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起风格预设栏"
              aria-label="收起风格预设栏"
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
                  title="展开风格预设栏"
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
            <span style={{ fontSize: '14px', color: '#64748b' }}>图生图</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#334155', fontWeight: 500, fontSize: '15px' }}>参考图片 URL</label>
                <input
                  type="text"
                  value={source_url}
                  onChange={(e) => set_source_url(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                    outline: 'none', fontSize: '15px', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: '#334155', fontWeight: 500, fontSize: '15px' }}>修改描述</label>
                <textarea
                  value={prompt}
                  onChange={(e) => set_prompt(e.target.value)}
                  placeholder="例如: 将图片转换为赛博朋克风格..."
                  style={{
                    width: '100%', minHeight: '140px', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                    resize: 'vertical', outline: 'none', fontSize: '15px', fontFamily: 'inherit', lineHeight: '1.6'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                <button
                  onClick={handle_generate}
                  disabled={loading || !prompt.trim() || !source_url.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 32px', 
                    backgroundColor: loading || !prompt.trim() || !source_url.trim() ? '#94a3b8' : '#0ea5e9', 
                    color: '#ffffff', border: 'none', borderRadius: '10px', cursor: loading || !prompt.trim() || !source_url.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '15px', transition: 'background-color 0.2s'
                  }}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                  {loading ? '生成中...' : '开始生成'}
                </button>
              </div>

              {error && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '10px', marginBottom: '28px', fontSize: '15px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
                <div style={{ 
                  flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1' 
                }}>
                  {source_url ? (
                    <img src={source_url} alt="Source" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Upload size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <span style={{ fontSize: '15px' }}>参考图预览</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  flex: 1, backgroundColor: '#f1f5f9', borderRadius: '12px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1' 
                }}>
                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                      <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
                      <span style={{ fontSize: '15px' }}>生成中...</span>
                    </div>
                  ) : result_url ? (
                    <img src={result_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <ImagePlus size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <span style={{ fontSize: '15px' }}>结果图预览</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageToImage
