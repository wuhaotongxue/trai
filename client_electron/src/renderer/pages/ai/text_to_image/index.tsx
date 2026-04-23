/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: 文生图页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState } from 'react'
import { Image as ImageIcon, Loader2, Palette, ChevronRight, Cat, Building2, Mountain, User } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis, to_fixed_chars } from '@/utils/ui_text'

interface PromptTemplate {
  id: string
  name: string
  prompt: string
  category: string
}

interface StyleCategory {
  id: string
  name: string
  icon: React.ReactNode
}

/**
 * 文生图组件
 * 
 * 用于通过文本描述生成图像，支持风格分类和模板选择
 */
const TextToImage: React.FC = () => {
  const [prompt, set_prompt] = useState('你的一只穿着宇航服的猫, 在火星表面漫步, 高分辨率, 电影级光影...')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_template, set_active_template] = useState<string>('')
  const [active_category, set_active_category] = useState<string>('animal')

  /**
   * 风格分类列表
   */
  const categories: StyleCategory[] = [
    { id: 'animal', name: '动物风格', icon: <Cat size={14} /> },
    { id: 'city', name: '城市风格', icon: <Building2 size={14} /> },
    { id: 'landscape', name: '风景风格', icon: <Mountain size={14} /> },
    { id: 'portrait', name: '人物风格', icon: <User size={14} /> }
  ]

  /**
   * 提示词模板列表
   */
  const prompt_templates: PromptTemplate[] = [
    { id: 'cat_astronaut', name: '宇航员猫', prompt: '一只穿着宇航服的猫, 在火星表面漫步, 高分辨率, 电影级光影', category: 'animal' },
    { id: 'cyberpunk_city', name: '赛博朋克城市', prompt: '未来赛博朋克城市夜景, 霓虹灯, 雨夜, 反射, 科幻风格', category: 'city' },
    { id: 'fantasy_landscape', name: '奇幻风景', prompt: '奇幻风格的山水风景, 漂浮的岛屿, 瀑布, 魔法光芒, 梦幻色彩', category: 'landscape' },
    { id: 'portrait', name: '人物肖像', prompt: '精美的女性人物肖像, 柔和的光线, 电影级构图, 高分辨率', category: 'portrait' }
  ]

  /**
   * 根据当前选中的分类过滤模板
   */
  const filtered_templates = prompt_templates.filter(t => t.category === active_category)

  /**
   * 处理图像生成
   * 
   * 调用 Electron API 生成图像，处理加载状态和错误
   */
  const handle_generate = async () => {
    if (!prompt.trim()) return
    set_loading(true)
    set_error('')
    set_result_url('')
    
    try {
      const res = await window.electron_api.ai_generate_image(prompt)
      if (res.success && res.data?.image_url) {
        set_result_url(res.data.image_url)
      } else {
        set_error(res.error || '生成失败, 请重试')
      }
    } catch (err: any) {
      set_error(err.message || '网络异常')
    } finally {
      set_loading(false)
    }
  }

  /**
   * 应用模板
   * 
   * @param template 选中的模板
   * 
   * 将模板的提示词应用到输入框
   */
  const apply_template = (template: PromptTemplate) => {
    set_prompt(template.prompt)
    set_active_template(template.id)
  }

  const leftPanel = (
    <>
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => {
            set_active_category(category.id)
            // 自动填充该分类的第一个模板
            const first_template = prompt_templates.find(t => t.category === category.id)
            if (first_template) {
              set_prompt(first_template.prompt)
              set_active_template(first_template.id)
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_category === category.id ? 'var(--ui_accent)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_category === category.id ? 'white' : 'var(--ui_text)',
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
      {filtered_templates.map(template => (
        <button
          key={template.id}
          onClick={() => apply_template(template)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_template === template.id ? 'var(--ui_accent)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_template === template.id ? 'white' : 'var(--ui_text)',
            fontWeight: active_template === template.id ? '600' : 'normal',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Palette size={14} />
            <span
              style={
                should_ellipsis(template.name)
                  ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                  : { whiteSpace: 'nowrap' }
              }
            >
              {template.name}
            </span>
          </div>
          {active_template === template.id && <ChevronRight size={14} />}
        </button>
      ))}
    </>
  )

  const active_template_name = active_template ? prompt_templates.find(t => t.id === active_template)?.name : ''
  const active_category_name = categories.find(c => c.id === active_category)?.name || '模板预设'
  const middle_title = to_fixed_chars(active_category_name, 4, '风格')

  return (
    <ThreePanelLayout
      title="文生图像"
      titleIcon={<ImageIcon size={20} color="var(--ui_accent)" />}
      leftPanelTitle="风格分类"
      leftPanel={leftPanel}
      middlePanelTitle={middle_title}
      middlePanel={middlePanel}
      rightPanelTitle={active_template_name || '图片生成'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--ui_text)', fontWeight: 600, fontSize: '14px' }}>描述你想生成的画面</label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={prompt}
                onChange={(e) => set_prompt(e.target.value)}
                placeholder="例如: 一只穿着宇航服的猫, 在火星表面漫步, 高分辨率, 电影级光影..."
                style={{
                  width: '100%', height: '80px', padding: '14px', borderRadius: '10px', border: '1px solid var(--ui_border)', 
                  resize: 'none', outline: 'none', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box',
                  backgroundColor: 'var(--ui_panel)',
                  color: 'var(--ui_text)'
                }}
              />
              {prompt && (
                <button
                  onClick={() => set_prompt('')}
                  style={{
                    position: 'absolute', right: '10px', top: '10px', padding: '4px 8px', 
                    backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text_muted)', border: 'none', borderRadius: '4px', 
                    cursor: 'pointer', fontSize: '12px', fontWeight: 500
                  }}
                >
                  清空
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() ? 'var(--ui_text_muted)' : 'var(--ui_accent)', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--ui_danger)', color: 'white', borderRadius: '8px', marginTop: '16px', fontSize: '13px', boxSizing: 'border-box' }}>
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
              <Loader2 size={32} className="animate-spin" />
              <span style={{ fontSize: '14px' }}>AI 正在努力作画, 请稍候...</span>
            </div>
          ) : result_url ? (
            <img src={result_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'var(--ui_text_muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={48} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '14px' }}>生成的图片将在这里展示</span>
            </div>
          )}
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default TextToImage
