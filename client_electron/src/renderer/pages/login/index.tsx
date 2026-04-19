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
  const [password, set_password] = useState('')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('http://127.0.0.1:5666')
  const [api_loading, set_api_loading] = useState(true)
  const [api_saving, set_api_saving] = useState(false)
  const [is_default_password, set_is_default_password] = useState(true)
  const [show_logs, set_show_logs] = useState(false)
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)
  const { logs, add_log, clear_logs } = use_log_store()
  const log_card_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load_config = async () => {
      try {
        const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
        if (res.success && typeof res.data === 'string' && res.data.trim()) {
          set_api_url(res.data.trim())
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

    const submit_password = is_default_password ? 'Tr@@2026...' : password

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f3f3', overflow: 'hidden' }}>
      {/* 自定义标题栏 */}
      <div
        className="drag-region"
        style={{
          height: '36px',
          width: '100%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          fontSize: '12px',
          color: '#333333',
          boxSizing: 'border-box',
          borderBottom: '1px solid #e0e0e0',
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
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333333'
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
                background: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#333333'
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
                  backgroundColor: '#ffffff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  padding: '8px',
                  overflow: 'auto',
                  zIndex: 1000
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '4px 8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: '#333' }}>系统日志</h3>
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
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', width: '400px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: '#202020', textAlign: 'center', margin: '0 0 24px 0', fontWeight: '600' }}>TRAI</h2>
          <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>服务地址</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={api_url}
                  onChange={(e) => set_api_url(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                  placeholder="http://127.0.0.1:5666"
                  onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                  disabled={api_loading || api_saving}
                />
                <button
                  type="button"
                  onClick={save_api_url}
                  disabled={api_loading || api_saving}
                  style={{ width: '72px', backgroundColor: '#f3f3f3', color: '#202020', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', cursor: (api_loading || api_saving) ? 'not-allowed' : 'pointer', fontWeight: 'normal', fontSize: '14px' }}
                >
                  {api_saving ? '保存中' : '保存'}
                </button>
              </div>
              <div style={{ marginTop: '6px', color: 'rgba(0, 0, 0, 0.5)', fontSize: '12px' }}>
                示例: 127.0.0.1:5666 或 http://192.168.98.72:5666
              </div>
            </div>
            <div>
              <label style={{ color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => set_username(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                placeholder="请输入用户名"
                onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>密码</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={password_visible ? 'text' : 'password'}
                  value={is_default_password ? '***************' : password}
                  onChange={(e) => {
                    set_password(e.target.value)
                    set_is_default_password(false)
                  }}
                  onFocus={(e) => {
                    set_is_default_password(false)
                    e.target.style.border = '1px solid #0078d4'
                  }}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                  style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (is_default_password) {
                      set_is_default_password(false)
                    }
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
                    color: 'rgba(0, 0, 0, 0.55)'
                  }}
                >
                  {password_visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error_msg && <div style={{ color: '#e51400', fontSize: '12px' }}>{error_msg}</div>}
            <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px', fontWeight: 'normal', fontSize: '14px' }}>
              登录
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ color: '#0078d4', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/register')}>
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
