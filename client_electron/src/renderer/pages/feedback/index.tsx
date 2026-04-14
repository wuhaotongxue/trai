/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 13:40:00
 * 描述: 用户反馈页面
 */
import React, { useState } from 'react'
import { MessageSquarePlus, Send, Loader2 } from 'lucide-react'

const Feedback: React.FC = () => {
  const [type, set_type] = useState('suggestion')
  const [title, set_title] = useState('')
  const [content, set_content] = useState('')
  const [contact, set_contact] = useState('')
  const [loading, set_loading] = useState(false)
  const [message, set_message] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      set_message({ type: 'error', text: '标题和内容不能为空' })
      return
    }

    set_loading(true)
    set_message(null)

    try {
      const res = await window.electron_api.feedback_submit({ type, title, content, contact })
      if (res.success) {
        set_message({ type: 'success', text: '反馈提交成功，感谢您的支持！' })
        set_title('')
        set_content('')
        set_contact('')
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
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquarePlus size={24} color="#0078d4" />
        <h1 style={{ margin: 0, fontSize: '20px', color: '#202020' }}>用户反馈</h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
          欢迎您提出宝贵的意见或反馈遇到的问题，我们将不断优化产品体验。
        </p>

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
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>反馈类型</label>
            <select 
              value={type}
              onChange={(e) => set_type(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' }}
            >
              <option value="suggestion">产品建议</option>
              <option value="bug">问题报告 (Bug)</option>
              <option value="other">其他</option>
            </select>
          </div>

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
  )
}

export default Feedback
