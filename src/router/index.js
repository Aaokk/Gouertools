import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import WatermarkEditor from '../components/WatermarkEditor.vue'
import PdfToImage from '../components/PdfToImage.vue'
import ImageToPdf from '../components/ImageToPdf.vue'
import PdfWatermark from '../components/PdfWatermark.vue'
import ImageConverter from '../components/ImageConverter.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/watermark',
      name: 'watermark',
      component: WatermarkEditor
    },
    {
      path: '/pdf2image',
      name: 'pdf2image',
      component: PdfToImage
    },
    {
      path: '/image2pdf',
      name: 'image2pdf',
      component: ImageToPdf
    },
    {
      path: '/pdf-watermark',
      name: 'pdf-watermark',
      component: PdfWatermark
    },
    {
      path: '/image-converter',
      name: 'image-converter',
      component: ImageConverter
    }
  ]
})

export default router 