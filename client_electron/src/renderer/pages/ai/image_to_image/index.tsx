/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 11:20:00
 * 描述: 图生图页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Upload, Palette, ChevronRight, Image, Rocket, Palette as PaletteIcon } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis, to_fixed_chars } from '@/utils/ui_text'

interface StylePreset {
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
 * 图生图组件
 * 
 * 用于通过参考图片和文本描述生成新图像，支持风格分类和预设选择
 */
const ImageToImage: React.FC = () => {
  const [prompt, set_prompt] = useState('将这只可爱的猫咪图片转换为赛博朋克风格, 霓虹灯, 未来感...')
  const [source_url, set_source_url] = useState('./kity.png')
  const [source_preview_url, set_source_preview_url] = useState('')
  const [source_file_name, set_source_file_name] = useState('')
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error, set_error] = useState('')
  const [active_style, set_active_style] = useState<string>('')
  const [active_category, set_active_category] = useState<string>('scifi')
  const file_input_ref = useRef<HTMLInputElement>(null)

  /**
   * 清理预览 URL
   */
  useEffect(() => {
    return () => {
      if (source_preview_url) URL.revokeObjectURL(source_preview_url)
    }
  }, [source_preview_url])

  /**
   * 读取文件为 Data URL
   * 
   * @param file 要读取的文件
   * @returns Promise<string> - 文件的 Data URL
   */
  const read_as_data_url = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = (e) => reject(e)
    })
  }

  /**
   * 风格分类列表
   */
  const categories: StyleCategory[] = [
    { id: 'scifi', name: '科幻风格', icon: <Rocket size={14} /> },
    { id: 'art', name: '艺术风格', icon: <PaletteIcon size={14} /> }
  ]

  /**
   * 风格预设列表
   */
  const style_presets: StylePreset[] = [
    { id: 'cyberpunk', name: '赛博朋克', prompt: '将图片转换为赛博朋克风格, 霓虹灯, 未来感', category: 'scifi' },
    { id: 'anime', name: '动漫风格', prompt: '将图片转换为日本动漫风格, 色彩鲜艳', category: 'art' },
    { id: 'watercolor', name: '水彩风格', prompt: '将图片转换为水彩画风格, 柔和的色彩', category: 'art' },
    { id: 'oil_painting', name: '油画风格', prompt: '将图片转换为古典油画风格, 厚重的笔触', category: 'art' }
  ]

  /**
   * 根据当前选中的分类过滤风格预设
   */
  const filtered_styles = style_presets.filter(s => s.category === active_category)

  /**
   * 处理图像生成
   * 
   * 调用 Electron API 生成图像，处理加载状态和错误
   */
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
        set_error(res.error || '生成失败, 请重试')
      }
    } catch (err: any) {
      set_error(err.message || '网络异常')
    } finally {
      set_loading(false)
    }
  }

  /**
   * 应用风格预设
   * 
   * @param style 选中的风格预设
   * 
   * 将预设的提示词应用到输入框
   */
  const apply_style = (style: StylePreset) => {
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
            const first_style = style_presets.find(s => s.category === category.id)
            if (first_style) {
              set_prompt(first_style.prompt)
              set_active_style(first_style.id)
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
      {filtered_styles.map(style => (
        <button
          key={style.id}
          onClick={() => apply_style(style)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: active_style === style.id ? 'var(--ui_accent)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: active_style === style.id ? 'white' : 'var(--ui_text)',
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
            <Palette size={14} />
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

  const active_style_name = active_style ? style_presets.find(s => s.id === active_style)?.name : ''
  const active_category_name = categories.find(c => c.id === active_category)?.name || '图生预设'
  const middle_title = to_fixed_chars(active_category_name, 4, '风格')
  const source_display_url = source_preview_url || source_url

  return (
    <ThreePanelLayout
      title="图生图像"
      titleIcon={<ImagePlus size={20} color="var(--ui_accent)" />}
      leftPanelTitle="风格分类"
      leftPanel={leftPanel}
      middlePanelTitle={middle_title}
      middlePanel={middlePanel}
      rightPanelTitle={active_style_name || '图片转换'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--ui_text)', fontWeight: 600, fontSize: '14px' }}>参考图片</label>
            <input
              type="text"
              value={source_url}
              onChange={(e) => {
                set_source_url(e.target.value)
                set_source_file_name('')
                if (source_preview_url) {
                  URL.revokeObjectURL(source_preview_url)
                  set_source_preview_url('')
                }
              }}
              placeholder="https://example.com/image.jpg 或上传本地图片"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--ui_border)', 
                outline: 'none', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '10px' }}>
              <input
                ref={file_input_ref}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  try {
                    const data_url = await read_as_data_url(file)
                    set_source_url(data_url)
                    set_source_file_name(file.name)

                    const next_preview = URL.createObjectURL(file)
                    if (source_preview_url) URL.revokeObjectURL(source_preview_url)
                    set_source_preview_url(next_preview)
                  } catch {
                    set_error('读取图片失败, 请重试')
                  } finally {
                    e.target.value = ''
                  }
                }}
              />
              <button
                type="button"
                onClick={() => file_input_ref.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  backgroundColor: 'var(--ui_panel_alt)', border: '1px solid var(--ui_border)', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', color: 'var(--ui_text)'
                }}
              >
                <Upload size={16} />
                上传图片
              </button>
              <div style={{ flex: 1, minWidth: 0, color: 'var(--ui_text_muted)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {source_file_name || (source_url ? '已填写 URL' : '未选择')}
              </div>
              {(source_url || source_preview_url) && (
                <button
                  type="button"
                  onClick={() => {
                    set_source_url('')
                    set_source_file_name('')
                    if (source_preview_url) {
                      URL.revokeObjectURL(source_preview_url)
                      set_source_preview_url('')
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--ui_panel)',
                    border: '1px solid var(--ui_border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: 'var(--ui_text)'
                  }}
                >
                  清除
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--ui_text)', fontWeight: 600, fontSize: '14px' }}>修改描述</label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={prompt}
                onChange={(e) => set_prompt(e.target.value)}
                placeholder="例如: 将图片转换为赛博朋克风格..."
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

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handle_generate}
              disabled={loading || !prompt.trim() || !source_url.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', 
                backgroundColor: loading || !prompt.trim() || !source_url.trim() ? 'var(--ui_text_muted)' : 'var(--ui_accent)', 
                color: '#ffffff', border: 'none', borderRadius: '8px', cursor: loading || !prompt.trim() || !source_url.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '14px', transition: 'background-color 0.2s'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              {loading ? '生成中...' : '开始生成'}
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: 'var(--ui_danger)', color: 'white', borderRadius: '8px', marginTop: '16px', fontSize: '13px', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, marginTop: '16px' }}>
          <div style={{ 
            flex: 1, backgroundColor: 'var(--ui_panel_alt)', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed var(--ui_border)', boxSizing: 'border-box'
          }}>
            {source_display_url ? (
              <img src={source_display_url} alt="Source" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: 'var(--ui_text_muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={36} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '14px' }}>参考图预览</span>
              </div>
            )}
          </div>

          <div style={{ 
            flex: 1, backgroundColor: 'var(--ui_panel_alt)', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed var(--ui_border)', boxSizing: 'border-box'
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--ui_text_muted)', gap: '8px' }}>
                <Loader2 size={28} className="animate-spin" />
                <span style={{ fontSize: '14px' }}>生成中...</span>
              </div>
            ) : result_url ? (
              <img src={result_url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: 'var(--ui_text_muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
