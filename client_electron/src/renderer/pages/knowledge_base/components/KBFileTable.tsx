/**
 * 文件名: KBFileTable.tsx
 * 作者: wuhao
 * 日期: 2026-04-25 00:35:00
 * 描述: 知识库文件列表组件
 */
import React from 'react'
import { List } from 'react-window'
import { FileText, Trash2, Loader2 } from 'lucide-react'

interface KbFile {
  id: string
  kb_id: string
  name: string
  size: string
  upload_time: string
  status: 'success' | 'uploading' | 'error'
}

interface KBFileTableProps {
  files: KbFile[]
  files_loading: boolean
  list_height: number
  on_delete: (file_id: string) => void
}

const KBFileTable: React.FC<KBFileTableProps> = ({ files, files_loading, list_height, on_delete }) => {
  const show_skeleton = files_loading && files.length === 0

  if (show_skeleton) {
    return (
      <div style={{ height: list_height, overflow: 'hidden' }}>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: '56px', padding: '0 20px', borderBottom: '1px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_border)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '60%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
              </div>
            </div>
            <div style={{ width: '80px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
            <div style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
            <div style={{ width: '56px', height: '24px', borderRadius: '12px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return null
  }

  return (
    <List
      rowCount={files.length}
      rowHeight={56}
      rowProps={{}}
      style={{ height: list_height }}
      rowComponent={({ index, style }) => {
        const file = files[index]
        return (
          <div
            key={file.id}
            style={{
              ...style,
              borderBottom: '1px solid var(--ui_border)',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ padding: '12px 20px', width: '100%', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_panel_alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color="var(--ui_accent)" />
                </div>
                <span style={{ fontSize: '14px', color: 'var(--ui_text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{file.name}</span>
              </div>
            </div>
            <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--ui_text_muted)', width: '120px' }}>{file.size}</div>
            <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--ui_text_muted)', whiteSpace: 'nowrap', width: '160px' }}>{file.upload_time}</div>
            <div style={{ padding: '12px 20px', width: '100px' }}>
              {file.status === 'success' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--ui_success)', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}>已解析</span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--ui_accent)', backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 500 }}><Loader2 size={12} className="anim_spin" />上传中</span>
              )}
            </div>
            <div style={{ padding: '12px 20px', textAlign: 'right', width: '80px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <button type="button" onClick={() => on_delete(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_danger)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="删除" aria-label="删除文件" onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' }} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

export default KBFileTable
