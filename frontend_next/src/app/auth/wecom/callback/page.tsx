/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-15
 * 描述: 企业微信授权登录前端回调页
 */

"use client";
import Cookies from "js-cookie";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      Cookies.set("token", accessToken);
      Cookies.set("refresh_token", refreshToken);

      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        if (payload.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/agent";
        }
      } catch {
        window.location.href = "/";
      }
    } else {
      router.replace("/login?error=wecom_auth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080c1a]">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
      <p className="text-slate-600 dark:text-slate-400">正在处理登录授权, 请稍候...</p>
    </div>
  );
}

export default function WeComCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080c1a]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">加载中...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
