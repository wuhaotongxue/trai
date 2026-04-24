/**
 * 文件名: KBEmptyState.tsx
 * 作者: wuhao
 * 日期: 2026-04-25 00:40:00
 * 描述: 知识库空状态组件
 */
import React from 'react'
import { Database, Loader2 } from 'lucide-react'

interface KBEmptyStateProps {
  is_loading: boolean
  message?: string
}

const KBEmptyState: React.FC<KBEmptyStateProps> = ({ is_loading, message }) => {
  if (is_loading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--ui_panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Loader2 size={32} className="anim_spin" />
        </div>
        <div style={{ fontSize: '15px', marginBottom: '8px' }}>{message || '正在加载中...'}</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)' }}>
      <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--ui_panel)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <Database size={36} color="var(--ui_text_muted)" />
      </div>
      <p style={{ fontSize: '15px', marginBottom: '8px', fontWeight: 500, color: 'var(--ui_text)' }}>该知识库暂无文件</p>
      <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>点击右上角上传文件, 支持 PDF, Word, TXT 等格式</p>
    </div>
  )
}

export default KBEmptyState
