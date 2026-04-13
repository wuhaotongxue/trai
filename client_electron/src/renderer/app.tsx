/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: UI 渲染层主组件
 */
import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

// 拓展 window 对象类型


const App: React.FC = () => {
  return <RouterProvider router={router} />
}

export default App
