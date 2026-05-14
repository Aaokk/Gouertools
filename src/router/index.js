import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import WatermarkEditor from '../components/WatermarkEditor.vue'
import ImageConverter from '../components/ImageConverter.vue'
import ImageCompressor from '../components/ImageCompressor.vue'
import ImageCropper from '../components/ImageCropper.vue'

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
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由切换时动态更新 title 和 meta description
router.afterEach((to) => {
  const { title, description, keywords } = to.meta || {}

  if (title) document.title = title

  setMeta('name', 'description', description || '')
  setMeta('name', 'keywords', keywords || '')
  setMeta('property', 'og:title', title || '')
  setMeta('property', 'og:description', description || '')
  setMeta('name', 'twitter:title', title || '')
  setMeta('name', 'twitter:description', description || '')
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

export default router
