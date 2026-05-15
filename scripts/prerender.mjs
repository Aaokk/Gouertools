/**
 * 构建后预渲染：用 puppeteer 打开 dist 里的每条路由，
 * 等 Vue 渲染完成后把整页 HTML 写回对应路径。
 * 搜索引擎爬虫因此能直接看到 title/description/正文，无需执行 JS。
 *
 * 用法：npm run build && node scripts/prerender.mjs
 *       （已集成到 npm run build:seo）
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const PORT = 4936

const ROUTES = [
  '/',
  '/watermark',
  '/image-compressor',
  '/image-converter',
  '/image-cropper',
  '/qrcode',
  '/exif',
  '/mosaic',
]

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

function startStaticServer () {
  return new Promise((ok) => {
    const fallback = readFileSync(join(DIST, 'index.html'))

    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`)
      let filePath = join(DIST, decodeURIComponent(url.pathname))

      if (!existsSync(filePath) || !filePath.includes('.')) {
        filePath = join(DIST, 'index.html')
      }

      try {
        const data = readFileSync(filePath)
        const ext = extname(filePath).toLowerCase()
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(fallback)
      }
    })

    server.listen(PORT, '127.0.0.1', () => ok(server))
  })
}

async function renderRoute (browser, route) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  await page.goto(`http://127.0.0.1:${PORT}${route}`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  })

  // 等 Vue 的 router.afterEach 把 title/meta 注入完
  await page.waitForFunction(
    () => document.title && document.title !== 'Loading…' && document.querySelector('#app')?.innerHTML?.length > 100,
    { timeout: 10000 }
  )

  // 再多等一小下让异步组件稳定
  await new Promise((r) => setTimeout(r, 300))

  let html = await page.content()

  // 去掉 puppeteer 里残余的 <script> 不影响构建产物
  // 但保留 type="module" 的入口脚本和 JSON-LD
  html = html.replace(/<script>.*?<\/script>/gs, (match) => {
    if (match.includes('type="module"') || match.includes('application/ld+json')) return match
    return ''
  })

  await page.close()
  return html
}

async function main () {
  console.log('[prerender] 启动临时静态服务…')
  const server = await startStaticServer()

  console.log('[prerender] 启动浏览器…')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  for (const route of ROUTES) {
    console.log(`[prerender] ${route}`)
    const html = await renderRoute(browser, route)

    const outPath =
      route === '/'
        ? join(DIST, 'index.html')
        : join(DIST, route.slice(1), 'index.html')

    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, html, 'utf-8')
  }

  await browser.close()
  server.close()
  console.log(`[prerender] 完成！${ROUTES.length} 个页面已写入 dist/`)
}

main().catch((e) => {
  console.error('[prerender] 失败:', e)
  process.exit(1)
})
