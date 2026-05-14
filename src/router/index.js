import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import WatermarkEditor from '../components/WatermarkEditor.vue'
import ImageConverter from '../components/ImageConverter.vue'
import ImageCompressor from '../components/ImageCompressor.vue'
import ImageCropper from '../components/ImageCropper.vue'
import QrCodeGen from '../components/QrCodeGen.vue'
import ExifEditor from '../components/ExifEditor.vue'
import MosaicEditor from '../components/MosaicEditor.vue'

const BASE = 'Gouer工具包包'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: `${BASE} — 一站式图片处理工具`,
      description: '添加水印、图片压缩、格式转换，本地处理保护隐私，支持批量操作，简单好用。',
      keywords: '图片工具,图片处理,在线工具,批量处理,Gouer',
    }
  },
  {
    path: '/watermark',
    name: 'watermark',
    component: WatermarkEditor,
    meta: {
      title: `添加水印 — ${BASE}`,
      description: '为图片添加文字水印或图片水印，支持批量处理、自定义字体大小、透明度、位置，实时预览效果。',
      keywords: '添加水印,图片水印,批量水印,文字水印,版权保护',
    }
  },
  {
    path: '/image-compressor',
    name: 'image-compressor',
    component: ImageCompressor,
    meta: {
      title: `图片压缩 — ${BASE}`,
      description: '在线压缩 JPG、PNG、WebP、GIF、AVIF、SVG 图片，支持调整质量、颜色数量、分辨率，批量处理不上传服务器。',
      keywords: '图片压缩,PNG压缩,JPG压缩,WebP压缩,GIF压缩,AVIF压缩,SVG优化,批量压缩',
    }
  },
  {
    path: '/image-cropper',
    name: 'image-cropper',
    component: ImageCropper,
    meta: {
      title: `图片裁剪 — ${BASE}`,
      description: '可视化图片裁剪工具，支持自由裁剪、固定比例裁剪，内置一寸照、二寸照、护照照片等证件照比例预设。',
      keywords: '图片裁剪,可视化裁剪,证件照,一寸照,二寸照,护照照片,图片比例',
    }
  },
  {
    path: '/image-converter',
    name: 'image-converter',
    component: ImageConverter,
    meta: {
      title: `格式转换 — ${BASE}`,
      description: '图片格式互转，支持 JPG、PNG、WebP 互相转换，可调整输出质量、分辨率，本地处理隐私安全。',
      keywords: '格式转换,图片转换,JPG转PNG,PNG转WebP,图片格式,转换工具',
    }
  },
  {
    path: '/qrcode',
    name: 'qrcode',
    component: QrCodeGen,
    meta: {
      title: `二维码生成 — ${BASE}`,
      description: '在线生成二维码，支持网址、文字、电话、邮件、WiFi 等类型，可自定义颜色、尺寸，下载 PNG/SVG。',
      keywords: '二维码生成,QR码,WiFi二维码,二维码制作,在线二维码',
    }
  },
  {
    path: '/exif',
    name: 'exif',
    component: ExifEditor,
    meta: {
      title: `EXIF 查看/清除 — ${BASE}`,
      description: '查看图片 EXIF 元数据（拍摄设备、时间、GPS 位置等），一键清除 EXIF 保护隐私，本地处理不上传。',
      keywords: 'EXIF查看,EXIF清除,图片隐私,GPS位置清除,图片元数据',
    }
  },
  {
    path: '/mosaic',
    name: 'mosaic',
    component: MosaicEditor,
    meta: {
      title: `局部打码 — ${BASE}`,
      description: '图片局部马赛克/模糊处理，拖拽选区一键打码，支持马赛克、高斯模糊、黑色遮罩三种效果，可撤销。',
      keywords: '图片打码,马赛克,局部模糊,隐私保护,截图打码',
    }
  }
]

// Electron 用 hash 模式（file:// 协议不支持 HTML5 history）
// 浏览器 web 用 HTML5 history（无 # 号，利于 SEO）
const isElectron = import.meta.env.VITE_TARGET === 'electron'

const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory('/'),
  routes,
})

const SITE_BASE = 'https://tools.gouer.vip'

// 路由切换时动态更新 title / meta / canonical / JSON-LD
router.afterEach((to) => {
  const { title, description, keywords } = to.meta || {}
  const canonical = SITE_BASE + to.path

  if (title) document.title = title

  setMeta('name', 'description',        description || '')
  setMeta('name', 'keywords',           keywords    || '')
  setMeta('property', 'og:title',       title       || '')
  setMeta('property', 'og:description', description || '')
  setMeta('property', 'og:url',         canonical)
  setMeta('property', 'og:type',        'website')
  setMeta('name', 'twitter:title',       title       || '')
  setMeta('name', 'twitter:description', description || '')
  setMeta('name', 'twitter:card',        'summary')

  // canonical 链接
  setLink('canonical', canonical)

  // JSON-LD 结构化数据（WebApplication）
  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title || BASE,
    description: description || '',
    url: canonical,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    inLanguage: 'zh-CN',
  })
})

function setMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data) {
  let el = document.querySelector('script[type="application/ld+json"]')
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export default router
