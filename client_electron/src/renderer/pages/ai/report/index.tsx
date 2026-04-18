/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 17:30:00
 * 描述: AI 周报生成页面 - 三段式布局
 */
import React, { useState, useRef } from 'react'
import { FileEdit, UploadCloud, File, X, Sparkles, Download, Loader2, ChevronRight, FileText, Calendar, ListChecks, PanelLeftOpen, List } from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const AiReport: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [template_file, set_template_file] = useState<File | null>(null)
  const [description, set_description] = useState('')
  const [is_generating, set_is_generating] = useState(false)
  const [generated_report, set_generated_report] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const [active_template, set_active_template] = useState<string>('')

  const file_input_ref = useRef<HTMLInputElement>(null)

  const report_templates: ReportTemplate[] = [
    { id: 'weekly', name: '周报模板', description: '标准周报格式，包含本周总结和下周计划', icon: <Calendar size={14} /> },
    { id: 'monthly', name: '月报模板', description: '月度总结格式，包含项目进展和数据统计', icon: <FileText size={14} /> },
    { id: 'project', name: '项目报告', description: '项目专项报告，包含里程碑和风险评估', icon: <ListChecks size={14} /> }
  ]

  const handle_file_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        set_error_msg('模板文件大小不能超过 10MB')
        return
      }
      set_template_file(file)
      set_error_msg('')
    }
    if (file_input_ref.current) {
      file_input_ref.current.value = ''
    }
  }

  const file_to_base64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handle_generate = async () => {
    if (!template_file) {
      set_error_msg('请先上传周报模板')
      return
    }
    if (!description.trim()) {
      set_error_msg('请描述本周的工作内容')
      return
    }

    set_is_generating(true)
    set_error_msg('')
    set_generated_report('')

    try {
      const file_data = await file_to_base64(template_file)
      
      if (window.electron_api?.ai_generate_report) {
        const res = await window.electron_api.ai_generate_report(file_data, template_file.name, description)
        if (res.success) {
          set_generated_report(res.data)
        } else {
          set_error_msg(res.error || '生成周报失败')
        }
      } else {
        setTimeout(() => {
          set_generated_report(`# 本周工作总结\n\n- 完成了前端架构的升级...\n- 修复了若干已知 Bug...\n\n# 下周计划\n\n- 继续推进新功能的开发...`)
          set_is_generating(false)
        }, 3000)
        return
      }
    } catch (err: any) {
      set_error_msg(err.message || '生成过程发生异常')
    } finally {
      if (window.electron_api?.ai_generate_report) {
        set_is_generating(false)
      }
    }
  }

  const handle_download = () => {
    if (!generated_report) return
    const blob = new Blob([generated_report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `周报_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const select_template = (template: ReportTemplate) => {
    set_active_template(template.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileEdit size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>AI 周报生成</h1>
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
              AI 周报
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
              <span style={{ fontSize: '14px', fontWeight: 600 }}>报告模板</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起报告模板栏"
              aria-label="收起报告模板栏"
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
            {report_templates.map(template => (
              <button
                key={template.id}
                onClick={() => select_template(template)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_template === template.id ? '#f0f9ff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: active_template === template.id ? '#0ea5e9' : '#475569',
                  fontWeight: active_template === template.id ? '600' : 'normal',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {template.icon}
                  {template.name}
                </div>
                {active_template === template.id && <ChevronRight size={14} />}
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
                  title="展开报告模板栏"
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
            <span style={{ fontSize: '14px', color: '#64748b' }}>AI 周报生成</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '16px', margin: '0 0 14px 0', color: '#202020', fontWeight: '600' }}>1. 上传周报模板</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '18px' }}>支持 Markdown、TXT、DOCX 格式的模板文件，AI 将学习其中的结构并填入内容。</p>
                
                {!template_file ? (
                  <div 
                    onClick={() => file_input_ref.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0ea5e9'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    <UploadCloud size={40} color="#94a3b8" />
                    <span style={{ fontSize: '15px', color: '#475569' }}>点击选择模板文件</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#f1f5f9', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <File size={24} color="#0ea5e9" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '15px', color: '#334155', fontWeight: 500 }}>{template_file.name}</span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{(template_file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <X 
                      size={20} 
                      color="#64748b" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => set_template_file(null)}
                    />
                  </div>
                )}
                <input 
                  type="file" 
                  ref={file_input_ref} 
                  style={{ display: 'none' }} 
                  title="选择模板文件"
                  aria-label="选择模板文件"
                  accept=".md,.txt,.doc,.docx"
                  onChange={handle_file_change}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '16px', margin: '0 0 14px 0', color: '#202020', fontWeight: '600' }}>2. 描述本周工作</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '18px' }}>请简要列出你本周完成的任务、遇到的问题以及下周计划，AI 将自动为你扩写润色。</p>
                <textarea 
                  value={description}
                  onChange={(e) => set_description(e.target.value)}
                  placeholder="例如：
1. 修复了登录页面的报错问题
2. 开发并上线了周报生成功能
3. 下周计划完成后台管理面板重构"
                  style={{
                    width: '100%',
                    minHeight: '160px',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '15px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.6
                  }}
                />
              </div>

              {error_msg && <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fef2f2', borderRadius: '10px' }}>{error_msg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <button
                  type="button"
                  onClick={handle_generate}
                  disabled={is_generating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 32px',
                    backgroundColor: '#0ea5e9',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: is_generating ? 'not-allowed' : 'pointer',
                    opacity: is_generating ? 0.7 : 1
                  }}
                >
                  {is_generating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  {is_generating ? '正在智能生成中...' : '生成周报'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '16px', margin: 0, color: '#202020', fontWeight: '600' }}>生成结果</h2>
                  {generated_report && (
                    <button
                      onClick={handle_download}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#0ea5e9',
                        border: '1px solid #0ea5e9',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={16} />
                      下载 Markdown
                    </button>
                  )}
                </div>
                
                <div style={{ minHeight: '350px', maxHeight: '550px', overflowY: 'auto', borderRadius: '10px' }}>
                  {!generated_report && !is_generating ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '40px', border: '2px dashed #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                      <FileEdit size={56} style={{ opacity: 0.3, marginBottom: '20px' }} />
                      <span style={{ fontSize: '15px' }}>生成的周报内容将显示在这里</span>
                      <span style={{ fontSize: '13px', marginTop: '10px' }}>支持直接修改与编辑</span>
                    </div>
                  ) : is_generating ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', padding: '40px', borderRadius: '10px', backgroundColor: '#f0f9ff' }}>
                      <Loader2 size={40} className="animate-spin" style={{ marginBottom: '20px' }} />
                      <span style={{ fontSize: '15px' }}>AI 正在努力撰写中，请稍候...</span>
                    </div>
                  ) : (
                    <textarea
                      value={generated_report}
                      onChange={(e) => set_generated_report(e.target.value)}
                      style={{
                        width: '100%',
                        height: '450px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        outline: 'none',
                        resize: 'vertical',
                        fontSize: '15px',
                        lineHeight: 1.7,
                        fontFamily: 'inherit',
                        color: '#334155',
                        padding: '20px'
                      }}
                    />
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

export default AiReport
