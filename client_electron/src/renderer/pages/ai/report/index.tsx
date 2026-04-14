/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 17:30:00
 * 描述: AI 周报生成页面
 */
import React, { useState, useRef } from 'react'
import { FileEdit, UploadCloud, File, X, Sparkles, Download, Loader2 } from 'lucide-react'

const AiReport: React.FC = () => {
  const [template_file, set_template_file] = useState<File | null>(null)
  const [description, set_description] = useState('')
  const [is_generating, set_is_generating] = useState(false)
  const [generated_report, set_generated_report] = useState('')
  const [error_msg, set_error_msg] = useState('')

  const file_input_ref = useRef<HTMLInputElement>(null)

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
      // 转 base64 给主进程
      const file_data = await file_to_base64(template_file)
      
      if (window.electron_api?.ai_generate_report) {
        const res = await window.electron_api.ai_generate_report(file_data, template_file.name, description)
        if (res.success) {
          set_generated_report(res.data)
        } else {
          set_error_msg(res.error || '生成周报失败')
        }
      } else {
        // 占位模拟
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <FileEdit size={24} color="#0078d4" />
        <h1 style={{ margin: 0, fontSize: '20px', color: '#202020' }}>AI 周报生成</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* 左侧输入区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '400px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '15px', margin: '0 0 12px 0', color: '#202020', fontWeight: '600' }}>1. 上传周报模板</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>支持 Markdown、TXT、DOCX 格式的模板文件，AI 将学习其中的结构并填入内容。</p>
            
            {!template_file ? (
              <div 
                onClick={() => file_input_ref.current?.click()}
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0078d4'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <UploadCloud size={32} color="#94a3b8" />
                <span style={{ fontSize: '14px', color: '#475569' }}>点击选择模板文件</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <File size={20} color="#0078d4" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{template_file.name}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{(template_file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <X 
                  size={18} 
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
              accept=".md,.txt,.doc,.docx"
              onChange={handle_file_change}
            />
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '15px', margin: '0 0 12px 0', color: '#202020', fontWeight: '600' }}>2. 描述本周工作</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>请简要列出你本周完成的任务、遇到的问题以及下周计划，AI 将自动为你扩写润色。</p>
            <textarea 
              value={description}
              onChange={(e) => set_description(e.target.value)}
              placeholder="例如：
1. 修复了登录页面的报错问题
2. 开发并上线了周报生成功能
3. 下周计划完成后台管理面板重构"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            />
          </div>

          {error_msg && <div style={{ color: '#e51400', fontSize: '13px' }}>{error_msg}</div>}

          <button
            onClick={handle_generate}
            disabled={is_generating}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#0078d4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: is_generating ? 'not-allowed' : 'pointer',
              opacity: is_generating ? 0.7 : 1
            }}
          >
            {is_generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {is_generating ? '正在智能生成中...' : '生成周报'}
          </button>
        </div>

        {/* 右侧结果区 */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minWidth: '400px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', margin: 0, color: '#202020', fontWeight: '600' }}>生成结果</h2>
            {generated_report && (
              <button
                onClick={handle_download}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#0078d4',
                  border: '1px solid #0078d4',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                下载 Markdown
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {!generated_report && !is_generating ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FileEdit size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <span style={{ fontSize: '14px' }}>生成的周报内容将显示在这里</span>
                <span style={{ fontSize: '12px', marginTop: '8px' }}>支持直接修改与编辑</span>
              </div>
            ) : is_generating ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0078d4' }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px' }} />
                <span style={{ fontSize: '14px' }}>AI 正在努力撰写中，请稍候...</span>
              </div>
            ) : (
              <textarea
                value={generated_report}
                onChange={(e) => set_generated_report(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                  color: '#334155'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiReport
