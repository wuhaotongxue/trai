/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-14 08:12:51
 * 描述: 客户端工具箱页面，提供文件处理功能
 */
import React, { useState } from 'react'

const Tools: React.FC = () => {
  const [loading, set_loading] = useState(false)
  const [result_url, set_result_url] = useState('')
  const [error_msg, set_error_msg] = useState('')

  const handle_md_to_pdf = async () => {
    // 创建一个隐藏的 input 用于选择文件
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading(true)
      set_error_msg('')
      set_result_url('')
      
      try {
        // file.path 是 Electron 特有的属性，包含文件的绝对路径
        const res = await window.electron_api.tools_convert_md_to_pdf(file.path)
        if (res.success && res.data) {
          set_result_url(res.data.url)
        } else {
          set_error_msg(res.error || '转换失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '转换异常')
      } finally {
        set_loading(false)
      }
    }
    input.click()
  }

  const handle_compress_image = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      set_loading(true)
      set_error_msg('')
      set_result_url('')
      
      try {
        const res = await window.electron_api.tools_compress_image(file.path, 60)
        if (res.success && res.data) {
          set_result_url(res.data.url)
        } else {
          set_error_msg(res.error || '压缩失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '压缩异常')
      } finally {
        set_loading(false)
      }
    }
    input.click()
  }

  const handle_compress_zip = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files)
      if (files.length === 0) return
      
      set_loading(true)
      set_error_msg('')
      set_result_url('')
      
      try {
        // @ts-ignore
        const file_paths = files.map(f => f.path)
        const res = await window.electron_api.tools_compress_files_to_zip(file_paths)
        if (res.success && res.data) {
          set_result_url(res.data.url)
        } else {
          set_error_msg(res.error || '打包失败')
        }
      } catch (err: any) {
        set_error_msg(err.message || '打包异常')
      } finally {
        set_loading(false)
      }
    }
    input.click()
  }

  return (
    <div>
      <h1 style={{ color: '#202020', marginTop: 0 }}>工具箱</h1>
      <p style={{ color: 'rgba(0, 0, 0, 0.6)' }}>常用文件处理与转换</p>
      
      <div style={{
        marginTop: '24px',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={handle_md_to_pdf} 
            disabled={loading}
            style={{ padding: '10px 16px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Markdown 转 PDF
          </button>
          
          <button 
            onClick={handle_compress_image} 
            disabled={loading}
            style={{ padding: '10px 16px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            图片压缩
          </button>
          
          <button 
            onClick={handle_compress_zip} 
            disabled={loading}
            style={{ padding: '10px 16px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            多文件 ZIP 打包
          </button>
        </div>

        {loading && <div style={{ color: '#0078d4' }}>处理中，请稍候...</div>}
        {error_msg && <div style={{ color: '#e51400' }}>{error_msg}</div>}
        {result_url && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f9fd', border: '1px solid #cce5ff', borderRadius: '4px' }}>
            <div style={{ color: '#0078d4', fontWeight: 'bold', marginBottom: '8px' }}>处理成功！</div>
            <a href={result_url} target="_blank" rel="noreferrer" style={{ color: '#0078d4', wordBreak: 'break-all' }}>
              点击此处下载处理后的文件 (链接 5 分钟内有效)
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tools
