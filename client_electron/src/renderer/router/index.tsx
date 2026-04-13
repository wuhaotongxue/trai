/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 前端路由配置文件
 */
import React from 'react'
import { createHashRouter } from 'react-router-dom'
import MainLayout from '@/components/layout/main_layout'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Dashboard from '@/pages/dashboard'
import Settings from '@/pages/settings'

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
])
