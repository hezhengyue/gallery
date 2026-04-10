import Gallery from '@/components/Gallery'
import { loadImages } from '@/lib/image-loader'

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