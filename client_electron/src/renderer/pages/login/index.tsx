/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端登录页面
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { use_auth_store } from '@/store/auth'
import TitleBar from '@/components/layout/title_bar'

const Login: React.FC = () => {
  const [username, set_username] = useState('admin')
  const [password, set_password] = useState('admin123')
  const [error_msg, set_error_msg] = useState('')
  const navigate = useNavigate()
  const login = use_auth_store((state) => state.login)

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      set_error_msg('用户名和密码不能为空')
      return
    }

    try {
      const res = await window.electron_api.auth_login({ username, password })
      if (res.success && res.data) {
        // 登录成功
        const user_info = res.data.user
        login({ 
          username: user_info.username || username, 
          email: user_info.email || `${username}@trai.local`, 
          role: user_info.role || 'user' 
        })
        navigate('/')
      } else {
        set_error_msg(res.error || '登录失败，请检查用户名和密码')
      }
    } catch (err: any) {
      set_error_msg(err.message || '登录异常')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f3f3', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', width: '320px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: '#202020', textAlign: 'center', margin: '0 0 24px 0', fontWeight: '600' }}>TRAI 客户端</h2>
          <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <input
                type="password"
                value={password}
                onChange={(e) => set_password(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                placeholder="请输入密码"
                onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
              />
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
