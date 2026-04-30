/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 17:30:00
 * 描述: AI 周报生成页面 - 使用通用三段式布局, 自适应缩放
 */
import React, { useState, useRef } from 'react'
import { FileEdit, UploadCloud, File, X, Sparkles, Download, Loader2, ChevronRight, FileText, Calendar, ListChecks } from 'lucide-react'
import ThreePanelLayout from '../../../components/layout/ThreePanelLayout'
import { should_ellipsis } from '@/utils/ui_text'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const AiReport: React.FC = () => {
  const [template_file, set_template_file] = useState<File | null>(null)
  const [description, set_description] = useState('')
  const [is_generating, set_is_generating] = useState(false)
  const [generated_report, set_generated_report] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const [active_template, set_active_template] = useState<string>('')

  const file_input_ref = useRef<HTMLInputElement>(null)

  const report_templates: ReportTemplate[] = [
    { id: 'weekly', name: '周报模板', description: '标准周报格式, 包含本周总结和下周计划', icon: <Calendar size={14} /> },
    { id: 'monthly', name: '月报模板', description: '月度总结格式, 包含项目进展和数据统计', icon: <FileText size={14} /> },
    { id: 'project', name: '项目报告', description: '项目专项报告, 包含里程碑和风险评估', icon: <ListChecks size={14} /> }
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

  const middlePanel = (
    <>
      {report_templates.map(template => (
        <button
          type="button"
          key={template.id}
          onClick={() => select_template(template)}
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
            {template.icon}
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

  return (
    <ThreePanelLayout
      title="AI 周报生成"
      middlePanelTitle="报告预设"
      middlePanel={middlePanel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', margin: '0 0 8px 0', color: 'var(--ui_text)', fontWeight: '600' }}>1. 上传周报模板</h2>
            <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', marginBottom: '12px' }}>支持 Markdown、TXT、DOCX 格式</p>
            
            {!template_file ? (
              <div 
                onClick={() => file_input_ref.current?.click()}
                style={{
                  border: '2px dashed var(--ui_border)',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--ui_panel_alt)',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ui_accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ui_border)'}
              >
                <UploadCloud size={28} color="var(--ui_text_muted)" />
                <span style={{ fontSize: '13px', color: 'var(--ui_text)' }}>点击选择模板文件</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--ui_panel_alt)', borderRadius: '8px', border: '1px solid var(--ui_border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <File size={18} color="var(--ui_accent)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: 'var(--ui_text)', fontWeight: 500 }}>{template_file.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--ui_text_muted)' }}>{(template_file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <X 
                  size={16} 
                  color="var(--ui_text_muted)" 
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

          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', margin: '0 0 8px 0', color: 'var(--ui_text)', fontWeight: '600' }}>2. 描述本周工作</h2>
            <textarea 
              value={description}
              onChange={(e) => set_description(e.target.value)}
              placeholder="例如: 1. 修复了登录页面的报错问题 2. 开发并上线了周报生成功能"
              style={{
                width: '100%',
                height: '80px',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--ui_border)',
                outline: 'none',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)'
              }}
            />
          </div>

          {error_msg && <div style={{ color: 'white', fontSize: '13px', marginBottom: '12px', padding: '10px 14px', backgroundColor: 'var(--ui_danger)', borderRadius: '8px' }}>{error_msg}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handle_generate}
              disabled={is_generating}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: 'var(--ui_accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: is_generating ? 'not-allowed' : 'pointer',
                opacity: is_generating ? 0.7 : 1
              }}
            >
              {is_generating ? <Loader2 size={18} className="anim_spin" /> : <Sparkles size={18} />}
              {is_generating ? '正在智能生成中...' : '生成周报'}
            </button>
          </div>
        </div>

        <div style={{ 
          flex: 1, minHeight: 0, marginTop: '16px', backgroundColor: 'var(--ui_panel)', borderRadius: '16px', 
          display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--ui_border)', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--ui_border)', flexShrink: 0 }}>
            <h2 style={{ fontSize: '15px', margin: 0, color: 'var(--ui_text)', fontWeight: '600' }}>生成结果</h2>
            {generated_report && (
              <button
                type="button"
                onClick={handle_download}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: 'var(--ui_accent)',
                  border: '1px solid var(--ui_accent)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                下载 Markdown
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {!generated_report && !is_generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ui_text_muted)', gap: '10px' }}>
                <FileEdit size={48} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '14px' }}>上传模板并描述工作内容后, AI 将为你生成周报</span>
              </div>
            ) : is_generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ui_text_muted)', gap: '10px' }}>
                <Loader2 size={32} className="anim_spin" />
                <span style={{ fontSize: '14px' }}>AI 正在智能生成周报...</span>
              </div>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', lineHeight: 1.6, color: 'var(--ui_text)', margin: 0, fontFamily: 'inherit' }}>
                {generated_report}
              </pre>
            )}
          </div>
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default AiReport
