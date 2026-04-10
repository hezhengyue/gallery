import Gallery from '@/components/Gallery'
import { loadImages } from '@/lib/image-loader'
import { Metadata } from 'next'  // 👈 导入 Metadata 类型

// 🔥 导出 metadata 对象（服务端执行）
export const metadata: Metadata = {
  title: '正月画廊',
  description: '浏览精选摄影作品，支持分类筛选和沉浸式预览',
  keywords: ['摄影', '作品集', '画廊', '图片展示'],
  authors: [{ name: '正月' }],
  openGraph: {
    title: '我的作品集 | Gallery',
    description: '浏览精选摄影作品',
    type: 'website',
    locale: 'zh_CN',
  },
}

export default function Home() {
  const images = loadImages() // 服务端执行，客户端无感知
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">正月画廊</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">共 {images.length} 张图片</p>
        <Gallery images={images} />
      </div>
    </main>
  )
}