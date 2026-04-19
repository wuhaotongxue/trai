/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: AI 音乐页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState } from 'react'
import { Music, Loader2, ChevronRight, Headphones, Radio, Guitar, Piano, Zap, Music2 } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis, to_fixed_chars } from '@/utils/ui_text'

interface MusicStyle {
  id: string
  name: string
  prompt: string
  icon: React.ReactNode
  category: string
}

interface MusicCategory {
  id: string
  name: string
  icon: React.ReactNode
}

const AiMusic: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_style, set_active_style] = useState<string>('')
  const [active_category, set_active_category] = useState<string>('modern')

  const categories: MusicCategory[] = [
    { id: 'modern', name: '现代风格', icon: <Zap size={14} /> },
    { id: 'classic', name: '古典风格', icon: <Music2 size={14} /> }
  ]

  const music_styles: MusicStyle[] = [
    { id: 'electronic', name: '电子音乐', prompt: '一首欢快的赛博朋克风格电子乐，节奏明快，带有强烈的鼓点', icon: <Radio size={14} />, category: 'modern' },
    { id: 'rock', name: '摇滚音乐', prompt: '一首充满力量的摇滚乐，激昂的吉他独奏，强烈的节奏', icon: <Guitar size={14} />, category: 'modern' },
    { id: 'classical', name: '古典音乐', prompt: '一首优美的古典钢琴曲，柔和的旋律，浪漫的氛围', icon: <Piano size={14} />, category: 'classic' },
    { id: 'ambient', name: '环境音乐', prompt: '一首宁静的环境音乐，适合冥想和放松，自然音效', icon: <Headphones size={14} />, category: 'classic' }
  ]

  const filtered_styles = music_styles.filter(s => s.category === active_category)

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

  const leftPanel = (
    <>
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => {
            set_active_category(category.id)
            // 自动填充该分类的第一个模板
            const first_style = music_styles.find(s => s.category === category.id)
            if (first_style) {
              set_prompt(first_style.prompt)
              set_active_style(first_style.id)
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_category === category.id ? '#f0f9ff' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_category === category.id ? '#0ea5e9' : '#475569',
            fontWeight: active_category === category.id ? '600' : 'normal',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          {category.icon}
          <span
            style={
              should_ellipsis(category.name)
                ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                : { whiteSpace: 'nowrap' }
            }
          >
            {category.name}
          </span>
        </button>
      ))}
    </>
  )

  const middlePanel = (
    <>
      {filtered_styles.map(style => (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {style.icon}
            <span
              style={
                should_ellipsis(style.name)
                  ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                  : { whiteSpace: 'nowrap' }
              }
            >
              {style.name}
            </span>
          </div>
          {active_style === style.id && <ChevronRight size={14} />}
        </button>
      ))}
    </>
  )

  const active_style_name = active_style ? music_styles.find(s => s.id === active_style)?.name : ''
  const active_category_name = categories.find(c => c.id === active_category)?.name || '风格预设'
  const middle_title = to_fixed_chars(active_category_name, 4, '风格')

  return (
    <ThreePanelLayout
      title="音乐生成"
      titleIcon={<Music size={20} color="#0ea5e9" />}
      leftPanelTitle="音乐分类"
      leftPanel={leftPanel}
      middlePanelTitle={middle_title}
      middlePanel={middlePanel}
      rightPanelTitle={active_style_name || '音乐生成'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600, fontSize: '14px' }}>描述你想生成的音乐</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="例如: 一首欢快的赛博朋克风格电子乐，节奏明快，带有强烈的鼓点..."
              style={{
                width: '100%', height: '80px', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                resize: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() ? '#94a3b8' : '#0ea5e9', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Music size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginTop: '16px', fontSize: '13px', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ 
          flex: 1, minHeight: 0, marginTop: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', boxSizing: 'border-box'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', gap: '10px' }}>
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: '14px' }}>AI 正在创作乐曲，请稍候...</span>
            </div>
          ) : result_url ? (
            <div style={{ width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Music size={48} style={{ color: '#0ea5e9', marginBottom: '24px' }} />
              <audio controls src={result_url} style={{ width: '100%', maxWidth: '400px' }}>
                您的浏览器不支持 audio 标签。
              </audio>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Music size={48} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '14px' }}>生成的音乐将在这里展示</span>
            </div>
          )}
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default AiMusic
