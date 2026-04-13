/**
 * 文件名: main.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 17:05:00
 * 描述: React 应用挂载入口
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
