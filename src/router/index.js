import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'

const WatermarkEditor = () => import('../components/WatermarkEditor.vue')
const ImageConverter = () => import('../components/ImageConverter.vue')
const ImageCompressor = () => import('../components/ImageCompressor.vue')
const ImageCropper = () => import('../components/ImageCropper.vue')
const QrCodeGen = () => import('../components/QrCodeGen.vue')
const ExifEditor = () => import('../components/ExifEditor.vue')
const MosaicEditor = () => import('../components/MosaicEditor.vue')
const AppIconMaker = () => import('../components/AppIconMaker.vue')
import DownloadLanding from '../components/DownloadLanding.vue'
const NotFound = () => import('../components/NotFound.vue')

const BASE = 'Gouer工具包包'

const routes = [
  {
    path: '/download',
    name: 'download',
    component: DownloadLanding,
    meta: {
      standaloneLayout: true,
      title: `下载桌面客户端 — ${BASE}`,
      description:
        '下载 Gouer工具包包桌面版（Windows / macOS），点击时从官方上架更新接口解析本机匹配的 HTTPS 安装包直链。',
      keywords:
        'Gouer工具包包下载,桌面客户端,Tauri,Windows exe,macOS dmg,app 更新,tools.ge0,gouer',
    },
  },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: `${BASE} — 免费在线图片处理工具箱`,
      description: '免费在线图片处理工具箱：添加水印、图片压缩、格式转换、图片裁剪、二维码生成、EXIF清除、马赛克打码、应用图标生成，全部浏览器本地处理不上传，保护隐私，支持批量操作。',
      keywords: '在线图片处理,图片工具箱,免费图片编辑,批量图片处理,图片压缩工具,添加水印工具,格式转换工具,本地处理不上传,浏览器图片编辑,隐私安全图片工具',
    }
  },
  {
    path: '/watermark',
    name: 'watermark',
    component: WatermarkEditor,
    meta: {
      title: `在线添加水印 — 免费批量图片水印工具 — ${BASE}`,
      description: '免费在线为图片添加文字水印或图片水印，支持批量处理、自定义字体颜色透明度、平铺重复水印、拖拽调整位置，实时预览效果，本地处理不上传保护隐私。',
      keywords: '在线添加水印,图片加水印,批量水印工具,免费水印,文字水印,图片水印,照片水印,版权水印保护,水印透明度,平铺水印,拖拽水印位置,本地水印不上传',
    }
  },
  {
    path: '/image-compressor',
    name: 'image-compressor',
    component: ImageCompressor,
    meta: {
      title: `在线图片压缩 — 免费批量压缩 JPG/PNG/WebP/GIF/AVIF — ${BASE}`,
      description: '免费在线压缩图片，支持 JPG、PNG、WebP、GIF、AVIF、SVG 格式，可调整质量与分辨率，已完成项可「保存全部」打成 ZIP 一次下载，100% 浏览器本地处理不上传服务器。',
      keywords: '在线图片压缩,图片压缩工具,PNG压缩,JPG压缩,WebP压缩,GIF压缩,AVIF压缩,SVG优化,批量压缩图片,图片瘦身,减小图片体积,无损压缩,指定大小压缩,本地压缩不上传',
    }
  },
  {
    path: '/image-cropper',
    name: 'image-cropper',
    component: ImageCropper,
    meta: {
      title: `在线图片裁剪 — 证件照一寸二寸裁剪工具 — ${BASE}`,
      description: '免费在线图片裁剪工具，支持自由裁剪、固定比例裁剪，内置一寸照、二寸照、小二寸、护照照片、身份证照等证件照尺寸预设，可视化拖拽操作，本地处理保护隐私。',
      keywords: '在线图片裁剪,图片裁剪工具,证件照裁剪,一寸照片裁剪,二寸照片裁剪,护照照片尺寸,身份证照片,免费裁剪工具,固定比例裁剪,自由裁剪,照片尺寸调整,在线剪切图片',
    }
  },
  {
    path: '/image-converter',
    name: 'image-converter',
    component: ImageConverter,
    meta: {
      title: `图片格式转换 — 免费在线 JPG/PNG/WebP 互转 — ${BASE}`,
      description: '免费在线图片格式互转工具，支持 JPG、PNG、WebP 等格式相互转换，可调整输出质量与分辨率，批量转换，浏览器本地处理隐私安全不上传。',
      keywords: '图片格式转换,在线格式转换,JPG转PNG,PNG转JPG,PNG转WebP,WebP转PNG,WebP转JPG,JPG转WebP,图片转换工具,免费格式转换,批量格式转换,图片格式互转,高清无损转换',
    }
  },
  {
    path: '/qrcode',
    name: 'qrcode',
    component: QrCodeGen,
    meta: {
      title: `二维码生成器 — 免费在线生成自定义二维码 — ${BASE}`,
      description: '免费在线二维码生成器，支持网址、文字、电话、邮件、WiFi 等类型，可自定义颜色、嵌入 Logo、调整容错级别，导出高清 PNG/SVG，支持海报合成。',
      keywords: '二维码生成器,在线生成二维码,免费二维码,QR码生成,WiFi二维码生成,自定义二维码颜色,二维码Logo,二维码海报,网址二维码,文字二维码,微信二维码,二维码下载PNG,二维码下载SVG',
    }
  },
  {
    path: '/exif',
    name: 'exif',
    component: ExifEditor,
    meta: {
      title: `EXIF 信息查看与清除 — 在线删除照片GPS位置 — ${BASE}`,
      description: '免费在线查看图片 EXIF 元数据（相机型号、拍摄参数、GPS 位置、时间等），一键清除全部 EXIF 信息保护隐私，本地处理照片不上传服务器。',
      keywords: 'EXIF信息查看,EXIF清除工具,删除照片GPS位置,图片隐私保护,清除图片元数据,照片定位信息删除,EXIF数据删除,在线EXIF查看器,去除拍摄信息,照片隐私清理,图片去除GPS',
    }
  },
  {
    path: '/mosaic',
    name: 'mosaic',
    component: MosaicEditor,
    meta: {
      title: `图片打码工具 — 在线马赛克/模糊/遮罩 — ${BASE}`,
      description: '免费在线图片打码工具，支持马赛克像素化、高斯模糊、黑色遮罩三种效果，画笔或选框拖拽选区一键打码，可撤销操作，本地处理保护隐私。',
      keywords: '图片打码工具,在线马赛克,图片马赛克,照片模糊处理,高斯模糊,图片遮罩,隐私保护打码,人脸打码,车牌打码,截图打码,局部马赛克,像素化工具,免费打码工具',
    }
  },
  {
    path: '/app-icon',
    name: 'app-icon',
    component: AppIconMaker,
    meta: {
      title: `应用图标生成器 — Android/iOS/Favicon 批量导出 — ${BASE}`,
      description: '免费在线应用图标生成器，上传图片一键批量生成 Android mipmap 全套、iOS AppIcon.appiconset（含 Contents.json）与网站 favicon.ico，支持圆角调整，打包 ZIP 下载，本地处理。',
      keywords: '应用图标生成器,App Icon生成,安卓图标生成,iOS图标生成,favicon生成器,ic_launcher生成,AppIcon.appiconset,mipmap图标,应用图标制作,批量生成图标,图标圆角,PWA图标,apple-touch-icon,在线图标工具',
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: `页面不存在 (404) — ${BASE}`,
      description: '您访问的地址在 Gouer工具包包中不存在，请返回首页或从左侧菜单选择功能。',
      keywords: '404,页面未找到,Gouer工具包包',
    }
  }
]

