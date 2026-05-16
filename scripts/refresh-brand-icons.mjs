/**
 * 从一张正方形 Logo PNG 批量生成：
 * - public/ 站点的 favicon、Apple Touch、PWA 用图、OG 预览图、favicon.ico
 * - src-tauri/icons/ + 仓库根目录 icon.icns / icon.ico（Tauri 桌面端）
 *
 * 依赖 macOS「sips」做缩放（本地换品牌跑一次即可，产物入库）。
 *
 * macOS 图标「规格」简述（为何 Finder / 访达里也会显大/显小）：
 * - 像素档由 Apple 规定：`AppIconType` 表格中 macOS 槽位为 16、32、128、256、512、1024（及 @2x 等价像素），
 *   见 https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/AppIconType.html
 *   与「Configuring your app icon」 https://developer.apple.com/documentation/xcode/configuring-your-app-icon
 * - `npx tauri icon` 会从本仓库的 `public/logo-app-source.png`（1024）生成上述各档并写入 .icns。
 * - 在同一像素方格内，须有外圈透明 + **白色圆角板通常还要在「安全矩形」内侧再缩一层**（不要白底铺满 924²），
 *   否则整块白会比 Chrome、HBuilder 等 boxed 竞品显大。
 * - 外层透明：Apple Design Resources 常见 **约 50px/边** → `APPLE_APP_ICON_CLEAR_MARGIN_PX`；
 * - 底板再缩进：`MACOS_PLATE_EXTRA_INSET_PX`，圆角底板边长约为 `1024 - 2*outer - 2*plate_inset`。
 *
 *   node scripts/refresh-brand-icons.mjs /path/to/logo.png
 *   BRAND_PNG=/path/to/logo.png node scripts/refresh-brand-icons.mjs
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * @param {Array<{ width: number, height: number, png: Uint8Array|Buffer }>} entries
 */
