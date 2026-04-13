/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 客户端注册页面
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Register: React.FC = () => {
  const [username, set_username] = useState('')
  const [password, set_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [error_msg, set_error_msg] = useState('')
  const navigate = useNavigate()

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      set_error_msg('用户名和密码不能为空')
      return
    }

    if (password !== confirm_password) {
      set_error_msg('两次密码输入不一致')
      return
    }

    // 模拟注册成功并返回登录页
    alert('注册成功, 请登录')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '8px', width: '320px', border: '1px solid #334155' }}>
        <h2 style={{ color: '#e2e8f0', textAlign: 'center', margin: '0 0 24px 0' }}>注册 TRAI 账号</h2>
        <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => set_username(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#e2e8f0', boxSizing: 'border-box' }}
              placeholder="请输入新用户名"
            />
          </div>
          <div>
            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => set_password(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#e2e8f0', boxSizing: 'border-box' }}
              placeholder="请设置密码"
            />
          </div>
          <div>
            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '8px', fontSize: '14px' }}>确认密码</label>
            <input
              type="password"
              value={confirm_password}
              onChange={(e) => set_confirm_password(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#e2e8f0', boxSizing: 'border-box' }}
              placeholder="请再次输入密码"
            />
          </div>
          {error_msg && <div style={{ color: '#ef4444', fontSize: '12px' }}>{error_msg}</div>}
          <button type="submit" style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}>
            注 册
          </button>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
              已有账号? 返回登录
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
