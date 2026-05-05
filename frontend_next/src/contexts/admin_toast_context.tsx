/**
 * admin_toast_context.tsx
 * 作者: wuhao
 * 日期: 2026-04-24
 * 描述: Admin 全局 Toast 上下文,所有子页面共享同一份 toast 状态
 */

"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface AdminToast {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
}

type AdminToastContextType = {
  toasts: AdminToast[];
  toast: (opts: { message: string; variant?: ToastVariant; title?: string; duration?: number }) => void;
  dismiss: (id: string) => void;
};

const AdminToastContext = createContext<AdminToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback(
    (opts: { message: string; variant?: ToastVariant; title?: string; duration?: number }) => {
      const id = `admin-toast-${++counterRef.current}`;
      const newToast: AdminToast = {
        id,
        title: opts.title,
        message: opts.message,
        variant: opts.variant || "info",
      };
      setToasts((prev) => [...prev, newToast]);

      const duration = opts.duration ?? 3500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AdminToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  return {
    toasts: ctx.toasts.map((t) => ({ ...t, onDismiss: () => ctx.dismiss(t.id) })),
    toast: ctx.toast,
    dismiss: ctx.dismiss,
  };
}
