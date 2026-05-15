/**
 * 应用图标渲染：先在高分辨率上绘制蒙版图，再逐级减半缩到目标尺寸。
 * 逐级减半（progressive halving）是消除圆角/圆形边缘锯齿的关键，
 * 因为 Canvas drawImage 双线性插值在缩放比 >2× 时质量急剧下降。
 */

const MASTER = 1024

/**
 * 逐级减半：每次宽高除以 2，直到接近目标尺寸，最后一步精确缩放。
 * 这与 Photoshop / Figma 导出小图的内部做法一致。
 */
function progressiveDownscale (source, targetSize) {
  let cur = source
  let curSize = source.width

  while (curSize / 2 >= targetSize) {
    const half = Math.max(targetSize, Math.floor(curSize / 2))
    const tmp = document.createElement('canvas')
    tmp.width = half
    tmp.height = half
    const ctx = tmp.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(cur, 0, 0, curSize, curSize, 0, 0, half, half)
    cur = tmp
    curSize = half
  }

  if (curSize !== targetSize) {
    const fin = document.createElement('canvas')
    fin.width = targetSize
    fin.height = targetSize
    const ctx = fin.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(cur, 0, 0, curSize, curSize, 0, 0, targetSize, targetSize)
    return fin
  }
  return cur
}

/**
 * @param {HTMLImageElement} img
 * @param {{ shape:'rounded'|'circle', cornerPct:number, paddingPct:number, fit?:'cover'|'contain' }} opts
 * @param {number} outPx 输出正方形边长
 */
export function drawAppIconToCanvas (img, opts, outPx) {
  const out = Math.max(1, Math.floor(outPx))
  const hiRes = Math.min(4096, Math.max(out * 4, 1024))

  const work = document.createElement('canvas')
  work.width = hiRes
  work.height = hiRes
  const wctx = work.getContext('2d')
  wctx.imageSmoothingEnabled = true
  wctx.imageSmoothingQuality = 'high'

  // 1) 先填充圆角/圆形蒙版（fill 自带抗锯齿）
  wctx.fillStyle = '#000'
  wctx.beginPath()
  shapeMaskPath(wctx, hiRes, opts)
  wctx.fill()

  // 2) source-in：仅在已有像素区域（即蒙版形状内）绘制图片，继承蒙版的抗锯齿 alpha
  wctx.globalCompositeOperation = 'source-in'
  const pad = Number(opts.paddingPct) || 0
  const innerScale = Math.max(0.5, 1 - pad / 100)
  const inner = hiRes * innerScale
  const off = (hiRes - inner) / 2
  const sw = img.naturalWidth || img.width
  const sh = img.naturalHeight || img.height
  const fit = opts.fit === 'contain' ? 'contain' : 'cover'

  const scale =
    fit === 'contain'
      ? Math.min(inner / sw, inner / sh)
      : Math.max(inner / sw, inner / sh)
  const dw = sw * scale
  const dh = sh * scale
  const dx = off + (inner - dw) / 2
  const dy = off + (inner - dh) / 2
  wctx.drawImage(img, 0, 0, sw, sh, dx, dy, dw, dh)
  wctx.globalCompositeOperation = 'source-over'

  // 3) 逐级减半缩放到目标尺寸
  return progressiveDownscale(work, out)
}

export function renderAppIconToBlob (img, opts, outPx) {
  const canvas = drawAppIconToCanvas(img, opts, outPx)
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
}

export function blobToUint8Array (blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result))
    r.onerror = reject
    r.readAsArrayBuffer(blob)
  })
}

function shapeMaskPath (ctx, size, opts) {
  const cornerPct = Number(opts.cornerPct) || 0
  if (opts.shape === 'circle') {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    return
  }
  const maxR = size / 2
  const r = maxR * (cornerPct / 100)
  const rr = Math.min(maxR, r)
  if (typeof ctx.roundRect === 'function' && rr > 0) {
    ctx.roundRect(0, 0, size, size, rr)
    return
  }
  roundRectPath(ctx, 0, 0, size, size, rr)
}

function roundRectPath (ctx, x, y, w, h, r) {
  if (r <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function loadDecodedImage (file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片无法解码'))
    }
    img.src = url
  })
}

export { MASTER }
