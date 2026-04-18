/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-16 10:11:04
 * 描述: 客户端登录页面
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { use_auth_store } from '@/store/auth'
import TitleBar from '@/components/layout/title_bar'

const Login: React.FC = () => {
  const [username, set_username] = useState('wuhao')
  const [password, set_password] = useState('')
  const [password_visible, set_password_visible] = useState(false)
  const [error_msg, set_error_msg] = useState('')
  const [api_url, set_api_url] = useState('http://127.0.0.1:5666')
  const [api_loading, set_api_loading] = useState(true)
  const [api_saving, set_api_saving] = useState(false)
  const [is_default_password, set_is_default_password] = useState(true)
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)

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

    const load_demo_account = async () => {
      try {
        const api_base = api_url.trim() ? (api_url.startsWith('http') ? api_url : `http://${api_url}`) : 'http://127.0.0.1:5666'
        const res = await fetch(`${api_base}/api/auth/demo`)
        if (res.ok) {
          const data = await res.json()
          set_username(data.username)
        }
      } catch (err) {
        console.error('加载 demo 账号失败:', err)
      }
    }

    void load_config()
    void load_demo_account()
  }, [api_url])

  const normalized_api_url = useMemo(() => {
    const raw = api_url.trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return `http://${raw}`
  }, [api_url])

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

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (is_default_password) {
      set_error_msg('请输入密码')
      return
    }

    if (!username || !password) {
      set_error_msg('用户名和密码不能为空')
      return
    }

    try {
      if (!api_loading) {
        await save_api_url()
      }
      const res = await window.electron_api.auth_login({ username, password })
      if (res.success && res.data) {
        const user_info = res.data.user
        login({
          username: user_info.username || username,
          email: user_info.email || `${username}@trai.local`,
          role: user_info.role || 'user'
        })
        navigate('/')
      } else {
        const raw = String(res.error || '')
        if (raw.includes('用户名或密码错误') || raw.includes('401')) {
          set_error_msg('密码错误, 请联系邮箱: wuhaotongxue@gmail.com')
        } else {
          set_error_msg(raw || '登录失败, 请检查用户名和密码')
        }
      }
    } catch (err: any) {
      const raw = String(err?.message || '')
      if (raw.includes('401')) {
        set_error_msg('密码错误, 请联系邮箱: wuhaotongxue@gmail.com')
      } else {
        set_error_msg(raw || '登录异常')
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f3f3', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', width: '320px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
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
