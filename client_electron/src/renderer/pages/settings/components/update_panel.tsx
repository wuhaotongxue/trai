/**
 * 文件名: update_panel.tsx
 * 作者: wuhao
 * 日期: 2026-04-25 04:00:00
 * 描述: 客户端更新面板组件
 */
import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Download, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface UpdateStatus {
  checking: boolean
  available: boolean
  downloaded: boolean
  error: string | null
  version: string | null
  releaseNotes: string | null
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

interface UpdatePanelProps {
  autoCheck?: boolean  // 是否自动检查更新
}

const UpdatePanel: React.FC<UpdatePanelProps> = ({ autoCheck = true }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [status, setStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloaded: false,
    error: null,
    version: null,
    releaseNotes: null
  })
  const [progress, setProgress] = useState<UpdateProgress | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showReleaseNotes, setShowReleaseNotes] = useState(false)

  // 加载当前版本
  useEffect(() => {
    const loadVersion = async () => {
      if (window.electron_api?.app_get_version) {
        try {
          const v = await window.electron_api.app_get_version()
          setCurrentVersion(v || '未知')
        } catch (e) {
          console.error('Failed to get app version', e)
          setCurrentVersion('未知')
        }
      }
    }
    loadVersion()
  }, [])

  // 监听更新状态变化
  useEffect(() => {
    if (!window.electron_api?.on_update_status) return

    const unsubscribe = window.electron_api.on_update_status((_event: any, newStatus: UpdateStatus) => {
      setStatus(newStatus)
      if (!newStatus.checking && !newStatus.available) {
        setIsDownloading(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // 监听下载进度
  useEffect(() => {
    if (!window.electron_api?.on_update_progress) return

    const unsubscribe = window.electron_api.on_update_progress((_event: any, newProgress: UpdateProgress) => {
      setProgress(newProgress)
      setIsDownloading(newProgress.percent < 100 && newProgress.percent > 0)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // 自动检查更新
  useEffect(() => {
    if (!autoCheck) return

    const checkOnMount = async () => {
      if (window.electron_api?.app_check_update) {
        try {
          await window.electron_api.app_check_update()
        } catch (e) {
          console.error('Auto check update failed', e)
        }
      }
    }

    // 延迟检查，避免启动时阻塞
    const timer = setTimeout(checkOnMount, 3000)
    return () => clearTimeout(timer)
  }, [autoCheck])

  // 手动检查更新
  const handleCheckUpdate = useCallback(async () => {
    if (!window.electron_api?.app_check_update) return

    setStatus(prev => ({ ...prev, checking: true, error: null }))
    try {
      await window.electron_api.app_check_update()
    } catch (e) {
      setStatus(prev => ({ ...prev, checking: false, error: '检查更新失败' }))
    }
  }, [])

  // 下载更新
  const handleDownloadUpdate = useCallback(async () => {
    if (!window.electron_api?.app_download_update) return

    setIsDownloading(true)
    setProgress({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 })
    try {
      await window.electron_api.app_download_update()
    } catch (e) {
      setIsDownloading(false)
      setStatus(prev => ({ ...prev, error: '下载更新失败' }))
    }
  }, [])

  // 安装更新并重启
  const handleInstallUpdate = useCallback(async () => {
    if (!window.electron_api?.app_install_update) return

    try {
      await window.electron_api.app_install_update()
    } catch (e) {
      console.error('Install update failed', e)
    }
  }, [])

  // 格式化下载速度
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }

  // 获取状态文本
  const getStatusText = (): string => {
    if (status.checking) return '正在检查更新...'
    if (status.error) return status.error
    if (status.downloaded) return `新版本 ${status.version} 已下载完成`
    if (status.available) return `发现新版本 ${status.version}`
    if (status.version) return `当前已是最新版本 ${status.version}`
    return ''
  }

  // 获取状态类型
  const getStatusType = (): 'info' | 'success' | 'warning' | 'error' => {
    if (status.error) return 'error'
    if (status.downloaded) return 'success'
    if (status.available) return 'warning'
    return 'info'
  }

  const statusType = getStatusType()

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ui_text)', margin: '0 0 8px 0' }}>
          系统更新
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', margin: 0 }}>
          检查并安装最新版本的 TRAI 客户端
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
        {/* 版本信息卡片 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'var(--ui_panel)',
          borderRadius: '12px',
          border: '1px solid var(--ui_border)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RefreshCw size={28} color="var(--ui_accent)" />
          </div>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--ui_text_muted)', marginBottom: '4px' }}>
              当前版本
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ui_text)' }}>
              v{currentVersion || '加载中...'}
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* 检查更新按钮 */}
          <button
            onClick={handleCheckUpdate}
            disabled={status.checking || isDownloading}
            style={{
              padding: '12px 24px',
              backgroundColor: status.checking ? 'var(--ui_panel_alt)' : 'var(--ui_panel)',
              color: status.checking ? 'var(--ui_text_muted)' : 'var(--ui_text)',
              border: '1px solid var(--ui_border)',
              borderRadius: '10px',
              cursor: status.checking || isDownloading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {status.checking ? (
              <Loader2 size={16} className="anim_spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {status.checking ? '检查中...' : '检查更新'}
          </button>

          {/* 下载更新按钮 */}
          {status.available && !status.downloaded && (
            <button
              onClick={handleDownloadUpdate}
              disabled={isDownloading}
              style={{
                padding: '12px 24px',
                backgroundColor: isDownloading ? 'var(--ui_panel_alt)' : 'var(--ui_accent)',
                color: isDownloading ? 'var(--ui_text_muted)' : 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isDownloading ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isDownloading ? (
                <Loader2 size={16} className="anim_spin" />
              ) : (
                <Download size={16} />
              )}
              {isDownloading ? '下载中...' : '下载更新'}
            </button>
          )}

          {/* 安装更新按钮 */}
          {status.downloaded && (
            <button
              onClick={handleInstallUpdate}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--ui_success)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <CheckCircle size={16} />
              立即安装并重启
            </button>
          )}
        </div>

        {/* 下载进度条 */}
        {isDownloading && progress && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--ui_panel)',
            borderRadius: '10px',
            border: '1px solid var(--ui_border)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '13px',
              color: 'var(--ui_text)'
            }}>
              <span>下载进度</span>
              <span>{progress.percent.toFixed(1)}%</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: 'var(--ui_border)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress.percent}%`,
                backgroundColor: 'var(--ui_accent)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--ui_text_muted)'
            }}>
              <span>{formatSpeed(progress.bytesPerSecond)}</span>
              <span>
                {progress.transferred > 0 && progress.total > 0 && (
                  <>{(progress.transferred / 1024 / 1024).toFixed(1)} MB / {(progress.total / 1024 / 1024).toFixed(1)} MB</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* 状态提示 */}
        {getStatusText() && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: statusType === 'error' ? 'rgba(239, 68, 68, 0.1)' :
              statusType === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                statusType === 'warning' ? 'rgba(14, 165, 233, 0.1)' :
                  'var(--ui_panel)',
            border: `1px solid ${statusType === 'error' ? 'rgba(239, 68, 68, 0.2)' :
              statusType === 'success' ? 'rgba(16, 185, 129, 0.2)' :
                statusType === 'warning' ? 'rgba(14, 165, 233, 0.2)' :
                  'var(--ui_border)'}`,
            borderRadius: '10px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: statusType === 'error' ? 'var(--ui_danger)' :
                statusType === 'success' ? 'var(--ui_success)' :
                  statusType === 'warning' ? 'var(--ui_accent)' :
                    'var(--ui_panel_alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {statusType === 'error' ? '!' :
                statusType === 'success' ? '✓' :
                  statusType === 'warning' ? '!' : 'i'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: statusType === 'info' ? 400 : 500,
                color: statusType === 'error' ? 'var(--ui_danger)' :
                  statusType === 'success' ? 'var(--ui_success)' :
                    statusType === 'warning' ? 'var(--ui_accent)' :
                      'var(--ui_text_muted)'
              }}>
                {getStatusText()}
              </div>
            </div>
          </div>
        )}

        {/* 更新日志 */}
        {status.releaseNotes && status.available && (
          <div style={{
            backgroundColor: 'var(--ui_panel)',
            borderRadius: '10px',
            border: '1px solid var(--ui_border)',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowReleaseNotes(!showReleaseNotes)}
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--ui_text)',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <span>更新日志</span>
              {showReleaseNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showReleaseNotes && (
              <div style={{
                padding: '0 16px 16px 16px',
                fontSize: '13px',
                color: 'var(--ui_text_muted)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {status.releaseNotes}
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {status.error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px'
          }}>
            <AlertCircle size={16} color="var(--ui_danger)" />
            <span style={{ fontSize: '13px', color: 'var(--ui_danger)' }}>
              {status.error}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpdatePanel
