/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:40:00
 * 描述: 用户反馈页面 - 三段式布局
 */
import React, { useState, useRef } from 'react'
import { MessageSquarePlus, Send, Loader2, Paperclip, X, Lightbulb, Bug, HelpCircle, ChevronRight, History, PanelLeftClose, PanelLeftOpen, List } from 'lucide-react'

interface FeedbackType {
  id: string
  name: string
  icon: React.ReactNode
  value: string
}

const Feedback: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_type, set_active_type] = useState<string>('suggestion')

  const [title, set_title] = useState('')
  const [content, set_content] = useState('')
  const [contact, set_contact] = useState('')
  const [attachments, set_attachments] = useState<File[]>([])
  const [loading, set_loading] = useState(false)
  const [message, set_message] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const file_input_ref = useRef<HTMLInputElement>(null)

  const feedback_types: FeedbackType[] = [
    { id: 'suggestion', name: '产品建议', icon: <Lightbulb size={16} />, value: 'suggestion' },
    { id: 'bug', name: '问题报告', icon: <Bug size={16} />, value: 'bug' },
    { id: 'other', name: '其他', icon: <HelpCircle size={16} />, value: 'other' }
  ]

  const handle_file_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const new_files = Array.from(e.target.files)
      const valid_files = new_files.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          alert(`文件 ${f.name} 超过 5MB 限制`)
          return false
        }
        return true
      })
      
      set_attachments(prev => {
        const combined = [...prev, ...valid_files]
        if (combined.length > 3) {
          alert('最多只能上传 3 个附件')
          return combined.slice(0, 3)
        }
        return combined
      })
    }
    if (file_input_ref.current) {
      file_input_ref.current.value = ''
    }
  }

  const remove_attachment = (index: number) => {
    set_attachments(prev => prev.filter((_, i) => i !== index))
  }

  const file_to_base64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      set_message({ type: 'error', text: '标题和内容不能为空' })
      return
    }

    set_loading(true)
    set_message(null)

    try {
      const attachments_data = await Promise.all(
        attachments.map(async file => ({
          name: file.name,
          data: await file_to_base64(file)
        }))
      )

      const res = await window.electron_api.feedback_submit({ 
        type: active_type, 
        title, 
        content, 
        contact,
        attachments: attachments_data 
      })
      
      if (res.success) {
        set_message({ type: 'success', text: '反馈提交成功，感谢您的支持！' })
        set_title('')
        set_content('')
        set_contact('')
        set_attachments([])
      } else {
        set_message({ type: 'error', text: res.error || '提交失败' })
      }
    } catch (err: any) {
      set_message({ type: 'error', text: err.message || '系统错误' })
    } finally {
      set_loading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquarePlus size={20} color="#0ea5e9" />
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>用户反馈</span>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ 
          width: is_left_sidebar_open ? '10%' : '0px', 
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          maxWidth: is_left_sidebar_open ? '120px' : '0px',
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>反馈</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起反馈类型栏"
              aria-label="收起反馈类型栏"
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
            {feedback_types.map(type => (
              <button
                key={type.id}
                onClick={() => set_active_type(type.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_type === type.value ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: active_type === type.value ? '#0ea5e9' : '#475569',
                  fontWeight: active_type === type.value ? '600' : 'normal',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {type.icon}
                {type.name}
              </button>
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>说明</span>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起反馈说明栏"
              aria-label="收起反馈说明栏"
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
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minWidth: '200px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              {active_type === 'suggestion' && (
                <>
                  <p style={{ marginBottom: '12px' }}>
                    欢迎您提出宝贵的产品建议，我们将不断优化产品体验。
                  </p>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>
                    请详细描述您的建议，包括功能改进、界面优化等方面。
                  </p>
                </>
              )}
              {active_type === 'bug' && (
                <>
                  <p style={{ marginBottom: '12px' }}>
                    遇到问题？请详细描述您遇到的情况，我们会尽快修复。
                  </p>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>
                    建议包含：操作步骤、预期结果、实际结果、截图等。
                  </p>
                </>
              )}
              {active_type === 'other' && (
                <>
                  <p style={{ marginBottom: '12px' }}>
                    其他类型的反馈，请详细描述您的需求。
                  </p>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>
                    我们会认真阅读每一条反馈。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '12px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>提交反馈</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
              
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开反馈类型栏"
                  aria-label="展开反馈类型栏"
                  style={{
                    position: 'absolute', left: '0', top: '24px', transform: 'translateX(-100%)',
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none',
                    cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '6px 0 0 6px', transition: 'all 0.2s',
                    boxShadow: '-2px 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0ea5e9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              
              {!is_middle_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_middle_sidebar_open(true)}
                  title="展开反馈说明栏"
                  aria-label="展开反馈说明栏"
                  style={{
                    position: 'absolute', left: is_left_sidebar_open ? '200px' : '0', top: '24px', transform: 'translateX(-100%)',
                    background: '#ffffff', border: '1px solid #e2e8f0', borderRight: 'none',
                    cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '6px 0 0 6px', transition: 'all 0.2s',
                    boxShadow: '-2px 2px 4px rgba(0,0,0,0.05)',
                    zIndex: is_left_sidebar_open ? 10 : 5
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0ea5e9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <List size={18} />
                </button>
              )}
              {message && (
                <div style={{ 
                  padding: '12px 16px', 
                  marginBottom: '20px', 
                  borderRadius: '6px', 
                  backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: message.type === 'success' ? '#16a34a' : '#dc2626',
                  fontSize: '14px'
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>标题 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => set_title(e.target.value)}
                    placeholder="请简要描述反馈内容"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>详细描述 <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea 
                    value={content}
                    onChange={(e) => set_content(e.target.value)}
                    placeholder="请详细描述您的问题或建议..."
                    rows={6}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>联系方式 (选填)</label>
                  <input 
                    type="text" 
                    value={contact}
                    onChange={(e) => set_contact(e.target.value)}
                    placeholder="留下您的邮箱或微信，方便我们与您联系"
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>附件 (选填)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="file" 
                        ref={file_input_ref} 
                        onChange={handle_file_change} 
                        multiple 
                        title="添加附件"
                        aria-label="添加附件"
                        style={{ display: 'none' }} 
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <button
                        type="button"
                        onClick={() => file_input_ref.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#475569',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                      >
                        <Paperclip size={16} />
                        添加附件
                      </button>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>支持图片、PDF、文档等格式，最多上传 3 个，单文件 5MB 以内</span>
                    </div>
                    
                    {attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {attachments.map((file, index) => (
                          <div 
                            key={`${file.name}-${index}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#334155'
                            }}
                          >
                            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                              ({(file.size / 1024).toFixed(1)}KB)
                            </span>
                            <X 
                              size={14} 
                              color="#64748b" 
                              style={{ cursor: 'pointer', marginLeft: '4px' }} 
                              onClick={() => remove_attachment(index)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#0078d4',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  提交反馈
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Feedback