// 直接打开本地 dist/index.html（file://）时用 hash，否则 history 无法匹配路径
const useHashOnFileProtocol =
  typeof window !== 'undefined' && window.location.protocol === 'file:'

const router = createRouter({
  history: useHashOnFileProtocol ? createWebHashHistory() : createWebHistory('/'),
  routes,
})

const SITE_BASE = 'https://gouer.vip'

// 路由切换时动态更新 title / meta / canonical / JSON-LD
router.afterEach((to) => {
  const notFound = to.name === 'not-found'
  const { title, description, keywords } = to.meta || {}
  const canonical = notFound ? `${SITE_BASE}/` : SITE_BASE + to.path

  if (title) document.title = title

  setMeta('name', 'description',        description || '')
  setMeta('name', 'keywords',           keywords    || '')
  setMeta('property', 'og:title',       title       || '')
  setMeta('property', 'og:description', description || '')
  const ogImage = `${SITE_BASE}/og-image.png`
  setMeta('property', 'og:image',       ogImage)
  setMeta('property', 'og:url',         canonical)
  setMeta('property', 'og:type',        'website')
  setMeta('name', 'twitter:title',       title       || '')
  setMeta('name', 'twitter:description', description || '')
  setMeta('name', 'twitter:image',       ogImage)
  setMeta('name', 'twitter:card',        'summary_large_image')
  setMeta('name', 'robots', notFound ? 'noindex, nofollow' : 'index, follow')

  // canonical 链接（404 统一点到首页，避免无效 URL 被当作规范地址）
  setLink('canonical', canonical)

  // JSON-LD 结构化数据（WebApplication）
  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: notFound ? BASE : (title || BASE),
    description: notFound ? '免费在线图片处理工具箱（本地运行，隐私安全）' : (description || ''),
    url: canonical,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser, Windows, macOS',
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
