import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import i18n from '../i18n'

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

const routes = [
  {
    path: '/download',
    name: 'download',
    component: DownloadLanding,
    meta: {
      standaloneLayout: true,
      seoKey: 'download'
    },
  },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { seoKey: 'home' }
  },
  {
    path: '/watermark',
    name: 'watermark',
    component: WatermarkEditor,
    meta: { seoKey: 'watermark' }
  },
  {
    path: '/image-compressor',
    name: 'image-compressor',
    component: ImageCompressor,
    meta: { seoKey: 'imageCompressor' }
  },
  {
    path: '/image-cropper',
    name: 'image-cropper',
    component: ImageCropper,
    meta: { seoKey: 'imageCropper' }
  },
  {
    path: '/image-converter',
    name: 'image-converter',
    component: ImageConverter,
    meta: { seoKey: 'imageConverter' }
  },
  {
    path: '/qrcode',
    name: 'qrcode',
    component: QrCodeGen,
    meta: { seoKey: 'qrcode' }
  },
  {
    path: '/exif',
    name: 'exif',
    component: ExifEditor,
    meta: { seoKey: 'exif' }
  },
  {
    path: '/mosaic',
    name: 'mosaic',
    component: MosaicEditor,
    meta: { seoKey: 'mosaic' }
  },
  {
    path: '/app-icon',
    name: 'app-icon',
    component: AppIconMaker,
    meta: { seoKey: 'appIcon' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: { seoKey: 'notFound' }
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
  const canonical = notFound ? `${SITE_BASE}/` : SITE_BASE + to.path
  const seoKey = to.meta?.seoKey || 'home'
  const t = i18n.global.t

  const title = t(`seo.${seoKey}.title`)
  const description = t(`seo.${seoKey}.description`)
  const keywords = t(`seo.${seoKey}.keywords`)
  const seoLangCode = t('seo.langCode')

  if (title) document.title = title

  setMeta('name', 'description',        description || '')
  setMeta('name', 'keywords',           keywords    || '')
  setMeta('property', 'og:title',       title       || '')
  setMeta('property', 'og:description', description || '')
  const ogImage = `${SITE_BASE}/og-image.png`
  setMeta('property', 'og:image',       ogImage)
  setMeta('property', 'og:url',         canonical)
  setMeta('property', 'og:type',        'website')
  setMeta('property', 'og:locale',      seoLangCode)
  setMeta('name', 'twitter:title',       title       || '')
  setMeta('name', 'twitter:description', description || '')
  setMeta('name', 'twitter:image',       ogImage)
  setMeta('name', 'twitter:card',        'summary_large_image')
  setMeta('name', 'robots', notFound ? 'noindex, nofollow' : 'index, follow')

  // canonical 链接（404 统一点到首页，避免无效 URL 被当作规范地址）
  setLink('canonical', canonical)

  // JSON-LD 结构化数据（WebApplication）
  const baseName = t('seo.baseName')
  const notFoundBaseName = t('seo.notFoundBaseName')
  const notFoundDefaultDesc = t('seo.notFoundDefaultDesc')
  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: notFound ? notFoundBaseName : (title || baseName),
    description: notFound ? notFoundDefaultDesc : (description || ''),
    url: canonical,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser, Windows, macOS',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    inLanguage: seoLangCode,
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
