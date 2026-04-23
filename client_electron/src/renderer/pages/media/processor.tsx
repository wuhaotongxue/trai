/**
 * 文件名: processor.tsx
 * 作者：wuhao
 * 日期：2026-04-23 11:00:00
 * 描述：媒体处理页面，支持音频转文本、字幕生成、双语字幕等功能
 */
import React, { useState, useRef } from 'react'
import { Upload, FileAudio, FileVideo, FileText, FileCode, Languages, Settings, Download, Play, Loader2, CheckCircle2, AlertCircle, X, Plus, Trash2, Edit2, Save, Film, MonitorPlay, Type } from 'lucide-react'
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'

/**
 * 音频处理任务接口
 */
interface AudioTask {
  id: string
  file_name: string
  file_path: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  transcript?: string
  transcript_md?: string
  subtitles?: SubtitleEntry[]
  translated_subtitles?: SubtitleEntry[]
  error?: string
  created_at: string
}

/**
 * 字幕条目接口
 */
interface SubtitleEntry {
  start: number
  end: number
  text: string
  translated_text?: string
}

/**
 * 媒体处理页面组件
 */
const MediaProcessorPage: React.FC = () => {
  // 状态管理
  const [active_tab, set_active_tab] = useState<'audio_transcript' | 'subtitle_generator' | 'bilingual_subtitles'>('audio_transcript')
  const [audio_tasks, set_audio_tasks] = useState<AudioTask[]>([])
  const [selected_video_orientation, setSelected_video_orientation] = useState<'vertical' | 'horizontal'>('horizontal')
  const [source_language, set_source_language] = useState<string>('zh')
  const [target_language, set_target_language] = useState<string>('en')
  const [is_processing, setIsProcessing] = useState<boolean>(false)
  
  // 引用
  const file_input_ref = useRef<HTMLInputElement>(null)
  
  // 处理音频文件上传
  const handle_upload_audio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const new_tasks: AudioTask[] = Array.from(files).map((file, index) => ({
      id: `task_${Date.now()}_${index}`,
      file_name: file.name,
      file_path: (file as any).path || URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString()
    }))
    
    set_audio_tasks([...audio_tasks, ...new_tasks])
    
    // 自动开始处理
    new_tasks.forEach(task => process_audio_task(task))
  }
  
  // 处理音频任务
  const process_audio_task = async (task: AudioTask) => {
    try {
      setIsProcessing(true)
      
      // 更新状态为处理中
      set_audio_tasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'processing', progress: 10 } : t
      ))
      
      // 模拟处理进度
      const progress_interval = setInterval(() => {
        set_audio_tasks(prev => prev.map(t => {
          if (t.id === task.id && t.status === 'processing') {
            const new_progress = Math.min(t.progress + 10, 90)
            return { ...t, progress: new_progress }
          }
          return t
        }))
      }, 500)
      
      // 调用后端 API 进行语音识别
      if (window.electron_api && window.electron_api.media_transcribe_audio) {
        const result = await window.electron_api.media_transcribe_audio(task.file_path, source_language)
        
        clearInterval(progress_interval)
        
        if (result.success && result.data) {
          // 生成 MD 格式
          const md_content = generate_markdown_transcript(result.data!.transcript, task.file_name)
          
          set_audio_tasks(prev => prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              status: 'completed', 
              progress: 100,
              transcript: result.data!.transcript,
              transcript_md: md_content
            } : t
          ))
        } else {
          throw new Error(result.error || '处理失败')
        }
      } else {
        // 模拟结果（用于浏览器预览）
        await new Promise(resolve => setTimeout(resolve, 3000))
        clearInterval(progress_interval)
        
        const mock_transcript = `这是一个模拟的语音识别结果。
        音频文件 "${task.file_name}" 的内容已经被转换为文本。
        在实际的 Electron 环境中，会调用后端 API 进行真实的语音识别。`
        
        const mock_md = generate_markdown_transcript(mock_transcript, task.file_name)
        
        set_audio_tasks(prev => prev.map(t => 
          t.id === task.id ? { 
            ...t, 
            status: 'completed', 
            progress: 100,
            transcript: mock_transcript,
            transcript_md: mock_md
          } : t
        ))
      }
    } catch (error) {
      console.error('处理音频失败:', error)
      set_audio_tasks(prev => prev.map(t => 
        t.id === task.id ? { 
          ...t, 
          status: 'error', 
          error: (error as Error).message 
        } : t
      ))
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 生成 Markdown 格式的转录文本
  const generate_markdown_transcript = (transcript: string, file_name: string): string => {
    const now = new Date().toLocaleString('zh-CN')
    return `# 音频转录文本

## 基本信息
- **文件名**: ${file_name}
- **生成时间**: ${now}

## 转录内容

${transcript}

---
*由 TRAI 媒体处理器生成*
`
  }
  
  // 生成字幕
  const handle_generate_subtitles = async (task: AudioTask) => {
    try {
      setIsProcessing(true)
      
      if (window.electron_api && window.electron_api.media_generate_subtitles) {
        const result = await window.electron_api.media_generate_subtitles(
          task.file_path,
          source_language,
          selected_video_orientation
        )
        
        if (result.success && result.data) {
          set_audio_tasks(prev => prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              subtitles: result.data!.subtitles 
            } : t
          ))
        }
      } else {
        // 模拟字幕生成
        await new Promise(resolve => setTimeout(resolve, 2000))
        const mock_subtitles: SubtitleEntry[] = [
          { start: 0, end: 3000, text: '欢迎观看这个视频' },
          { start: 3000, end: 6000, text: '这是一个字幕生成的示例' },
          { start: 6000, end: 9000, text: '支持竖屏和横屏格式' }
        ]
        
        set_audio_tasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, subtitles: mock_subtitles } : t
        ))
      }
    } catch (error) {
      console.error('生成字幕失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 翻译字幕
  const handle_translate_subtitles = async (task: AudioTask) => {
    try {
      setIsProcessing(true)
      
      if (window.electron_api && window.electron_api.media_translate_subtitles) {
        const result = await window.electron_api.media_translate_subtitles(
          task.subtitles!,
          source_language,
          target_language
        )
        
        if (result.success && result.data) {
          set_audio_tasks(prev => prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              translated_subtitles: result.data!.translated_subtitles 
            } : t
          ))
        }
      } else {
        // 模拟翻译
        await new Promise(resolve => setTimeout(resolve, 2000))
        const mock_translations = task.subtitles?.map(s => ({
          ...s,
          translated_text: `Translation: ${s.text}`
        }))
        
        set_audio_tasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, translated_subtitles: mock_translations } : t
        ))
      }
    } catch (error) {
      console.error('翻译字幕失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 下载文件
  const handle_download = (task: AudioTask, type: 'transcript' | 'md' | 'pdf' | 'subtitles' | 'bilingual') => {
    let content = ''
    let mime_type = 'text/plain'
    let extension = 'txt'
    
    switch (type) {
      case 'transcript':
        content = task.transcript || ''
        extension = 'txt'
        break
      case 'md':
        content = task.transcript_md || ''
        mime_type = 'text/markdown'
        extension = 'md'
        break
      case 'pdf':
        content = generate_pdf_content(task)
        mime_type = 'application/pdf'
        extension = 'pdf'
        break
      case 'subtitles':
        content = generate_srt(task.subtitles || [])
        mime_type = 'text/srt'
        extension = 'srt'
        break
      case 'bilingual':
        content = generate_bilingual_srt(task.subtitles || [], task.translated_subtitles || [])
        mime_type = 'text/srt'
        extension = 'srt'
        break
    }
    
    const blob = new Blob([content], { type: mime_type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${task.file_name.split('.')[0]}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // 生成PDF内容
  const generate_pdf_content = (task: AudioTask): string => {
    const now = new Date().toLocaleString('zh-CN')
    return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 5 0 R >>
stream
BT
/F1 12 Tf
100 700 Td
(Audio Transcript: ${task.file_name}) Tj
ET
BT
/F1 10 Tf
100 680 Td
(Generated: ${now}) Tj
ET
BT
/F1 10 Tf
100 650 Td
(Transcript Content:) Tj
ET
BT
/F1 10 Tf
100 630 Td
(${task.transcript || 'No transcript available'}) Tj
ET
endstream
endobj
5 0 obj
${new TextEncoder().encode(`BT
/F1 12 Tf
100 700 Td
(Audio Transcript: ${task.file_name}) Tj
ET
BT
/F1 10 Tf
100 680 Td
(Generated: ${now}) Tj
ET
BT
/F1 10 Tf
100 650 Td
(Transcript Content:) Tj
ET
BT
/F1 10 Tf
100 630 Td
(${task.transcript || 'No transcript available'}) Tj
ET`).length}
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000101 00000 n 
0000000176 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
%%EOF`
  }
  
  // 生成 SRT 字幕格式
  const generate_srt = (subtitles: SubtitleEntry[]): string => {
    return subtitles.map((item, index) => {
      const start_time = format_srt_time(item.start)
      const end_time = format_srt_time(item.end)
      return `${index + 1}\n${start_time} --> ${end_time}\n${item.text}\n`
    }).join('\n')
  }
  
  // 生成双语 SRT 字幕格式
  const generate_bilingual_srt = (subtitles: SubtitleEntry[], translations: SubtitleEntry[]): string => {
    return subtitles.map((item, index) => {
      const start_time = format_srt_time(item.start)
      const end_time = format_srt_time(item.end)
      const translation = translations[index]?.translated_text || ''
      return `${index + 1}\n${start_time} --> ${end_time}\n${item.text}\n${translation}\n`
    }).join('\n')
  }
  
  // 格式化 SRT 时间
  const format_srt_time = (ms: number): string => {
    const total_seconds = Math.floor(ms / 1000)
    const hours = Math.floor(total_seconds / 3600)
    const minutes = Math.floor((total_seconds % 3600) / 60)
    const seconds = total_seconds % 60
    const milliseconds = ms % 1000
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
  }
  
  // 删除任务
  const handle_delete_task = (task_id: string) => {
    set_audio_tasks(audio_tasks.filter(t => t.id !== task_id))
  }
  
  // 左侧任务列表面板
  const left_panel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部操作栏 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--ui_border)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <button
          onClick={() => file_input_ref.current?.click()}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--ui_accent)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Plus size={14} />
          添加
        </button>
        <input
          ref={file_input_ref}
          type="file"
          accept="audio/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handle_upload_audio}
        />
      </div>
      
      {/* 任务列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {audio_tasks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ui_text_muted)', fontSize: '13px' }}>
            <Upload size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div>暂无处理任务</div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>点击"添加"按钮上传音频或视频文件</div>
          </div>
        ) : (
          audio_tasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--ui_panel_alt)',
                border: '1px solid var(--ui_border)',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.file_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ui_text_muted)', marginBottom: '8px' }}>
                    {new Date(task.created_at).toLocaleString('zh-CN')}
                  </div>
                  
                  {/* 进度条 */}
                  {task.status === 'processing' && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>
                        <span>处理中</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: 'var(--ui_border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${task.progress}%`, height: '100%', backgroundColor: 'var(--ui_accent)', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  
                  {/* 状态指示器 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    {task.status === 'pending' && (
                      <>
                        <AlertCircle size={12} color="var(--ui_text_muted)" />
                        <span style={{ color: 'var(--ui_text_muted)' }}>等待处理</span>
                      </>
                    )}
                    {task.status === 'processing' && (
                      <>
                        <Loader2 size={12} className="animate-spin" color="var(--ui_accent)" />
                        <span style={{ color: 'var(--ui_accent)' }}>处理中</span>
                      </>
                    )}
                    {task.status === 'completed' && (
                      <>
                        <CheckCircle2 size={12} color="var(--ui_success)" />
                        <span style={{ color: 'var(--ui_success)' }}>已完成</span>
                      </>
                    )}
                    {task.status === 'error' && (
                      <>
                        <AlertCircle size={12} color="var(--ui_danger)" />
                        <span style={{ color: 'var(--ui_danger)' }}>{task.error}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handle_delete_task(task.id)}
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--ui_text_muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ui_danger)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--ui_text_muted)'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
  
  return (
    <ThreePanelLayout
      title="媒体处理"
      titleIcon={<FileText size={20} />}
      leftPanelTitle="任务列表"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
      contentPadding={0}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部标签栏 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--ui_border)',
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--ui_panel)'
        }}>
          <button
            onClick={() => set_active_tab('audio_transcript')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: active_tab === 'audio_transcript' ? 'var(--ui_accent)' : 'transparent',
              color: active_tab === 'audio_transcript' ? 'white' : 'var(--ui_text)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (active_tab !== 'audio_transcript') {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }
            }}
            onMouseLeave={(e) => {
              if (active_tab !== 'audio_transcript') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <FileText size={16} />
            音频转文本
          </button>
          
          <button
            onClick={() => set_active_tab('subtitle_generator')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: active_tab === 'subtitle_generator' ? 'var(--ui_accent)' : 'transparent',
              color: active_tab === 'subtitle_generator' ? 'white' : 'var(--ui_text)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (active_tab !== 'subtitle_generator') {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }
            }}
            onMouseLeave={(e) => {
              if (active_tab !== 'subtitle_generator') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Film size={16} />
            字幕生成
          </button>
          
          <button
            onClick={() => set_active_tab('bilingual_subtitles')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: active_tab === 'bilingual_subtitles' ? 'var(--ui_accent)' : 'transparent',
              color: active_tab === 'bilingual_subtitles' ? 'white' : 'var(--ui_text)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (active_tab !== 'bilingual_subtitles') {
                e.currentTarget.style.backgroundColor = 'var(--ui_border)'
              }
            }}
            onMouseLeave={(e) => {
              if (active_tab !== 'bilingual_subtitles') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Languages size={16} />
            双语字幕
          </button>
        </div>
        
        {/* 内容区域 */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {active_tab === 'audio_transcript' && (
            <AudioTranscriptTab
              tasks={audio_tasks}
              on_generate_md={handle_download}
              on_download={handle_download}
              is_processing={is_processing}
            />
          )}
          
          {active_tab === 'subtitle_generator' && (
            <SubtitleGeneratorTab
              tasks={audio_tasks}
              on_generate_subtitles={handle_generate_subtitles}
              on_download={handle_download}
              video_orientation={selected_video_orientation}
              on_orientation_change={setSelected_video_orientation}
              source_language={source_language}
              on_language_change={set_source_language}
              is_processing={is_processing}
            />
          )}
          
          {active_tab === 'bilingual_subtitles' && (
            <BilingualSubtitlesTab
              tasks={audio_tasks}
              on_translate={handle_translate_subtitles}
              on_download={handle_download}
              source_language={source_language}
              target_language={target_language}
              on_source_language_change={set_source_language}
              on_target_language_change={set_target_language}
              is_processing={is_processing}
            />
          )}
        </div>
      </div>
    </ThreePanelLayout>
  )
}

/**
 * 音频转文本标签页组件
 */
const AudioTranscriptTab: React.FC<{
  tasks: AudioTask[]
  on_generate_md: (task: AudioTask, type: 'transcript' | 'md') => void
  on_download: (task: AudioTask, type: 'transcript' | 'md' | 'pdf' | 'subtitles' | 'bilingual') => void
  is_processing: boolean
}> = ({ tasks, on_generate_md, on_download, is_processing }) => {
  const completed_tasks = tasks.filter(t => t.status === 'completed')
  
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ui_text)', marginBottom: '8px' }}>音频转文本</h2>
        <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>
          上传音频文件，自动识别语音并转换为文本和 Markdown 格式
        </p>
      </div>
      
      {completed_tasks.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--ui_text_muted)' }}>
          <FileAudio size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>暂无已完成的转录任务</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>请先上传音频文件进行处理</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {completed_tasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileAudio size={24} color="var(--ui_accent)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--ui_text)' }}>{task.file_name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ui_text_muted)' }}>
                      已完成于 {new Date(task.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => on_generate_md(task, 'transcript')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--ui_border)',
                      backgroundColor: 'transparent',
                      color: 'var(--ui_text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={14} />
                    下载文本
                  </button>
                  <button
                    onClick={() => on_generate_md(task, 'md')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--ui_border)',
                      backgroundColor: 'transparent',
                      color: 'var(--ui_text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileCode size={14} />
                    下载 MD
                  </button>
                  <button
                    onClick={() => on_download(task, 'pdf')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--ui_border)',
                      backgroundColor: 'transparent',
                      color: 'var(--ui_text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={14} />
                    下载 PDF
                  </button>
                </div>
              </div>
              
              <div style={{
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: 'var(--ui_panel_alt)',
                border: '1px solid var(--ui_border)',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--ui_text)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {task.transcript}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 字幕生成标签页组件
 */
const SubtitleGeneratorTab: React.FC<{
  tasks: AudioTask[]
  on_generate_subtitles: (task: AudioTask) => void
  on_download: (task: AudioTask, type: 'subtitles') => void
  video_orientation: 'vertical' | 'horizontal'
  on_orientation_change: (orientation: 'vertical' | 'horizontal') => void
  source_language: string
  on_language_change: (lang: string) => void
  is_processing: boolean
}> = ({ tasks, on_generate_subtitles, on_download, video_orientation, on_orientation_change, source_language, on_language_change, is_processing }) => {
  const completed_tasks = tasks.filter(t => t.status === 'completed')
  
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ui_text)', marginBottom: '8px' }}>字幕生成</h2>
        <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>
          为视频或音频自动生成字幕，支持竖屏和横屏格式
        </p>
      </div>
      
      {/* 设置选项 */}
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'var(--ui_panel)',
        border: '1px solid var(--ui_border)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '8px' }}>
              视频格式
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => on_orientation_change('horizontal')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: video_orientation === 'horizontal' ? '2px solid var(--ui_accent)' : '1px solid var(--ui_border)',
                  backgroundColor: video_orientation === 'horizontal' ? 'var(--ui_accent)' : 'transparent',
                  color: video_orientation === 'horizontal' ? 'white' : 'var(--ui_text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MonitorPlay size={16} />
                横屏
              </button>
              <button
                onClick={() => on_orientation_change('vertical')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: video_orientation === 'vertical' ? '2px solid var(--ui_accent)' : '1px solid var(--ui_border)',
                  backgroundColor: video_orientation === 'vertical' ? 'var(--ui_accent)' : 'transparent',
                  color: video_orientation === 'vertical' ? 'white' : 'var(--ui_text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Film size={16} />
                竖屏
              </button>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '8px' }}>
              源语言
            </label>
            <select
              value={source_language}
              onChange={(e) => on_language_change(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'var(--ui_input)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="zh">中文</option>
              <option value="en">英语</option>
              <option value="ja">日语</option>
              <option value="ko">韩语</option>
            </select>
          </div>
        </div>
      </div>
      
      {completed_tasks.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--ui_text_muted)' }}>
          <Film size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>暂无可生成字幕的任务</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>请先上传音频或视频文件</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {completed_tasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {task.file_name.match(/\.(mp4|avi|mov|wmv|mkv)$/i) ? (
                    <Film size={24} color="var(--ui_accent)" />
                  ) : (
                    <FileAudio size={24} color="var(--ui_accent)" />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--ui_text)' }}>{task.file_name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ui_text_muted)' }}>
                      {task.subtitles ? `已生成 ${task.subtitles.length} 条字幕` : '未生成字幕'}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!task.subtitles ? (
                    <button
                      onClick={() => on_generate_subtitles(task)}
                      disabled={is_processing}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--ui_accent)',
                        color: 'white',
                        cursor: is_processing ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: is_processing ? 0.6 : 1
                      }}
                    >
                      {is_processing ? <Loader2 size={16} className="animate-spin" /> : <Type size={16} />}
                      生成字幕
                    </button>
                  ) : (
                    <button
                      onClick={() => on_download(task, 'subtitles')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--ui_border)',
                        backgroundColor: 'transparent',
                        color: 'var(--ui_text)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={16} />
                      下载 SRT
                    </button>
                  )}
                </div>
              </div>
              
              {task.subtitles && (
                <div style={{
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ui_panel_alt)',
                  border: '1px solid var(--ui_border)',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {task.subtitles.map((subtitle, index) => (
                    <div key={index} style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--ui_text)' }}>
                      <span style={{ color: 'var(--ui_text_muted)', marginRight: '8px' }}>
                        [{format_time(subtitle.start)} - {format_time(subtitle.end)}]
                      </span>
                      {subtitle.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 双语字幕标签页组件
 */
const BilingualSubtitlesTab: React.FC<{
  tasks: AudioTask[]
  on_translate: (task: AudioTask) => void
  on_download: (task: AudioTask, type: 'bilingual') => void
  source_language: string
  target_language: string
  on_source_language_change: (lang: string) => void
  on_target_language_change: (lang: string) => void
  is_processing: boolean
}> = ({ tasks, on_translate, on_download, source_language, target_language, on_source_language_change, on_target_language_change, is_processing }) => {
  const tasks_with_subtitles = tasks.filter(t => t.status === 'completed' && t.subtitles)
  
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ui_text)', marginBottom: '8px' }}>双语字幕</h2>
        <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)' }}>
          为已有字幕生成翻译，创建双语字幕文件
        </p>
      </div>
      
      {/* 语言设置 */}
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'var(--ui_panel)',
        border: '1px solid var(--ui_border)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '8px' }}>
              源语言
            </label>
            <select
              value={source_language}
              onChange={(e) => on_source_language_change(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'var(--ui_input)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="zh">中文</option>
              <option value="en">英语</option>
              <option value="ja">日语</option>
              <option value="ko">韩语</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ui_text)', marginBottom: '8px' }}>
              目标语言
            </label>
            <select
              value={target_language}
              onChange={(e) => on_target_language_change(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--ui_border)',
                backgroundColor: 'var(--ui_input)',
                color: 'var(--ui_text)',
                fontSize: '13px',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="en">英语</option>
              <option value="zh">中文</option>
              <option value="ja">日语</option>
              <option value="ko">韩语</option>
            </select>
          </div>
        </div>
      </div>
      
      {tasks_with_subtitles.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--ui_text_muted)' }}>
          <Languages size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>暂无可翻译的字幕</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>请先生成字幕后再进行翻译</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {tasks_with_subtitles.map(task => (
            <div
              key={task.id}
              style={{
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Languages size={24} color="var(--ui_accent)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--ui_text)' }}>{task.file_name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ui_text_muted)' }}>
                      {task.translated_subtitles 
                        ? `已翻译 ${task.translated_subtitles.length} 条字幕` 
                        : `${task.subtitles?.length || 0} 条字幕待翻译`}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!task.translated_subtitles ? (
                    <button
                      onClick={() => on_translate(task)}
                      disabled={is_processing}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--ui_accent)',
                        color: 'white',
                        cursor: is_processing ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: is_processing ? 0.6 : 1
                      }}
                    >
                      {is_processing ? <Loader2 size={16} className="animate-spin" /> : <Languages size={16} />}
                      翻译字幕
                    </button>
                  ) : (
                    <button
                      onClick={() => on_download(task, 'bilingual')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--ui_border)',
                        backgroundColor: 'transparent',
                        color: 'var(--ui_text)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={16} />
                      下载双语字幕
                    </button>
                  )}
                </div>
              </div>
              
              {task.translated_subtitles && (
                <div style={{
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ui_panel_alt)',
                  border: '1px solid var(--ui_border)',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {task.translated_subtitles.map((subtitle, index) => (
                    <div key={index} style={{ marginBottom: '12px', fontSize: '13px' }}>
                      <div style={{ color: 'var(--ui_text_muted)', marginBottom: '4px', fontSize: '11px' }}>
                        [{format_time(subtitle.start)} - {format_time(subtitle.end)}]
                      </div>
                      <div style={{ color: 'var(--ui_text)', marginBottom: '4px' }}>{subtitle.text}</div>
                      <div style={{ color: 'var(--ui_accent)', fontStyle: 'italic' }}>{subtitle.translated_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 格式化时间显示
 */
const format_time = (ms: number): string => {
  const total_seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(total_seconds / 60)
  const seconds = total_seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default MediaProcessorPage
