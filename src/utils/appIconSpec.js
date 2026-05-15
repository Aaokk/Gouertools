/**
 * Android launcher mipmaps（基线密度规范）
 */
export const ANDROIDMipmaps = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
]

export const ANDROID_PLAYSTORE_SIZE = 512

/** 每个像素边长对应文件名（多套槽位复用同一文件） */
export function iosIconFilename (px) {
  return `icon_${px}.png`
}

/** Xcode AppIcon.appiconset 槽位：(idiom, sizePt×pt, scale) → 像素边长 */
const IOS_SLOTS = [
  ['iphone', '20x20', '2x', 40],
  ['iphone', '20x20', '3x', 60],
  ['iphone', '29x29', '2x', 58],
  ['iphone', '29x29', '3x', 87],
  ['iphone', '40x40', '2x', 80],
  ['iphone', '40x40', '3x', 120],
  ['iphone', '60x60', '2x', 120],
  ['iphone', '60x60', '3x', 180],
  ['ipad', '20x20', '1x', 20],
  ['ipad', '20x20', '2x', 40],
  ['ipad', '29x29', '1x', 29],
  ['ipad', '29x29', '2x', 58],
  ['ipad', '40x40', '1x', 40],
  ['ipad', '40x40', '2x', 80],
  ['ipad', '76x76', '1x', 76],
  ['ipad', '76x76', '2x', 152],
  ['ipad', '83.5x83.5', '2x', 167],
  ['ios-marketing', '1024x1024', '1x', 1024],
]

export function iosUniquePixelSizes () {
  const s = new Set()
  for (const [, , , px] of IOS_SLOTS) s.add(px)
  return [...s].sort((a, b) => a - b)
}

export function buildIosContentsObject () {
  return {
    images: IOS_SLOTS.map(([idiom, size, scale, px]) => ({
      filename: iosIconFilename(px),
      idiom,
      scale,
      size,
    })),
    info: {
      author: 'xcode',
      version: 1,
    },
  }
}

/** 网站套件：文件名 → 正方形像素尺寸 */
export const WEB_EXPORT_SIZES = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,
}

/** favicon.ico 内嵌 PNG 的尺寸（与 Chrome / IE 兼容常用组合） */
export const ICO_EMBED_SIZES = [16, 32, 48]
