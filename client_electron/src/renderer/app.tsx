/**
 * 文件名: app.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: UI 渲染层主组件
 */
import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { setup_axios_interceptors } from './utils/axios_interceptor'

// 拓展 window 对象类型


const App: React.FC = () => {
  useEffect(() => {
    setup_axios_interceptors()
  }, [])

  return <RouterProvider router={router} />
}

export default App
