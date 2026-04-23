/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具箱页面, 提供文件处理功能
 */
import React, { useState } from 'react'
import { FileText, Image as ImageIcon, FileArchive, ArrowDownToLine, Loader2, AlertCircle, CheckCircle2, RefreshCw, PanelLeftOpen, PanelLeftClose, List, Wrench, Folder, Code as FileCode, FileSpreadsheet } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { should_ellipsis } from '@/utils/ui_text'

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
  const [md_preview_text, set_md_preview_text] = useState('')
  const [md_preview_name, set_md_preview_name] = useState('')
  const [md_preview_error, set_md_preview_error] = useState('')
  const [json_input, set_json_input] = useState('')
  const [json_result, set_json_result] = useState('')
  const [json_error, set_json_error] = useState('')

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
      set_result_info(null)
      set_md_preview_error('')
      
      try {
        const preview_text = await file.text()
        set_md_preview_name(file.name)
        set_md_preview_text(preview_text.length > 20000 ? `${preview_text.slice(0, 20000)}\n\n... (预览已截断)` : preview_text)

        const res = await window.electron_api.tools_convert_md_to_pdf(file.path)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
        } else {
          set_error_msg(res.error || '转换失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '转换异常')
        set_md_preview_error('Markdown 预览读取失败')
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

  const handle_word_to_pdf = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx,.doc'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('word2pdf')
      set_error_msg('')
      set_result_url('')
      set_result_info(null)
      
      try {
        const res = await window.electron_api.tools_convert_word_to_pdf(file.path)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
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

  const handle_pdf_to_word = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('pdf2word')
      set_error_msg('')
      set_result_url('')
      set_result_info(null)
      
      try {
        const res = await window.electron_api.tools_convert_pdf_to_word(file.path)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
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

  const [target_excel_format, set_target_excel_format] = useState('csv')

  const handle_excel_convert = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading_task('excel')
      set_error_msg('')
      set_result_url('')
      set_result_info(null)
      
      try {
        const res = await window.electron_api.tools_convert_excel(file.path, target_excel_format)
        if (res.success && res.data) {
          set_result_url(res.data.url)
          set_result_info(res.data)
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

  const handle_json_tool = () => {
    set_json_error('')
    set_json_result('')
    
    try {
      if (!json_input.trim()) {
        throw new Error('请输入JSON内容')
      }
      
      const parsed = JSON.parse(json_input)
      const formatted = JSON.stringify(parsed, null, 2)
      set_json_result(formatted)
      set_json_error('')
    } catch (error: any) {
      set_json_error(`JSON格式错误: ${error.message}`)
      set_json_result('')
    }
  }

  const handle_json_file_upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      set_json_input(content)
    }
    reader.readAsText(file)
  }

  const all_tools: ToolItem[] = [
    {
      id: 'md2pdf',
      title: 'MD转PDF',
      description: '将 MD 文件渲染并导出为 PDF 文档',
      icon: <FileText size={32} color="var(--ui_accent)" />,
      action: handle_md_to_pdf,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)'
    },
    {
      id: 'word2pdf',
      title: 'Word转PDF',
      description: '将 Word 文件转换为 PDF 文档',
      icon: <FileText size={32} color="var(--ui_accent)" />,
      action: handle_word_to_pdf,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)'
    },
    {
      id: 'pdf2word',
      title: 'PDF转Word',
      description: '将 PDF 文件转换为 Word 文档',
      icon: <FileText size={32} color="var(--ui_accent)" />,
      action: handle_pdf_to_word,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)'
    },
    {
      id: 'excel',
      title: 'Excel转换',
      description: '将 Excel 文件转换为 CSV、JSON 等格式',
      icon: <FileSpreadsheet size={32} color="var(--ui_accent)" />,
      action: handle_excel_convert,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>目标格式:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
              { value: 'xlsx', label: 'Excel' }
            ].map((format) => (
              <label key={format.value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--ui_border)',
                backgroundColor: target_excel_format === format.value ? 'var(--ui_accent)' : 'var(--ui_panel)',
                color: target_excel_format === format.value ? 'white' : 'var(--ui_text)',
                cursor: 'pointer',
                fontSize: '13px',
                flex: 1,
                justifyContent: 'center'
              }}>
                <input
                  type="radio"
                  name="excel_format"
                  value={format.value}
                  checked={target_excel_format === format.value}
                  onChange={() => set_target_excel_format(format.value)}
                  style={{ display: 'none' }}
                />
                {format.label}
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'json',
      title: 'JSON检测',
      description: '检测和格式化 JSON 数据',
      icon: <FileCode size={32} color="var(--ui_accent)" />,
      action: () => {},
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--ui_text_muted)', marginBottom: '8px' }}>
              JSON 输入
            </label>
            <textarea
              value={json_input}
              onChange={(e) => set_json_input(e.target.value)}
              placeholder='请输入JSON内容或上传JSON文件'
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                resize: 'vertical',
                outline: 'none'
              }}
            />
            <input
              type="file"
              accept=".json"
              onChange={handle_json_file_upload}
              style={{ marginTop: '8px', fontSize: '12px' }}
            />
          </div>
          <button
            onClick={handle_json_tool}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--ui_accent)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            检测并格式化
          </button>
          {json_error && (
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--ui_danger)',
              color: 'white',
              fontSize: '13px'
            }}>
              {json_error}
            </div>
          )}
          {json_result && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--ui_text_muted)', marginBottom: '8px' }}>
                格式化结果
              </label>
              <textarea
                value={json_result}
                readOnly
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--ui_border)',
                  backgroundColor: 'var(--ui_panel_alt)',
                  color: 'var(--ui_text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(json_result)
                  alert('已复制到剪贴板')
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--ui_border)',
                  backgroundColor: 'transparent',
                  color: 'var(--ui_text)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                复制结果
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'image',
      title: '图片压缩',
      description: '智能压缩图片体积, 支持设定目标大小并自动调节质量',
      icon: <ImageIcon size={32} color="var(--ui_success)" />,
      action: handle_compress_image,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>目标大小 (KB):</label>
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
                border: '1px solid var(--ui_border)', 
                fontSize: '13px', 
                outline: 'none',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)',
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
      title: 'ZIP 压缩',
      description: '将多个文件打包压缩成一个 ZIP 文件',
      icon: <FileArchive size={32} color="var(--ui_accent)" />,
      action: handle_compress_zip,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)'
    },
    {
      id: 'convert_image',
      title: '格式转换',
      description: '在常见格式间互转 (如 png, jpeg, ico, webp)',
      icon: <RefreshCw size={32} color="var(--ui_accent)" />,
      action: handle_convert_image,
      bg_color: 'var(--ui_panel_alt)',
      border_color: 'var(--ui_border)',
      extra_ui: (
        <div style={{ marginTop: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="convert_image_target_format" style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>目标格式:</label>
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
                border: '1px solid var(--ui_border)', 
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)',
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
              <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>打包尺寸 (多选):</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[16, 32, 48, 64, 128, 256].map(size => (
                  <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--ui_text_muted)', cursor: 'pointer' }}>
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
              <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>目标大小 (KB):</label>
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
                    border: '1px solid var(--ui_border)', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: 'var(--ui_panel)',
                    color: 'var(--ui_text)',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
              </div>
            </div>
          )}

          {target_image_format !== 'ico' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: ['jpeg', 'webp'].includes(target_image_format) ? '8px' : '0' }}>
              <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>尺寸 (宽 x 高):</label>
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
                    border: '1px solid var(--ui_border)', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: 'var(--ui_panel)',
                    color: 'var(--ui_text)',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
                <span style={{ color: 'var(--ui_text_muted)' }}>x</span>
                <input 
                  type="number" 
                  placeholder="高"
                  value={target_height}
                  onChange={(e) => set_target_height(e.target.value)}
                  style={{ 
                    flex: 1,
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--ui_border)', 
                    fontSize: '13px', 
                    outline: 'none',
                    backgroundColor: 'var(--ui_panel)',
                    color: 'var(--ui_text)',
                    width: '100%',
                    minWidth: '0'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)', marginTop: '2px' }}>* 留空则保持原图尺寸</span>
            </div>
          )}
        </div>
      )
    }
  ]

  const categories: ToolCategory[] = [
    { id: 'all', name: '全部工具', icon: <Wrench size={16} />, tools: all_tools },
    { id: 'convert', name: '格式转换', icon: <RefreshCw size={16} />, tools: all_tools.filter(t => ['md2pdf', 'convert_image', 'word2pdf', 'pdf2word', 'excel'].includes(t.id)) },
    { id: 'compress', name: '压缩工具', icon: <FileArchive size={16} />, tools: all_tools.filter(t => ['image', 'zip'].includes(t.id)) },
    { id: 'tools', name: '其他工具', icon: <FileCode size={16} />, tools: all_tools.filter(t => ['json'].includes(t.id)) }
  ]

  const active_cat = categories.find(c => c.id === active_cat_id) || categories[0]
  const active_tool = all_tools.find(t => t.id === active_tool_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_bg)', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>工具箱</span>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '10%' : '0px',
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: 'var(--ui_panel)', 
          borderRight: is_left_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>工具箱</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起分类栏"
              aria-label="收起分类栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftClose size={18} />
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
                  backgroundColor: active_cat_id === cat.id ? 'var(--ui_accent)' : 'transparent',
                  color: active_cat_id === cat.id ? 'white' : 'var(--ui_text)',
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
                  if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)'
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
          backgroundColor: 'var(--ui_panel)', 
          borderRight: is_middle_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)', overflow: 'hidden' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开分类栏"
                  aria-label="展开分类栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span
                style={
                  should_ellipsis(active_cat.name)
                    ? { fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    : { fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }
                }
              >
                {active_cat.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起工具列表"
              aria-label="收起工具列表"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
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
                    backgroundColor: active_tool_id === tool.id ? 'var(--ui_accent)' : 'transparent',
                    color: active_tool_id === tool.id ? 'white' : 'var(--ui_text)',
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
                    if (active_tool_id !== tool.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                  }}
                  onMouseLeave={(e) => {
                    if (active_tool_id !== tool.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {React.cloneElement(tool.icon as React.ReactElement<any>, { size: 16 })}
                  <div
                    style={
                      should_ellipsis(tool.title)
                        ? { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                        : { flex: 1, whiteSpace: 'nowrap' }
                    }
                  >
                    {tool.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '12px 16px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center' }}>
            {!is_middle_sidebar_open && (
              <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                {!is_left_sidebar_open && (
                  <button
                    onClick={() => set_is_left_sidebar_open(true)}
                    title="展开分类栏"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--ui_text_muted)', borderRadius: '6px', transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
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
                    color: 'var(--ui_text_muted)', borderRadius: '6px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <List size={20} />
                </button>
              </div>
            )}
            <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{active_tool?.title || '工具箱'}</span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {!active_tool ? (
              <div style={{ textAlign: 'center', color: 'var(--ui_text_muted)', marginTop: '40px', fontSize: '14px' }}>
                请从左侧选择一个工具
              </div>
            ) : (
              <div style={{
                backgroundColor: 'var(--ui_panel)',
                borderRadius: '12px',
                border: `1px solid var(--ui_border)`,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                maxWidth: '800px',
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
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--ui_text)', fontWeight: 600 }}>{active_tool.title}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ui_text_muted)', lineHeight: '1.4' }}>{active_tool.description}</p>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}></div>

                {active_tool.extra_ui && active_tool.extra_ui}

                {active_tool.id === 'md2pdf' && (
                  <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--ui_text_muted)', marginBottom: '8px', fontWeight: 600 }}>
                      Markdown 预览{md_preview_name ? `: ${md_preview_name}` : ''}
                    </div>
                    {md_preview_error ? (
                      <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ui_danger)', border: '1px solid var(--ui_danger)', color: 'white', fontSize: '12px' }}>
                        {md_preview_error}
                      </div>
                    ) : md_preview_text ? (
                      <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--ui_border)', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', padding: '12px' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md_preview_text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', border: '1px solid var(--ui_border)', color: 'var(--ui_text_muted)', fontSize: '12px' }}>
                        选择 Markdown 文件后可预览
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={active_tool.action} 
                  disabled={loading_task !== null}
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: loading_task === active_tool.id ? 'var(--ui_border)' : 'var(--ui_accent)', 
                    color: loading_task === active_tool.id ? 'var(--ui_text_muted)' : '#ffffff', 
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
                backgroundColor: error_msg ? 'var(--ui_danger)' : 'var(--ui_success)',
                border: `1px solid ${error_msg ? 'var(--ui_danger)' : 'var(--ui_success)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                maxWidth: '800px',
                margin: '24px auto 0'
              }}>
                {error_msg ? <AlertCircle size={24} color="#ef4444" /> : <CheckCircle2 size={24} color="#10b981" />}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {error_msg ? '处理失败' : '处理成功'}
                  </h4>
                  
                  {error_msg ? (
                    <p style={{ margin: 0, color: 'white', fontSize: '14px' }}>{error_msg}</p>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 12px 0', color: 'white', fontSize: '14px' }}>
                        {result_info?.expires_in && result_info.expires_in > 0
                          ? '文件已成功生成, 请点击下方按钮下载, 链接有效期 5 分钟. '
                          : '文件已成功生成, 请点击下方按钮下载. '}
                      </p>

                      {result_info?.message && result_info.message !== '处理成功' && (
                        <p style={{ margin: '0 0 12px 0', color: 'white', fontSize: '13px' }}>
                          {result_info.message}
                        </p>
                      )}
                      
                      {result_info && result_info.original_size !== undefined && (
                        <div style={{ marginBottom: '12px', fontSize: '13px', color: 'white', display: 'flex', gap: '16px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
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
                          backgroundColor: 'white',
                          color: 'var(--ui_success)',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <ArrowDownToLine size={16} />
                        下载文件
                      </a>

                      {active_tool?.id === 'md2pdf' && result_url && (
                        <div style={{ marginTop: '14px' }}>
                          <p style={{ margin: '0 0 8px 0', color: 'white', fontSize: '13px' }}>转换结果预览</p>
                          <iframe
                            src={result_url}
                            title="PDF 预览"
                            style={{
                              width: '100%',
                              height: '360px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              borderRadius: '8px',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                      )}
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
