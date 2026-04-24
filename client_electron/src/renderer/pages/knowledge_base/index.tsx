/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-25 00:50:00
 * 描述: 专属知识库管理页面，支持新建知识库与上传文件（三段式折叠布局）
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Database, Plus, UploadCloud, FileText, X, Search, Loader2, Trash2, Folder, PanelLeftClose, PanelLeftOpen, List as ListIcon, Edit2, FolderInput, BookOpen, RotateCw } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { KBPagination, KBFileTable, KBEmptyState } from './components'
import '../../styles/knowledge_base.css'

interface KbCategory {
  id: string
  name: string
}

interface KnowledgeBase {
  id: string
  category_id: string
  name: string
  file_count: number
  created_at: string
}

interface KbFile {
  id: string
  kb_id: string
  name: string
  size: string
  upload_time: string
  status: 'success' | 'uploading' | 'error'
}

const KnowledgeBasePage: React.FC = () => {
  const { user } = use_auth_store()
  const [categories, set_categories] = useState<KbCategory[]>([])
  const [active_cat_id, set_active_cat_id] = useState<string>('')
  const [kb_list, set_kb_list] = useState<KnowledgeBase[]>([])
  const [active_kb_id, set_active_kb_id] = useState<string>('')
  const [files, set_files] = useState<KbFile[]>([])
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [show_create_modal, set_show_create_modal] = useState(false)
  const [new_kb_name, set_new_kb_name] = useState('')
  const [creating_kb, set_creating_kb] = useState(false)
  const [create_kb_error, set_create_kb_error] = useState('')
  const [kb_loading, set_kb_loading] = useState(true)
  const [kb_error, set_kb_error] = useState('')
  const [files_loading, set_files_loading] = useState(false)
  const [files_error, set_files_error] = useState('')
  const [show_cat_modal, set_show_cat_modal] = useState(false)
  const [new_cat_name, set_new_cat_name] = useState('')
  const [search_query, set_search_query] = useState('')
  const [file_page, set_file_page] = useState(1)
  const [file_page_size, set_file_page_size] = useState(10)
  const [file_total, set_file_total] = useState(0)
  const [jump_page_input, set_jump_page_input] = useState('')
  const [page_action, set_page_action] = useState<'prev' | 'next' | 'jump' | 'refresh' | 'init' | null>(null)
  const [debug_visible, set_debug_visible] = useState(false)
  const [debug_messages, set_debug_messages] = useState<string[]>([])
  const [show_custom_modal, set_show_custom_modal] = useState(false)
  const [custom_modal_type, set_custom_modal_type] = useState<'alert' | 'confirm'>('alert')
  const [custom_modal_title, set_custom_modal_title] = useState('')
  const [custom_modal_message, set_custom_modal_message] = useState('')
  const [custom_modal_callback, set_custom_modal_callback] = useState<(() => void) | null>(null)
  const [editing_kb_id, set_editing_kb_id] = useState<string | null>(null)
  const [edit_kb_name, set_edit_kb_name] = useState('')
  const [moving_kb_id, set_moving_kb_id] = useState<string | null>(null)
  const [target_cat_id, set_target_cat_id] = useState<string>('')
  const [editing_cat_id, set_editing_cat_id] = useState<string | null>(null)
  const [edit_cat_name, set_edit_cat_name] = useState('')
  const file_input_ref = useRef<HTMLInputElement>(null)
  const list_container_ref = useRef<HTMLDivElement>(null)
  const [list_height, set_list_height] = useState(300)

  const show_alert = useCallback((title: string, message: string) => {
    set_custom_modal_title(title)
    set_custom_modal_message(message)
    set_custom_modal_type('alert')
    set_custom_modal_callback(null)
    set_show_custom_modal(true)
  }, [])

  const show_confirm = useCallback((title: string, message: string, callback: () => void) => {
    set_custom_modal_title(title)
    set_custom_modal_message(message)
    set_custom_modal_type('confirm')
    set_custom_modal_callback(() => callback)
    set_show_custom_modal(true)
  }, [])

  const display_files = useMemo(() => {
    const q = search_query.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, search_query])

  useEffect(() => { set_file_page(1) }, [active_kb_id])

  useEffect(() => {
    const kb = kb_list.find((it) => it.id === active_kb_id)
    if (file_total <= 0 && kb && typeof kb.file_count === 'number' && kb.file_count > 0) {
      set_file_total(kb.file_count)
    }
  }, [active_kb_id, kb_list, file_total])

  const file_total_pages = useMemo(() => {
    if (file_total <= 0) return 1
    return Math.max(1, Math.ceil(file_total / file_page_size))
  }, [file_total, file_page_size])

  const file_current_page = useMemo(() => {
    return Math.min(Math.max(1, file_page), file_total_pages)
  }, [file_page, file_total_pages])

  useEffect(() => { set_jump_page_input(String(file_current_page)) }, [file_current_page])

  const fetch_files_page = useCallback(async (target_page: number, page_size_override?: number) => {
    if (!active_kb_id || !window.electron_api?.kb_list_index_files) return
    const page = Math.max(1, target_page)
    const effective_page_size = typeof page_size_override === 'number' ? page_size_override : file_page_size
    set_files_loading(true)
    set_files_error('')
    const append_debug = (msg: string) => {
      const ts = new Date().toISOString().slice(11, 19)
      set_debug_messages((prev) => [...prev.slice(-19), `${ts} ${msg}`])
    }
    try {
      append_debug(`request kb_id=${active_kb_id} page=${page} page_size=${effective_page_size}`)
      const res = await window.electron_api.kb_list_index_files(active_kb_id, page, effective_page_size)
      if (!res.success) {
        set_files_error(res.error || '获取知识库文件失败')
        append_debug(`error page=${page} msg=${res.error || 'unknown'}`)
        return
      }
      const data_root = res.data?.data || res.data
      const items_source = data_root?.items || data_root?.data?.items || data_root?.data || []
      const items: any[] = Array.isArray(items_source) ? items_source : []
      const total_source = data_root?.total ?? data_root?.data?.total
      const fallback_total_from_kb = kb_list.find((it) => it.id === active_kb_id)?.file_count
      const total_candidate = typeof total_source === 'number' ? total_source : typeof total_source === 'string' && total_source.trim() && !Number.isNaN(Number(total_source)) ? Number(total_source) : 0
      const total = Math.max(total_candidate, typeof fallback_total_from_kb === 'number' ? fallback_total_from_kb : 0, file_total, items.length) || items.length
      const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const mapped_files: KbFile[] = items.map((it) => {
        const raw_status = String(it.status || it.Status || it.document_status || it.documentStatus || '').toUpperCase()
        let status: KbFile['status'] = 'success'
        if (raw_status === 'FAILED' || raw_status === 'ERROR') status = 'error'
        if (raw_status === 'PENDING' || raw_status === 'PROCESSING' || raw_status === 'RUNNING') status = 'uploading'
        return {
          id: String(it.file_id || it.fileId || it.FileId || it.document_id || it.documentId || it.id || it.Id || ''),
          kb_id: active_kb_id,
          name: String(it.file_name || it.fileName || it.FileName || it.document_name || it.documentName || it.name || it.Name || ''),
          size: String(it.size || it.Size || it.size_in_bytes || it.sizeInBytes || '-'),
          upload_time: String(it.upload_time || it.gmtCreate || it.GmtCreate || it.createTime || now_str),
          status
        }
      }).filter((f) => f.id && f.name)
      set_files(mapped_files)
      set_file_total(total)
      set_file_page(page)
      set_kb_list((prev) => prev.map((kb) => kb.id === active_kb_id ? { ...kb, file_count: total } : kb))
      append_debug(`response page=${page} items=${mapped_files.length} total=${total}`)
    } catch (err: any) {
      set_files_error(err?.message || '获取知识库文件失败')
      append_debug(`exception page=${page} msg=${String(err?.message || err)}`)
    } finally {
      set_files_loading(false)
    }
  }, [active_kb_id, file_page_size, file_total, kb_list])

  const request_files_page = useCallback(async (target_page: number, action: 'prev' | 'next' | 'jump' | 'refresh' | 'init', page_size_override?: number) => {
    if (files_loading) return
    set_page_action(action)
    // 立即清空数据并显示骨架屏（用户点击的瞬间）
    set_files([])
    set_files_loading(true)
    try { await fetch_files_page(target_page, page_size_override) } finally { set_page_action(null) }
  }, [fetch_files_page, files_loading])

  useEffect(() => { void request_files_page(1, 'init') }, [active_kb_id, file_page_size])

  useEffect(() => {
    const updateListHeight = () => {
      if (list_container_ref.current) {
        const rect = list_container_ref.current.getBoundingClientRect()
        set_list_height(Math.max(200, rect.height - 60))
      }
    }
    updateListHeight()
    const observer = new ResizeObserver(updateListHeight)
    if (list_container_ref.current) observer.observe(list_container_ref.current)
    return () => observer.disconnect()
  }, [])

  const refresh_files = useCallback(async () => { await request_files_page(file_current_page, 'refresh') }, [file_current_page, request_files_page])

  const handle_create_cat = useCallback(() => {
    if (!new_cat_name.trim()) return
    const new_cat: KbCategory = { id: `cat_${Date.now()}`, name: new_cat_name.trim() }
    set_categories((prev) => [...prev, new_cat])
    set_active_cat_id(new_cat.id)
    set_show_cat_modal(false)
    set_new_cat_name('')
  }, [new_cat_name])

  const handle_create_kb = useCallback(async () => {
    const name = new_kb_name.trim()
    const create_cat_id = active_cat_id || categories[0]?.id || 'default'
    if (!name || !create_cat_id) return
    if (!window.electron_api.kb_demo_create) { set_create_kb_error('当前客户端版本不支持创建知识库'); return }
    set_create_kb_error('')
    set_creating_kb(true)
    try {
      const res = await window.electron_api.kb_demo_create({ index_name: name })
      if (!res.success || !res.data) { set_create_kb_error(res.error || '创建失败'); return }
      const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const actual_data = res.data.data || res.data
      const new_kb: KnowledgeBase = { id: actual_data.index_id, category_id: create_cat_id, name: actual_data.index_name || name, file_count: 1, created_at: now_str }
      set_kb_list((prev) => [new_kb, ...prev])
      set_file_total(1)
      set_active_kb_id(new_kb.id)
      set_show_create_modal(false)
      set_new_kb_name('')
    } finally { set_creating_kb(false) }
  }, [new_kb_name, active_cat_id, categories])

  const handle_file_upload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected_files = Array.from(e.target.files || [])
    if (selected_files.length === 0 || !active_kb_id) return
    if (!window.electron_api?.kb_upload_text) { show_alert('提示', '当前客户端版本不支持上传文件'); return }
    set_files_loading(true)
    try {
      for (const file of selected_files) {
        let content: string
        const ext = file.name.toLowerCase().split('.').pop() || ''
        const text_extensions = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm']
        if (text_extensions.includes(ext)) { content = await file.text() } else {
          const array_buffer = await file.arrayBuffer()
          const uint8_array = new Uint8Array(array_buffer)
          content = btoa(String.fromCharCode(...uint8_array))
        }
        const res = await window.electron_api.kb_upload_text(active_kb_id, file.name, content)
        if (!res.success) show_alert('上传失败', `上传 ${file.name} 失败: ${res.error}`)
      }
    } catch (err: any) { show_alert('上传失败', `读取/上传文件失败: ${err.message}`) } finally {
      set_files_loading(false)
      await fetch_files_page(1)
    }
    if (e.target) e.target.value = ''
  }, [active_kb_id, show_alert, fetch_files_page])

  const handle_delete_file = useCallback(async (file_id: string) => {
    if (!active_kb_id || !window.electron_api?.kb_delete_index_file) return
    show_confirm('确认删除', '确定要删除该文件吗?', async () => {
      try {
        const res = await window.electron_api.kb_delete_index_file(active_kb_id, file_id)
        if (res.success) {
          const next_total = Math.max(0, file_total - 1)
          const next_total_pages = next_total <= 0 ? 1 : Math.max(1, Math.ceil(next_total / file_page_size))
          const next_page = Math.min(file_current_page, next_total_pages)
          set_file_total(next_total)
          await fetch_files_page(next_page)
        } else { show_alert('删除失败', `删除失败: ${res.error}`) }
      } catch (e: any) { show_alert('删除失败', `删除异常: ${e.message}`) }
    })
  }, [active_kb_id, file_total, file_page_size, file_current_page, show_confirm, show_alert, fetch_files_page])

  const handle_rename_kb = useCallback(async (kb_id: string) => {
    if (!edit_kb_name.trim()) return
    if (!window.electron_api?.kb_rename_index) return
    show_confirm('确认重命名', `确认将知识库重命名为 "${edit_kb_name.trim()}" 吗?`, async () => {
      try {
        const res = await window.electron_api.kb_rename_index(kb_id, edit_kb_name.trim())
        if (res.success) {
          set_kb_list(prev => prev.map(kb => kb.id === kb_id ? { ...kb, name: edit_kb_name.trim() } : kb))
          set_editing_kb_id(null)
          set_edit_kb_name('')
        } else { show_alert('重命名失败', `重命名失败: ${res.error}`) }
      } catch (e: any) { show_alert('重命名失败', `重命名异常: ${e.message}`) }
    })
  }, [edit_kb_name, show_confirm, show_alert])

  const handle_delete_kb = useCallback(async (kb_id: string) => {
    if (!window.electron_api?.kb_delete_index) return
    show_confirm('确认删除', '确认要删除该知识库吗? 此操作不可恢复!', async () => {
      try {
        const res = await window.electron_api.kb_delete_index(kb_id)
        if (res.success) { set_kb_list(prev => prev.filter(k => k.id !== kb_id)); if (active_kb_id === kb_id) set_active_kb_id('') } else { show_alert('删除失败', `删除知识库失败: ${res.error}`) }
      } catch (e: any) { show_alert('删除失败', `删除异常: ${e.message}`) }
    })
  }, [active_kb_id, show_confirm, show_alert])

  const handle_move_kb = useCallback((kb_id: string) => {
    set_moving_kb_id(kb_id)
    const kb = kb_list.find(k => k.id === kb_id)
    if (kb) set_target_cat_id(kb.category_id)
  }, [kb_list])

  const confirm_move_kb = useCallback(() => {
    if (!moving_kb_id || !target_cat_id) return
    set_kb_list(prev => prev.map(kb => kb.id === moving_kb_id ? { ...kb, category_id: target_cat_id } : kb))
    set_moving_kb_id(null)
    set_target_cat_id('')
  }, [moving_kb_id, target_cat_id])

  const handle_rename_cat = useCallback((cat_id: string) => {
    const cat = categories.find(c => c.id === cat_id)
    if (cat) { set_editing_cat_id(cat_id); set_edit_cat_name(cat.name) }
  }, [categories])

  const confirm_rename_cat = useCallback(() => {
    if (!editing_cat_id || !edit_cat_name.trim()) { set_editing_cat_id(null); return }
    set_categories(prev => prev.map(c => c.id === editing_cat_id ? { ...c, name: edit_cat_name.trim() } : c))
    set_editing_cat_id(null)
    set_edit_cat_name('')
  }, [editing_cat_id, edit_cat_name])

  const handle_delete_cat = useCallback((cat_id: string) => {
    if (cat_id === 'default') { show_alert('无法删除', '默认分类不能删除'); return }
    const cat = categories.find(c => c.id === cat_id)
    if (!cat) return
    const kbs_in_cat = kb_list.filter(k => k.category_id === cat_id)
    if (kbs_in_cat.length === 0) {
      show_confirm('删除分类', `确定要删除分类"${cat.name}"吗? `, () => {
        set_categories(prev => prev.filter(c => c.id !== cat_id))
        if (active_cat_id === cat_id) set_active_cat_id('default')
      })
    } else {
      show_confirm('删除分类', `分类"${cat.name}"下有${kbs_in_cat.length}个知识库, 删除分类会同时删除这些知识库.\n\n是否要先将这些知识库转移到默认分类? `, () => {
        set_kb_list(prev => prev.map(kb => kb.category_id === cat_id ? { ...kb, category_id: 'default' } : kb))
        set_categories(prev => prev.filter(c => c.id !== cat_id))
        if (active_cat_id === cat_id) set_active_cat_id('default')
      })
    }
  }, [categories, kb_list, active_cat_id, show_alert, show_confirm])

  const get_display_name = (name: string, maxLength: number = 4) => {
    const parts = name.split('__')
    const displayName = parts.length > 1 ? parts.slice(1).join('__') : name
    if (displayName.length > maxLength) return displayName.slice(0, maxLength) + '...'
    return displayName
  }

  const active_cat = useMemo(() => categories.find(c => c.id === active_cat_id), [categories, active_cat_id])
  const active_kb = useMemo(() => kb_list.find(kb => kb.id === active_kb_id), [kb_list, active_kb_id])
  const current_cat_kbs = useMemo(() => kb_list.filter(kb => kb.category_id === active_cat_id), [kb_list, active_cat_id])

  const render_left_sidebar = () => (
    <div style={{
      width: is_left_sidebar_open ? '180px' : '0px', minWidth: is_left_sidebar_open ? '180px' : '0px',
      opacity: is_left_sidebar_open ? 1 : 0, backgroundColor: 'var(--ui_panel)',
      borderRight: is_left_sidebar_open ? '1px solid var(--ui_border)' : 'none', display: 'flex',
      flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden', flexShrink: 1
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>知识库</span>
        <button type="button" onClick={() => set_is_left_sidebar_open(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><PanelLeftClose size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box', minHeight: 0 }}>
        {categories.map(cat => (
          <div key={cat.id} style={{
            padding: '6px 8px', borderRadius: '6px', backgroundColor: active_cat_id === cat.id ? 'var(--ui_accent)' : 'transparent',
            color: active_cat_id === cat.id ? 'white' : 'var(--ui_text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', fontWeight: active_cat_id === cat.id ? 600 : 400, transition: 'background-color 0.2s'
          }} onMouseEnter={(e) => { if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)' }} onMouseLeave={(e) => { if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = 'transparent' }}>
            {editing_cat_id === cat.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <Folder size={16} />
                <input autoFocus value={edit_cat_name} onChange={(e) => set_edit_cat_name(e.target.value)} onBlur={confirm_rename_cat} onKeyDown={(e) => { if (e.key === 'Enter') confirm_rename_cat(); if (e.key === 'Escape') { set_editing_cat_id(null); set_edit_cat_name('') } }} style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--ui_accent)', borderRadius: '4px', outline: 'none', fontSize: '13px', minWidth: 0 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }} onClick={() => { set_active_cat_id(cat.id); const first_kb = kb_list.find(k => k.category_id === cat.id); if (first_kb) set_active_kb_id(first_kb.id) }}>
                <Folder size={16} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{cat.name}</span>
              </div>
            )}
            {editing_cat_id !== cat.id && cat.id !== 'default' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: active_cat_id === cat.id ? 1 : 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = active_cat_id === cat.id ? '1' : '0'}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handle_rename_cat(cat.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)' }}><Edit2 size={14} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handle_delete_cat(cat.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_danger)', borderRadius: '4px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ui_border)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => set_show_cat_modal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', backgroundColor: 'transparent', color: 'var(--ui_accent)', border: '1px dashed var(--ui_accent)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Plus size={14} /> 分类</button>
      </div>
    </div>
  )

  const render_middle_sidebar = () => (
    <div style={{
      width: is_middle_sidebar_open ? '220px' : '0px', minWidth: is_middle_sidebar_open ? '220px' : '0px', flexShrink: 1,
      opacity: is_middle_sidebar_open ? 1 : 0, backgroundColor: 'var(--ui_panel)',
      borderRight: is_middle_sidebar_open ? '1px solid var(--ui_border)' : 'none', display: 'flex',
      flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden'
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
          {!is_left_sidebar_open && <button type="button" onClick={() => set_is_left_sidebar_open(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><PanelLeftOpen size={18} /></button>}
          <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{active_cat?.name || '知识库'}</span>
        </div>
        <button type="button" onClick={() => set_is_middle_sidebar_open(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><ListIcon size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box', minHeight: 0 }}>
        {current_cat_kbs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>当前分类暂无子知识库</div>
        ) : (
          current_cat_kbs.map(kb => (
            <div key={kb.id} onClick={() => set_active_kb_id(kb.id)} title={`创建时间: ${kb.created_at}`} style={{
              padding: '12px 16px', borderRadius: '8px', backgroundColor: active_kb_id === kb.id ? 'var(--ui_panel_alt)' : 'transparent',
              border: `1px solid ${active_kb_id === kb.id ? 'var(--ui_border)' : 'transparent'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px', transition: 'all 0.2s'
            }} onMouseEnter={(e) => { if (active_kb_id !== kb.id) e.currentTarget.style.backgroundColor = 'var(--ui_border)' }} onMouseLeave={(e) => { if (active_kb_id !== kb.id) e.currentTarget.style.backgroundColor = 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <BookOpen size={14} color={active_kb_id === kb.id ? 'var(--ui_accent)' : 'var(--ui_text_muted)'} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{get_display_name(kb.name)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--ui_text_muted)', backgroundColor: 'var(--ui_border)', padding: '2px 6px', borderRadius: '12px' }}>{kb.file_count}</span>
                  {active_cat?.id !== 'default' && (
                    <>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handle_move_kb(kb.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><FolderInput size={12} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); set_editing_kb_id(kb.id); set_edit_kb_name(get_display_name(kb.name)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit2 size={12} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handle_delete_kb(kb.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_danger)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={12} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ui_border)', boxSizing: 'border-box' }}>
        <button type="button" onClick={() => set_show_create_modal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', backgroundColor: 'transparent', color: 'var(--ui_accent)', border: '1px dashed var(--ui_accent)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_accent_light)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Plus size={14} /> 知识库</button>
      </div>
    </div>
  )

  const render_right_content = () => {
    if (!active_kb) return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--ui_panel)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid var(--ui_border)' }}>
          <FolderInput size={32} color="var(--ui_text_muted)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '6px' }}>请在左侧选择或新建知识库</p>
          <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>点击左侧「+」按钮创建新知识库</p>
        </div>
      </div>
    )
    return (
      <>
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {!is_middle_sidebar_open && (
              <>
                {!is_left_sidebar_open && <button type="button" onClick={() => set_is_left_sidebar_open(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px', marginRight: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><PanelLeftOpen size={18} /></button>}
                <button type="button" onClick={() => set_is_middle_sidebar_open(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ui_text_muted)', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><ListIcon size={18} /></button>
              </>
            )}
            {editing_kb_id === active_kb.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <input autoFocus aria-label="知识库名称" title="知识库名称" value={edit_kb_name} onChange={(e) => set_edit_kb_name(e.target.value.slice(0, 15))} onBlur={() => handle_rename_kb(active_kb.id)} onKeyDown={(e) => e.key === 'Enter' && handle_rename_kb(active_kb.id)} style={{ fontSize: '18px', color: 'var(--ui_text)', fontWeight: 600, padding: '4px 8px', border: '1px solid var(--ui_accent)', borderRadius: '6px', outline: 'none', minWidth: '100px', flex: 1 }} maxLength={15} />
                <div style={{ fontSize: '12px', color: edit_kb_name.length >= 15 ? 'var(--ui_danger)' : 'var(--ui_text_muted)', whiteSpace: 'nowrap' }}>{edit_kb_name.length}/15</div>
              </div>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)', fontWeight: 600, minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{get_display_name(active_kb.name, 20)}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => handle_move_kb(active_kb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_text_muted)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }} title="移动知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><FolderInput size={18} /></button>
                  <button type="button" onClick={() => { set_editing_kb_id(active_kb.id); set_edit_kb_name(get_display_name(active_kb.name)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_text_muted)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }} title="重命名知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit2 size={18} /></button>
                  <button type="button" onClick={() => handle_delete_kb(active_kb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_danger)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }} title="删除知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={18} /></button>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--ui_text_muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="搜索文件..." aria-label="搜索文件" title="搜索文件" value={search_query} onChange={e => set_search_query(e.target.value)} style={{ padding: '4px 12px 4px 32px', border: '1px solid var(--ui_border)', borderRadius: '4px', outline: 'none', fontSize: '13px', width: '200px', height: '28px', boxSizing: 'border-box', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }} />
            </div>
            <button type="button" onClick={refresh_files} title="刷新文件列表" disabled={files_loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', backgroundColor: 'transparent', color: 'var(--ui_text_muted)', border: '1px solid var(--ui_border)', borderRadius: '4px', cursor: files_loading ? 'not-allowed' : 'pointer' }} onMouseEnter={(e) => { if (!files_loading) e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><RotateCw size={18} className={files_loading ? 'anim_spin' : ''} /></button>
            <input type="file" multiple ref={file_input_ref} onChange={handle_file_upload} title="上传文件" aria-label="上传文件" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" style={{ display: 'none' }} />
            <button type="button" onClick={() => file_input_ref.current?.click()} aria-label="上传文件" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'var(--ui_accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}><UploadCloud size={18} /> 上传文件</button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', minHeight: 0 }}>
          <div ref={list_container_ref} style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '16px', border: '1px solid var(--ui_border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)' }}>
                <div style={{ display: 'flex', width: '100%' }}>
                  <div style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--ui_text_muted)', flex: 1 }}>文件名称</div>
                  <div style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--ui_text_muted)', width: '120px' }}>大小</div>
                  <div style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--ui_text_muted)', width: '160px' }}>上传时间</div>
                  <div style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--ui_text_muted)', width: '100px' }}>状态</div>
                  <div style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--ui_text_muted)', width: '80px', textAlign: 'right' }}>操作</div>
                </div>
              </div>
              <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                {files_loading && display_files.length === 0 ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                    <style>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                      }
                    `}</style>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', height: '56px', padding: '0 20px', borderBottom: '1px solid var(--ui_border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--ui_border)', flexShrink: 0 }} />
                          <div style={{ flex: 1, height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '60%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                          </div>
                        </div>
                        <div style={{ width: '80px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
                        <div style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
                        <div style={{ width: '56px', height: '24px', borderRadius: '12px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--ui_border)', marginLeft: '20px' }} />
                      </div>
                    ))}
                  </div>
                ) : display_files.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--ui_panel)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <Database size={36} color="var(--ui_text_muted)" />
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '8px', fontWeight: 500, color: 'var(--ui_text)' }}>该知识库暂无文件</p>
                    <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>点击右上角上传文件, 支持 PDF, Word, TXT 等格式</p>
                  </div>
                ) : (
                  <>
                    <KBFileTable
                      files={display_files}
                      files_loading={files_loading}
                      list_height={list_height}
                      on_delete={handle_delete_file}
                    />
                    {files_loading && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--ui_panel)', border: '1px solid var(--ui_border)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--ui_border)', borderTopColor: 'var(--ui_accent)', animation: 'spin 0.8s linear infinite' }} />
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          <span style={{ fontSize: '11px', color: 'var(--ui_text_muted)' }}>加载中</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <KBPagination file_total={file_total} file_page={file_page} file_page_size={file_page_size} file_total_pages={file_total_pages} jump_page_input={jump_page_input} files_loading={files_loading} page_action={page_action} debug_visible={debug_visible} on_page_size_change={(size) => void request_files_page(1, 'init', size)} on_prev={() => request_files_page(file_current_page - 1, 'prev')} on_next={() => request_files_page(file_current_page + 1, 'next')} on_jump_change={set_jump_page_input} on_jump={() => { const v = Number(jump_page_input); if (!Number.isFinite(v)) return; const next_page = Math.min(Math.max(1, Math.trunc(v)), file_total_pages); void request_files_page(next_page, 'jump') }} on_toggle_debug={() => set_debug_visible((v) => !v)} />
              {debug_visible ? (
                <div style={{ borderTop: '1px solid var(--ui_border)', padding: '10px 16px', backgroundColor: 'var(--ui_panel_alt)', maxHeight: '160px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '6px' }}>debug: kb_id={active_kb_id || '-'} page={file_current_page} page_size={file_page_size} total={file_total} items={display_files.length}</div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--ui_text)', whiteSpace: 'pre-wrap' }}>{debug_messages.join('\n')}</div>
                </div>
              ) : null}
          </div>
        </div>
      </>
    )
  }

  const render_modals = () => (
    <>
      {moving_kb_id && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--ui_panel)', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)' }}>移动知识库</h3>
              <button type="button" onClick={() => set_moving_kb_id(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_text_muted)' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--ui_text)', marginBottom: '8px' }}>选择目标分类</label>
              <select value={target_cat_id} onChange={(e) => set_target_cat_id(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', fontSize: '14px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }}>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => set_moving_kb_id(null)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--ui_border)', color: 'var(--ui_text_muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button type="button" onClick={confirm_move_kb} style={{ padding: '8px 16px', backgroundColor: 'var(--ui_accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>确认移动</button>
            </div>
          </div>
        </div>
      )}
      {show_cat_modal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--ui_panel)', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)' }}>新建目录分类</h3>
              <button type="button" onClick={() => set_show_cat_modal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_text_muted)' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input autoFocus placeholder="请输入目录名称..." aria-label="目录名称" title="目录名称" value={new_cat_name} onChange={e => set_new_cat_name(e.target.value.slice(0, 4))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', fontSize: '14px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }} onFocus={e => e.target.style.borderColor = 'var(--ui_accent)'} onBlur={e => e.target.style.borderColor = 'var(--ui_border)'} maxLength={4} />
              <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginTop: '6px' }}>提示: 名称不超过4个汉字或字符</div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: new_cat_name.length >= 4 ? 'var(--ui_danger)' : 'var(--ui_text_muted)', marginTop: '4px' }}>{new_cat_name.length}/4</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => { set_show_cat_modal(false); set_new_cat_name('') }} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--ui_border)', color: 'var(--ui_text_muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button type="button" onClick={handle_create_cat} style={{ padding: '8px 16px', backgroundColor: 'var(--ui_accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>确认创建</button>
            </div>
          </div>
        </div>
      )}
      {show_create_modal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--ui_panel)', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)' }}>新建知识库 (所属: {active_cat?.name})</h3>
              <button type="button" onClick={() => set_show_create_modal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ui_text_muted)' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input autoFocus placeholder="请输入知识库名称..." aria-label="知识库名称" title="知识库名称" value={new_kb_name} onChange={e => set_new_kb_name(e.target.value.slice(0, 4))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ui_border)', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', fontSize: '14px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)' }} onFocus={e => e.target.style.borderColor = 'var(--ui_accent)'} onBlur={e => e.target.style.borderColor = 'var(--ui_border)'} maxLength={4} />
              <div style={{ fontSize: '12px', color: 'var(--ui_text_muted)', marginTop: '6px' }}>提示: 名称不超过4个汉字或字符</div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: new_kb_name.length >= 4 ? 'var(--ui_danger)' : 'var(--ui_text_muted)', marginTop: '4px' }}>{new_kb_name.length}/4</div>
            </div>
            {create_kb_error && <div style={{ color: 'var(--ui_danger)', fontSize: '12px', marginBottom: '12px' }}>{create_kb_error}</div>}
            {creating_kb && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ui_text_muted)', marginBottom: '12px' }}><Loader2 size={14} className="anim_spin" />正在创建中...</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => { set_show_create_modal(false); set_new_kb_name(''); set_create_kb_error('') }} disabled={creating_kb} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--ui_border)', color: 'var(--ui_text_muted)', borderRadius: '6px', cursor: creating_kb ? 'not-allowed' : 'pointer', fontSize: '14px' }}>取消</button>
              <button type="button" onClick={handle_create_kb} disabled={creating_kb} style={{ padding: '8px 16px', backgroundColor: 'var(--ui_accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: creating_kb ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>{creating_kb && <Loader2 size={14} className="anim_spin" />}确认创建</button>
            </div>
          </div>
        </div>
      )}
      {show_custom_modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--ui_panel)', borderRadius: '12px', padding: '24px', width: '380px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <img src="kity.png" alt="Kity" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
              <h2 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)', fontWeight: 600 }}>{custom_modal_title}</h2>
            </div>
            <div style={{ marginBottom: '24px' }}><p style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text_muted)', lineHeight: '1.6' }}>{custom_modal_message}</p></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {custom_modal_type === 'confirm' && <button onClick={() => set_show_custom_modal(false)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: '1px solid var(--ui_border)', borderRadius: '6px', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text_muted)', cursor: 'pointer' }}>取消</button>}
              <button onClick={() => { set_show_custom_modal(false); if (custom_modal_callback) custom_modal_callback() }} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '6px', backgroundColor: 'var(--ui_accent)', color: 'white', cursor: 'pointer' }}>{custom_modal_type === 'confirm' ? '确认' : '确定'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  useEffect(() => {
    const load_remote = async () => {
      set_kb_loading(true)
      set_kb_error('')
      if (!window.electron_api?.kb_list_categories || !window.electron_api?.kb_list_indices) { set_kb_error('当前客户端版本不支持拉取知识库列表'); set_kb_loading(false); return }
      try {
        const [cat_res, idx_res] = await Promise.all([window.electron_api.kb_list_categories(), window.electron_api.kb_list_indices()])
        if (!cat_res.success) { set_kb_error(cat_res.error || '获取知识库分类失败'); set_kb_loading(false); return }
        if (!idx_res.success) { set_kb_error(idx_res.error || '获取知识库列表失败'); set_kb_loading(false); return }
        const cat_source = cat_res.data?.data?.items || cat_res.data?.items || cat_res.data?.data || cat_res.data || []
        const cat_items: any[] = Array.isArray(cat_source) ? cat_source : []
        const mapped_categories: KbCategory[] = cat_items.map((it) => ({ id: String(it.category_id || it.categoryId || it.CategoryId || it.id || it.Id || ''), name: String(it.category_name || it.categoryName || it.CategoryName || it.name || it.Name || '') })).filter((c) => c.id && c.name)
        const ensured_categories = mapped_categories.length > 0 ? mapped_categories : [{ id: 'default', name: '默认' }]
        let default_cat = ensured_categories.find(c => c.name === '默认' || c.name === '默认类目')
        if (!default_cat) { default_cat = { id: 'default', name: '默认类目' }; ensured_categories.unshift(default_cat) } else { default_cat.name = '默认类目' }
        const final_categories = ensured_categories.filter(c => !c.name.startsWith('trai_demo_cat'))
        set_categories(final_categories)
        set_active_cat_id((prev) => prev || default_cat.id)
        const idx_source = idx_res.data?.data?.items || idx_res.data?.items || idx_res.data?.data || idx_res.data || []
        const idx_items: any[] = Array.isArray(idx_source) ? idx_source : []
        const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const cat_id_for_kb = default_cat.id
        const mapped_kbs: KnowledgeBase[] = idx_items.map((it) => ({ id: String(it.index_id || it.indexId || it.IndexId || it.id || it.Id || ''), category_id: cat_id_for_kb, name: String(it.index_name || it.indexName || it.IndexName || it.name || it.Name || ''), file_count: Number(it.file_count || it.fileCount || it.DocumentCount || it.document_count || it.documentCount || 0), created_at: String(it.created_at || it.gmtCreate || it.GmtCreate || it.createTime || now_str) })).filter((kb) => kb.id && kb.name)
        set_kb_list(mapped_kbs)
        set_active_kb_id((prev) => prev || (mapped_kbs[0]?.id || ''))
      } catch (err: any) { set_kb_error(err?.message || '加载知识库失败') } finally { set_kb_loading(false) }
    }
    void load_remote()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_panel)', position: 'relative', minHeight: 0 }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>知识库管理</span>
        </div>
      </div>
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {render_left_sidebar()}
        {render_middle_sidebar()}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>{render_right_content()}</div>
      </div>
      {render_modals()}
    </div>
  )
}

export default KnowledgeBasePage
