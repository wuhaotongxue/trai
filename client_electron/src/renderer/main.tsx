/**
 * 文件名: main.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: React 应用挂载入口
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import './styles/global.css'

console.log('[main] main.tsx loading...')
console.log('[main] App imported:', App)

const root = document.getElementById('root')
console.log('[main] root element:', root)

ReactDOM.createRoot(root!).render(
  // 注意: 暂时禁用 StrictMode 以诊断白屏问题
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>
  <App />
)

console.log('[main] App rendered')
