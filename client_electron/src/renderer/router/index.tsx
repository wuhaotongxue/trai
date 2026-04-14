/**
 * 文件名: index.tsx
 * 作者: wuhao
 * 日期: 2026-04-13 18:15:00
 * 描述: 前端路由配置文件
 */
import React from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/components/layout/main_layout'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Dashboard from '@/pages/dashboard'
import Settings from '@/pages/settings'
import Tools from '@/pages/tools'
import { use_auth_store } from '@/store/auth'

// 需要认证的路由守卫
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const is_authenticated = use_auth_store((state) => state.is_authenticated)
  return is_authenticated ? <>{children}</> : <Navigate to="/login" replace />
}

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
    element: (
      <AuthRoute>
        <MainLayout />
      </AuthRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/tools',
        element: <Tools />
      },
      {
        path: '/settings',
        element: <Settings />
      }
    ]
  }
])
