/**
 * 文件名: title_bar.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 19:40:00
 * 描述: Win11 风格的自定义可拖拽顶栏
 */
import React, { useEffect, useRef, useState } from 'react'
import { RotateCw, FileText, Sun, Moon } from 'lucide-react'
import { use_log_store } from '@/store/log'
import { use_notification_store } from '@/store/notification'

const TitleBar: React.FC = () => {
  const { logs, show_logs, clear_logs, toggle_logs } = use_log_store()
  const { is_visible, message, show } = use_notification_store()
  const log_card_ref = useRef<HTMLDivElement>(null)
  const [theme, set_theme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    window.electron_api
      .config_get('ui:theme', 'light')
      .then((res) => {
        const next = res.success && (res.data === 'dark' || res.data === 'light') ? (res.data as 'light' | 'dark') : 'light'
        document.documentElement.dataset.theme = next
        set_theme(next)
      })
      .catch(() => {
        document.documentElement.dataset.theme = 'light'
        set_theme('light')
      })
  }, [])

  // 点击其他地方关闭日志卡片
  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(event.target as Node)) {
        if (show_logs) {
          toggle_logs()
        }
      }
    }

    document.addEventListener('mousedown', handle_click_outside)
    return () => {
      document.removeEventListener('mousedown', handle_click_outside)
    }
  }, [show_logs, toggle_logs])

  return (
    <div
      className="drag-region"
      style={{
        height: '36px',
        width: '100%',
        backgroundColor: 'var(--ui_panel)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px',
        fontSize: '12px',
        color: 'var(--ui_text)',
        boxSizing: 'border-box',
        borderBottom: '1px solid var(--ui_border)',
        position: 'relative',
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
        <span>TRAI</span>
        <button
          className="no-drag-region"
          type="button"
          title={theme === 'dark' ? '切换浅色' : '切换深色'}
          aria-label={theme === 'dark' ? '切换浅色' : '切换深色'}
          onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark'
            document.documentElement.dataset.theme = next
            set_theme(next)
            window.electron_api.config_set('ui:theme', next).catch(() => {})
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--ui_border)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ui_text_muted)'
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          className="no-drag-region"
          type="button"
          title="刷新"
          onClick={() => {
            show('正在刷新...', 0) // 不自动隐藏, 因为要刷新
            // 延迟 1500ms 刷新, 确保用户能看到通知
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--ui_border)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ui_text_muted)'
          }}
        >
          <RotateCw size={14} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="no-drag-region"
            type="button"
            title={show_logs ? '隐藏日志' : '显示日志'}
            onClick={toggle_logs}
            style={{
              background: 'transparent',
              border: '1px solid var(--ui_border)',
              borderRadius: '6px',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ui_text_muted)'
            }}
          >
            <FileText size={14} />
          </button>

          {show_logs && (
            <div 
              ref={log_card_ref}
              className="no-drag-region"
              style={{
                position: 'absolute',
                top: '36px',
                left: '0',
                width: '400px',
                maxWidth: '90vw',
                maxHeight: '300px',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '8px',
                overflow: 'auto',
                zIndex: 1000
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '4px 8px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--ui_text)' }}>系统日志</h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="no-drag-region"
                    type="button"
                    onClick={() => window.location.reload()}
                    title="刷新"
                    style={{
                      background: 'none',
                      border: '1px solid var(--ui_border)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--ui_text)'
                    }}
                  >
                    刷新
                  </button>
                  <button
                    className="no-drag-region"
                    type="button"
                    onClick={clear_logs}
                    title="清除"
                    style={{
                      background: 'none',
                      border: '1px solid var(--ui_border)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--ui_text)'
                    }}
                  >
                    清除
                  </button>
                  <button
                    className="no-drag-region"
                    type="button"
                    onClick={toggle_logs}
                    title="关闭"
                    style={{
                      background: 'none',
                      border: '1px solid var(--ui_border)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--ui_text)'
                    }}
                  >
                    关闭
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', padding: '0 8px' }}>
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px', color: 'var(--ui_text)' }}>{log}</div>
                  ))
                ) : (
                  <div style={{ color: 'var(--ui_text_muted)' }}>暂无日志</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 全局通知 */}
      {is_visible && (
        <div
          className="no-drag-region"
          style={{
            position: 'absolute',
            top: '50%',
            right: '16px',
            transform: 'translateY(-50%)',
            backgroundColor: 'var(--ui_success)',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1001,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default TitleBar
