/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 设置页面组件 - 三段式布局
 */
import React, { useState, useEffect, useRef } from 'react'
import { use_auth_store } from '@/store/auth'
import { User, Upload, KeyRound, Save, Settings as SettingsIcon, Monitor, ChevronRight, Globe, RefreshCw, PanelLeftClose, PanelLeftOpen, List } from 'lucide-react'

interface SettingItem {
  id: string
  name: string
  icon: React.ReactNode
  category: 'system' | 'account'
}

const Settings: React.FC = () => {
  const [is_left_sidebar_open, set_is_left_sidebar_open] = useState(true)
  const [is_middle_sidebar_open, set_is_middle_sidebar_open] = useState(true)
  const [active_category, set_active_category] = useState<'system' | 'account'>('system')
  const [active_item, set_active_item] = useState<string>('api_config')

  const user = use_auth_store((state) => state.user)

  const [api_url, set_api_url] = useState('http://127.0.0.1:5666')
  const [saved, set_saved] = useState(false)
  const [update_status, set_update_status] = useState<string>('')
  const [is_checking, set_is_checking] = useState(false)
  const [has_update, set_has_update] = useState(false)
  const [current_version, set_current_version] = useState('')

  const [old_password, set_old_password] = useState('')
  const [new_password, set_new_password] = useState('')
  const [confirm_password, set_confirm_password] = useState('')
  const [pwd_msg, set_pwd_msg] = useState({ type: '', text: '' })
  
  const [avatar_preview, set_avatar_preview] = useState<string | null>(null)
  const file_input_ref = useRef<HTMLInputElement>(null)

  const setting_items: SettingItem[] = [
    { id: 'api_config', name: '网络配置', icon: <Globe size={16} />, category: 'system' },
    { id: 'update', name: '系统更新', icon: <RefreshCw size={16} />, category: 'system' },
    { id: 'avatar', name: '头像设置', icon: <Upload size={16} />, category: 'account' },
    { id: 'password', name: '修改密码', icon: <KeyRound size={16} />, category: 'account' }
  ]

  const filtered_items = setting_items.filter(item => item.category === active_category)

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
      const res = await window.electron_api.auth_change_password({ old_password, new_password })
      if (!res.success) {
        set_pwd_msg({ type: 'error', text: res.error || '密码修改失败' })
        return
      }
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
    }
    reader.readAsDataURL(file)
  }

  const trigger_file_select = () => {
    file_input_ref.current?.click()
  }

  const handle_category_change = (category: 'system' | 'account') => {
    set_active_category(category)
    const first_item = setting_items.find(item => item.category === category)
    if (first_item) {
      set_active_item(first_item.id)
    }
  }

  const render_content = () => {
    switch (active_item) {
      case 'api_config':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>网络配置</h2>
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
        )
      case 'update':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600' }}>系统更新</h2>
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
        )
      case 'avatar':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  title="选择头像图片"
                  aria-label="选择头像图片"
                  placeholder="选择头像图片"
                />
                <button 
                  type="button"
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
        )
      case 'password':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#202020', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        )
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={20} color="#0ea5e9" />
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '14px', fontWeight: 600 }}>设置</h1>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '10%' : '0px',
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: '#f1f5f9',
          borderRight: is_left_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>设置分类</span>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起设置分类栏"
              aria-label="收起设置分类栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', paddingLeft: '8px' }}>设置分类</div>
            <button
              onClick={() => handle_category_change('system')}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: active_category === 'system' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: active_category === 'system' ? '#0ea5e9' : '#475569',
                fontWeight: active_category === 'system' ? '600' : 'normal',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <Monitor size={16} />
              系统
            </button>
            <button
              onClick={() => handle_category_change('account')}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: active_category === 'account' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: active_category === 'account' ? '#0ea5e9' : '#475569',
                fontWeight: active_category === 'account' ? '600' : 'normal',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <User size={16} />
              账号
            </button>
          </div>
        </div>

        <div style={{
          width: is_middle_sidebar_open ? '12%' : '0px',
          minWidth: is_middle_sidebar_open ? '70px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: '#ffffff',
          borderRight: is_middle_sidebar_open ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开设置分类栏"
                  aria-label="展开设置分类栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s',
                    marginRight: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={18} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                {active_category === 'system' ? '系统' : '账号'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => set_is_middle_sidebar_open(false)}
              title="收起设置项栏"
              aria-label="收起设置项栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={18} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', minWidth: '200px', boxSizing: 'border-box' }}>
            {filtered_items.map(item => (
              <button
                key={item.id}
                onClick={() => set_active_item(item.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: active_item === item.id ? '#f0f9ff' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: active_item === item.id ? '#0ea5e9' : '#475569',
                  fontWeight: active_item === item.id ? '600' : 'normal',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  {item.name}
                </div>
                {active_item === item.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' }}>
            {render_content()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
