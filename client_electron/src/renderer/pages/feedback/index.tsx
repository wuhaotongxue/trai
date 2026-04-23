/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:40:00
 * 描述: 用户反馈页面 - 三段式布局
 */
import React, { useState, useRef } from 'react'
import { MessageSquarePlus, Send, Loader2, Paperclip, X, Lightbulb, Bug, HelpCircle, ChevronRight, History, PanelLeftClose, PanelLeftOpen, List } from 'lucide-react'
import { should_ellipsis } from '@/utils/ui_text'

interface FeedbackType {
  id: string
  name: string
  icon: React.ReactNode
  value: string
}

interface FeedbackSubCategory {
  id: string
  name: string
  description: string
}

const Feedback: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_type, set_active_type] = useState<string>('suggestion')
  const [active_sub_category, set_active_sub_category] = useState<string>('')

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
    { id: 'other', name: '其他反馈', icon: <HelpCircle size={16} />, value: 'other' }
  ]

  const sub_categories: Record<string, FeedbackSubCategory[]> = {
    suggestion: [
      { id: 'performance', name: '性能优化', description: '提升软件运行速度和响应效率' },
      { id: 'feature', name: '功能建议', description: '新增功能或改进现有功能' },
      { id: 'ui', name: '界面优化', description: '改进用户界面和交互体验' },
      { id: 'update', name: '更新建议', description: '版本更新相关的建议' }
    ],
    bug: [
      { id: 'crash', name: '崩溃闪退', description: '软件意外关闭或无法启动' },
      { id: 'function', name: '功能异常', description: '功能无法正常使用' },
      { id: 'display', name: '显示问题', description: '界面显示异常或错位' },
      { id: 'performance_bug', name: '性能问题', description: '运行缓慢或卡顿' }
    ],
    other: [
      { id: 'consult', name: '使用咨询', description: '产品使用相关问题' },
      { id: 'cooperation', name: '合作意向', description: '商务合作或定制需求' },
      { id: 'complaint', name: '投诉建议', description: '服务质量相关反馈' },
      { id: 'other_type', name: '其他类型', description: '不属于以上分类的反馈' }
    ]
  }

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
        set_message({ type: 'success', text: '反馈提交成功, 感谢您的支持! ' })
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_bg)', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquarePlus size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>用户反馈</span>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: 'var(--ui_bg)' }}>
        <div style={{ 
          width: is_left_sidebar_open ? '10%' : '0px', 
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          maxWidth: is_left_sidebar_open ? '120px' : '0px',
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>反馈类型</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起反馈类型栏"
              aria-label="收起反馈类型栏"
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
            {feedback_types.map(type => (
              <button
                key={type.id}
                onClick={() => {
                  set_active_type(type.value)
                  set_active_sub_category('')
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_type === type.value ? 'var(--ui_accent)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: active_type === type.value ? 'white' : 'var(--ui_text)',
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
          backgroundColor: 'var(--ui_panel)', 
          borderRight: is_middle_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开反馈类型栏"
                  aria-label="展开反馈类型栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              {(() => {
                const title =
                  (active_type === 'suggestion' && '产品建议') ||
                  (active_type === 'bug' && '问题报告') ||
                  (active_type === 'other' && '其他反馈') ||
                  ''
                return (
                  <span
                    style={
                      should_ellipsis(title)
                        ? { fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                        : { fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }
                    }
                  >
                    {title}
                  </span>
                )
              })()}
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起反馈说明栏"
              aria-label="收起反馈说明栏"
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
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {sub_categories[active_type]?.map(sub => (
              <div
                key={sub.id}
                onClick={() => set_active_sub_category(sub.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: active_sub_category === sub.id ? 'var(--ui_accent)' : 'transparent',
                  color: active_sub_category === sub.id ? 'white' : 'var(--ui_text)',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.2s',
                  fontSize: '13px',
                  fontWeight: active_sub_category === sub.id ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (active_sub_category !== sub.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                }}
                onMouseLeave={(e) => {
                  if (active_sub_category !== sub.id) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {sub.name}
              </div>
            ))}
          </div>
        </div>

        <div className="no-drag-region" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="drag-region" style={{ padding: '12px 16px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center' }}>
            {!is_middle_sidebar_open && (
              <div className="no-drag-region" style={{ display: 'flex', alignItems: 'center', marginRight: '16px', gap: '4px' }}>
                {!is_left_sidebar_open && (
                  <button
                    type="button"
                    onClick={() => set_is_left_sidebar_open(true)}
                    title="展开反馈类型栏"
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
                  type="button"
                  onClick={() => set_is_middle_sidebar_open(true)}
                  title="展开反馈分类栏"
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
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>
              {active_sub_category ? sub_categories[active_type]?.find(s => s.id === active_sub_category)?.name : '提交反馈'}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {message && (
                <div style={{ 
                  padding: '12px 16px', 
                  marginBottom: '20px', 
                  borderRadius: '6px', 
                  backgroundColor: message.type === 'success' ? 'var(--ui_success)' : 'var(--ui_danger)',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {active_sub_category && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--ui_accent)', borderRadius: '6px', border: '1px solid var(--ui_accent)' }}>
                    <p style={{ fontSize: '13px', color: 'white', margin: 0 }}>
                      当前分类: {sub_categories[active_type]?.find(s => s.id === active_sub_category)?.description}
                    </p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ui_text)' }}>标题 <span style={{ color: 'var(--ui_danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => set_title(e.target.value)}
                    placeholder={active_sub_category ? `请输入${sub_categories[active_type]?.find(s => s.id === active_sub_category)?.name}相关的标题` : '请简要描述反馈内容'}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ui_border)', outline: 'none', fontSize: '14px', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ui_text)' }}>详细描述 <span style={{ color: 'var(--ui_danger)' }}>*</span></label>
                  <textarea 
                    value={content}
                    onChange={(e) => set_content(e.target.value)}
                    placeholder={active_sub_category ? `请详细描述您关于${sub_categories[active_type]?.find(s => s.id === active_sub_category)?.name}的问题或建议...` : '请详细描述您的问题或建议...'}
                    rows={6}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ui_border)', outline: 'none', fontSize: '14px', resize: 'vertical', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ui_text)' }}>联系方式 (选填)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={contact}
                      onChange={(e) => set_contact(e.target.value)}
                      placeholder="请输入您的邮箱前缀"
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ui_border)', outline: 'none', fontSize: '14px', backgroundColor: 'var(--ui_panel_alt)', color: 'var(--ui_text)' }}
                    />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const prefix = contact.split('@')[0] || contact
                          set_contact(prefix + e.target.value)
                        }
                      }}
                      style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--ui_border)', outline: 'none', fontSize: '14px', backgroundColor: 'var(--ui_panel_alt)', cursor: 'pointer', minWidth: '140px', color: 'var(--ui_text)' }}
                    >
                      <option value="">选择邮箱后缀</option>
                      <option value="@qq.com">@qq.com</option>
                      <option value="@163.com">@163.com</option>
                      <option value="@126.com">@126.com</option>
                      <option value="@gmail.com">@gmail.com</option>
                      <option value="@outlook.com">@outlook.com</option>
                      <option value="@sina.com">@sina.com</option>
                      <option value="@sohu.com">@sohu.com</option>
                      <option value="@foxmail.com">@foxmail.com</option>
                      <option value="@aliyun.com">@aliyun.com</option>
                      <option value="@yeah.net">@yeah.net</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {['@qq.com', '@163.com', '@gmail.com', '@outlook.com'].map(suffix => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => {
                          const prefix = contact.split('@')[0] || contact
                          set_contact(prefix + suffix)
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--ui_border)',
                          backgroundColor: 'var(--ui_panel_alt)',
                          color: 'var(--ui_text)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                          e.currentTarget.style.color = 'var(--ui_text)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'
                          e.currentTarget.style.color = 'var(--ui_text)'
                        }}
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ui_text)' }}>附件 (选填)</label>
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
                          backgroundColor: 'var(--ui_panel_alt)',
                          border: '1px solid var(--ui_border)',
                          borderRadius: '6px',
                          color: 'var(--ui_text)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_alt)'}
                      >
                        <Paperclip size={16} />
                        添加附件
                      </button>
                      <span style={{ fontSize: '12px', color: 'var(--ui_text_muted)' }}>支持图片、PDF、文档等格式, 最多上传 3 个, 单文件 5MB 以内</span>
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
                              backgroundColor: 'var(--ui_panel_alt)',
                              border: '1px solid var(--ui_border)',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: 'var(--ui_text)'
                            }}
                          >
                            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </span>
                            <span style={{ color: 'var(--ui_text_muted)', fontSize: '11px' }}>
                              ({(file.size / 1024).toFixed(1)}KB)
                            </span>
                            <X 
                              size={14} 
                              color="var(--ui_text_muted)" 
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
                    backgroundColor: 'var(--ui_accent)',
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