function buildIcoFromPngs (entries) {
  const n = entries.length
  const headerLen = 6
  const entryLen = 16
  let dataOffset = headerLen + entryLen * n
  const parts = []

  const head = new DataView(new ArrayBuffer(6))
  head.setUint16(0, 0, true)
  head.setUint16(2, 1, true)
  head.setUint16(4, n, true)
  parts.push(new Uint8Array(head.buffer))

  for (const e of entries) {
    const pngBuf = e.png instanceof Uint8Array ? e.png : new Uint8Array(e.png)
    const row = new DataView(new ArrayBuffer(16))
    row.setUint8(0, e.width >= 256 ? 0 : e.width)
    row.setUint8(1, e.height >= 256 ? 0 : e.height)
    row.setUint8(2, 0)
    row.setUint8(3, 0)
    row.setUint16(4, 1, true)
    row.setUint16(6, 32, true)
    row.setUint32(8, pngBuf.byteLength, true)
    row.setUint32(12, dataOffset, true)
    dataOffset += pngBuf.byteLength
    parts.push(new Uint8Array(row.buffer))
  }

  for (const e of entries) {
    const pngBuf = e.png instanceof Uint8Array ? e.png : new Uint8Array(e.png)
    parts.push(pngBuf)
  }

  const total = parts.reduce((acc, u8) => acc + u8.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const u8 of parts) {
    out.set(u8, o)
    o += u8.length
  }
  return out.buffer
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 主图尺寸，与 Xcode / `tauri icon` 推荐的 1024² 一致（亦对应 App Store / Retina 一档）。 */
const TAURI_ICON_PX = 1024

/**
 * 1024² 主图上、四边透明安全区（单侧像素）。与 Apple Design Resources 中 macOS 图标模板惯例一致（每侧约 50px，内容约 924²）。
 * Finder 与各档缩略图共用 .icns，主图外圈留白会直接反映到「在方格里的体量」。
 */
const APPLE_APP_ICON_CLEAR_MARGIN_PX = 50

/**
 * 在透明外圈以内的「924² 安全区」中，白板再单侧缩进像素（白板不要顶满整个安全矩形）。
 */
const MACOS_PLATE_EXTRA_INSET_PX = 52

/**
 * Logo 在白板内的目标比例（会先裁透明边再缩放；改完务必跑刷新脚本）。
 * 再小：0.72～0.78；再大：约 0.90。
 */
const TAURI_GLYPH_OF_PLATE_FRAC = 0.87

function sipsResize (src, w, h, outAbs) {
  const r = spawnSync('sips', ['-z', String(h), String(w), src, '--out', outAbs], {
    cwd: root,
    stdio: 'inherit',
  })
  if (r.status !== 0 && r.status != null) {
    console.error('[refresh-brand-icons] sips failed (需要 macOS 且源图为有效 PNG)：', outAbs)
    process.exit(r.status)
  }
  if (r.error) throw r.error
}

const pngArg = process.argv[2]?.trim()
const brandSrc =
  pngArg ||
  process.env.BRAND_PNG?.trim() ||
  ''

if (!brandSrc || brandSrc.startsWith('-')) {
  console.error(`用法: node scripts/refresh-brand-icons.mjs <正方形 PNG 路径>

示例:
  node scripts/refresh-brand-icons.mjs ~/Downloads/newlogo.png`)
  process.exit(1)
}

const srcAbs = resolve(brandSrc)
const pubDir = join(root, 'public')
const tmpIco = join(root, '.tmp-favicon-ico')
mkdirSync(tmpIco, { recursive: true })

const pubPairs = /** @type {const} */ ([
  [512, 512, 'favicon.png'],
  [512, 512, 'og-image.png'],
  [180, 180, 'apple-touch-icon.png'],
  [192, 192, 'android-chrome-192x192.png'],
  [512, 512, 'android-chrome-512x512.png'],
  [32, 32, 'favicon-32x32.png'],
  [16, 16, 'favicon-16x16.png'],
])

for (const [w, h, name] of pubPairs) {
  sipsResize(srcAbs, w, h, join(pubDir, name))
}

const f16 = join(tmpIco, '16.png')
const f32 = join(tmpIco, '32.png')
const f48 = join(tmpIco, '48.png')
sipsResize(srcAbs, 16, 16, f16)
sipsResize(srcAbs, 32, 32, f32)
sipsResize(srcAbs, 48, 48, f48)

const icoBlob = buildIcoFromPngs([
  { width: 16, height: 16, png: new Uint8Array(readFileSync(f16)) },
  { width: 32, height: 32, png: new Uint8Array(readFileSync(f32)) },
  { width: 48, height: 48, png: new Uint8Array(readFileSync(f48)) },
])
writeFileSync(join(pubDir, 'favicon.ico'), Buffer.from(icoBlob))

rmSync(tmpIco, { recursive: true, force: true })

const tauriSource = join(pubDir, 'logo-app-source.png')
const padScript = join(root, 'scripts/pad-square-icon.py')
const padded = spawnSync(
  'python3',
  [
    padScript,
    'macos-plate',
    srcAbs,
    tauriSource,
    String(TAURI_ICON_PX),
    String(APPLE_APP_ICON_CLEAR_MARGIN_PX),
    String(MACOS_PLATE_EXTRA_INSET_PX),
    String(TAURI_GLYPH_OF_PLATE_FRAC),
  ],
  { cwd: root, stdio: 'inherit' },
)
if (padded.status !== 0 && padded.status != null) {
  console.warn(
    '[refresh-brand-icons] pad-square-icon.py 失败（需 python3 + Pillow），桌面图标回退为铺满透明画布（Dock 可能与「整块白底图标」大小不一）',
  )
  sipsResize(srcAbs, TAURI_ICON_PX, TAURI_ICON_PX, tauriSource)
}
if (padded.error) throw padded.error

const plateSide =
  TAURI_ICON_PX -
  2 * APPLE_APP_ICON_CLEAR_MARGIN_PX -
  2 * MACOS_PLATE_EXTRA_INSET_PX
const logoTargetMax = Math.round(plateSide * TAURI_GLYPH_OF_PLATE_FRAC)
console.log(
  `[refresh-brand-icons] 桌面主图 → ${tauriSource}：白板边长≈${plateSide}px，Logo 最长边目标≈${logoTargetMax}px（TAURI_GLYPH_OF_PLATE_FRAC=${TAURI_GLYPH_OF_PLATE_FRAC}）`,
)
console.log(
  '[refresh-brand-icons] 仅此链影响 Tauri 的 .icns/.ico；浏览器 favicon 不会因该比例变化。图标没变化时：重装/重打 .app，或结束 tauri dev 后重启，并把程序从 Dock 拿掉再固定以清缓存。',
)

const tauriDir = join(root, 'src-tauri')
const tauriIconsOut = join(tauriDir, 'icons')

const ti = spawnSync(
  'npx',
  ['tauri', 'icon', tauriSource, '-o', 'icons'],
  { cwd: tauriDir, stdio: 'inherit', shell: true },
)
if (ti.status !== 0 && ti.status != null) {
  console.error('[refresh-brand-icons] tauri icon 失败')
  process.exit(ti.status)
}
if (ti.error) throw ti.error

copyFileSync(join(tauriIconsOut, 'icon.icns'), join(root, 'icon.icns'))
copyFileSync(join(tauriIconsOut, 'icon.ico'), join(root, 'icon.ico'))

const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <title>Gouer 工具包包 Logo</title>
  <image width="512" height="512" href="/favicon.png" xlink:href="/favicon.png" preserveAspectRatio="xMidYMid meet"/>
</svg>
`

writeFileSync(join(pubDir, 'favicon.svg'), faviconSvg, 'utf8')

console.log(
  `[refresh-brand-icons] 已从 ${srcAbs} 写入 public/favicon*.png、favicon.ico、apple-touch、sizes、OG 图；`,
  `Tauri → ${join(tauriIconsOut)} 与仓库根目录 icon.icns / icon.ico`,
)
