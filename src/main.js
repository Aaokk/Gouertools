import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err)
  console.error('错误信息:', info)
}

// 添加路由
app.use(router)

// 挂载应用
app.mount('#app')

// 调试信息
console.log('应用已启动')
