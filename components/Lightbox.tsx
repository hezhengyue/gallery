'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import type { ImageItem } from '@/lib/image-loader'

export default function Lightbox({ 
  images, 
  currentIndex, 
  onClose 
}: { 
  images: ImageItem[]
  currentIndex: number
  onClose: () => void
}) {
  const img = images[currentIndex]
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const preloadCache = useRef<Set<string>>(new Set())

  // 🔥 预加载前后 3 张图片
  const preloadImages = useCallback((idx: number) => {
    for (let i = -3; i <= 3; i++) {
      const target = (idx + i + images.length) % images.length
      const src = images[target].src
      if (!preloadCache.current.has(src)) {
        preloadCache.current.add(src)
        const el = new (window as any).Image()
        el.src = src
      }
    }
  }, [images])

  useEffect(() => { preloadImages(currentIndex) }, [currentIndex, preloadImages])

  // 🔥 切换逻辑（修复点击无效问题）
  const nav = useCallback((dir: number) => {
    setOpacity(0.3) // 快速变暗过渡，避免黑屏感
    setScale(1)
    setPosition({ x: 0, y: 0 })
    const next = (currentIndex + dir + images.length) % images.length
    // ⚠️ 关键：必须通知父组件更新索引
    window.dispatchEvent(new CustomEvent('lightbox-change', { detail: next }))
  }, [currentIndex, images.length])

  // 图片加载完成后恢复不透明度
  const handleImageLoad = () => setOpacity(1)

  // 缩放控制
  const zoomIn = () => setScale(p => Math.min(p * 1.25, 4))
  const zoomOut = () => setScale(p => Math.max(p / 1.25, 0.25))
  const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }) }

  // 🔥 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    e.stopPropagation()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || scale <= 1) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const maxX = (rect.width * scale - rect.width) / 2
    const maxY = (rect.height * scale - rect.height) / 2
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, e.clientX - dragStart.x)),
      y: Math.max(-maxY, Math.min(maxY, e.clientY - dragStart.y))
    })
  }, [isDragging, dragStart, scale])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 触摸支持
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y })
    e.stopPropagation()
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || scale <= 1) return
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const maxX = (rect.width * scale - rect.width) / 2
    const maxY = (rect.height * scale - rect.height) / 2
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, e.touches[0].clientX - dragStart.x)),
      y: Math.max(-maxY, Math.min(maxY, e.touches[0].clientY - dragStart.y))
    })
  }, [isDragging, dragStart, scale])

  const handleTouchEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (isDragging && scale > 1) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      return () => {
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, scale, handleTouchMove, handleTouchEnd])

  // 键盘控制
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') nav(-1)
      if (e.key === 'ArrowRight') nav(1)
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === '0') resetZoom()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, nav])

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onWheel={handleWheel}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 图片容器（带平滑过渡） */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-opacity duration-200"
          style={{
            opacity,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out, opacity 0.2s ease'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <Image
            src={img.src}
            alt={img.title}
            width={1600}
            height={1200}
            className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl select-none"
            priority
            draggable={false}
            onLoad={handleImageLoad}
          />
        </div>

        {/* 左侧按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); nav(-1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all hover:scale-110 text-2xl font-bold z-10"
        >
          ‹
        </button>

        {/* 右侧按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); nav(1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all hover:scale-110 text-2xl font-bold z-10"
        >
          ›
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full text-gray-900 shadow-lg hover:scale-110 transition-all text-xl font-bold z-10"
        >
          ×
        </button>

        {/* 底部控制栏 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl text-center">
            <p className="text-white text-lg font-medium">{img.title}</p>
            <p className="text-gray-400 text-sm mt-1">{currentIndex + 1} / {images.length}</p>
          </div>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl">
            <button onClick={(e) => { e.stopPropagation(); zoomOut() }} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all text-lg font-bold">−</button>
            <span className="text-white text-sm font-mono min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={(e) => { e.stopPropagation(); zoomIn() }} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all text-lg font-bold">+</button>
            <button onClick={(e) => { e.stopPropagation(); resetZoom() }} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-lg transition-all text-xs font-bold ml-2">⟲</button>
          </div>
          <p className="text-gray-500 text-xs">滚轮缩放 • 拖拽移动 • ← → 切换 • ESC 关闭</p>
        </div>
      </div>
    </div>
  )
}