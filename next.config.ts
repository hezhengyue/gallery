// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // 🔥 静态导出，兼容 EdgeOne / 任何静态托管
  output: 'export',
  
  images: {
    // 🔥 关键：禁用图片优化（边缘环境不支持 /_next/image API）
    unoptimized: true,
  },
}

export default nextConfig