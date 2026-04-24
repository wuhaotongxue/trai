/**
 * 文件名: title_bar.tsx
 * 作者: wuhao
 * 日期: 2026-04-24 00:10:00
 * 描述: TRAI 桌面客户端 Win11 风格自定义标题栏，支持主题切换、日志查看与国际化
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { RotateCw, FileText, Sun, Moon, Globe, ChevronDown, Minus, Square, X, Maximize2 } from 'lucide-react'
import { use_log_store } from '@/store/log'
import { use_notification_store } from '@/store/notification'
import { t, type Locale } from '@/i18n'
import { use_locale_store } from '@/store/locale'

const TitleBar: React.FC = () => {
  const { logs, show_logs, clear_logs, toggle_logs } = use_log_store()
  const { is_visible, message, show } = use_notification_store()
  const log_card_ref = useRef<HTMLDivElement>(null)
  const [theme, set_theme] = useState<'light' | 'dark'>('light')
  const [caps_lock_visible, set_caps_lock_visible] = useState(false)
  const [caps_lock_enabled, set_caps_lock_enabled] = useState(false)
  const [locale, set_locale] = useState<Locale>('zh')
  const [show_lang_menu, set_show_lang_menu] = useState(false)
  const lang_menu_ref = useRef<HTMLDivElement>(null)
  const [, force_update] = useState(0)

  useEffect(() => {
    const unsubscribe = use_locale_store.subscribe((state) => {
      force_update((n) => n + 1)
      set_locale(state.locale)
    })
    return unsubscribe
  }, [])

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

  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(event.target as Node)) {
        if (show_logs) toggle_logs()
      }
      if (lang_menu_ref.current && !lang_menu_ref.current.contains(event.target as Node)) {
        set_show_lang_menu(false)
      }
    }
    document.addEventListener('mousedown', handle_click_outside)
    return () => document.removeEventListener('mousedown', handle_click_outside)
  }, [show_logs, toggle_logs])

  useEffect(() => {
    let hide_timer: ReturnType<typeof setTimeout> | null = null
    const handle_keydown = (e: KeyboardEvent) => {
      if (e.key === 'CapsLock') {
        const caps_lock = e.getModifierState('CapsLock')
        set_caps_lock_enabled(caps_lock)
        set_caps_lock_visible(true)
        if (hide_timer) clearTimeout(hide_timer)
        hide_timer = setTimeout(() => set_caps_lock_visible(false), 2000)
      }
    }
    document.addEventListener('keydown', handle_keydown)
    return () => {
      document.removeEventListener('keydown', handle_keydown)
      if (hide_timer) clearTimeout(hide_timer)
    }
  }, [])

  const switch_theme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    set_theme(next)
    window.electron_api.config_set('ui:theme', next).catch(() => {})
  }, [theme])

  const switch_locale = useCallback((l: Locale) => {
    use_locale_store.getState().set_locale(l)
    set_locale(l)
    window.electron_api.config_set('ui:locale', l).catch(() => {})
    set_show_lang_menu(false)
  }, [])

  return (
    <div
      className="drag-region"
      style={{
        height: 'var(--titlebar_height)',
        width: '100%',
        backgroundColor: 'var(--ui_panel)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        fontSize: '12px',
        color: 'var(--ui_text)',
        boxSizing: 'border-box',
        borderBottom: '1px solid var(--ui_border)',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      {/* 左侧: Logo + 品牌名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img src="./kity.png" alt="logo" style={{ width: '15px', height: '15px' }} />
        <span style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.02em' }}>TRAI</span>
      </div>

      {/* 中间: 工具按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
        {/* 主题切换 */}
        <button
          className="no-drag-region"
          type="button"
          title={theme === 'dark' ? t('switch_to_light') : t('switch_to_dark')}
          onClick={switch_theme}
          style={{
            background: 'transparent',
            border: '1px solid var(--ui_border)',
            borderRadius: 'var(--ui_radius_sm)',
            padding: '4px 7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ui_text_muted)',
            transition: 'all var(--ui_transition_fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* 语言切换 */}
        <div style={{ position: 'relative' }} ref={lang_menu_ref}>
          <button
            className="no-drag-region"
            type="button"
            title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
            onClick={() => set_show_lang_menu(!show_lang_menu)}
            style={{
              background: 'transparent',
              border: '1px solid var(--ui_border)',
              borderRadius: 'var(--ui_radius_sm)',
              padding: '4px 7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: 'var(--ui_text_muted)',
              transition: 'all var(--ui_transition_fast)',
              fontSize: '12px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Globe size={13} />
            <span style={{ fontSize: '11px' }}>{locale === 'zh' ? '中文' : 'EN'}</span>
            <ChevronDown size={12} />
          </button>

          {show_lang_menu && (
            <div
              className="no-drag-region"
              style={{
                position: 'absolute',
                top: '34px',
                left: '0',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)',
                borderRadius: 'var(--ui_radius_md)',
                boxShadow: 'var(--ui_shadow_md)',
                padding: '4px',
                zIndex: 1001,
                minWidth: '120px',
                animation: 'fadeInUp 0.15s ease',
              }}
            >
              {([
                { locale: 'zh' as Locale, label: '中文', flag: 'CN' },
                { locale: 'en' as Locale, label: 'English', flag: 'US' },
              ]).map(({ locale: l, label, flag }) => (
                <button
                  key={l}
                  className="no-drag-region"
                  type="button"
                  onClick={() => switch_locale(l)}
                  style={{
                    width: '100%',
                    background: locale === l ? 'var(--ui_accent_light)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--ui_radius_sm)',
                    padding: '7px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: locale === l ? 'var(--ui_accent)' : 'var(--ui_text)',
                    fontSize: '13px',
                    fontWeight: locale === l ? 600 : 400,
                    transition: 'all var(--ui_transition_fast)',
                    textAlign: 'left' as const,
                  }}
                  onMouseEnter={(e) => { if (locale !== l) e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}
                  onMouseLeave={(e) => { if (locale !== l) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{ fontSize: '14px' }}>{flag === 'CN' ? '🇨🇳' : '🇺🇸'}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 刷新 */}
        <button
          className="no-drag-region"
          type="button"
          title={t('refresh')}
          onClick={() => {
            show(t('refresh') + '...', 0)
            setTimeout(() => window.location.reload(), 800)
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--ui_border)',
            borderRadius: 'var(--ui_radius_sm)',
            padding: '4px 7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ui_text_muted)',
            transition: 'all var(--ui_transition_fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <RotateCw size={14} />
        </button>

        {/* 日志按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            className="no-drag-region"
            type="button"
            title={show_logs ? t('hide_logs') : t('show_logs')}
            onClick={toggle_logs}
            style={{
              background: show_logs ? 'var(--ui_accent_light)' : 'transparent',
              border: '1px solid var(--ui_border)',
              borderRadius: 'var(--ui_radius_sm)',
              padding: '4px 7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: show_logs ? 'var(--ui_accent)' : 'var(--ui_text_muted)',
              transition: 'all var(--ui_transition_fast)',
            }}
            onMouseEnter={(e) => { if (!show_logs) { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)'; e.currentTarget.style.color = 'var(--ui_text)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' } }}
            onMouseLeave={(e) => { if (!show_logs) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ui_text_muted)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' } }}
          >
            <FileText size={14} />
            {logs.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--ui_accent)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {logs.length > 9 ? '9+' : logs.length}
              </span>
            )}
          </button>

          {show_logs && (
            <div
              ref={log_card_ref}
              className="no-drag-region"
              style={{
                position: 'absolute',
                top: '36px',
                left: '0',
                width: '420px',
                maxWidth: '90vw',
                maxHeight: '320px',
                backgroundColor: 'var(--ui_panel)',
                border: '1px solid var(--ui_border)',
                borderRadius: 'var(--ui_radius_lg)',
                boxShadow: 'var(--ui_shadow_lg)',
                padding: '12px',
                overflow: 'auto',
                zIndex: 1001,
                animation: 'fadeInUp 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ui_text)' }}>{t('system_logs')}</h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { label: t('refresh'), action: () => window.location.reload() },
                    { label: t('clear'), action: clear_logs },
                    { label: t('close'), action: toggle_logs }
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      className="no-drag-region"
                      type="button"
                      onClick={action}
                      style={{
                        background: 'var(--ui_panel_hover)',
                        border: '1px solid var(--ui_border)',
                        borderRadius: 'var(--ui_radius_sm)',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: 'var(--ui_text_secondary)',
                        transition: 'all var(--ui_transition_fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_active)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--ui_panel_hover)' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: '0 4px', color: 'var(--ui_text_secondary)', lineHeight: '1.7' }}>
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '2px', wordBreak: 'break-all' }}>{log}</div>
                )) : (
                  <div style={{ color: 'var(--ui_text_muted)', padding: '8px 0' }}>{t('no_logs')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧: Caps Lock 提示 */}
      {caps_lock_visible && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '16px',
            transform: 'translateY(-50%)',
            backgroundColor: caps_lock_enabled ? 'var(--ui_warning)' : 'var(--ui_text_muted)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: 'var(--ui_radius_md)',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: 'var(--ui_shadow_md)',
            zIndex: 1002,
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '14px' }}>{caps_lock_enabled ? '🔒' : '🔓'}</span>
          {caps_lock_enabled ? t('caps_lock_on') : t('caps_lock_off')}
        </div>
      )}

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
            padding: '6px 14px',
            borderRadius: 'var(--ui_radius_md)',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: 'var(--ui_shadow_md)',
            zIndex: 1001,
            animation: 'fadeIn 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '14px' }}>✓</span>
          {message}
        </div>
      )}
    </div>
  )
}

export default TitleBar
