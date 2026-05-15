import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { join } from 'path'

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
    id.includes('node_modules/@ckpack/vue-color') ||
    id.includes('node_modules/@ctrl/tinycolor') ||
    id.includes('node_modules/material-colors')
  ) {
    return 'color-vendor'
  }
  return undefined
}

// 须与「vite build --mode electron」一致；勿只依赖进程环境变量，否则桌面包会走错 base / 路由
export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'

  /** file:// 下带 crossorigin 的 module script 可能无法执行，Electron 表现为白屏 */
  const electronStripCrossoriginPlugin =
    isElectron &&
    ({
      name: 'electron-strip-crossorigin',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          /\s+crossorigin(?:=(?:"anonymous"|"use-credentials"))?/gi,
          ''
        )
      },
    })

  const plugins = [vue()]
  if (electronStripCrossoriginPlugin) plugins.push(electronStripCrossoriginPlugin)

  return {
    plugins,
    base: isElectron ? './' : '/',
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
      minify: isElectron ? 'terser' : 'esbuild',
      terserOptions: isElectron
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
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
  }
})
