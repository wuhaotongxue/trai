/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-23 10:00:00
 * 描述: 媒体播放页面, 支持音乐和视频播放 - 三段式布局
 */
import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, FolderOpen, Music, Film, ChevronLeft, ChevronRight, Search, X, ChevronDown, ChevronRight as ChevronRightIcon, Folder, Rewind, FastForward } from 'lucide-react'
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'

/**
 * 媒体文件接口定义
 */
interface MediaFile {
  id: string
  name: string
  path: string
  type: 'audio' | 'video'
  duration?: number
  size?: string
}

/**
 * 文件夹接口定义
 */
interface FolderItem {
  id: string
  name: string
  path: string
  type: 'folder'
  children?: (MediaFile | FolderItem)[]
}

/**
 * 媒体播放页面组件
 */
const MediaPlayerPage: React.FC = () => {
  // 状态管理
  const [selected_files, set_selected_files] = useState<(MediaFile | FolderItem)[]>([])
  const [current_file_index, set_current_file_index] = useState<number>(-1)
  const [is_playing, set_is_playing] = useState<boolean>(false)
  const [current_time, set_current_time] = useState<number>(0)
  const [duration, set_duration] = useState<number>(0)
  const [volume, set_volume] = useState<number>(0.7)
  const [is_muted, set_is_muted] = useState<boolean>(false)
  const [is_fullscreen, set_is_fullscreen] = useState<boolean>(false)
  const [search_query, set_search_query] = useState<string>('')
  const [expanded_folders, set_expanded_folders] = useState<Set<string>>(new Set())
  
  // 引用
  const audio_ref = useRef<HTMLAudioElement>(null)
  const video_ref = useRef<HTMLVideoElement>(null)
  const player_ref = useRef<HTMLDivElement>(null)
  
  // 获取当前播放的文件
  const current_file = current_file_index >= 0 && current_file_index < selected_files.length 
    ? selected_files[current_file_index] 
    : null
  
  // 当文件变化时，处理播放逻辑
  useEffect(() => {
    if (current_file && current_file.type !== 'folder' && is_playing) {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.play().catch(err => console.error('音频播放失败:', err))
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.play().catch(err => console.error('视频播放失败:', err))
      }
    }
  }, [current_file, is_playing])
  
  // 处理文件选择
  const handle_select_files = async () => {
    try {
      const result = await window.electron_api.media_select_files()
      if (result.success && result.files) {
        const media_files: MediaFile[] = result.files.map((file: any, index: number) => {
          const is_audio = file.path.match(/\.(mp3|wav|flac|ogg|m4a)$/i)
          const is_video = file.path.match(/\.(mp4|avi|mov|wmv|mkv)$/i)
          
          if (is_audio || is_video) {
            return {
              id: `file_${index}_${Date.now()}`,
              name: file.name,
              path: file.path,
              type: is_audio ? 'audio' : 'video'
            }
          }
          return null
        }).filter((file): file is MediaFile => file !== null)
        
        set_selected_files(media_files)
        if (media_files.length > 0) {
          set_current_file_index(0)
          set_is_playing(true)
        }
      }
    } catch (error) {
      console.error('选择文件失败:', error)
    }
  }
  
  // 处理文件夹选择
  const handle_select_folder = async () => {
    try {
      const result = await window.electron_api.media_select_folder()
      if (result.success && result.files) {
        // 构建文件夹结构
        const build_folder_structure = (files: any[]) => {
          const root: FolderItem = {
            id: 'root',
            name: '根文件夹',
            path: '',
            type: 'folder',
            children: []
          }
          
          files.forEach((file, index) => {
            const parts = file.path.split('\\')
            let current = root
            
            for (let i = 0; i < parts.length - 1; i++) {
              const folder_name = parts[i]
              const folder_path = parts.slice(0, i + 1).join('\\')
              
              let folder = current.children?.find((item): item is FolderItem => 
                item.type === 'folder' && item.path === folder_path
              )
              
              if (!folder) {
                folder = {
                  id: `folder_${folder_path}_${Date.now()}`,
                  name: folder_name,
                  path: folder_path,
                  type: 'folder',
                  children: []
                }
                current.children?.push(folder)
              }
              
              current = folder
            }
            
            // 添加文件
            const is_audio = file.path.match(/\.(mp3|wav|flac|ogg|m4a)$/i)
            const is_video = file.path.match(/\.(mp4|avi|mov|wmv|mkv)$/i)
            
            if (is_audio || is_video) {
              const media_file: MediaFile = {
                id: `file_${index}_${Date.now()}`,
                name: file.name,
                path: file.path,
                type: is_audio ? 'audio' : 'video'
              }
              current.children?.push(media_file)
            }
          })
          
          return root.children || []
        }
        
        const folder_structure = build_folder_structure(result.files)
        set_selected_files(folder_structure)
        
        // 展开第一个文件夹
        if (folder_structure.length > 0 && folder_structure[0].type === 'folder') {
          set_expanded_folders(new Set([folder_structure[0].id]))
        }
      }
    } catch (error) {
      console.error('选择文件夹失败:', error)
    }
  }
  
  // 播放/暂停切换
  const handle_play_pause = () => {
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        if (is_playing) {
          audio_ref.current.pause()
        } else {
          audio_ref.current.play()
        }
      } else if (current_file.type === 'video' && video_ref.current) {
        if (is_playing) {
          video_ref.current.pause()
        } else {
          video_ref.current.play()
        }
      }
      set_is_playing(!is_playing)
    }
  }
  
  // 上一曲
  const handle_previous = () => {
    // 收集所有媒体文件
    const collect_media_files = (items: (MediaFile | FolderItem)[]): MediaFile[] => {
      let media_files: MediaFile[] = []
      for (const item of items) {
        if (item.type === 'folder' && item.children) {
          media_files = media_files.concat(collect_media_files(item.children))
        } else if (item.type !== 'folder') {
          media_files.push(item)
        }
      }
      return media_files
    }
    
    const media_files = collect_media_files(selected_files)
    if (media_files.length > 0) {
      // 找到当前文件在媒体文件列表中的索引
      const current_media_index = media_files.findIndex(file => file.id === current_file?.id)
      const new_index = (current_media_index - 1 + media_files.length) % media_files.length
      const new_file = media_files[new_index]
      
      // 找到新文件在原始列表中的索引
      const find_file_index = (items: (MediaFile | FolderItem)[], target_id: string): number => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.id === target_id) {
            return i
          }
          if (item.type === 'folder' && item.children) {
            const child_index = find_file_index(item.children, target_id)
            if (child_index !== -1) {
              return i
            }
          }
        }
        return -1
      }
      
      const original_index = find_file_index(selected_files, new_file.id)
      if (original_index !== -1) {
        set_current_file_index(original_index)
        set_is_playing(true)
        set_current_time(0)
      }
    }
  }
  
  // 下一曲
  const handle_next = () => {
    // 收集所有媒体文件
    const collect_media_files = (items: (MediaFile | FolderItem)[]): MediaFile[] => {
      let media_files: MediaFile[] = []
      for (const item of items) {
        if (item.type === 'folder' && item.children) {
          media_files = media_files.concat(collect_media_files(item.children))
        } else if (item.type !== 'folder') {
          media_files.push(item)
        }
      }
      return media_files
    }
    
    const media_files = collect_media_files(selected_files)
    if (media_files.length > 0) {
      // 找到当前文件在媒体文件列表中的索引
      const current_media_index = media_files.findIndex(file => file.id === current_file?.id)
      const new_index = (current_media_index + 1) % media_files.length
      const new_file = media_files[new_index]
      
      // 找到新文件在原始列表中的索引
      const find_file_index = (items: (MediaFile | FolderItem)[], target_id: string): number => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.id === target_id) {
            return i
          }
          if (item.type === 'folder' && item.children) {
            const child_index = find_file_index(item.children, target_id)
            if (child_index !== -1) {
              return i
            }
          }
        }
        return -1
      }
      
      const original_index = find_file_index(selected_files, new_file.id)
      if (original_index !== -1) {
        set_current_file_index(original_index)
        set_is_playing(true)
        set_current_time(0)
      }
    }
  }
  
  // 快进
  const handle_seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const new_time = parseFloat(e.target.value)
    set_current_time(new_time)
    
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.currentTime = new_time
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.currentTime = new_time
      }
    }
  }
  
  // 快退10秒
  const handle_backward = () => {
    const new_time = Math.max(0, current_time - 10)
    set_current_time(new_time)
    
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.currentTime = new_time
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.currentTime = new_time
      }
    }
  }
  
  // 快进10秒
  const handle_forward = () => {
    const new_time = Math.min(duration, current_time + 10)
    set_current_time(new_time)
    
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.currentTime = new_time
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.currentTime = new_time
      }
    }
  }
  
  // 调整音量
  const handle_volume_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const new_volume = parseFloat(e.target.value)
    set_volume(new_volume)
    set_is_muted(new_volume === 0)
    
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.volume = new_volume
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.volume = new_volume
      }
    }
  }
  
  // 静音切换
  const handle_mute_toggle = () => {
    const new_muted = !is_muted
    set_is_muted(new_muted)
    
    if (current_file && current_file.type !== 'folder') {
      if (current_file.type === 'audio' && audio_ref.current) {
        audio_ref.current.muted = new_muted
      } else if (current_file.type === 'video' && video_ref.current) {
        video_ref.current.muted = new_muted
      }
    }
  }
  
  // 全屏切换
  const handle_fullscreen_toggle = () => {
    if (player_ref.current) {
      if (!is_fullscreen) {
        if (player_ref.current.requestFullscreen) {
          player_ref.current.requestFullscreen()
        } else if ((player_ref.current as any).webkitRequestFullscreen) {
          (player_ref.current as any).webkitRequestFullscreen()
        } else if ((player_ref.current as any).mozRequestFullScreen) {
          (player_ref.current as any).mozRequestFullScreen()
        } else if ((player_ref.current as any).msRequestFullscreen) {
          (player_ref.current as any).msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen()
        }
      }
    }
  }
  
  // 处理全屏变化
  useEffect(() => {
    const handle_fullscreen_change = () => {
      set_is_fullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handle_fullscreen_change)
    return () => {
      document.removeEventListener('fullscreenchange', handle_fullscreen_change)
    }
  }, [])
  
  // 处理播放时间更新
  const handle_time_update = (time: number) => {
    set_current_time(time)
  }
  
  // 处理播放结束
  const handle_ended = () => {
    handle_next()
  }
  
  // 处理加载元数据
  const handle_metadata_loaded = (dur: number) => {
    set_duration(dur)
  }
  
  // 格式化时间
  const format_time = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // 切换文件夹展开状态
  const toggle_folder = (folder_id: string) => {
    const new_expanded = new Set(expanded_folders)
    if (new_expanded.has(folder_id)) {
      new_expanded.delete(folder_id)
    } else {
      new_expanded.add(folder_id)
    }
    set_expanded_folders(new_expanded)
  }
  
  // 渲染文件列表项
  const render_file_item = (item: MediaFile | FolderItem, level: number = 0) => {
    if (item.type === 'folder') {
      const is_expanded = expanded_folders.has(item.id)
      return (
        <div key={item.id} style={{ paddingLeft: `${level * 16}px` }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--ui_border)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            onClick={() => toggle_folder(item.id)}
          >
            <div style={{ marginRight: '8px' }}>
              {is_expanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
            </div>
            <Folder size={16} style={{ marginRight: '8px', color: 'var(--ui_accent)' }} />
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
          </div>
          {is_expanded && item.children && item.children.map(child => render_file_item(child, level + 1))}
        </div>
      )
    } else {
      const is_current = current_file?.id === item.id
      return (
        <div 
          key={item.id} 
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '6px',
            backgroundColor: is_current ? 'var(--ui_accent)' : 'transparent',
            color: is_current ? 'white' : 'var(--ui_text)',
            transition: 'all 0.2s',
            paddingLeft: `${level * 16}px`
          }}
          onMouseEnter={(e) => {
            if (!is_current) {
              e.currentTarget.style.backgroundColor = 'var(--ui_border)'
            }
          }}
          onMouseLeave={(e) => {
            if (!is_current) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          onClick={() => {
            const index = selected_files.findIndex(file => file.id === item.id)
            set_current_file_index(index)
            set_is_playing(true)
            set_current_time(0)
          }}
        >
          {item.type === 'audio' ? (
            <Music size={16} style={{ marginRight: '8px' }} />
          ) : (
            <Film size={16} style={{ marginRight: '8px' }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: is_current ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '11px', color: is_current ? 'rgba(255,255,255,0.7)' : 'var(--ui_text_muted)', marginTop: '2px' }}>
              {item.type === 'audio' ? '音频' : '视频'}
            </div>
          </div>
        </div>
      )
    }
  }
  
  // 过滤文件列表
  const filtered_files = selected_files.filter(file => 
    file.name.toLowerCase().includes(search_query.toLowerCase())
  )
  
  // 左侧文件列表面板
  const left_panel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 操作按钮 */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--ui_border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handle_select_files}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--ui_border)',
            backgroundColor: 'transparent',
            color: 'var(--ui_text)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ui_border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <FolderOpen size={14} />
          选择文件
        </button>
        <button
          onClick={handle_select_folder}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--ui_border)',
            backgroundColor: 'transparent',
            color: 'var(--ui_text)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--ui_border)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <FolderOpen size={14} />
          选择文件夹
        </button>
      </div>
      
      {/* 搜索框 */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--ui_border)' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--ui_text_muted)' }} />
          <input
            type="text"
            placeholder="搜索"
            value={search_query}
            onChange={(e) => set_search_query(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid var(--ui_border)',
              backgroundColor: 'var(--ui_input)',
              color: 'var(--ui_text)',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--ui_accent)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--ui_border)'
            }}
          />
          {search_query && (
            <button
              onClick={() => set_search_query('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--ui_text_muted)',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* 文件列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {filtered_files.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>
            暂无媒体文件
          </div>
        ) : (
          filtered_files.map(item => render_file_item(item))
        )}
      </div>
    </div>
  )
  
  return (
    <ThreePanelLayout
      title={current_file ? current_file.name : '播放器'}
      titleIcon={<Music size={20} />}
      leftPanelTitle="媒体文件"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
      contentPadding={0}
    >
      <div 
        ref={player_ref} 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        {/* 播放区域 */}
        <div 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ui_panel_alt)', minHeight: 0 }}
          onDoubleClick={handle_fullscreen_toggle}
        >
          {current_file ? (
            current_file.type === 'folder' ? (
              <div style={{ textAlign: 'center', color: 'var(--ui_text_muted)' }}>
                <Folder size={80} style={{ marginBottom: '20px', opacity: 0.5, color: 'var(--ui_accent)' }} />
                <h3 style={{ margin: 0, color: 'var(--ui_text)' }}>请选择媒体文件</h3>
                <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: 'var(--ui_text_muted)' }}>当前选择的是文件夹，请从左侧列表中选择具体的媒体文件</p>
              </div>
            ) : current_file.type === 'audio' ? (
              <div style={{ textAlign: 'center', color: 'var(--ui_text)', padding: '40px' }}>
                <Music size={80} style={{ marginBottom: '20px', color: 'var(--ui_accent)' }} />
                <h2 style={{ margin: '0 0 10px 0', color: 'var(--ui_text)' }}>{current_file.name}</h2>
                <p style={{ margin: 0, color: 'var(--ui_text_muted)' }}>音频播放中</p>
                <audio
                  ref={audio_ref}
                  src={current_file.path.replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:')}
                  autoPlay={is_playing}
                  onTimeUpdate={(e) => handle_time_update(e.currentTarget.currentTime)}
                  onEnded={handle_ended}
                  onLoadedMetadata={(e) => handle_metadata_loaded(e.currentTarget.duration)}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <video
                  ref={video_ref}
                  src={current_file.path.replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:')}
                  autoPlay={is_playing}
                  onTimeUpdate={(e) => handle_time_update(e.currentTarget.currentTime)}
                  onEnded={handle_ended}
                  onLoadedMetadata={(e) => handle_metadata_loaded(e.currentTarget.duration)}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ui_text_muted)' }}>
              <Music size={80} style={{ marginBottom: '20px', opacity: 0.5, color: 'var(--ui_accent)' }} />
              <h3 style={{ margin: 0, color: 'var(--ui_text)' }}>请选择媒体文件</h3>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: 'var(--ui_text_muted)' }}>支持音乐和视频文件</p>
            </div>
          )}
        </div>
        
        {/* 播放控制栏 */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--ui_border)',
          backgroundColor: 'var(--ui_panel)',
          zIndex: 10,
          position: 'relative',
          minHeight: '100px'
        }}>
          {/* 进度条 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--ui_text_muted)' }}>
              <span>{format_time(current_time)}</span>
              <span>{format_time(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              value={current_time}
              onChange={handle_seek}
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--ui_border)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            />
          </div>
          
          {/* 控制按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <button
              onClick={handle_previous}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'transparent',
                color: 'var(--ui_text)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <SkipBack size={20} />
            </button>
            
            <button
              onClick={handle_backward}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'transparent',
                color: 'var(--ui_text)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Rewind size={20} />
            </button>
            
            <button
              onClick={handle_play_pause}
              style={{
                padding: '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--ui_accent)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {is_playing ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={handle_forward}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'transparent',
                color: 'var(--ui_text)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <FastForward size={20} />
            </button>
            
            <button
              onClick={handle_next}
              style={{
                padding: '8px',
                borderRadius: '50%',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'transparent',
                color: 'var(--ui_text)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <SkipForward size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
              <button
                onClick={handle_mute_toggle}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid var(--ui_border)',
                  backgroundColor: 'transparent',
                  color: 'var(--ui_text)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ui_border)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {is_muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={is_muted ? 0 : volume}
                onChange={handle_volume_change}
                style={{
                  width: '100px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--ui_border)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ThreePanelLayout>
  )
}

export default MediaPlayerPage