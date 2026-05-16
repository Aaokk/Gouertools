import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'path'

// __APP_VERSION__ 来自 package.json 的 version（运行 sync-version / tauri 构建时会同步其它清单）
const pkgJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

function manualChunksForVendor(id) {
  if (!id.includes('node_modules')) return undefined
  if (
    id.includes('node_modules/vue/') ||
    id.includes('node_modules/vue-router/') ||
    id.includes('node_modules/@vue/')
  ) {
    return 'vue-vendor'
  }
  if (id.includes('node_modules/svgo')) return 'svgo-vendor'
  if (id.includes('node_modules/qrcode')) return 'qrcode-vendor'
  if (id.includes('node_modules/jszip')) return 'jszip-vendor'
  if (id.includes('node_modules/exifr')) return 'exifr-vendor'
  if (
    id.includes('node_modules/@ctrl/tinycolor') ||
    id.includes('node_modules/material-colors')
  ) {
    return 'color-vendor'
  }
  return undefined
}

export default defineConfig({
  define: {
    // 运行时更新检查等使用，与桌面包展示版本同源
    __APP_VERSION__: JSON.stringify(pkgJson.version),
  },
  plugins: [vue()],
  base: '/',
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html'),
      },
      output: {
        assetFileNames: () => '[name]-[hash][extname]',
        compact: true,
        manualChunks: manualChunksForVendor,
      },
    },
    emptyOutDir: true,
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
