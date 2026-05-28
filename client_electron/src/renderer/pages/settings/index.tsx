/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 设置页面组件 - 三段式布局
 */
import React, { useState, useEffect, useRef } from 'react'
import { use_auth_store } from '@/store/auth'
import { translate } from '@/i18n'
import { User, Upload, KeyRound, Settings as SettingsIcon, Monitor, ChevronRight, Globe, PanelLeftClose, PanelLeftOpen, List, RefreshCw } from 'lucide-react'
import { UpdatePanel } from './components'

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

  // 预设 API 地址选项
  const preset_urls = [
    { label: '本地开发', value: 'http://127.0.0.1:5666' },
    { label: '内网服务器', value: 'http://192.168.100.119:5666' },
    { label: '远程生产', value: 'https://trai.tuoren.com' },
  ]

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
    load_config()
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
      alert(translate('select_image_file'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(translate('image_size_limit'))
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
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ui_text)', margin: '0 0 8px 0' }}>后端 API 地址</h3>
              <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', margin: 0 }}>配置客户端连接的后端服务器地址</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
              
              {/* 预设快捷选项 */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {preset_urls.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => set_api_url(preset.value)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: api_url === preset.value ? 'var(--ui_accent)' : 'var(--ui_panel)',
                      color: api_url === preset.value ? 'white' : 'var(--ui_text)',
                      border: api_url === preset.value ? '1px solid var(--ui_accent)' : '1px solid var(--ui_border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      boxShadow: api_url === preset.value ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* 自定义输入框 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: 'var(--ui_text_muted)', fontWeight: 500 }}>自定义地址</label>
                <input
                  type="text"
                  value={api_url}
                  onChange={(e) => set_api_url(e.target.value)}
                  placeholder="例如: http://127.0.0.1:5666"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--ui_border)',
                    outline: 'none',
                    fontSize: '14px',
                    color: 'var(--ui_text)',
                    backgroundColor: 'var(--ui_panel)',
                    transition: 'border 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <button 
                type="button"
                onClick={handle_save}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--ui_accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.25)' }}
              >
                保存配置
              </button>
              {saved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--ui_success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</div>
                  <span style={{ color: 'var(--ui_success)', fontSize: '13px', fontWeight: 500 }}>保存成功，刷新页面后生效</span>
                </div>
              )}
            </div>
          </div>
        )
      case 'update':
        return <UpdatePanel autoCheck={false} />
      case 'avatar':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ui_text)', margin: '0 0 8px 0' }}>头像设置</h3>
              <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', margin: 0 }}>设置您的个人头像</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '24px', 
                backgroundColor: 'var(--ui_panel)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--ui_border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
              }}>
                {avatar_preview ? (
                  <img src={avatar_preview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.username === 'admin' ? (
                    <img src="./kity.png" alt="admin avatar" style={{ width: '80%', height: '80%', objectFit: 'cover', borderRadius: '20px' }} />
                  ) : (
                    <User size={48} color="var(--ui_text_muted)" />
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
                />
                <button 
                  type="button"
                  onClick={trigger_file_select}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--ui_accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.35)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.25)' }}
                >
                  <Upload size={16} />
                  选择新头像
                </button>
                <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', marginTop: '12px' }}>
                  支持 JPG、PNG 格式<br />大小不超过 2MB
                </p>
              </div>
            </div>
          </div>
        )
      case 'password':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ui_text)', margin: '0 0 8px 0' }}>修改密码</h3>
              <p style={{ fontSize: '13px', color: 'var(--ui_text_muted)', margin: 0 }}>更新您的账户密码</p>
            </div>
            <form onSubmit={handle_change_password} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '420px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--ui_text)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>原密码</label>
                <input 
                  type="password" 
                  value={old_password}
                  onChange={(e) => set_old_password(e.target.value)}
                  placeholder="请输入当前密码"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--ui_border)',
                    outline: 'none', fontSize: '14px', color: 'var(--ui_text)', transition: 'border 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                    backgroundColor: 'var(--ui_panel)'
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--ui_text)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>新密码</label>
                <input 
                  type="password" 
                  value={new_password}
                  onChange={(e) => set_new_password(e.target.value)}
                  placeholder="请输入新密码 (不少于6位)"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--ui_border)',
                    outline: 'none', fontSize: '14px', color: 'var(--ui_text)', transition: 'border 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                    backgroundColor: 'var(--ui_panel)'
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--ui_text)', display: 'block', marginBottom: '8px', fontWeight: 500 }}>确认新密码</label>
                <input 
                  type="password" 
                  value={confirm_password}
                  onChange={(e) => set_confirm_password(e.target.value)}
                  placeholder="请再次输入新密码"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--ui_border)',
                    outline: 'none', fontSize: '14px', color: 'var(--ui_text)', transition: 'border 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                    backgroundColor: 'var(--ui_panel)'
                  }}
                  onFocus={(e) => { e.target.style.border = '1px solid var(--ui_accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)' }}
                  onBlur={(e) => { e.target.style.border = '1px solid var(--ui_border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              
              {pwd_msg.text && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: pwd_msg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '10px',
                  border: `1px solid ${pwd_msg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: pwd_msg.type === 'error' ? 'var(--ui_danger)' : 'var(--ui_success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '11px', fontWeight: 700
                  }}>
                    {pwd_msg.type === 'error' ? '!' : '✓'}
                  </div>
                  <span style={{ color: pwd_msg.type === 'error' ? 'var(--ui_danger)' : 'var(--ui_success)', fontSize: '13px', fontWeight: 500 }}>
                    {pwd_msg.text}
                  </span>
                </div>
              )}
              
              <button 
                type="submit"
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--ui_accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.25)' }}
              >
                <KeyRound size={16} />
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--ui_panel)', position: 'relative' }}>
      <div className="drag-region" style={{ padding: '20px 24px', backgroundColor: 'var(--ui_panel)', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={20} color="var(--ui_accent)" />
          <span style={{ color: 'var(--ui_text)', fontSize: '14px', fontWeight: 600 }}>{active_category === 'system' ? '系统设置' : '账号设置'}</span>
        </div>
      </div>
      
      <div className="no-drag-region" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: is_left_sidebar_open ? '10%' : '0px',
          minWidth: is_left_sidebar_open ? '70px' : '0px',
          opacity: is_left_sidebar_open ? 1 : 0,
          backgroundColor: 'var(--ui_panel)',
          borderRight: is_left_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>设置分类</span>
            </div>
            <button
              type="button"
              onClick={() => set_is_left_sidebar_open(false)}
              title="收起设置分类栏"
              aria-label="收起设置分类栏"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', boxSizing: 'border-box' }}>
            <button
              onClick={() => handle_category_change('system')}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: active_category === 'system' ? 'var(--ui_accent)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: active_category === 'system' ? 'white' : 'var(--ui_text)',
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
              系统设置
            </button>
            <button
              onClick={() => handle_category_change('account')}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: active_category === 'account' ? 'var(--ui_accent)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: active_category === 'account' ? 'white' : 'var(--ui_text)',
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
              账号设置
            </button>
          </div>
        </div>

        <div style={{
          width: is_middle_sidebar_open ? '12%' : '0px',
          minWidth: is_middle_sidebar_open ? '70px' : '0px',
          opacity: is_middle_sidebar_open ? 1 : 0,
          backgroundColor: 'var(--ui_panel)',
          borderRight: is_middle_sidebar_open ? '1px solid var(--ui_border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          flexShrink: 1
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
              {!is_left_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_left_sidebar_open(true)}
                  title="展开设置分类栏"
                  aria-label="展开设置分类栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)', whiteSpace: 'nowrap' }}>
                {active_category === 'system' ? '系统设置' : '账号设置'}
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
                color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <List size={16} />
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
                  backgroundColor: active_item === item.id ? 'var(--ui_accent)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: active_item === item.id ? 'white' : 'var(--ui_text)',
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
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', display: 'flex', alignItems: 'center', backgroundColor: 'var(--ui_panel)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ui_text)' }}>
              {!is_middle_sidebar_open && (
                <button
                  type="button"
                  onClick={() => set_is_middle_sidebar_open(true)}
                  title="展开设置项栏"
                  aria-label="展开设置项栏"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--ui_text_muted)', borderRadius: '4px', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ui_border)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <List size={16} />
                </button>
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ui_text)' }}>
                {setting_items.find(item => item.id === active_item)?.name || '设置详情'}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--ui_panel)', minHeight: 0 }}>
            {render_content()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
