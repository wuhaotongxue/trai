/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具箱页面，提供文件处理功能
 */
import React, { useState } from 'react'
import { FileText, Image as ImageIcon, FileArchive, ArrowDownToLine, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

const format_size = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      const files = Array.from(e.target.files)
      if (files.length === 0) return
      
      set_loading_task('zip')
      set_error_msg('')
      set_result_url('')
      
      try {
        // @ts-ignore
        const file_paths = files.map(f => f.path)
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

  const tool_cards = [
    {
      id: 'md2pdf',
      title: 'Markdown 转 PDF',
      description: '将 Markdown 文件渲染并导出为 PDF 文档',
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
            <label style={{ fontSize: '13px', color: '#475569' }}>目标格式:</label>
            <select 
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
                <span style={{ color: '#94a3b8' }}>×</span>
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

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', fontWeight: 600 }}>工具箱</h1>
      </div>
      <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>常用文件处理与格式转换工具，操作将在本地或云端安全处理。</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {tool_cards.map(card => (
          <div 
            key={card.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: `1px solid #e2e8f0`,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = card.border_color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: card.bg_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 600 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{card.description}</p>
              </div>
            </div>
            
            <div style={{ flex: 1 }}></div>

            {card.extra_ui && card.extra_ui}

            <button 
              onClick={card.action} 
              disabled={loading_task !== null}
              style={{ 
                padding: '10px 16px', 
                backgroundColor: loading_task === card.id ? '#f1f5f9' : '#0078d4', 
                color: loading_task === card.id ? '#64748b' : '#ffffff', 
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
              {loading_task === card.id ? (
                <><Loader2 size={16} className="animate-spin" /> 处理中...</>
              ) : (
                '选择文件'
              )}
            </button>
          </div>
        ))}
      </div>

      {(error_msg || result_url) && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: error_msg ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${error_msg ? '#fecaca' : '#bbf7d0'}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
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
  )
}

export default Tools
