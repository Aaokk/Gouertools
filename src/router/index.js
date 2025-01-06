import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import WatermarkEditor from '../components/WatermarkEditor.vue'
import PdfToImage from '../components/PdfToImage.vue'
import ImageToPdf from '../components/ImageToPdf.vue'
import PdfWatermark from '../components/PdfWatermark.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/watermark',
    name: 'WatermarkEditor',
    component: WatermarkEditor
  },
  {
    path: '/pdf2image',
    name: 'PdfToImage',
    component: PdfToImage
  },
  {
    path: '/image2pdf',
    name: 'ImageToPdf',
    component: ImageToPdf
  },
  {
    path: '/pdf-watermark',
    name: 'PdfWatermark',
    component: PdfWatermark
  }
]

const router = createRouter({
  history: createWebHashHistory('./'),
  routes
})

// 添加全局导航守卫
router.beforeEach((to, from, next) => {
  console.log('路由跳转:', to.path)
  next()
})

export default router 