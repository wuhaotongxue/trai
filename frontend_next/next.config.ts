import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移除 output: "export" 以启用热重载和 WebSocket 功能
  allowedDevOrigins: ["192.168.100.119", "localhost", "192.168.98.72", "192.168.98.183"],
  async rewrites() {
    return [
      {
        source: "/api_trai/:path*",
        destination: "http://localhost:5666/api_trai/:path*",
      },
    ];
  },
};

export default nextConfig;
