/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-16 10:11:04
 * 描述: 客户端登录页面
 */
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText, RotateCw } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import { use_log_store } from '@/store/log'
import TitleBar from '@/components/layout/title_bar'

/**
 * 登录页面组件
 */
const Login: React.FC = () => {
  const [username, set_username] = useState('wuhao')
  const [password, set_password] = useState('Tr@@2026...')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('https://trai.tuoren.com')
  const [api_loading, set_api_loading] = useState(true)
  const [api_saving, set_api_saving] = useState(false)
  const [remember_me, set_remember_me] = useState(true)
  const [show_logs, set_show_logs] = useState(false)
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)
  const { logs, add_log, clear_logs } = use_log_store()
  const log_card_ref = useRef<HTMLDivElement>(null)
  const last_submit_time = useRef(0)

  useEffect(() => {
    const load_config = async () => {
      try {
        if (window.electron_api?.config_get) {
          const res = await window.electron_api.config_get('api_url', 'https://trai.tuoren.com')
          if (res.success && typeof res.data === 'string' && res.data.trim()) {
            set_api_url(res.data.trim())
          }
          const rm_res = await window.electron_api.config_get('remember_me', true)
          if (rm_res.success) {
            set_remember_me(rm_res.data)
          }
        }
      } finally {
        set_api_loading(false)
      }
    }

    void load_config()
  }, [])

  // 点击其他地方关闭日志卡片
  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (log_card_ref.current && !log_card_ref.current.contains(event.target as Node)) {
        set_show_logs(false)
      }
    }

    document.addEventListener('mousedown', handle_click_outside)
    return () => {
      document.removeEventListener('mousedown', handle_click_outside)
    }
  }, [])

  const handle_wecom_login = async () => {
    add_log('开始企业微信扫码登录...')
    try {
      if (!api_loading) {
        await save_api_url()
      }
      const res = await window.electron_api.auth_wecom_login()
      add_log(`扫码登录响应: ${JSON.stringify(res, null, 2)}`)
      if (res.success && res.data) {
        await window.electron_api.config_set('remember_me', remember_me)
        const user_info = res.data.user
        add_log(`登录成功: ${user_info.username || 'wecom_user'}`)
        login({
          username: user_info.username || 'wecom_user',
          email: user_info.email || 'wecom_user@trai.local',
          role: user_info.role || 'user'
        })
        navigate('/')
      } else {
        const raw = String(res.error || '')
        add_log(`扫码登录失败: ${raw}`)
        set_error_msg(raw || '扫码登录失败')
      }
    } catch (err: any) {
      const raw = String(err?.message || '')
      add_log(`扫码登录异常: ${raw}`)
      set_error_msg(raw || '扫码登录异常')
    }
  }

  /**
   * 标准化的 API 地址
   */
  const normalized_api_url = useMemo(() => {
    const raw = api_url.trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return `http://${raw}`
  }, [api_url])

  /**
   * 保存 API 地址
   */
  const save_api_url = async () => {
    const next = normalized_api_url
    if (!next) {
      set_error_msg('服务地址不能为空')
      return
    }

    set_api_saving(true)
    try {
      const res = await window.electron_api.config_set('api_url', next)
      if (!res.success) {
        set_error_msg(res.error || '保存服务地址失败')
        return
      }
      set_api_url(next)
    } catch (err: any) {
      set_error_msg(err?.message || '保存服务地址失败')
    } finally {
      set_api_saving(false)
    }
  }

  /**
   * 处理表单提交
   * @param e 表单事件
   */
  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const now = Date.now()
    if (now - last_submit_time.current < 1000) {
      add_log('操作过于频繁, 已拦截 (防抖/节流)')
      return
    }
    last_submit_time.current = now

    const submit_password = password

    if (!username || !submit_password) {
      set_error_msg('用户名和密码不能为空')
      add_log('错误: 用户名和密码不能为空')
      return
    }

    add_log(`开始登录: 用户名=${username}, 密码长度=${submit_password.length}`)
    add_log(`服务地址: ${normalized_api_url}`)

    try {
      if (!api_loading) {
        add_log('保存服务地址...')
        await save_api_url()
      }
      add_log('调用登录接口...')
      const res = await window.electron_api.auth_login({ username, password: submit_password })
      add_log(`登录响应: ${JSON.stringify(res, null, 2)}`)
      if (res.success && res.data) {
        await window.electron_api.config_set('remember_me', remember_me)
        const user_info = res.data.user
        add_log(`登录成功: ${user_info.username || username}`)
        login({
          username: user_info.username || username,
          email: user_info.email || `${username}@trai.local`,
          role: user_info.role || 'user'
        })
        navigate('/')
      } else {
        const raw = String(res.error || '')
        add_log(`登录失败: ${raw}`)
        if (raw.includes('用户名或密码错误') || raw.includes('401')) {
          set_error_msg('密码错误, 请联系邮箱: wuhaotongxue@gmail.com')
        } else {
          set_error_msg(raw || '登录失败, 请检查用户名和密码')
        }
      }
    } catch (err: any) {
      const raw = String(err?.message || '')
      add_log(`登录异常: ${raw}`)
      if (raw.includes('401')) {
        set_error_msg('密码错误, 请联系邮箱: wuhaotongxue@gmail.com')
      } else {
        set_error_msg(raw || '登录异常')
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--ui_bg)', overflow: 'hidden' }}>
      {/* 自定义标题栏 */}
      <div
        className="drag-region"
        style={{
          height: '36px',
          width: '100%',
          backgroundColor: 'var(--ui_panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '12px',
          color: 'var(--ui_text)',
          boxSizing: 'border-box',
          borderBottom: '1px solid var(--ui_border)',
          position: 'relative',
          zIndex: 1000,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./kity.png" alt="logo" style={{ width: '16px', height: '16px' }} />
          <span style={{ fontWeight: '500' }}>TRAI</span>
          <button
            className="no-drag-region"
            type="button"
            title="刷新"
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--ui_panel_alt)',
              border: '1px solid var(--ui_border)',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ui_text)'
            }}
          >
            <RotateCw size={14} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="no-drag-region"
              type="button"
              title={show_logs ? '隐藏日志' : '显示日志'}
              onClick={() => set_show_logs(!show_logs)}
              style={{
                background: 'var(--ui_panel_alt)',
                border: '1px solid var(--ui_border)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ui_text)'
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
                  top: '40px',
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
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px'
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
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      清除
                    </button>
                    <button
                      className="no-drag-region"
                      type="button"
                      onClick={() => set_show_logs(false)}
                      title="关闭"
                      style={{
                        background: 'none',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      关闭
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', padding: '0 8px' }}>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
                    ))
                  ) : (
                    <div style={{ color: '#666' }}>暂无日志</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'var(--ui_panel)', padding: '40px', borderRadius: '8px', width: '61.8%', minWidth: '400px', maxWidth: '600px', border: '1px solid var(--ui_border)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: 'var(--ui_text)', textAlign: 'center', margin: '0 0 24px 0', fontWeight: '600' }}>TRAI</h2>
          <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--ui_text)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => set_username(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                placeholder="请输入用户名"
                onFocus={(e) => e.target.style.border = '1px solid var(--ui_accent)'}
                onBlur={(e) => e.target.style.border = '1px solid var(--ui_border)'}
              />
            </div>
            <div>
              <label style={{ color: 'var(--ui_text)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>密码</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={password_visible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    set_password(e.target.value)
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--ui_accent)'
                  }}
                  onBlur={(e) => e.target.style.border = '1px solid var(--ui_border)'}
                  style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '4px', border: '1px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)', color: 'var(--ui_text)', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => {
                    set_password_visible((v) => !v)
                  }}
                  title={password_visible ? '隐藏密码' : '显示密码'}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--ui_text_muted)'
                  }}
                >
                  {password_visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error_msg && (
              <div
                style={{
                  color: 'var(--ui_danger)',
                  fontSize: '12px',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  padding: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '4px'
                }}
              >
                {error_msg}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember_me"
                checked={remember_me}
                onChange={(e) => set_remember_me(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="remember_me" style={{ color: 'var(--ui_text)', fontSize: '14px', cursor: 'pointer' }}>
                保存登录状态 (免扫码)
              </label>
            </div>
            <button type="submit" style={{ backgroundColor: 'var(--ui_accent)', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px', fontWeight: 'normal', fontSize: '14px' }}>
              登录
            </button>
            <button type="button" onClick={handle_wecom_login} style={{ backgroundColor: 'var(--ui_panel)', color: 'var(--ui_accent)', padding: '10px', borderRadius: '4px', border: '1px solid var(--ui_accent)', cursor: 'pointer', marginTop: '4px', fontWeight: 'normal', fontSize: '14px' }}>
              企业微信扫码登录
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ color: 'var(--ui_accent)', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/register')}>
                没有账号? 去注册
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
