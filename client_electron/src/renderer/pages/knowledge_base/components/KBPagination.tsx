/**
 * 文件名: KBPagination.tsx
 * 作者: wuhao
 * 日期: 2026-04-25 00:30:00
 * 描述: 知识库分页组件
 */
import React from 'react'
import { Loader2 } from 'lucide-react'

interface KBPaginationProps {
  file_total: number
  file_page: number
  file_page_size: number
  file_total_pages: number
  jump_page_input: string
  files_loading: boolean
  page_action: string | null
  debug_visible: boolean
  on_page_size_change: (size: number) => void
  on_prev: () => void
  on_next: () => void
  on_jump_change: (value: string) => void
  on_jump: () => void
  on_toggle_debug: () => void
}

const KBPagination: React.FC<KBPaginationProps> = ({
  file_total,
  file_page,
  file_page_size,
  file_total_pages,
  jump_page_input,
  files_loading,
  page_action,
  debug_visible,
  on_page_size_change,
  on_prev,
  on_next,
  on_jump_change,
  on_jump,
  on_toggle_debug
}) => {
  return (
    <>
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, var(--ui_panel), var(--ui_panel_alt))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ui_text_muted)', fontWeight: 500 }}>
            共 <span style={{ color: 'var(--ui_accent)', fontWeight: 600 }}>{file_total}</span> 条
          </div>
          <button
            type="button"
            onClick={on_toggle_debug}
            style={{
              border: '1px solid var(--ui_border)',
              backgroundColor: debug_visible ? 'var(--ui_accent_light)' : 'var(--ui_panel)',
              color: debug_visible ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            日志
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ui_text_muted)', whiteSpace: 'nowrap' }}>
            <span>每页</span>
            <select
              aria-label="每页数量"
              title="每页数量"
              value={file_page_size}
              onChange={(e) => on_page_size_change(Number(e.target.value))}
              disabled={files_loading}
              style={{
                padding: '4px 8px',
                border: '1px solid var(--ui_border)',
                borderRadius: '6px',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <button
            type="button"
            onClick={on_prev}
            disabled={file_page <= 1 || files_loading}
            style={{
              padding: '6px 14px',
              backgroundColor: file_page <= 1 ? 'var(--ui_panel_alt)' : 'var(--ui_panel)',
              color: file_page <= 1 ? 'var(--ui_text_muted)' : 'var(--ui_text)',
              border: '1px solid var(--ui_border)',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: file_page <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            上一页
          </button>
          <div style={{ fontSize: '13px', color: 'var(--ui_text)', whiteSpace: 'nowrap', fontWeight: 500 }}>
            第 <span style={{ color: 'var(--ui_accent)', fontWeight: 600 }}>{file_page}</span> / {file_total_pages} 页
          </div>
          <button
            type="button"
            onClick={on_next}
            disabled={file_page >= file_total_pages || files_loading}
            style={{
              padding: '6px 14px',
              backgroundColor: file_page >= file_total_pages ? 'var(--ui_panel_alt)' : 'var(--ui_panel)',
              color: file_page >= file_total_pages ? 'var(--ui_text_muted)' : 'var(--ui_text)',
              border: '1px solid var(--ui_border)',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: file_page >= file_total_pages ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            下一页
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--ui_text_muted)', whiteSpace: 'nowrap' }}>跳转</span>
            <input
              type="number"
              aria-label="跳转页码"
              title="跳转页码"
              min={1}
              max={file_total_pages}
              value={jump_page_input}
              onChange={(e) => on_jump_change(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                on_jump()
              }}
              disabled={files_loading}
              style={{
                width: '60px',
                padding: '6px 8px',
                border: '1px solid var(--ui_border)',
                borderRadius: '6px',
                backgroundColor: 'var(--ui_panel)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                textAlign: 'center'
              }}
            />
            <button
              type="button"
              onClick={on_jump}
              disabled={files_loading}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--ui_accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {files_loading && page_action === 'jump' ? <Loader2 size={12} className="anim_spin" /> : null}
              跳转
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default KBPagination
