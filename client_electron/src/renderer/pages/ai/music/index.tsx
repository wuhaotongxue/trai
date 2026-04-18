/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: AI 音乐页面 - 三段式布局
 */
import React, { useState } from 'react'
import { Music, Loader2, Sparkles, ChevronRight, Headphones, Radio, Guitar, Piano } from 'lucide-react'

interface MusicStyle {
  id: string
  name: string
  prompt: string
  icon: React.ReactNode
}

const AiMusic: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_style, set_active_style] = useState<string>('')

  const music_styles: MusicStyle[] = [
    { id: 'electronic', name: '电子乐', prompt: '一首欢快的赛博朋克风格电子乐，节奏明快，带有强烈的鼓点', icon: <Radio size={14} /> },
    { id: 'classical', name: '古典音乐', prompt: '一首优美的古典钢琴曲，柔和的旋律，浪漫的氛围', icon: <Piano size={14} /> },
    { id: 'rock', name: '摇滚', prompt: '一首充满力量的摇滚乐，激昂的吉他独奏，强烈的节奏', icon: <Guitar size={14} /> },
    { id: 'ambient', name: '环境音乐', prompt: '一首宁静的环境音乐，适合冥想和放松，自然音效', icon: <Headphones size={14} /> }
  ]

  const handle_generate = async () => {
    if (!prompt.trim()) return
    set_loading(true)
    set_error('')
    set_result_url('')
    
    try {
      const res = await window.electron_api.ai_generate_music(prompt)
      if (res.success && res.data?.audio_url) {
        set_result_url(res.data.audio_url)
      } else {
        set_error(res.error || '生成失败，请重试')
      }
    } catch (err: any) {
      set_error(err.message || '网络异常')
    } finally {
      set_loading(false)
    }
  }

  const apply_style = (style: MusicStyle) => {
    set_prompt(style.prompt)
    set_active_style(style.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Music size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>AI 音乐生成</h1>
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
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', paddingLeft: '8px' }}>AI 能力</div>
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
              AI 音乐
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
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', paddingLeft: '8px' }}>
              音乐风格
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {music_styles.map(style => (
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
                  {style.icon}
                  {style.name}
                </div>
                {active_style === style.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>描述你想生成的音乐</label>
                <textarea
                  value={prompt}
                  onChange={(e) => set_prompt(e.target.value)}
                  placeholder="例如: 一首欢快的赛博朋克风格电子乐，节奏明快，带有强烈的鼓点..."
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
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Music size={18} />}
                  {loading ? '生成中...' : '开始生成'}
                </button>
              </div>

              {error && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>
                  {error}
                </div>
              )}

              <div style={{ 
                width: '100%', minHeight: '200px', backgroundColor: '#f1f5f9', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #cbd5e1' 
              }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                    <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px' }} />
                    <span>AI 正在创作乐曲，请稍候...</span>
                  </div>
                ) : result_url ? (
                  <div style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Music size={48} style={{ color: '#0ea5e9', marginBottom: '24px' }} />
                    <audio controls src={result_url} style={{ width: '100%', maxWidth: '400px' }}>
                      您的浏览器不支持 audio 标签。
                    </audio>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Music size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <span>生成的音乐将在这里展示</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiMusic
