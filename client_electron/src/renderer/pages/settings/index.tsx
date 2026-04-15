/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 设置页面组件
 */
import React, { useState, useEffect, useRef } from 'react'
import { use_auth_store } from '@/store/auth'
import { User, Upload, KeyRound, Save } from 'lucide-react'

const Settings: React.FC = () => {
  // 标签页状态
  const [active_tab, set_active_tab] = useState<'system' | 'account'>('system')

  // 系统设置状态
  const [api_url, set_api_url] = useState('http://127.0.0.1:8000')
  const [saved, set_saved] = useState(false)
  const [update_status, set_update_status] = useState<string>('')
  const [is_checking, set_is_checking] = useState(false)
  const [has_update, set_has_update] = useState(false)
  const [current_version, set_current_version] = useState('')

  // 个人账号状态
  const user = use_auth_store((state) => state.user)
  const [old_password, set_old_password] = useState('')
  const [new_password, set_new_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [pwd_msg, set_pwd_msg] = useState({ type: '', text: '' })
  
  const [avatar_preview, set_avatar_preview] = useState<string | null>(null)
  const file_input_ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load_config = async () => {
      if (window.electron_api?.config_get) {
        const res = await window.electron_api.config_get('api_url', 'http://127.0.0.1:5666')
        if (res.success) {
          set_api_url(res.data)
        }
      }
    }
    
    const load_version = async () => {
      if (window.electron_api?.app_get_version) {
        try {
          const v = await window.electron_api.app_get_version()
          set_current_version(v)
        } catch (e) {
          console.error('Failed to get app version', e)
        }
      }
    }
    
    load_config()
    load_version()
  }, [])

  const handle_save = async () => {
    if (window.electron_api?.config_set) {
      const res = await window.electron_api.config_set('api_url', api_url)
      if (res.success) {
        set_saved(true)
        setTimeout(() => set_saved(false), 2000)
      }
    }
  }

  const check_update = async () => {
    if (!window.electron_api?.app_check_update) return
    
    set_is_checking(true)
    set_update_status('正在检查更新...')
    set_has_update(false)
    
    try {
      const res = await window.electron_api.app_check_update()
      if (res.success && res.data) {
        set_has_update(true)
        set_update_status(`发现新版本: ${res.data.updateInfo.version}`)
      } else {
        set_update_status('当前已经是最新版本')
      }
    } catch (err) {
      set_update_status('检查更新失败, 请稍后再试')
      console.error(err)
    } finally {
      set_is_checking(false)
    }
  }

  const install_update = async () => {
    if (window.electron_api?.app_install_update) {
      set_update_status('正在准备重启安装...')
      await window.electron_api.app_install_update()
    }
  }

  const handle_change_password = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!old_password || !new_password || !confirm_password) {
      set_pwd_msg({ type: 'error', text: '请填写所有密码字段' })
      return
    }
    if (new_password !== confirm_password) {
      set_pwd_msg({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }
    if (new_password.length < 6) {
      set_pwd_msg({ type: 'error', text: '新密码长度不能少于6位' })
      return
    }
    
    try {
      // 占位逻辑: TODO 后续接通后端修改密码接口
      set_pwd_msg({ type: 'success', text: '密码修改成功' })
      set_old_password('')
      set_new_password('')
      set_confirm_password('')
      setTimeout(() => set_pwd_msg({ type: '', text: '' }), 3000)
    } catch (err: any) {
      set_pwd_msg({ type: 'error', text: err.message || '密码修改失败' })
    }
  }

  const handle_avatar_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 检查文件类型和大小 (如: 最大 2MB)
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      set_avatar_preview(event.target?.result as string)
      // 占位逻辑: TODO 后续调用上传头像接口
    }
    reader.readAsDataURL(file)
  }

  const trigger_file_select = () => {
    file_input_ref.current?.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '18px', fontWeight: 600 }}>系统设置</h1>
      </div>
      <div className="no-drag-region" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {/* 标签导航 */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
        <button
          onClick={() => set_active_tab('system')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: active_tab === 'system' ? '2px solid #0078d4' : '2px solid transparent',
            color: active_tab === 'system' ? '#0078d4' : 'rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: active_tab === 'system' ? '600' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          常规设置
        </button>
        <button
          onClick={() => set_active_tab('account')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: active_tab === 'account' ? '2px solid #0078d4' : '2px solid transparent',
            color: active_tab === 'account' ? '#0078d4' : 'rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: active_tab === 'account' ? '600' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          个人账号设置
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
        {active_tab === 'system' && (
          <>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>网络配置</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                <label style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.7)' }}>后端 API 地址</label>
                <input 
                  type="text" 
                  value={api_url}
                  onChange={(e) => set_api_url(e.target.value)}
                  placeholder="例如: http://127.0.0.1:8000"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#202020',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                />
                <button 
                  onClick={handle_save}
                  style={{
                    marginTop: '12px',
                    padding: '10px 16px',
                    backgroundColor: '#0078d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'normal',
                    alignSelf: 'flex-start'
                  }}
                >
                  保存配置
                </button>
                {saved && <span style={{ color: '#107c10', fontSize: '12px', marginTop: '8px' }}>保存成功</span>}
              </div>
            </div>

            <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <h2 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>系统更新</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.7)' }}>
                  当前版本: <span style={{ fontWeight: '500', color: '#202020' }}>v{current_version || '未知'}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    onClick={check_update}
                    disabled={is_checking}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: is_checking ? '#f3f2f1' : '#ffffff',
                      color: is_checking ? '#a19f9d' : '#202020',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '6px',
                      cursor: is_checking ? 'not-allowed' : 'pointer',
                      fontWeight: 'normal'
                    }}
                  >
                    {is_checking ? '检查中...' : '检查更新'}
                  </button>
                  
                  {has_update && (
                    <button 
                      onClick={install_update}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'normal'
                      }}
                    >
                      立即重启并安装
                    </button>
                  )}
                </div>
                
                {update_status && (
                  <span style={{ 
                    color: has_update ? '#0078d4' : 'rgba(0, 0, 0, 0.6)', 
                    fontSize: '13px' 
                  }}>
                    {update_status}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {active_tab === 'account' && (
          <>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0078d4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#202020', fontWeight: '600' }}>
                    {user?.username || '未登录'}
                  </h2>
                  <span style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.5)' }}>
                    {user?.email || '无邮箱'} · {user?.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', margin: '24px 0' }}></div>

              <h3 style={{ fontSize: '15px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} color="#0078d4" />
                头像设置
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: '#f3f2f1',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  {avatar_preview ? (
                    <img src={avatar_preview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.username === 'admin' ? (
                      <img src="./kity.png" alt="admin avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={32} color="#a19f9d" />
                    )
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={file_input_ref} 
                    onChange={handle_avatar_change} 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    onClick={trigger_file_select}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffffff',
                      color: '#202020',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f2f1'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    选择新头像
                  </button>
                  <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)', marginTop: '8px' }}>
                    支持 JPG、PNG 格式, 大小不超过 2MB
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
              <h3 style={{ fontSize: '15px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="#0078d4" />
                修改密码
              </h3>
              <form onSubmit={handle_change_password} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '6px' }}>原密码</label>
                  <input 
                    type="password" 
                    value={old_password}
                    onChange={(e) => set_old_password(e.target.value)}
                    placeholder="请输入当前密码"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)',
                      outline: 'none', fontSize: '14px', color: '#202020', transition: 'border 0.2s', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '6px' }}>新密码</label>
                  <input 
                    type="password" 
                    value={new_password}
                    onChange={(e) => set_new_password(e.target.value)}
                    placeholder="请输入新密码 (不少于6位)"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)',
                      outline: 'none', fontSize: '14px', color: '#202020', transition: 'border 0.2s', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.7)', display: 'block', marginBottom: '6px' }}>确认新密码</label>
                  <input 
                    type="password" 
                    value={confirm_password}
                    onChange={(e) => set_confirm_password(e.target.value)}
                    placeholder="请再次输入新密码"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(0, 0, 0, 0.1)',
                      outline: 'none', fontSize: '14px', color: '#202020', transition: 'border 0.2s', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #0078d4'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.1)'}
                  />
                </div>
                
                {pwd_msg.text && (
                  <span style={{ color: pwd_msg.type === 'error' ? '#e51400' : '#107c10', fontSize: '13px' }}>
                    {pwd_msg.text}
                  </span>
                )}
                
                <button 
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#0078d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  确认修改
                </button>
              </form>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}

export default Settings
