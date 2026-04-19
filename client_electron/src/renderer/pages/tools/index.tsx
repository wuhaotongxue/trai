/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具箱页面，提供文件处理功能
 */
import React, { useState } from 'react'
import { FileText, Image as ImageIcon, FileArchive, ArrowDownToLine, Loader2, AlertCircle, CheckCircle2, RefreshCw, PanelLeftOpen, List, Wrench, Folder } from 'lucide-react'

const format_size = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

interface ToolItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  bg_color: string
  border_color: string
  extra_ui?: React.ReactNode
}

interface ToolCategory {
  id: string
  name: string
  icon: React.ReactNode
  tools: ToolItem[]
}

const Tools: React.FC = () => {
  const [loading_task, set_loading_task] = useState<string | null>(null)
  const [result_url, set_result_url] = useState('')
  const [result_info, set_result_info] = useState<any>(null)
  const [error_msg, set_error_msg] = useState('')
  const [target_image_format, set_target_image_format] = useState('png')
  const [ico_sizes, set_ico_sizes] = useState<number[]>([16, 32, 48, 64, 128, 256])
  const [target_width, set_target_width] = useState<string>('')
  const [target_height, set_target_height] = useState<string>('')
  const [target_convert_kb, set_target_compress_kb] = useState<string>('')
  const [target_convert_size_kb, set_target_convert_size_kb] = useState<string>('')
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_cat_id, set_active_cat_id] = useState('all')
  const [active_tool_id, set_active_tool_id] = useState<string>('md2pdf')

  const handle_md_to_pdf = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('md2pdf')
      set_error_msg('')
      set_result_url('')
      
      try {
        const res = await window.electron_api.tools_convert_md_to_pdf(file.path)
        if (res.success && res.data) {
          set_result_url(res.data.url)
        } else {
          set_error_msg(res.error || '转换失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '转换异常')
      } finally {
        set_loading_task(null)
      }
    }
    input.click()
  }

  const handle_compress_image = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('image')
      set_error_msg('')
      set_result_url('')
      set_result_info(null)
      
      let kb: number | undefined = undefined
      if (target_convert_kb && !isNaN(Number(target_convert_kb))) {
        kb = Number(target_convert_kb)
      }
      
      try {
        const res = await window.electron_api.tools_compress_image(file.path, 60, kb)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
        } else {
          set_error_msg(res.error || '压缩失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '压缩异常')
      } finally {
        set_loading_task(null)
      }
    }
    input.click()
  }

  const handle_compress_zip = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[]
      if (files.length === 0) return
      
      set_loading_task('zip')
      set_error_msg('')
      set_result_url('')
      
      try {
        const file_paths = files.map(f => (f as any).path)
        const res = await window.electron_api.tools_compress_files_to_zip(file_paths)
        if (res.success && res.data) {
          set_result_url(res.data.url)
        } else {
          set_error_msg(res.error || '打包失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '打包异常')
      } finally {
        set_loading_task(null)
      }
    }
    input.click()
  }

  const handle_convert_image = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('convert_image')
      set_error_msg('')
      set_result_url('')
      set_result_info(null)
      
      let sizes_param: number[] | undefined = undefined
      let w: number | undefined = undefined
      let h: number | undefined = undefined
      let target_kb: number | undefined = undefined
      
      if (target_image_format === 'ico') {
        sizes_param = ico_sizes.length > 0 ? ico_sizes : undefined
      } else {
        if (target_width && !isNaN(Number(target_width))) w = Number(target_width)
        if (target_height && !isNaN(Number(target_height))) h = Number(target_height)
        if (target_convert_size_kb && !isNaN(Number(target_convert_size_kb))) target_kb = Number(target_convert_size_kb)
      }
      
      try {
        const res = await window.electron_api.tools_convert_image(file.path, target_image_format, sizes_param, w, h, target_kb)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
        } else {
          set_error_msg(res.error || '格式转换失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '格式转换异常')
      } finally {
        set_loading_task(null)
      }
    }
    input.click()
  }

  const all_tools: ToolItem[] = [
    {
      id: 'md2pdf',
      title: 'MD 转 PDF',
      description: '将 MD 文件渲染并导出为 PDF 文档',
      icon: <FileText size={32} color="#0ea5e9" />,
      action: handle_md_to_pdf,
      bg_color: '#f0f9ff',
      border_color: '#bae6fd'
    },
    {
      id: 'image',
      title: '图片压缩',
      description: '智能压缩图片体积，支持设定目标大小并自动调节质量',
      icon: <ImageIcon size={32} color="#10b981" />,
      action: handle_compress_image,
      bg_color: '#ecfdf5',
      border_color: '#a7f3d0',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: '#475569' }}>目标大小 (KB):</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
                type="number" 
                placeholder="如 500 (留空使用默认质量)"
                value={target_convert_kb}
                onChange={(e) => set_target_compress_kb(e.target.value)}
              style={{ 
                flex: 1,
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                fontSize: '13px', 
                outline: 'none',
                backgroundColor: '#ffffff',
                width: '100%',
                minWidth: '0'
              }}
            />
          </div>
        </div>
      )
    },
    {
      id: 'zip',
      title: 'ZIP 打包压缩',
      description: '将多个文件打包压缩成一个 ZIP 文件',
      icon: <FileArchive size={32} color="#f59e0b" />,
      action: handle_compress_zip,
      bg_color: '#fffbeb',
      border_color: '#fde68a'
    },
    {
      id: 'convert_image',
      title: '图片格式转换',
      description: '在常见格式间互转 (如 png, jpeg, ico, webp)',
      icon: <RefreshCw size={32} color="#0ea5e9" />,
      action: handle_convert_image,
      bg_color: '#f0f9ff',
      border_color: '#bae6fd',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="convert_image_target_format" style={{ fontSize: '13px', color: '#475569' }}>目标格式:</label>
            <select
              id="convert_image_target_format"
              aria-label="目标格式"
              title="目标格式"
              value={target_image_format} 
              onChange={(e) => {
                set_target_image_format(e.target.value)
                set_error_msg('')
                set_result_url('')
              }}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="ico">ICO (图标)</option>
              <option value="webp">WEBP</option>
              <option value="bmp">BMP</option>
            </select>
          </div>
          
          {target_image_format === 'ico' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#475569' }}>打包尺寸 (多选):</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[16, 32, 48, 64, 128, 256].map(size => (
                  <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={ico_sizes.includes(size)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set_ico_sizes(prev => [...prev, size].sort((a, b) => a - b))
                        } else {
                          set_ico_sizes(prev => prev.filter(s => s !== size))
                        }
                      }}
                      style={{ margin: 0 }}
                    />
                    {size}x{size}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {['jpeg', 'webp'].includes(target_image_format) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#475569' }}>目标大小 (KB):</label>
              <div style={{ display: 'flex' }}>
                <input 
                  type="number" 
                  placeholder="如 500 (留空使用默认质量)"
                  value={target_convert_size_kb}
                  onChange={(e) => set_target_convert_size_kb(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
              </div>
            </div>
          )}

          {target_image_format !== 'ico' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: ['jpeg', 'webp'].includes(target_image_format) ? '8px' : '0' }}>
              <label style={{ fontSize: '13px', color: '#475569' }}>尺寸 (宽 x 高):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="宽"
                  value={target_width}
                  onChange={(e) => set_target_width(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
                <span style={{ color: '#94a3b8' }}>x</span>
                <input 
                  type="number" 
                  placeholder="高"
                  value={target_height}
                  onChange={(e) => set_target_height(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>* 留空则保持原图尺寸</span>
            </div>
          )}
        </div>
      )
    }
  ]

  const categories: ToolCategory[] = [
    { id: 'all', name: '全部工具', icon: <Wrench size={16} />, tools: all_tools },
    { id: 'convert', name: '格式转换', icon: <RefreshCw size={16} />, tools: all_tools.filter(t => ['md2pdf', 'convert_image'].includes(t.id)) },
    { id: 'compress', name: '压缩打包', icon: <FileArchive size={16} />, tools: all_tools.filter(t => ['image', 'zip'].includes(t.id)) }
  ]

  const active_cat = categories.find(c => c.id === active_cat_id) || categories[0]
  const active_tool = all_tools.find(t => t.id === active_tool_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench size={20} color="#0ea5e9" />
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>工具箱</span>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '10%' : '0px',
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff', 
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '180px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>工具箱</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起分类栏"
              aria-label="收起分类栏"
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
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => {
                  set_active_cat_id(cat.id)
                  if (cat.tools.length > 0) {
                    set_active_tool_id(cat.tools[0].id)
                  }
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: active_cat_id === cat.id ? '#e0f2fe' : 'transparent',
                  color: active_cat_id === cat.id ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: active_cat_id === cat.id ? 600 : 400,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = '#e2e8f0'
                }}
                onMouseLeave={(e) => {
                  if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {cat.icon}
                {cat.name}
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          width: is_middle_sidebar_open ? '12%' : '0px', 
          minWidth: is_middle_sidebar_open ? '80px' : '0px',
          maxWidth: is_middle_sidebar_open ? '160px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff', 
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '200px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开分类栏"
                  aria-label="展开分类栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{active_cat.name}</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起工具列表"
              aria-label="收起工具列表"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
            {active_cat.tools.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>暂无工具</div>
            ) : (
              active_cat.tools.map(tool => (
                <div 
                  key={tool.id}
                  onClick={() => set_active_tool_id(tool.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: active_tool_id === tool.id ? '#e0f2fe' : 'transparent',
                    color: active_tool_id === tool.id ? '#0369a1' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontWeight: active_tool_id === tool.id ? 600 : 400,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (active_tool_id !== tool.id) e.currentTarget.style.backgroundColor = '#f1f5f9'
                  }}
                  onMouseLeave={(e) => {
                    if (active_tool_id !== tool.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {React.cloneElement(tool.icon as React.ReactElement<any>, { size: 16 })}
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tool.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            {!is_middle_sidebar_open && (
              <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                {!is_left_sidebar_open && (
                  <button
                    onClick={() => set_is_left_sidebar_open(true)}
                    title="展开分类栏"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PanelLeftOpen size={20} />
                  </button>
                )}
                <button
                  onClick={() => set_is_middle_sidebar_open(true)}
                  title="展开工具列表"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <List size={20} />
                </button>
              </div>
            )}
            <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>{active_tool?.title || '工具箱'}</h1>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {!active_tool ? (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '14px' }}>
                请从左侧选择一个工具
              </div>
            ) : (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: `1px solid #e2e8f0`,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: active_tool.bg_color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {React.cloneElement(active_tool.icon as React.ReactElement<any>, { size: 24 })}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 600 }}>{active_tool.title}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{active_tool.description}</p>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}></div>

                {active_tool.extra_ui && active_tool.extra_ui}

                <button 
                  onClick={active_tool.action} 
                  disabled={loading_task !== null}
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: loading_task === active_tool.id ? '#f1f5f9' : '#0078d4', 
                    color: loading_task === active_tool.id ? '#64748b' : '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: loading_task !== null ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {loading_task === active_tool.id ? (
                    <><Loader2 size={16} className="animate-spin" /> 处理中...</>
                  ) : (
                    '选择文件'
                  )}
                </button>
              </div>
            )}

            {(error_msg || result_url) && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: error_msg ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${error_msg ? '#fecaca' : '#bbf7d0'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                maxWidth: '600px',
                margin: '24px auto 0'
              }}>
                {error_msg ? <AlertCircle size={24} color="#ef4444" /> : <CheckCircle2 size={24} color="#10b981" />}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: error_msg ? '#991b1b' : '#166534', fontSize: '16px', fontWeight: 600 }}>
                    {error_msg ? '处理失败' : '处理成功'}
                  </h4>
                  
                  {error_msg ? (
                    <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px' }}>{error_msg}</p>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 12px 0', color: '#15803d', fontSize: '14px' }}>文件已成功生成，请点击下方按钮下载（链接有效期 5 分钟）。</p>
                      
                      {result_info && result_info.original_size !== undefined && (
                        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#047857', display: 'flex', gap: '16px', backgroundColor: '#d1fae5', padding: '8px 12px', borderRadius: '6px' }}>
                          <div>
                            <strong>处理前:</strong> {result_info.original_width && result_info.original_height ? `${result_info.original_width}x${result_info.original_height}, ` : ''}{format_size(result_info.original_size)}
                          </div>
                          <div>
                            <strong>处理后:</strong> {result_info.converted_width && result_info.converted_height ? `${result_info.converted_width}x${result_info.converted_height}, ` : ''}{format_size(result_info.converted_size)}
                          </div>
                        </div>
                      )}
                      
                      <a 
                        href={result_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                      >
                        <ArrowDownToLine size={16} />
                        下载文件
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tools
