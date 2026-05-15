import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { runTauriUpdateCheckOnce } from './utils/tauriUpdateCheck.js'
import './style.css'
import './themes.css'

/* ── 移动端禁止双指缩放、双击缩放 ──────────────────────────
 * iOS Safari 从 iOS 10 起忽略 viewport user-scalable=no，
 * 需要用 JS 拦截 touchstart（多点）和连续 touchend（双击）。
 * passive: false 是必须的，否则无法 preventDefault。
 * ────────────────────────────────────────────────────────── */
document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) e.preventDefault()
}, { passive: false })

let _lastTap = 0
document.addEventListener('touchend', (e) => {
  const now = Date.now()
  if (now - _lastTap < 300) e.preventDefault()
  _lastTap = now
}, { passive: false })

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

setTimeout(() => {
  runTauriUpdateCheckOnce()
}, 4000)

// 调试信息
console.log('应用已启动')
