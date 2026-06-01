import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移除 output: "export" 以启用热重载和 WebSocket 功能
  allowedDevOrigins: ["127.0.0.1", "192.168.100.119", "localhost", "192.168.98.72", "192.168.98.183"],
  async rewrites() {
    return [
      {
        source: "/api_trai/:path*",
        destination: "http://localhost:5666/api_trai/:path*",
      },
    ];
  },
  experimental: {
    proxyTimeout: 1000 * 60 * 10, // 设置代理超时时间为 10 分钟 (解决音乐生成等长耗时接口 socket hang up 的问题)
  },
};

export default nextConfig;
