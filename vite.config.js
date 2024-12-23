import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html')
      }
    },
    emptyOutDir: true,
    sourcemap: true,
    minify: false
  },
  // 添加开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    // 允许在浏览器中使用开发服务器
    hmr: {
      overlay: true
    }
  }
})
