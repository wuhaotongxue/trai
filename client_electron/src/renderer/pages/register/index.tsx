/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端注册页面
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TitleBar from '@/components/layout/title_bar'

const Register: React.FC = () => {
  const [username, set_username] = useState('')
  const [email, set_email] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const navigate = useNavigate()

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !email || !password) {
      set_error_msg('用户名、邮箱和密码不能为空')
      return
    }

    if (password !== confirm_password) {
      set_error_msg('两次密码输入不一致')
      return
    }

    try {
      const res = await window.electron_api.auth_register({ username, email, password })
      if (res.success) {
        alert('注册成功, 请登录')
        navigate('/login')
      } else {
        set_error_msg(res.error || '注册失败')
      }
    } catch (err: any) {
      set_error_msg(err.message || '注册异常')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f3f3', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', width: '320px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ color: '#202020', textAlign: 'center', margin: '0 0 24px 0', fontWeight: '600' }}>注册 TRAI 账号</h2>
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
              <label style={{ color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => set_email(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                placeholder="请输入邮箱"
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
            <div>
              <label style={{ color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '8px', fontSize: '14px' }}>确认密码</label>
              <input
                type="password"
                value={confirm_password}
                onChange={(e) => set_confirm_password(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', color: '#202020', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}
                placeholder="请再次输入密码"
                onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
              />
            </div>
            {error_msg && <div style={{ color: '#e51400', fontSize: '12px' }}>{error_msg}</div>}
            <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px', fontWeight: 'normal', fontSize: '14px' }}>
              注册
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span style={{ color: '#0078d4', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                已有账号? 去登录
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
