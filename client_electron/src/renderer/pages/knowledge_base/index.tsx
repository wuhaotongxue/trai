/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 15:30:00
 * 描述: 专属知识库管理页面，支持新建知识库与上传文件 (三段式折叠布局)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Database, Plus, UploadCloud, FileText, X, Search, Loader2, Trash2, Folder, PanelLeftClose, PanelLeft, Edit2, FolderInput, BookOpen } from 'lucide-react'

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
  const [categories, set_categories] = useState<KbCategory[]>([])
  const [active_cat_id, set_active_cat_id] = useState<string>('')

  const [kb_list, set_kb_list] = useState<KnowledgeBase[]>([])
  const [active_kb_id, set_active_kb_id] = useState<string>('')

  const [files, set_files] = useState<KbFile[]>([])
  
  // UI 折叠状态
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  
  // 弹窗与表单状态
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
  
  // 文件操作状态
  const [editing_file_id, set_editing_file_id] = useState<string | null>(null)
  const [edit_file_name, set_edit_file_name] = useState('')
  const [moving_file_id, set_moving_file_id] = useState<string | null>(null)
  const [target_move_kb_id, set_target_move_kb_id] = useState('')
  
  // 知识库操作状态
  const [editing_kb_id, set_editing_kb_id] = useState<string | null>(null)
  const [edit_kb_name, set_edit_kb_name] = useState('')
  const [moving_kb_id, set_moving_kb_id] = useState<string | null>(null)
  const [target_move_cat_id, set_target_move_cat_id] = useState('')

  const file_input_ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load_remote = async () => {
      set_kb_loading(true)
      set_kb_error('')

      if (!window.electron_api?.kb_list_categories || !window.electron_api?.kb_list_indices) {
        set_kb_error('当前客户端版本不支持拉取知识库列表')
        set_kb_loading(false)
        return
      }

      try {
        const [cat_res, idx_res] = await Promise.all([
          window.electron_api.kb_list_categories(),
          window.electron_api.kb_list_indices()
        ])

        if (!cat_res.success) {
          set_kb_error(cat_res.error || '获取知识库分类失败')
          set_kb_loading(false)
          return
        }
        if (!idx_res.success) {
          set_kb_error(idx_res.error || '获取知识库列表失败')
          set_kb_loading(false)
          return
        }

        const cat_source = cat_res.data?.data?.items || cat_res.data?.items || cat_res.data?.data || cat_res.data || []
        const cat_items: any[] = Array.isArray(cat_source) ? cat_source : []
        const mapped_categories: KbCategory[] = cat_items
          .map((it) => ({
            id: String(it.category_id || it.categoryId || it.CategoryId || it.id || it.Id || ''),
            name: String(it.category_name || it.categoryName || it.CategoryName || it.name || it.Name || '')
          }))
          .filter((c) => c.id && c.name)

        const ensured_categories =
          mapped_categories.length > 0 ? mapped_categories : [{ id: 'default', name: '默认类目' }]
        
        let default_cat = ensured_categories.find(c => c.name === '默认' || c.name === '默认类目')
        if (!default_cat) {
          default_cat = { id: 'default', name: '默认类目' }
          ensured_categories.unshift(default_cat)
        }

        set_categories(ensured_categories)
        set_active_cat_id((prev) => prev || default_cat.id)

        const idx_source = idx_res.data?.data?.items || idx_res.data?.items || idx_res.data?.data || idx_res.data || []
        const idx_items: any[] = Array.isArray(idx_source) ? idx_source : []
        const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const cat_id_for_kb = default_cat.id
        const mapped_kbs: KnowledgeBase[] = idx_items
          .map((it) => ({
            id: String(it.index_id || it.indexId || it.IndexId || it.id || it.Id || ''),
            category_id: cat_id_for_kb,
            name: String(it.index_name || it.indexName || it.IndexName || it.name || it.Name || ''),
            file_count: Number(it.file_count || it.fileCount || it.DocumentCount || it.document_count || it.documentCount || 0),
            created_at: String(it.created_at || it.gmtCreate || it.GmtCreate || it.createTime || now_str)
          }))
          .filter((kb) => kb.id && kb.name)

        set_kb_list(mapped_kbs)
        set_active_kb_id((prev) => prev || (mapped_kbs[0]?.id || ''))
      } catch (err: any) {
        set_kb_error(err?.message || '加载知识库失败')
      } finally {
        set_kb_loading(false)
      }
    }

    void load_remote()
  }, [])

  useEffect(() => {
    const load_files = async () => {
      if (!active_kb_id) return
      if (!window.electron_api?.kb_list_index_files) return

      set_files_loading(true)
      set_files_error('')

      try {
        const res = await window.electron_api.kb_list_index_files(active_kb_id)
        if (!res.success) {
          set_files_error(res.error || '获取知识库文件失败')
          return
        }

        const items_source = res.data?.data?.items || res.data?.items || res.data?.data || res.data || []
        const items: any[] = Array.isArray(items_source) ? items_source : []
        const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const mapped_files: KbFile[] = items
          .map((it) => {
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
          })
          .filter((f) => f.id && f.name)

        set_files(mapped_files)
        set_kb_list((prev) => prev.map((kb) => kb.id === active_kb_id ? { ...kb, file_count: mapped_files.length } : kb))
      } catch (err: any) {
        set_files_error(err?.message || '获取知识库文件失败')
      } finally {
        set_files_loading(false)
      }
    }

    void load_files()
  }, [active_kb_id])

  // -- Handlers --
  const handle_create_cat = () => {
    if (!new_cat_name.trim()) return
    const new_cat: KbCategory = {
      id: `cat_${Date.now()}`,
      name: new_cat_name.trim()
    }
    set_categories((prev) => [...prev, new_cat])
    set_active_cat_id(new_cat.id)
    set_show_cat_modal(false)
    set_new_cat_name('')
  }

  const handle_create_kb = async () => {
    const name = new_kb_name.trim()
    const create_cat_id = active_cat_id || categories[0]?.id || 'default'
    if (!name || !create_cat_id) return
    if (!window.electron_api.kb_demo_create) {
      set_create_kb_error('当前客户端版本不支持创建知识库')
      return
    }

    set_create_kb_error('')
    set_creating_kb(true)

    try {
      const res = await window.electron_api.kb_demo_create({ index_name: name })
      if (!res.success || !res.data) {
        set_create_kb_error(res.error || '创建失败, 请检查服务器配置')
        return
      }

      const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const actual_data = res.data.data || res.data
      const new_kb: KnowledgeBase = {
        id: actual_data.index_id,
        category_id: create_cat_id,
        name: actual_data.index_name || name,
        file_count: 1,
        created_at: now_str
      }

      const new_file: KbFile = {
        id: actual_data.file_id,
        kb_id: actual_data.index_id,
        name: actual_data.file_name,
        size: '-',
        upload_time: now_str,
        status: actual_data.job_status === 'FAILED' ? 'error' : 'success'
      }

      set_kb_list((prev) => [new_kb, ...prev])
      set_files((prev) => [new_file, ...prev])
      set_active_kb_id(new_kb.id)
      set_show_create_modal(false)
      set_new_kb_name('')
    } finally {
      set_creating_kb(false)
    }
  }

  const handle_file_upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected_files = Array.from(e.target.files || [])
    if (selected_files.length === 0 || !active_kb_id) return
    if (!window.electron_api?.kb_upload_text) {
      alert('当前客户端版本不支持上传文件')
      return
    }
    
    for (const file of selected_files) {
      const temp_id = `uploading_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      const now_str = new Date().toISOString().slice(0, 16).replace('T', ' ')
      
      const new_f: KbFile = {
        id: temp_id,
        kb_id: active_kb_id,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        upload_time: now_str,
        status: 'uploading'
      }
      
      // 先把文件状态设置为 uploading 并展示在列表中
      set_files(prev => [new_f, ...prev])

      try {
        const content = await file.text()
        const res = await window.electron_api.kb_upload_text(active_kb_id, file.name, content)
        if (res.success) {
          const real_id = res.data?.file_id || res.data?.data?.file_id || temp_id
          
          set_files(prev => prev.map(f => 
            f.id === temp_id ? { ...f, id: real_id, status: 'success' } : f
          ))
          
          set_kb_list(prev => prev.map(kb => 
            kb.id === active_kb_id ? { ...kb, file_count: kb.file_count + 1 } : kb
          ))
        } else {
          set_files(prev => prev.map(f => 
            f.id === temp_id ? { ...f, status: 'error' } : f
          ))
          alert(`上传 ${file.name} 失败: ${res.error}`)
        }
      } catch (err: any) {
        set_files(prev => prev.map(f => 
          f.id === temp_id ? { ...f, status: 'error' } : f
        ))
        alert(`读取/上传文件 ${file.name} 失败: ${err.message}`)
      }
    }
    
    if (e.target) e.target.value = ''
  }

  const handle_delete_file = async (file_id: string) => {
    if (!active_kb_id || !window.electron_api?.kb_delete_index_file) return
    if (!confirm('确定要删除该文件吗？')) return
    
    try {
      const res = await window.electron_api.kb_delete_index_file(active_kb_id, file_id)
      if (res.success) {
        set_files(prev => prev.filter(f => f.id !== file_id))
        set_kb_list(prev => prev.map(kb => 
          kb.id === active_kb_id ? { ...kb, file_count: Math.max(0, kb.file_count - 1) } : kb
        ))
      } else {
        alert(`删除失败: ${res.error}`)
      }
    } catch (e: any) {
      alert(`删除异常: ${e.message}`)
    }
  }

  const handle_rename_file = (file_id: string) => {
    if (!edit_file_name.trim()) return
    set_files(prev => prev.map(f => 
      f.id === file_id ? { ...f, name: edit_file_name.trim() } : f
    ))
    set_editing_file_id(null)
    set_edit_file_name('')
    alert('重命名成功')
  }

  const handle_move_file = (file_id: string) => {
    alert('暂不支持通过 API 移动文件到其他知识库')
    set_moving_file_id(null)
    set_target_move_kb_id('')
  }

  const handle_rename_kb = async (kb_id: string) => {
    if (!edit_kb_name.trim()) return
    if (!window.electron_api?.kb_rename_index) return
    try {
      const res = await window.electron_api.kb_rename_index(kb_id, edit_kb_name.trim())
      if (res.success) {
        set_kb_list(prev => prev.map(kb => 
          kb.id === kb_id ? { ...kb, name: edit_kb_name.trim() } : kb
        ))
        set_editing_kb_id(null)
        set_edit_kb_name('')
      } else {
        alert(`重命名失败: ${res.error}`)
      }
    } catch (e: any) {
      alert(`重命名异常: ${e.message}`)
    }
  }

  const handle_delete_kb = async (kb_id: string) => {
    if (!window.electron_api?.kb_delete_index) return
    if (!confirm('确定要删除该知识库吗？')) return
    try {
      const res = await window.electron_api.kb_delete_index(kb_id)
      if (res.success) {
        set_kb_list(prev => prev.filter(k => k.id !== kb_id))
        if (active_kb_id === kb_id) set_active_kb_id('')
      } else {
        alert(`删除知识库失败: ${res.error}`)
      }
    } catch (e: any) {
      alert(`删除异常: ${e.message}`)
    }
  }

  const handle_move_kb = (kb_id: string) => {
    alert('暂不支持通过 API 移动知识库到其他分类')
    set_moving_kb_id(null)
    set_target_move_cat_id('')
  }

  const active_cat = useMemo(() => categories.find(c => c.id === active_cat_id), [categories, active_cat_id])
  const active_kb = useMemo(() => kb_list.find(kb => kb.id === active_kb_id), [kb_list, active_kb_id])
  const current_cat_kbs = useMemo(() => {
    if (!active_cat_id) return kb_list
    return kb_list.filter(kb => kb.category_id === active_cat_id)
  }, [kb_list, active_cat_id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>知识库管理</h1>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧边栏：一级目录 */}
        <div style={{ 
          width: is_left_sidebar_open ? '200px' : '0px', 
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#f1f5f9', 
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '200px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>目录分类</span>
            <button
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起分类栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => {
                  set_active_cat_id(cat.id)
                  const first_kb = kb_list.find(k => k.category_id === cat.id)
                  if (first_kb) set_active_kb_id(first_kb.id)
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: active_cat_id === cat.id ? '#e0f2fe' : 'transparent',
                  color: active_cat_id === cat.id ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: active_cat_id === cat.id ? 600 : 400,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = '#e2e8f0'
                }}
                onMouseLeave={(e) => {
                  if (active_cat_id !== cat.id) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Folder size={16} />
                {cat.name}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', minWidth: '200px', boxSizing: 'border-box' }}>
            <button
              onClick={() => set_show_cat_modal(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', backgroundColor: 'transparent', color: '#0ea5e9', border: '1px dashed #0ea5e9',
                borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={14} /> 新建分类
            </button>
          </div>
        </div>

        {/* 中间边栏：子文件夹 (知识库) */}
        <div style={{ 
          width: is_middle_sidebar_open ? '240px' : '0px', 
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff', 
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '240px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{active_cat?.name || '子文件夹'}</span>
            </div>
            <button
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起知识库列表"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '240px', boxSizing: 'border-box' }}>
            {current_cat_kbs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>当前分类暂无子知识库</div>
            ) : (
              current_cat_kbs.map(kb => (
                <div 
                  key={kb.id}
                  onClick={() => set_active_kb_id(kb.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: active_kb_id === kb.id ? '#f1f5f9' : 'transparent',
                    border: `1px solid ${active_kb_id === kb.id ? '#e2e8f0' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (active_kb_id !== kb.id) e.currentTarget.style.backgroundColor = '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    if (active_kb_id !== kb.id) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={14} color={active_kb_id === kb.id ? '#0ea5e9' : '#64748b'} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: active_kb_id === kb.id ? '#0f172a' : '#334155' }}>
                        {kb.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px' }}>
                      {kb.file_count}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '20px' }}>{kb.created_at}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', minWidth: '240px', boxSizing: 'border-box' }}>
            <button
              onClick={() => set_show_create_modal(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px', transition: 'background-color 0.2s'
              }}
            >
              <Plus size={16} /> 新建知识库
            </button>
          </div>
        </div>

        {/* 右侧主区：文件管理 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {active_kb ? (
            <>
              <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {(!is_left_sidebar_open || !is_middle_sidebar_open) && (
                    <button
                      onClick={() => {
                        set_is_left_sidebar_open(true)
                        set_is_middle_sidebar_open(true)
                      }}
                      title="展开全部侧边栏"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <PanelLeft size={20} />
                    </button>
                  )}
                  {editing_kb_id === active_kb.id ? (
                    <input 
                      autoFocus value={edit_kb_name} onChange={(e) => set_edit_kb_name(e.target.value)}
                      onBlur={() => handle_rename_kb(active_kb.id)} onKeyDown={(e) => e.key === 'Enter' && handle_rename_kb(active_kb.id)}
                      style={{ fontSize: '18px', color: '#0f172a', fontWeight: 600, padding: '4px 8px', border: '1px solid #0ea5e9', borderRadius: '6px', outline: 'none', width: '240px' }}
                    />
                  ) : (
                    <>
                      <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 600 }}>{active_kb.name}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                        <button onClick={() => { set_editing_kb_id(active_kb.id); set_edit_kb_name(active_kb.name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="重命名知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit2 size={16} />重命名</button>
                        <button onClick={() => { alert('暂不支持移动知识库') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="移动知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><FolderInput size={16} />移动</button>
                        <button onClick={() => handle_delete_kb(active_kb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="删除知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={16} />删除</button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      placeholder="搜索文件..." 
                      value={search_query}
                      onChange={e => set_search_query(e.target.value)}
                      style={{ padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', fontSize: '13px', width: '200px' }}
                    />
                  </div>
                  <input type="file" multiple ref={file_input_ref} onChange={handle_file_upload} style={{ display: 'none' }} />
                  <button
                    onClick={() => file_input_ref.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                      backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 500
                    }}
                  >
                    <UploadCloud size={16} /> 上传文件
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {files.filter(f => f.kb_id === active_kb_id).length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <Database size={32} color="#cbd5e1" />
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '8px' }}>该知识库暂无文件</p>
                    <p style={{ fontSize: '13px', color: '#cbd5e1' }}>点击右上角上传文件，支持 PDF、Word、TXT 等格式</p>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b' }}>文件名称</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '120px' }}>大小</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '160px' }}>上传时间</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '100px' }}>状态</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '180px' }}>重命名&nbsp;&nbsp;&nbsp;&nbsp;移动</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '80px', textAlign: 'right' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.filter(f => f.kb_id === active_kb_id && f.name.toLowerCase().includes(search_query.toLowerCase())).map(file => (
                          <tr key={file.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} color="#0ea5e9" />
                                {editing_file_id === file.id ? (
                                  <input 
                                    autoFocus value={edit_file_name} onChange={(e) => set_edit_file_name(e.target.value)}
                                    onBlur={() => handle_rename_file(file.id)} onKeyDown={(e) => e.key === 'Enter' && handle_rename_file(file.id)}
                                    style={{ fontSize: '14px', color: '#334155', padding: '4px 8px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', width: '100%' }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '14px', color: '#334155', cursor: 'text' }} onDoubleClick={() => { set_editing_file_id(file.id); set_edit_file_name(file.name) }} title="双击重命名">{file.name}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{file.size}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{file.upload_time}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {file.status === 'success' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '12px' }}>已解析</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0ea5e9', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}><Loader2 size={12} className="animate-spin" />上传中</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginLeft: '12px' }}>
                                <button onClick={() => { alert('暂不支持重命名文件') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} title="重命名" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit2 size={16} /></button>
                                <button onClick={() => { alert('暂不支持移动文件') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '4px' }} title="移动到..." onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><FolderInput size={16} /></button>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button onClick={() => handle_delete_file(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '4px' }} title="删除" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              请在左侧选择或新建知识库
            </div>
          )}
        </div>
        
        {/* 移动文件弹窗 */}
        {moving_file_id && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>移动文件到...</h3>
                <button onClick={() => { set_moving_file_id(null); set_target_move_kb_id('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                {categories.map(cat => (
                  <div key={`move_cat_${cat.id}`}>
                    <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{cat.name}</div>
                    {kb_list.filter(kb => kb.category_id === cat.id).map(kb => (
                      <div 
                        key={`move_kb_${kb.id}`} onClick={() => set_target_move_kb_id(kb.id)}
                        style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: kb.id === active_kb_id ? 'not-allowed' : 'pointer', backgroundColor: target_move_kb_id === kb.id ? '#e0f2fe' : 'transparent', opacity: kb.id === active_kb_id ? 0.5 : 1, borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => { if (target_move_kb_id !== kb.id && kb.id !== active_kb_id) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                        onMouseLeave={(e) => { if (target_move_kb_id !== kb.id && kb.id !== active_kb_id) e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <span style={{ fontSize: '13px', color: target_move_kb_id === kb.id ? '#0369a1' : '#334155' }}>{kb.name} {kb.id === active_kb_id && '(当前)'}</span>
                        {target_move_kb_id === kb.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => { set_moving_file_id(null); set_target_move_kb_id('') }} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
                <button onClick={() => handle_move_file(moving_file_id)} disabled={!target_move_kb_id || target_move_kb_id === active_kb_id} style={{ padding: '8px 16px', backgroundColor: (!target_move_kb_id || target_move_kb_id === active_kb_id) ? '#cbd5e1' : '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: (!target_move_kb_id || target_move_kb_id === active_kb_id) ? 'not-allowed' : 'pointer', fontSize: '14px' }}>确认移动</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 移动知识库弹窗 */}
      {moving_kb_id && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>移动知识库到...</h3>
              <button onClick={() => { set_moving_kb_id(null); set_target_move_cat_id('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              {categories.map(cat => (
                <div 
                  key={`move_kb_cat_${cat.id}`} onClick={() => set_target_move_cat_id(cat.id)}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: cat.id === active_cat_id ? 'not-allowed' : 'pointer', backgroundColor: target_move_cat_id === cat.id ? '#e0f2fe' : 'transparent', opacity: cat.id === active_cat_id ? 0.5 : 1, borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => { if (target_move_cat_id !== cat.id && cat.id !== active_cat_id) e.currentTarget.style.backgroundColor = '#f8fafc' }}
                  onMouseLeave={(e) => { if (target_move_cat_id !== cat.id && cat.id !== active_cat_id) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={16} color={target_move_cat_id === cat.id ? '#0369a1' : '#64748b'} />
                    <span style={{ fontSize: '13px', color: target_move_cat_id === cat.id ? '#0369a1' : '#334155', fontWeight: target_move_cat_id === cat.id ? 600 : 400 }}>{cat.name} {cat.id === active_cat_id && '(当前)'}</span>
                  </div>
                  {target_move_cat_id === cat.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { set_moving_kb_id(null); set_target_move_cat_id('') }} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button onClick={() => handle_move_kb(moving_kb_id)} disabled={!target_move_cat_id || target_move_cat_id === active_cat_id} style={{ padding: '8px 16px', backgroundColor: (!target_move_cat_id || target_move_cat_id === active_cat_id) ? '#cbd5e1' : '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: (!target_move_cat_id || target_move_cat_id === active_cat_id) ? 'not-allowed' : 'pointer', fontSize: '14px' }}>确认移动</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建目录弹窗 */}
      {show_cat_modal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>新建目录分类</h3>
              <button onClick={() => set_show_cat_modal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <input autoFocus placeholder="请输入目录名称..." value={new_cat_name} onChange={e => set_new_cat_name(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px', fontSize: '14px' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { set_show_cat_modal(false); set_new_cat_name('') }} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button onClick={handle_create_cat} style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>确认创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 新建子知识库弹窗 */}
      {show_create_modal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>新建知识库 (所属: {active_cat?.name})</h3>
              <button onClick={() => set_show_create_modal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <input autoFocus placeholder="请输入知识库名称..." value={new_kb_name} onChange={e => set_new_kb_name(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px', fontSize: '14px' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            {create_kb_error && <div style={{ color: '#e51400', fontSize: '12px', marginBottom: '12px' }}>{create_kb_error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => { set_show_create_modal(false); set_new_kb_name(''); set_create_kb_error('') }}
                disabled={creating_kb}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: creating_kb ? 'not-allowed' : 'pointer', fontSize: '14px' }}
              >
                取消
              </button>
              <button
                onClick={handle_create_kb}
                disabled={creating_kb}
                style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: creating_kb ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {creating_kb && <Loader2 size={14} className="animate-spin" />}
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBasePage
