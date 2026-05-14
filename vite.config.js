import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'path'

const isElectron = process.env.VITE_TARGET === 'electron'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: isElectron ? './' : '/',
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    rollupOptions: {
      input: {
        main: join(__dirname, 'index.html')
      },
      output: {
        assetFileNames: () => '[name]-[hash][extname]'
      }
    },
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
