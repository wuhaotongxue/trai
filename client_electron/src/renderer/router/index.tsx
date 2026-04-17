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
import AgentChat from '@/pages/chat'
import KnowledgeBasePage from '@/pages/knowledge_base'
import UnderDevelopment from '@/pages/under_development'
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
        element: <UnderDevelopment />
      },
      {
        path: '/chat',
        element: <AgentChat />
      },
      {
        path: '/ai/text-to-image',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/image-to-image',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/music',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/video',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/report',
        element: <UnderDevelopment />
      },
      {
        path: '/ai/comfyui',
        element: <UnderDevelopment />
      },
      {
        path: '/agent/management',
        element: <UnderDevelopment />
      },
      {
        path: '/knowledge_base',
        element: <KnowledgeBasePage />
      },
      {
        path: '/tools',
        element: <UnderDevelopment />
      },
      {
        path: '/feedback',
        element: <UnderDevelopment />
      },
      {
        path: '/settings',
        element: <UnderDevelopment />
      }
    ]
  }
])
