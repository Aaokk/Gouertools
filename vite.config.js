import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'pdf-lib',
      'pako',
      '@pdf-lib/standard-fonts'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'pdf.worker.min.mjs') {
            return 'pdf-worker/[name][extname]'
          }
          return '[name]-[hash][extname]'
        }
      }
    },
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
