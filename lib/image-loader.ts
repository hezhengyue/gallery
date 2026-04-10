import fs from 'fs'
import path from 'path'
import { CATEGORIES } from '@/config/gallery-config'

const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export interface ImageItem {
  id: number
  src: string
  title: string
  category: { l1: string; l2: string; l3: string }
}

export function loadImages(): ImageItem[] {
  const publicDir = path.join(process.cwd(), 'public')
  const images: ImageItem[] = []
  let id = 1

  CATEGORIES.forEach(({ label, path: folderPath }) => {
    const [l1, l2, l3] = label.split('-').map(s => s.trim())
    const dir = path.join(publicDir, 'images', folderPath)
    
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ 跳过不存在的目录: ${folderPath}`)
      return
    }

    fs.readdirSync(dir)
      .filter(f => IMG_EXTS.includes(path.extname(f).toLowerCase()))
      .forEach(filename => {
        images.push({
          id: id++,
          src: `/images/${folderPath}/${filename}`,
          title: `${l1} - ${l2} - ${l3}`,
          category: { l1, l2, l3 }
        })
      })
  })

  return images
}