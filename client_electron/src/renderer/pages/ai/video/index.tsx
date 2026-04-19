/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: AI 视频页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState } from 'react'
import { Video, Loader2, ChevronRight, Film, Clapperboard, Camera, Tv, Rocket, TreePine } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis, to_fixed_chars } from '@/utils/ui_text'

interface VideoStyle {
  id: string
  name: string
  prompt: string
  icon: React.ReactNode
  category: string
}

interface VideoCategory {
  id: string
  name: string
  icon: React.ReactNode
}

const AiVideo: React.FC = () => {
  const [prompt, set_prompt] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_style, set_active_style] = useState<string>('')
  const [active_category, set_active_category] = useState<string>('city')

  const categories: VideoCategory[] = [
    { id: 'city', name: '城市风格', icon: <Rocket size={14} /> },
    { id: 'nature', name: '自然风格', icon: <TreePine size={14} /> }
  ]

  const video_styles: VideoStyle[] = [
    { id: 'cyberpunk', name: '赛博朋克', prompt: '镜头从高空俯冲穿过赛博朋克城市的街道，霓虹灯闪烁，飞行器穿梭', icon: <Film size={14} />, category: 'city' },
    { id: 'scifi', name: '科幻场景', prompt: '未来太空站内部，宇航员在失重环境中工作，科幻感', icon: <Tv size={14} />, category: 'city' },
    { id: 'nature', name: '自然风光', prompt: '航拍壮丽的山川河流，云雾缭绕，阳光穿透云层', icon: <Camera size={14} />, category: 'nature' },
    { id: 'cinematic', name: '电影质感', prompt: '电影级别的慢动作镜头，戏剧性的光影，史诗感', icon: <Clapperboard size={14} />, category: 'nature' }
  ]

  const filtered_styles = video_styles.filter(s => s.category === active_category)

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

  const apply_style = (style: VideoStyle) => {
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
            const first_style = video_styles.find(s => s.category === category.id)
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

  const active_style_name = active_style ? video_styles.find(s => s.id === active_style)?.name : ''
  const active_category_name = categories.find(c => c.id === active_category)?.name || '视频预设'
  const middle_title = to_fixed_chars(active_category_name, 4, '风格')

  return (
    <ThreePanelLayout
      title="视频生成"
      titleIcon={<Video size={20} color="#0ea5e9" />}
      leftPanelTitle="视频分类"
      leftPanel={leftPanel}
      middlePanelTitle={middle_title}
      middlePanel={middlePanel}
      rightPanelTitle={active_style_name || '视频生成'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600, fontSize: '14px' }}>描述你想生成的视频画面</label>
            <textarea
              value={prompt}
              onChange={(e) => set_prompt(e.target.value)}
              placeholder="例如: 镜头从高空俯冲穿过赛博朋克城市的街道，霓虹灯闪烁，飞行器穿梭..."
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginTop: '16px', fontSize: '14px', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ 
          flex: 1, minHeight: 0, marginTop: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', boxSizing: 'border-box'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', fontSize: '14px' }}>
              <Loader2 size={36} className="animate-spin" style={{ marginBottom: '12px' }} />
              <span>AI 正在渲染视频，请稍候...</span>
            </div>
          ) : result_url ? (
            <video controls src={result_url} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}>
              您的浏览器不支持 video 标签。
            </video>
          ) : (
            <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '14px' }}>
              <Video size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <span>生成的视频将在这里展示</span>
            </div>
          )}
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default AiVideo
