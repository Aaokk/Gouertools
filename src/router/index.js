import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../components/Home.vue'
import WatermarkEditor from '../components/WatermarkEditor.vue'
import ImageConverter from '../components/ImageConverter.vue'
import ImageCompressor from '../components/ImageCompressor.vue'

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
      path: '/image-converter',
      name: 'image-converter',
      component: ImageConverter
    },
    {
      path: '/image-compressor',
      name: 'image-compressor',
      component: ImageCompressor
    }
  ]
})

export default router 