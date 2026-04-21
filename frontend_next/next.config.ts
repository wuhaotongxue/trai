import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["192.168.98.183", "localhost", "192.168.98.72"],
};

export default nextConfig;
