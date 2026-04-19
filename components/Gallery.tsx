// components/Gallery.tsx
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Lightbox from './Lightbox'
import type { ImageItem } from '@/lib/image-loader'

const ITEMS_PER_PAGE = 12
const PRELOAD_THRESHOLD = 200

// 1. 辅助函数：格式化标题，自动过滤 undefined
const formatTitle = (category: ImageItem['category']) => {
  return [category.l1, category.l2, category.l3]
    .filter(Boolean) // 过滤掉 undefined, null, 空字符串
    .join(' - ')
}

export default function Gallery({ images }: { images: ImageItem[] }) {
  const [selected, setSelected] = useState<ImageItem | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [filters, setFilters] = useState({ l1: '全部', l2: '全部', l3: '全部' })
  
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 2. 数据过滤 + 标题清洗
  const rawFiltered = images.filter(img => 
    (filters.l1 === '全部' || img.category.l1 === filters.l1) &&
    (filters.l2 === '全部' || img.category.l2 === filters.l2) &&
    (filters.l3 === '全部' || img.category.l3 === filters.l3)
  )

  const filtered = rawFiltered.map(img => ({
    ...img,
    title: formatTitle(img.category)
  }))

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [filters])

  // 3. 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setIsLoading(true)
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filtered.length))
            setIsLoading(false)
          }, 300)
        }
      },
      { root: containerRef.current, rootMargin: `${PRELOAD_THRESHOLD}px` }
    )

    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [filtered.length, isLoading])

  // 4. 获取筛选选项（依然保持过滤 undefined 的逻辑）
  const getOptions = (level: 1|2|3, data = filtered) => {
    let rawValues: (string | undefined | null)[] = []

    if (level === 1) {
      rawValues = images.map(i => i.category.l1)
    } else if (level === 2) {
      rawValues = data
        .filter(i => filters.l1 === '全部' || i.category.l1 === filters.l1)
        .map(i => i.category.l2)
    } else {
      rawValues = data
        .filter(i => 
          (filters.l1 === '全部' || i.category.l1 === filters.l1) &&
          (filters.l2 === '全部' || i.category.l2 === filters.l2)
        )
        .map(i => i.category.l3)
    }

    const uniqueValidValues = Array.from(new Set(rawValues)).filter((val): val is string => !!val)
    return ['全部', ...uniqueValidValues]
  }

  const handleLightbox = (idx: number) => {
    setLightboxIdx(idx)
    setSelected(filtered[idx])
  }

  useEffect(() => {
    const handler = (e: Event) => handleLightbox((e as CustomEvent).detail)
    window.addEventListener('lightbox-change', handler as EventListener)
    return () => window.removeEventListener('lightbox-change', handler as EventListener)
  }, [filtered])

  const setFilter = (level: 1|2|3, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [`l${level}`]: value }
      // 级联重置：选 L1 重置 L2/L3，选 L2 重置 L3
      if (level === 1) { next.l2 = '全部'; next.l3 = '全部' }
      if (level === 2) next.l3 = '全部'
      return next
    })
  }

  const visibleImages = filtered.slice(0, visibleCount)

  return (
    <>
      <div className="mb-6 space-y-2">
        {[1, 2, 3].map(level => {
          const options = getOptions(level as 1|2|3)
          const value = filters[`l${level}` as keyof typeof filters]
          
          // 🔥 恢复级联逻辑：
          // 1. 如果上一级选的是"全部"，则隐藏当前级（L1选全部，隐藏L2；L2选全部，隐藏L3）
          if (level > 1 && filters[`l${level-1}` as keyof typeof filters] === '全部') return null
          
          // 2. 如果当前级没有有效选项（只有"全部"），也不显示
          if (options.length <= 1) return null

          return (
            <div key={level} className="flex flex-wrap gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[2rem]">L{level}：</span>
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setFilter(level as 1|2|3, opt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    value === opt 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )
        })}
        
        <div className="text-sm text-gray-500 pt-1">
          显示 <span className="font-semibold text-blue-600">{visibleImages.length}</span> / {filtered.length}
          {visibleCount < filtered.length && ` (已加载 ${visibleCount})`}
        </div>
      </div>

      <div ref={containerRef} className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 min-h-[400px]">
        {visibleImages.map((img, idx) => (
          <div
            key={img.id}
            className="break-inside-avoid cursor-pointer group mb-4"
            onClick={() => { setSelected(img); setLightboxIdx(idx) }}
          >
            <div className="relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
              <Image
                src={img.src}
                alt={img.title}
                width={600}
                height={800}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized={true}
                priority={idx < 8}
                loading={idx < 8 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            {/* 显示清洗后的标题 */}
            <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
              {img.title}
            </p>
          </div>
        ))}

        {visibleCount < filtered.length && (
          <div ref={observerTarget} className="col-span-full flex justify-center py-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>加载更多...</span>
              </div>
            ) : (
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filtered.length))}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                加载更多 ({filtered.length - visibleCount} 张)
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-gray-500 text-lg">暂无图片</p>
            <button
              onClick={() => setFilters({ l1: '全部', l2: '全部', l3: '全部' })}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              清除筛选
            </button>
          </div>
        )}
      </div>

      {selected && (
        <Lightbox
          images={filtered}
          currentIndex={lightboxIdx}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}