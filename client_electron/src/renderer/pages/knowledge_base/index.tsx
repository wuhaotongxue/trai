/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 15:30:00
 * 描述: 专属知识库管理页面, 支持新建知识库与上传文件 (三段式折叠布局)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Database, Plus, UploadCloud, FileText, X, Search, Loader2, Trash2, Folder, PanelLeftClose, PanelLeftOpen, List, Edit2, FolderInput, BookOpen, RotateCw } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
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
  const [file_page, set_file_page] = useState(1)
  const [file_page_size, set_file_page_size] = useState(10)
  const [file_total, set_file_total] = useState(0)
  const [jump_page_input, set_jump_page_input] = useState('')
  const [page_action, set_page_action] = useState<'prev' | 'next' | 'jump' | 'refresh' | 'init' | null>(null)
  const [debug_visible, set_debug_visible] = useState(false)
  const [debug_messages, set_debug_messages] = useState<string[]>([])
  
  // 自定义弹框状态
  const [show_custom_modal, set_show_custom_modal] = useState(false)
  const [custom_modal_type, set_custom_modal_type] = useState<'alert' | 'confirm'>('alert')
  const [custom_modal_title, set_custom_modal_title] = useState('')
  const [custom_modal_message, set_custom_modal_message] = useState('')
  const [custom_modal_callback, set_custom_modal_callback] = useState<(() => void) | null>(null)
  
  // 知识库操作状态
  const [editing_kb_id, set_editing_kb_id] = useState<string | null>(null)
  const [edit_kb_name, set_edit_kb_name] = useState('')
  const [moving_kb_id, set_moving_kb_id] = useState<string | null>(null)
  const [target_cat_id, set_target_cat_id] = useState<string>('')
  
  // 分类操作状态
  const [editing_cat_id, set_editing_cat_id] = useState<string | null>(null)
  const [edit_cat_name, set_edit_cat_name] = useState('')

  const file_input_ref = useRef<HTMLInputElement>(null)
  
  // 自定义弹框辅助函数
  const show_alert = (title: string, message: string) => {
    set_custom_modal_title(title)
    set_custom_modal_message(message)
    set_custom_modal_type('alert')
    set_custom_modal_callback(null)
    set_show_custom_modal(true)
  }
  
  const show_confirm = (title: string, message: string, callback: () => void) => {
    set_custom_modal_title(title)
    set_custom_modal_message(message)
    set_custom_modal_type('confirm')
    set_custom_modal_callback(() => callback)
    set_show_custom_modal(true)
  }

  const display_files = useMemo(() => {
    const q = search_query.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, search_query])

  useEffect(() => {
    set_file_page(1)
  }, [active_kb_id])

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

  useEffect(() => {
    set_jump_page_input(String(file_current_page))
  }, [file_current_page])

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

        // 过滤掉测试期间残留的名为 "trai_demo_cat" 开头的分类
        const final_categories = ensured_categories.filter(c => !c.name.startsWith('trai_demo_cat'))

        set_categories(final_categories)
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

  /**
   * 拉取指定页的知识库文件列表.
   *
   * 用途:
   * - 驱动文件表格展示, 支持分页与每页数量切换
   * - 同步维护 total, 当前页码与知识库 file_count, 便于分页 UI 计算
   *
   * 参数:
   * - target_page: 目标页码, 从 1 开始
   * - page_size_override: 可选, 本次请求临时覆盖 page_size, 用于切换每页数量时立即生效
   *
   * 返回:
   * - Promise<void>
   *
   * 异常:
   * - 不抛出异常到调用方, 统一转为 files_error 与 debug 输出
   */
  const fetch_files_page = async (target_page: number, page_size_override?: number) => {
    if (!active_kb_id) return
    if (!window.electron_api?.kb_list_index_files) return

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
      console.info('[kb_files] request', { kb_id: active_kb_id, page, page_size: effective_page_size })

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
      const total_candidate =
        typeof total_source === 'number'
          ? total_source
          : typeof total_source === 'string' && total_source.trim() && !Number.isNaN(Number(total_source))
            ? Number(total_source)
            : 0
      const total =
        Math.max(
          total_candidate,
          typeof fallback_total_from_kb === 'number' ? fallback_total_from_kb : 0,
          file_total,
          items.length
        ) || items.length

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
      set_file_total(total)
      set_file_page(page)
      set_kb_list((prev) => prev.map((kb) => kb.id === active_kb_id ? { ...kb, file_count: total } : kb))
      append_debug(
        `response page=${page} items=${mapped_files.length} total=${total} raw_total=${String(total_source)} kb_total=${String(fallback_total_from_kb)} first=${mapped_files[0]?.name || '-'}`
      )
      console.info('[kb_files] response', {
        kb_id: active_kb_id,
        page,
        items: mapped_files.length,
        total,
        raw_total: total_source,
        kb_total: fallback_total_from_kb,
        first: mapped_files[0]?.name || ''
      })
    } catch (err: any) {
      set_files_error(err?.message || '获取知识库文件失败')
      append_debug(`exception page=${page} msg=${String(err?.message || err)}`)
      console.info('[kb_files] exception', { kb_id: active_kb_id, page, error: err })
    } finally {
      set_files_loading(false)
    }
  }

  /**
   * 发起分页动作请求并维护加载态.
   *
   * 用途:
   * - 将上一页, 下一页, 跳转, 刷新等动作统一封装
   * - 控制 files_loading 与 page_action, 防止重复触发导致 UI 抖动或并发请求
   *
   * 参数:
   * - target_page: 目标页码
   * - action: 动作来源, 用于 UI 展示与调试
   * - page_size_override: 可选, 本次请求临时覆盖 page_size
   *
   * 返回:
   * - Promise<void>
   */
  const request_files_page = async (
    target_page: number,
    action: 'prev' | 'next' | 'jump' | 'refresh' | 'init',
    page_size_override?: number
  ) => {
    if (files_loading) return
    set_page_action(action)
    try {
      await fetch_files_page(target_page, page_size_override)
    } finally {
      set_page_action(null)
    }
  }

  useEffect(() => {
    void request_files_page(1, 'init')
  }, [active_kb_id, file_page_size])

  /**
   * 刷新当前页文件列表.
   *
   * 返回:
   * - Promise<void>
   */
  const refresh_files = async () => {
    await request_files_page(file_current_page, 'refresh')
  }

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

      set_kb_list((prev) => [new_kb, ...prev])
      set_file_total(1)
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
      show_alert('提示', '当前客户端版本不支持上传文件')
      return
    }
    
    set_files_loading(true)
    try {
      for (const file of selected_files) {
        // 读取文件内容，对于文本文件用 text()，对于二进制文件用 base64 编码
        let content: string
        const ext = file.name.toLowerCase().split('.').pop() || ''
        const text_extensions = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm']
        
        if (text_extensions.includes(ext)) {
          // 文本文件直接读取文本
          content = await file.text()
        } else {
          // 二进制文件读取为 base64 编码
          const array_buffer = await file.arrayBuffer()
          const uint8_array = new Uint8Array(array_buffer)
          content = btoa(String.fromCharCode(...uint8_array))
        }
        
        const res = await window.electron_api.kb_upload_text(active_kb_id, file.name, content)
        if (!res.success) {
          show_alert('上传失败', `上传 ${file.name} 失败: ${res.error}`)
        }
      }
    } catch (err: any) {
      show_alert('上传失败', `读取/上传文件失败: ${err.message}`)
    } finally {
      set_files_loading(false)
      await fetch_files_page(1)
    }
    
    if (e.target) e.target.value = ''
  }

  const handle_delete_file = async (file_id: string) => {
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
        } else {
          show_alert('删除失败', `删除失败: ${res.error}`)
        }
      } catch (e: any) {
        show_alert('删除失败', `删除异常: ${e.message}`)
      }
    })
  }

  // (移除了暂不支持的重命名文件和移动文件的方法)

  const handle_rename_kb = async (kb_id: string) => {
    if (!edit_kb_name.trim()) return
    if (!window.electron_api?.kb_rename_index) return
    show_confirm('确认重命名', `确认将知识库重命名为 "${edit_kb_name.trim()}" 吗?`, async () => {
      try {
        const res = await window.electron_api.kb_rename_index(kb_id, edit_kb_name.trim())
        if (res.success) {
          set_kb_list(prev => prev.map(kb => 
            kb.id === kb_id ? { ...kb, name: edit_kb_name.trim() } : kb
          ))
          set_editing_kb_id(null)
          set_edit_kb_name('')
        } else {
          show_alert('重命名失败', `重命名失败: ${res.error}`)
        }
      } catch (e: any) {
        show_alert('重命名失败', `重命名异常: ${e.message}`)
      }
    })
  }

  const handle_delete_kb = async (kb_id: string) => {
    if (!window.electron_api?.kb_delete_index) return
    show_confirm('确认删除', '确认要删除该知识库吗? 此操作不可恢复!', async () => {
      try {
        const res = await window.electron_api.kb_delete_index(kb_id)
        if (res.success) {
          set_kb_list(prev => prev.filter(k => k.id !== kb_id))
          if (active_kb_id === kb_id) set_active_kb_id('')
        } else {
          show_alert('删除失败', `删除知识库失败: ${res.error}`)
        }
      } catch (e: any) {
        show_alert('删除失败', `删除异常: ${e.message}`)
      }
    })
  }

  const handle_move_kb = (kb_id: string) => {
    set_moving_kb_id(kb_id)
    const kb = kb_list.find(k => k.id === kb_id)
    if (kb) {
      set_target_cat_id(kb.category_id)
    }
  }

  const confirm_move_kb = () => {
    if (!moving_kb_id || !target_cat_id) return
    set_kb_list(prev => prev.map(kb => 
      kb.id === moving_kb_id ? { ...kb, category_id: target_cat_id } : kb
    ))
    set_moving_kb_id(null)
    set_target_cat_id('')
  }

  // 分类操作
  const handle_rename_cat = (cat_id: string) => {
    const cat = categories.find(c => c.id === cat_id)
    if (cat) {
      set_editing_cat_id(cat_id)
      set_edit_cat_name(cat.name)
    }
  }

  const confirm_rename_cat = () => {
    if (!editing_cat_id || !edit_cat_name.trim()) {
      set_editing_cat_id(null)
      return
    }
    set_categories(prev => prev.map(c => 
      c.id === editing_cat_id ? { ...c, name: edit_cat_name.trim() } : c
    ))
    set_editing_cat_id(null)
    set_edit_cat_name('')
  }

  const handle_delete_cat = (cat_id: string) => {
    // 检查是否是默认分类
    if (cat_id === 'default') {
      show_alert('无法删除', '默认分类不能删除')
      return
    }
    
    const cat = categories.find(c => c.id === cat_id)
    if (!cat) return
    
    const kbs_in_cat = kb_list.filter(k => k.category_id === cat_id)
    
    if (kbs_in_cat.length === 0) {
      // 没有知识库，直接删除
      show_confirm('删除分类', `确定要删除分类"${cat.name}"吗？`, () => {
        set_categories(prev => prev.filter(c => c.id !== cat_id))
        if (active_cat_id === cat_id) {
          set_active_cat_id('default')
        }
      })
    } else {
      // 有知识库，提示是否转移
      show_confirm(
        '删除分类', 
        `分类"${cat.name}"下有${kbs_in_cat.length}个知识库，删除分类会同时删除这些知识库。\n\n是否要先将这些知识库转移到默认分类？`,
        () => {
          // 用户确认，转移知识库到默认分类，然后删除分类
          set_kb_list(prev => prev.map(kb => 
            kb.category_id === cat_id ? { ...kb, category_id: 'default' } : kb
          ))
          set_categories(prev => prev.filter(c => c.id !== cat_id))
          if (active_cat_id === cat_id) {
            set_active_cat_id('default')
          }
        }
      )
    }
  }

  // (移除了暂不支持的移动知识库的方法)

  // 辅助函数：所有用户都不显示用户名前缀 (前缀仅用于后台权限区分)
  const get_display_name = (name: string) => {
    const parts = name.split('__');
    if (parts.length > 1) {
      return parts.slice(1).join('__');
    }
    return name;
  };
  
  // 当前活动分类
  const active_cat = useMemo(() => categories.find(c => c.id === active_cat_id), [categories, active_cat_id])
  // 当前活动知识库
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
        {/* 左侧边栏: 一级目录 */}
        <div style={{
          width: is_left_sidebar_open ? '18%' : '0px',
          minWidth: is_left_sidebar_open ? '100px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#f1f5f9',
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>知识分类</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起分类栏"
              aria-label="收起分类栏"
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
            {categories.map(cat => (
              <div 
                key={cat.id}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: active_cat_id === cat.id ? '#e0f2fe' : 'transparent',
                  color: active_cat_id === cat.id ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                {editing_cat_id === cat.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <Folder size={16} />
                    <input
                      autoFocus
                      value={edit_cat_name}
                      onChange={(e) => set_edit_cat_name(e.target.value)}
                      onBlur={confirm_rename_cat}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirm_rename_cat()
                        if (e.key === 'Escape') {
                          set_editing_cat_id(null)
                          set_edit_cat_name('')
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: '1px solid #0ea5e9',
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '13px',
                        minWidth: 0
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      flex: 1,
                      minWidth: 0
                    }}
                    onClick={() => {
                      set_active_cat_id(cat.id)
                      const first_kb = kb_list.find(k => k.category_id === cat.id)
                      if (first_kb) set_active_kb_id(first_kb.id)
                    }}
                  >
                    <Folder size={16} />
                    <span style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      minWidth: 0
                    }}>
                      {cat.name}
                    </span>
                  </div>
                )}
                
                {editing_cat_id !== cat.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: active_cat_id === cat.id ? 1 : 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = active_cat_id === cat.id ? '1' : '0'}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handle_rename_cat(cat.id)
                      }}
                      title="重命名分类"
                      aria-label="重命名分类"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#cbd5e1'
                        e.currentTarget.style.color = '#334155'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#64748b'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handle_delete_cat(cat.id)
                      }}
                      title="删除分类"
                      aria-label="删除分类"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#64748b'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', minWidth: '180px', boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => set_show_cat_modal(true)}
              aria-label="新建分类"
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

        {/* 中间边栏: 子文件夹 (知识库) */}
        <div style={{
          width: is_middle_sidebar_open ? '220px' : '0px',
          flexShrink: 1,
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff',
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开分类栏"
                  aria-label="展开分类栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{active_cat?.name || '知识库'}</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起知识库列表"
              aria-label="收起知识库列表"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                      <BookOpen size={14} color={active_kb_id === kb.id ? '#0ea5e9' : '#64748b'} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: active_kb_id === kb.id ? '#0f172a' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {get_display_name(kb.name)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '12px' }}>
                        {kb.file_count}
                      </span>
                      {active_cat_id !== 'default' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handle_move_kb(kb.id)
                            }}
                            title="移动"
                            aria-label="移动知识库"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FolderInput size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              set_editing_kb_id(kb.id)
                              set_edit_kb_name(get_display_name(kb.name))
                            }}
                            title="重命名"
                            aria-label="重命名知识库"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handle_delete_kb(kb.id)
                            }}
                            title="删除"
                            aria-label="删除知识库"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#ef4444', borderRadius: '4px', transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '20px' }}>{kb.created_at}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', minWidth: '200px', boxSizing: 'border-box' }}>
            <button
              type="button"
              onClick={() => set_show_create_modal(true)}
              aria-label="新建知识库"
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

        {/* 右侧主区: 文件管理 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {active_kb ? (
            <>
              <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                  {!is_middle_sidebar_open && (
                    <>
                      {!is_left_sidebar_open && (
                        <button
                          type="button"
                          onClick={() => set_is_left_sidebar_open(true)}
                          title="展开分类栏"
                          aria-label="展开分类栏"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s',
                            marginRight: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <PanelLeftOpen size={20} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => set_is_middle_sidebar_open(true)}
                        title="展开知识库列表"
                        aria-label="展开知识库列表"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#64748b', borderRadius: '6px', transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <List size={20} />
                      </button>
                    </>
                  )}
                  {editing_kb_id === active_kb.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <input 
                        aria-label="知识库名称"
                        title="知识库名称"
                        autoFocus value={edit_kb_name} onChange={(e) => set_edit_kb_name(e.target.value.slice(0, 15))}
                        onBlur={() => handle_rename_kb(active_kb.id)} onKeyDown={(e) => e.key === 'Enter' && handle_rename_kb(active_kb.id)}
                        style={{ fontSize: '18px', color: '#0f172a', fontWeight: 600, padding: '4px 8px', border: '1px solid #0ea5e9', borderRadius: '6px', outline: 'none', minWidth: '100px', flex: 1 }}
                        maxLength={15}
                      />
                      <div style={{ fontSize: '12px', color: edit_kb_name.length >= 15 ? '#ef4444' : '#94a3b8', whiteSpace: 'nowrap' }}>
                        {edit_kb_name.length}/15
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 600, minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{get_display_name(active_kb.name)}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => handle_move_kb(active_kb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="移动知识库" aria-label="移动知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><FolderInput size={16} />移动</button>
                        <button type="button" onClick={() => { set_editing_kb_id(active_kb.id); set_edit_kb_name(get_display_name(active_kb.name)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="重命名知识库" aria-label="重命名知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Edit2 size={16} />重命名</button>
                        <button type="button" onClick={() => handle_delete_kb(active_kb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} title="删除知识库" aria-label="删除知识库" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={16} />删除</button>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px', padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                          ID: {active_kb.id}
                        </span>
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
                      aria-label="搜索文件"
                      title="搜索文件"
                      value={search_query}
                      onChange={e => set_search_query(e.target.value)}
                      style={{ padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', fontSize: '13px', width: '200px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={refresh_files}
                    title="刷新文件列表"
                    aria-label="刷新文件列表"
                    disabled={files_loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      backgroundColor: 'transparent',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: files_loading ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!files_loading) e.currentTarget.style.backgroundColor = '#f1f5f9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <RotateCw size={16} className={files_loading ? 'animate-spin' : ''} />
                  </button>
                  <input type="file" multiple ref={file_input_ref} onChange={handle_file_upload} title="上传文件" aria-label="上传文件" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" style={{ display: 'none' }} />
                  <button
                    type="button"
                    onClick={() => file_input_ref.current?.click()}
                    aria-label="上传文件"
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

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', minHeight: 0 }}>
                {files_loading && display_files.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <Loader2 size={28} className="animate-spin" />
                    <div style={{ marginTop: '12px', fontSize: '13px' }}>正在加载中...</div>
                  </div>
                ) : display_files.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <Database size={32} color="#cbd5e1" />
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '8px' }}>该知识库暂无文件</p>
                    <p style={{ fontSize: '13px', color: '#cbd5e1' }}>点击右上角上传文件, 支持 PDF, Word, TXT 等格式</p>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b' }}>文件名称</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '120px' }}>大小</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '160px' }}>上传时间</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '100px' }}>状态</th>
                          <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#64748b', width: '80px', textAlign: 'right' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {display_files.map(file => (
                          <tr key={file.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} color="#0ea5e9" />
                                <span style={{ fontSize: '14px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
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
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => handle_delete_file(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '4px' }} title="删除" aria-label="删除文件" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                      {files_loading ? (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                            <Loader2 size={18} className="animate-spin" />
                            <div style={{ fontSize: '13px', color: '#334155' }}>正在加载中...</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          共 {file_total} 条
                        </div>
                        <button
                          type="button"
                          onClick={() => set_debug_visible((v) => !v)}
                          style={{
                            border: '1px solid #e2e8f0',
                            backgroundColor: debug_visible ? '#f1f5f9' : '#ffffff',
                            color: '#64748b',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          日志
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                          <span>每页</span>
                          <select
                            aria-label="每页数量"
                            title="每页数量"
                            value={file_page_size}
                            onChange={(e) => {
                              const next_size = Number(e.target.value)
                              set_file_page_size(next_size)
                              void request_files_page(1, 'init', next_size)
                            }}
                            disabled={files_loading}
                            className="kb_pagination_select"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => request_files_page(file_current_page - 1, 'prev')}
                          disabled={file_current_page <= 1 || files_loading}
                          className="kb_pagination_button"
                        >
                          上一页
                        </button>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          第 {file_current_page} / {file_total_pages} 页
                        </div>
                        <button
                          type="button"
                          onClick={() => request_files_page(file_current_page + 1, 'next')}
                          disabled={file_current_page >= file_total_pages || files_loading}
                          className="kb_pagination_button"
                        >
                          下一页
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>跳转</span>
                          <input
                            type="number"
                            aria-label="跳转页码"
                            title="跳转页码"
                            min={1}
                            max={file_total_pages}
                            value={jump_page_input}
                            onChange={(e) => set_jump_page_input(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter') return
                              const v = Number(jump_page_input)
                              if (!Number.isFinite(v)) return
                              const next_page = Math.min(Math.max(1, Math.trunc(v)), file_total_pages)
                              void request_files_page(next_page, 'jump')
                            }}
                            disabled={files_loading}
                            className="kb_pagination_input"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = Number(jump_page_input)
                              if (!Number.isFinite(v)) return
                              const next_page = Math.min(Math.max(1, Math.trunc(v)), file_total_pages)
                              void request_files_page(next_page, 'jump')
                            }}
                            disabled={files_loading}
                            className="kb_pagination_button"
                          >
                            {files_loading && page_action === 'jump' ? <Loader2 size={12} className="animate-spin" /> : null}
                            跳转
                          </button>
                        </div>
                      </div>
                    </div>
                    {debug_visible ? (
                      <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 16px', backgroundColor: '#f8fafc', maxHeight: '160px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                          debug: kb_id={active_kb_id || '-'} page={file_current_page} page_size={file_page_size} total={file_total} items={display_files.length}
                        </div>
                        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace', fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                          {debug_messages.join('\n')}
                        </div>
                      </div>
                    ) : null}
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
        
        {/* 移动文件弹窗 (已移除) */}
      </div>

      {/* 移动知识库弹窗 */}
      {moving_kb_id && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>移动知识库</h3>
              <button type="button" onClick={() => set_moving_kb_id(null)} title="关闭" aria-label="关闭" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>选择目标分类</label>
              <select 
                value={target_cat_id} 
                onChange={(e) => set_target_cat_id(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => set_moving_kb_id(null)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button type="button" onClick={confirm_move_kb} style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>确认移动</button>
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
              <button type="button" onClick={() => set_show_cat_modal(false)} title="关闭" aria-label="关闭" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <input autoFocus placeholder="请输入目录名称..." aria-label="目录名称" title="目录名称" value={new_cat_name} onChange={e => set_new_cat_name(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px', fontSize: '14px' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={() => { set_show_cat_modal(false); set_new_cat_name('') }} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>取消</button>
              <button type="button" onClick={handle_create_cat} style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>确认创建</button>
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
              <button type="button" onClick={() => set_show_create_modal(false)} title="关闭" aria-label="关闭" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input autoFocus placeholder="请输入知识库名称..." aria-label="知识库名称" title="知识库名称" value={new_kb_name} onChange={e => set_new_kb_name(e.target.value.slice(0, 15))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', fontSize: '14px' }} onFocus={e => e.target.style.borderColor = '#0ea5e9'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} maxLength={15} />
              <div style={{ textAlign: 'right', fontSize: '12px', color: new_kb_name.length >= 15 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>
                {new_kb_name.length}/15
              </div>
            </div>
            {create_kb_error && <div style={{ color: '#e51400', fontSize: '12px', marginBottom: '12px' }}>{create_kb_error}</div>}
            {creating_kb && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                <Loader2 size={14} className="animate-spin" />
                正在创建中...
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { set_show_create_modal(false); set_new_kb_name(''); set_create_kb_error('') }}
                disabled={creating_kb}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: creating_kb ? 'not-allowed' : 'pointer', fontSize: '14px' }}
              >
                取消
              </button>
              <button
                type="button"
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
      
      {/* 自定义弹框 */}
      {show_custom_modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '380px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <img src="kity.png" alt="Kity" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 600 }}>{custom_modal_title}</h2>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{custom_modal_message}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {custom_modal_type === 'confirm' && (
                <button
                  onClick={() => set_show_custom_modal(false)}
                  style={{
                    padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                    border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff',
                    color: '#475569', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  取消
                </button>
              )}
              <button
                onClick={() => {
                  set_show_custom_modal(false)
                  if (custom_modal_callback) custom_modal_callback()
                }}
                style={{
                  padding: '10px 20px', fontSize: '14px', fontWeight: 500,
                  border: 'none', borderRadius: '6px', backgroundColor: '#0ea5e9',
                  color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
              >
                {custom_modal_type === 'confirm' ? '确认' : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBasePage
