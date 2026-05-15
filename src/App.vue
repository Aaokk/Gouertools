<template>
  <canvas ref="bgCanvasRef" id="bgCanvas" aria-hidden="true" />
  <div class="bg-grid-overlay" aria-hidden="true" />
  <div class="bg-scanlines" aria-hidden="true" />
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-sub">
          <img class="brand-logo" :src="brandLogoHref" alt="G" />
          <div>
            <h2>GOUER</h2>
            <span>工具包包 v{{ displayedVersion }}</span>
          </div>
        </div>
      </div>
      <nav class="sidebar-nav" aria-label="主导航">
        <router-link to="/" class="nav-item" exact-active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span>首页</span>
        </router-link>
        <router-link to="/qrcode" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 20h3"/></svg>
          <span>二维码</span>
        </router-link>
        <router-link to="/watermark" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
          <span>添加水印</span>
        </router-link>
        <router-link to="/image-compressor" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span>图片压缩</span>
        </router-link>
        <router-link to="/image-converter" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          <span>格式转换</span>
        </router-link>
        <router-link to="/image-cropper" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/></svg>
          <span>图片裁剪</span>
        </router-link>

        <router-link to="/exif" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>EXIF信息</span>
        </router-link>
        <router-link to="/mosaic" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/></svg>
          <span>局部打码</span>
        </router-link>
        <router-link to="/app-icon" class="nav-item" active-class="active">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>应用图标</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        Copyright © 2024
        <a href="https://gouer.vip" target="_blank" rel="noopener noreferrer">Gouer.Vip</a><br>
        All Rights Reserved.
      </div>
    </aside>

    <div class="main">
      <router-view />
    </div>
  </div>
  <ThemeSwitcher />
  <AppToast />
  <UpdateDownloadOverlay />
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import AppToast from './components/AppToast.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import UpdateDownloadOverlay from './components/UpdateDownloadOverlay.vue'
import { initBgCanvas } from './utils/bgCanvas.js'

export default {
  name: 'App',
  components: { AppToast, ThemeSwitcher, UpdateDownloadOverlay },
  computed: {
    brandLogoHref () {
      return `${import.meta.env.BASE_URL || './'}favicon.svg`
    },
    /** Vite inject：与 package.json version 同源（参见 vite.config define） */
    displayedVersion () {
      return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    }
  },
  setup () {
    const bgCanvasRef = ref(null)
    let stopBg = () => {}

    onMounted(() => {
      stopBg = initBgCanvas(bgCanvasRef.value)
    })
    onUnmounted(() => {
      stopBg()
    })

    return { bgCanvasRef }
  }
}
</script>
