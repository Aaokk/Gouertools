/**
 * 基于 node-qrcode 矩阵的自定义「码点形状」绘制（Canvas / SVG）
 */
import QRCode from 'qrcode'

/** 与 QrCodeGen 侧边栏一致的样式列表 */
export const QR_DOT_STYLES = [
  { id: 'normal', label: '普通' },
  { id: 'liquefied', label: '液化' },
  { id: 'tiles', label: '瓷砖' },
  { id: 'dotLarge', label: '大圆点' },
  { id: 'dotSmall', label: '小圆点' },
  { id: 'starThick', label: '粗星形' },
  { id: 'starThin', label: '细星形' },
  { id: 'grid', label: '网格' },
  { id: 'diamond', label: '菱形' },
  { id: 'dotSquare', label: '小方点' },
]

/** 定位图案（码眼）样式 — 按整块 7×7 模块区域绘制 */
export const QR_EYE_STYLES = [
  { id: 'square', label: '方正' },
  { id: 'round', label: '圆角' },
  { id: 'roundThick', label: '粗圆角' },
  { id: 'roundMedium', label: '中圆角' },
  { id: 'roundThin', label: '细圆角' },
  { id: 'circleThick', label: '粗圆形' },
  { id: 'circleThin', label: '细圆形' },
  { id: 'diamondEye', label: '菱形' },
  { id: 'starEye', label: '星形' },
  { id: 'eyeShape', label: '眼睛' },
  { id: 'singleCornerRound', label: '单圆角' },
]

function cellBounds(row, col, canvasSize, totalCells) {
  const x0 = Math.floor((col * canvasSize) / totalCells)
  const x1 = Math.floor(((col + 1) * canvasSize) / totalCells)
  const y0 = Math.floor((row * canvasSize) / totalCells)
  const y1 = Math.floor(((row + 1) * canvasSize) / totalCells)
  return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(Math.max(0, r), w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Nimiq qr-creator 同源逻辑（仅液化）：半径 ≤ 半格，相邻深色共用直角边，
 * 凸出转角 arcTo；孤立模块为正圆，连通域外轮廓连续圆角。
 */
const LIQUEFIED_RADIUS_RATIO = 0.5

/** @param {boolean} nw @param {boolean} ne @param {boolean} se @param {boolean} sw */
function appendCanvasLiquefiedDarkModule(ctx, l, t, r, b, rad, nw, ne, se, sw) {
  if (nw) {
    ctx.moveTo(l + rad, t)
  } else {
    ctx.moveTo(l, t)
  }
  function lal(on, x0, y0, x1, y1, r0, r1) {
    if (on) {
      ctx.lineTo(x0 + r0, y0 + r1)
      ctx.arcTo(x0, y0, x1, y1, rad)
    } else {
      ctx.lineTo(x0, y0)
    }
  }
  lal(ne, r, t, r, b, -rad, 0)
  lal(se, r, b, l, b, 0, -rad)
  lal(sw, l, b, l, t, rad, 0)
  lal(nw, l, t, r, t, 0, rad)
}

/** SVG 坐标 / 半径数值格式化（与 Canvas 对齐，避免超长小数） */
function svgSanNum(n) {
  return String(Math.round(Number(n) * 1000) / 1000)
}

/** @param {boolean} nw @param {boolean} ne @param {boolean} se @param {boolean} sw */
function svgPathLiquefiedDarkModule(l, t, r, b, rad, nw, ne, se, sw) {
  const z = svgSanNum
  const rr = Math.min(Math.max(0, rad), (r - l) / 2, (b - t) / 2)
  if (rr <= 0) {
    return `M ${z(l)} ${z(t)} H ${z(r)} V ${z(b)} H ${z(l)} Z `
  }
  let d = ''
  if (nw) d += `M ${z(l + rr)} ${z(t)} `
  else d += `M ${z(l)} ${z(t)} `
  if (ne) {
    d += `L ${z(r - rr)} ${z(t)} A ${z(rr)} ${z(rr)} 0 0 1 ${z(r)} ${z(t + rr)} `
  } else {
    d += `L ${z(r)} ${z(t)} `
  }
  if (se) {
    d += `L ${z(r)} ${z(b - rr)} A ${z(rr)} ${z(rr)} 0 0 1 ${z(r - rr)} ${z(b)} `
  } else {
    d += `L ${z(r)} ${z(b)} `
  }
  if (sw) {
    d += `L ${z(l + rr)} ${z(b)} A ${z(rr)} ${z(rr)} 0 0 1 ${z(l)} ${z(b - rr)} `
  } else {
    d += `L ${z(l)} ${z(b)} `
  }
  if (nw) {
    d += `L ${z(l)} ${z(t + rr)} A ${z(rr)} ${z(rr)} 0 0 1 ${z(l + rr)} ${z(t)} `
  } else {
    d += `L ${z(l)} ${z(t)} `
  }
  d += 'Z '
  return d
}

function liquefiedCornerFlags(northDark, eastDark, southDark, westDark) {
  return {
    nw: !northDark && !westDark,
    ne: !northDark && !eastDark,
    se: !southDark && !eastDark,
    sw: !southDark && !westDark,
  }
}

/** 仅指定一角圆角（tl / tr / bl / br），其余三角直角 — 用于「单圆角」码眼 */
function roundRectOneCornerPath(ctx, x, y, w, h, r, corner) {
  const rad = Math.min(Math.max(0, r), w / 2, h / 2)
  ctx.beginPath()
  switch (corner) {
    case 'tr':
      ctx.moveTo(x, y)
      ctx.lineTo(x + w - rad, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      break
    case 'bl':
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x + rad, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
      ctx.lineTo(x, y)
      ctx.closePath()
      break
    case 'br':
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h - rad)
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x, y)
      ctx.closePath()
      break
    default:
      ctx.moveTo(x + rad, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x, y + rad)
      ctx.quadraticCurveTo(x, y, x + rad, y)
      ctx.closePath()
  }
}

/** 左上、右下直角；右上与左下同半径圆弧（「眼睛」码眼对角对称） */
function roundRectTRBLRoundedPath(ctx, x, y, w, h, r) {
  const br = Math.min(Math.max(0, r), w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w - br, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + br)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x + br, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - br)
  ctx.lineTo(x, y + br)
  ctx.lineTo(x, y)
  ctx.closePath()
}

/** 左上与右下圆弧、右上与左下直角（与 roundRectTRBLRoundedPath 成镜像对角） */
function roundRectTLBRRoundedPath(ctx, x, y, w, h, r) {
  const rad = Math.min(Math.max(0, r), w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - rad)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + rad)
  ctx.quadraticCurveTo(x, y, x + rad, y)
  ctx.closePath()
}

/** 四角星：偶数顶点为外尖半径 outer，奇数为内凹半径 inner；inner 越大臂越粗 */
function drawFourPointStar(ctx, cx, cy, outer, inner) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / 4) * i - Math.PI / 2
    const px = cx + Math.cos(a) * r
    const py = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} styleId
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
export function drawQrDotShape(ctx, styleId, x, y, w, h) {
  const cx = x + w / 2
  const cy = y + h / 2
  const m = Math.min(w, h)
  const pad = m * 0.12

  switch (styleId) {
    case 'normal':
      ctx.fillRect(x, y, w, h)
      break
    case 'liquefied':
      /* 单格预览：半格圆角（孤立为圆）；整块见 renderStyledQrCanvas */
      roundRectPath(ctx, x, y, w, h, m * LIQUEFIED_RADIUS_RATIO)
      ctx.fill()
      break
    case 'tiles':
      roundRectPath(ctx, x + m * 0.14, y + m * 0.14, w - m * 0.28, h - m * 0.28, m * 0.22)
      ctx.fill()
      break
    case 'dotLarge':
      ctx.beginPath()
      ctx.arc(cx, cy, m * 0.42, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'dotSmall':
      ctx.beginPath()
      ctx.arc(cx, cy, m * 0.28, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'starThick':
      /* 凹角半径大 → 四面「臂」粗；与 starThin 对比勿搞反 */
      drawFourPointStar(ctx, cx, cy, m * 0.4, m * 0.26)
      ctx.fill()
      break
    case 'starThin':
      drawFourPointStar(ctx, cx, cy, m * 0.44, m * 0.14)
      ctx.fill()
      break
    case 'grid':
      roundRectPath(ctx, x + m * 0.08, y + m * 0.08, w - m * 0.16, h - m * 0.16, m * 0.12)
      ctx.fill()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(cx, y + pad)
      ctx.lineTo(x + w - pad, cy)
      ctx.lineTo(cx, y + h - pad)
      ctx.lineTo(x + pad, cy)
      ctx.closePath()
      ctx.fill()
      break
    case 'dotSquare':
      ctx.fillRect(x + m * 0.22, y + m * 0.22, w - m * 0.44, h - m * 0.44)
      break
    default:
      ctx.fillRect(x, y, w, h)
  }
}

/** SVG 片段（不含 fill，由外层 <g fill="..."> 统一着色） */
function svgDotShape(styleId, x, y, w, h) {
  const cx = x + w / 2
  const cy = y + h / 2
  const m = Math.min(w, h)
  const pad = m * 0.12
  const z = svgSanNum

  /** 与 Canvas roundRectPath 一致：rx 不超过宽高的一半 */
  const sr = (sx, sy, sw, sh, rx) => {
    const ww = Math.max(0, sw)
    const hh = Math.max(0, sh)
    const rr = Math.min(Math.max(0, rx), ww / 2, hh / 2)
    return `<rect x="${z(sx)}" y="${z(sy)}" width="${z(ww)}" height="${z(hh)}" rx="${z(rr)}" ry="${z(rr)}"/>`
  }

  switch (styleId) {
    case 'normal':
      return `<rect x="${z(x)}" y="${z(y)}" width="${z(w)}" height="${z(h)}"/>`
    case 'liquefied': {
      const rx = Math.min(m * LIQUEFIED_RADIUS_RATIO, w / 2, h / 2)
      return `<rect x="${z(x)}" y="${z(y)}" width="${z(w)}" height="${z(h)}" rx="${z(rx)}" ry="${z(rx)}"/>`
    }
    case 'tiles':
      return sr(x + m * 0.14, y + m * 0.14, w - m * 0.28, h - m * 0.28, m * 0.22)
    case 'dotLarge': {
      const rad = Math.min(m * 0.42, w / 2, h / 2)
      return `<circle cx="${z(cx)}" cy="${z(cy)}" r="${z(rad)}"/>`
    }
    case 'dotSmall': {
      const rad = Math.min(m * 0.28, w / 2, h / 2)
      return `<circle cx="${z(cx)}" cy="${z(cy)}" r="${z(rad)}"/>`
    }
    case 'starThick': {
      let d = ''
      for (let si = 0; si < 8; si++) {
        const r = si % 2 === 0 ? m * 0.4 : m * 0.26
        const a = (Math.PI / 4) * si - Math.PI / 2
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        d += si === 0 ? `M ${z(px)} ${z(py)}` : ` L ${z(px)} ${z(py)}`
      }
      return `<path d="${d} Z"/>`
    }
    case 'starThin': {
      let d = ''
      for (let si = 0; si < 8; si++) {
        const r = si % 2 === 0 ? m * 0.44 : m * 0.14
        const a = (Math.PI / 4) * si - Math.PI / 2
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        d += si === 0 ? `M ${z(px)} ${z(py)}` : ` L ${z(px)} ${z(py)}`
      }
      return `<path d="${d} Z"/>`
    }
    case 'grid':
      return sr(x + m * 0.08, y + m * 0.08, w - m * 0.16, h - m * 0.16, m * 0.12)
    case 'diamond':
      return `<polygon points="${z(cx)},${z(y + pad)} ${z(x + w - pad)},${z(cy)} ${z(cx)},${z(y + h - pad)} ${z(x + pad)},${z(cy)}"/>`
    case 'dotSquare': {
      const ix = x + m * 0.22
      const iy = y + m * 0.22
      const iw = Math.max(0, w - m * 0.44)
      const ih = Math.max(0, h - m * 0.44)
      return `<rect x="${z(ix)}" y="${z(iy)}" width="${z(iw)}" height="${z(ih)}"/>`
    }
    default:
      return `<rect x="${z(x)}" y="${z(y)}" width="${z(w)}" height="${z(h)}"/>`
  }
}

/** 24×24 视图下单格 SVG 片段（与 svgDotShape 一致），供 UI 预览；fill 由外层继承 currentColor */
export function qrDotPreviewMarkup(styleId) {
  return svgDotShape(styleId, 2, 2, 20, 20)
}

/** 24×24 内多格伪二维码碎片（白底黑模块），用于选择器缩略图 */
const QR_THUMB_PATTERN = ['111111', '100101', '101011', '110001', '100101', '111111']

export function qrDotThumbFragmentMarkup(styleId) {
  const n = QR_THUMB_PATTERN.length
  const vb = 24
  const cs = vb / n
  const darkAt = (r, c) => r >= 0 && r < n && c >= 0 && c < n && QR_THUMB_PATTERN[r][c] === '1'

  if (styleId === 'liquefied') {
    let d = ''
    const rad = Math.min(LIQUEFIED_RADIUS_RATIO * cs, cs / 2)
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!darkAt(r, c)) continue
        const { nw, ne, se, sw } = liquefiedCornerFlags(
          darkAt(r - 1, c),
          darkAt(r, c + 1),
          darkAt(r + 1, c),
          darkAt(r, c - 1),
        )
        const l = c * cs
        const t = r * cs
        const rr = l + cs
        const bb = t + cs
        d += svgPathLiquefiedDarkModule(l, t, rr, bb, rad, nw, ne, se, sw)
      }
    }
    return `<path d="${d.trim()}"/>`
  }

  let inner = ''
  for (let r = 0; r < n; r++) {
    const row = QR_THUMB_PATTERN[r]
    for (let c = 0; c < n; c++) {
      if (row[c] !== '1') continue
      inner += svgDotShape(styleId, c * cs, r * cs, cs, cs)
    }
  }
  return inner
}

function isFinderModule(r, c, modCount) {
  const inTL = r < 7 && c < 7
  const inTR = r < 7 && c >= modCount - 7
  const inBL = r >= modCount - 7 && c < 7
  return inTL || inTR || inBL
}

function finderCorners(modCount) {
  return [
    [0, 0],
    [modCount - 7, 0],
    [0, modCount - 7],
  ]
}

/** 单圆角码眼：圆弧落在整张二维码的外角（左上 / 右上 / 左下 finder 各对应 tl / tr / bl） */
function finderOuterRoundedCorner(fr, fc, modCount) {
  if (fr === 0 && fc === 0) return 'tl'
  if (fr === 0 && fc === modCount - 7) return 'tr'
  if (fr === modCount - 7 && fc === 0) return 'bl'
  return 'tl'
}

/** 「眼睛」对角双圆弧朝向：左上 finder 用右上+左下弧；右上、左下 finder 镜像为左上+右下弧 */
function finderEyeDiagonalVariant(fr, fc, modCount) {
  if (fr === 0 && fc === 0) return 'tr-bl'
  return 'tl-br'
}

function moduleSpanPixelBounds(r0, c0, r1, c1, canvasSize, totalCells) {
  const tl = cellBounds(r0, c0, canvasSize, totalCells)
  const br = cellBounds(r1, c1, canvasSize, totalCells)
  return {
    x: tl.x,
    y: tl.y,
    w: Math.max(1, br.x + br.w - tl.x),
    h: Math.max(1, br.y + br.h - tl.y),
  }
}

/** 外框 / 内白 / 中心黑 — 像素与矩阵格子对齐（勿用 outer.w/7 近似） */
function finderPaintMetrics(fr, fc, modCount, marginModules, canvasSize, totalCells) {
  const br = marginModules + fr
  const bc = marginModules + fc
  const outer = moduleSpanPixelBounds(br, bc, br + 6, bc + 6, canvasSize, totalCells)
  const hole = moduleSpanPixelBounds(br + 1, bc + 1, br + 5, bc + 5, canvasSize, totalCells)
  const center = moduleSpanPixelBounds(br + 2, bc + 2, br + 4, bc + 4, canvasSize, totalCells)
  const cell = moduleSpanPixelBounds(br, bc, br, bc, canvasSize, totalCells)
  return {
    outer,
    hole,
    center,
    cellW: cell.w,
    cellH: cell.h,
    eyeCorner: finderOuterRoundedCorner(fr, fc, modCount),
    eyeDiagonalVariant: finderEyeDiagonalVariant(fr, fc, modCount),
  }
}

function drawEyeLayersRound(ctx, outer, hole, center, fg, bg, outerRF, innerRF, centerRF) {
  const { x, y, w, h } = outer
  ctx.fillStyle = fg
  roundRectPath(ctx, x, y, w, h, Math.min(w, h) * outerRF)
  ctx.fill()
  ctx.fillStyle = bg
  roundRectPath(ctx, hole.x, hole.y, hole.w, hole.h, Math.min(hole.w, hole.h) * innerRF)
  ctx.fill()
  ctx.fillStyle = fg
  roundRectPath(ctx, center.x, center.y, center.w, center.h, Math.min(center.w, center.h) * centerRF)
  ctx.fill()
}

function drawEyeCircleLayers(ctx, outer, fg, bg, ringFrac) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.arc(cx, cy, rIn * 0.45, 0, Math.PI * 2)
  ctx.fill()
}

/** 四角尖朝向上下左右的凹弧星（astroid：x=Rcos³t,y=Rsin³t） */
function astroidStarPath(ctx, cx, cy, R, segments = 72) {
  ctx.beginPath()
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const px = cx + R * Math.pow(Math.cos(t), 3)
    const py = cy + R * Math.pow(Math.sin(t), 3)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/** 圆环 + 中心 astroid，与粗圆形码眼同款环宽比例 */
function drawEyeCircleAstroidLayers(ctx, outer, fg, bg, ringFrac, astroidInHoleFrac) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = fg
  astroidStarPath(ctx, cx, cy, rIn * astroidInHoleFrac)
  ctx.fill()
}

/** 圆环 + 中心圆角菱形（轴对齐正方形绕中心转 45°，四顶点朝上下左右） */
function drawEyeCircleRoundDiamondLayers(ctx, outer, fg, bg, ringFrac, tipInHoleFrac, cornerRelL) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  const tipR = rIn * tipInHoleFrac
  const L = tipR * Math.SQRT2
  const rr = Math.min(Math.max(L * cornerRelL, 0), L * 0.48)
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(Math.PI / 4)
  roundRectPath(ctx, -L / 2, -L / 2, L, L, rr)
  ctx.fill()
  ctx.restore()
}

/** 同心「叶片」码眼：仅外角一角大圆弧 — 「单圆角」（tl/tr/bl/br） */
function finderDirectedLeafRadii(outer, hole, center, eyeCorner, radiusFrac) {
  const { x, y, w, h } = outer
  const brOuter = Math.min(w, h) * radiusFrac
  let insetHole = hole.x - x
  let insetCenter = center.x - x
  if (eyeCorner === 'tr' || eyeCorner === 'br') {
    insetHole = x + w - (hole.x + hole.w)
    insetCenter = x + w - (center.x + center.w)
  } else if (eyeCorner === 'bl') {
    insetHole = y + h - (hole.y + hole.h)
    insetCenter = y + h - (center.y + center.h)
  }
  const brHole = Math.min(Math.max(0, brOuter - insetHole), hole.w / 2, hole.h / 2)
  const brCenter = Math.min(Math.max(0, brOuter - insetCenter), center.w / 2, center.h / 2)
  return { brOuter, brHole, brCenter }
}

function drawDirectedEyeLeafLayers(ctx, outer, hole, center, fg, bg, eyeCorner, radiusFrac) {
  const { x, y, w, h } = outer
  const { brOuter, brHole, brCenter } = finderDirectedLeafRadii(outer, hole, center, eyeCorner, radiusFrac)
  ctx.fillStyle = fg
  roundRectOneCornerPath(ctx, x, y, w, h, brOuter, eyeCorner)
  ctx.fill()
  ctx.fillStyle = bg
  roundRectOneCornerPath(ctx, hole.x, hole.y, hole.w, hole.h, brHole, eyeCorner)
  ctx.fill()
  ctx.fillStyle = fg
  roundRectOneCornerPath(ctx, center.x, center.y, center.w, center.h, brCenter, eyeCorner)
  ctx.fill()
}

function svgDirectedEyeLeafLayersPlain(outer, hole, center, fgEsc, bgEsc, eyeCorner, radiusFrac) {
  const { x, y, w, h } = outer
  const { brOuter, brHole, brCenter } = finderDirectedLeafRadii(outer, hole, center, eyeCorner, radiusFrac)
  return (
    svgRoundRectOneCornerPlain(x, y, w, h, brOuter, fgEsc, eyeCorner) +
    svgRoundRectOneCornerPlain(hole.x, hole.y, hole.w, hole.h, brHole, bgEsc, eyeCorner) +
    svgRoundRectOneCornerPlain(center.x, center.y, center.w, center.h, brCenter, fgEsc, eyeCorner)
  )
}

/** 「眼睛」：右上/左下圆弧同心缩放（与白洞、中心对齐矩阵） */
function finderEyeTRBLRadii(outer, hole, center, radiusFrac) {
  const { x, y, w, h } = outer
  const brOuter = Math.min(w, h) * radiusFrac
  const insetHole = hole.x - x
  const insetCenter = center.x - x
  const brHole = Math.min(Math.max(0, brOuter - insetHole), hole.w / 2, hole.h / 2)
  const brCenter = Math.min(Math.max(0, brOuter - insetCenter), center.w / 2, center.h / 2)
  return { brOuter, brHole, brCenter }
}

function drawEyeDiagonalPairLayers(ctx, outer, hole, center, fg, bg, radiusFrac, variant) {
  const { x, y, w, h } = outer
  const { brOuter, brHole, brCenter } = finderEyeTRBLRadii(outer, hole, center, radiusFrac)
  ctx.fillStyle = fg
  if (variant === 'tl-br') roundRectTLBRRoundedPath(ctx, x, y, w, h, brOuter)
  else roundRectTRBLRoundedPath(ctx, x, y, w, h, brOuter)
  ctx.fill()
  ctx.fillStyle = bg
  if (variant === 'tl-br') roundRectTLBRRoundedPath(ctx, hole.x, hole.y, hole.w, hole.h, brHole)
  else roundRectTRBLRoundedPath(ctx, hole.x, hole.y, hole.w, hole.h, brHole)
  ctx.fill()
  ctx.fillStyle = fg
  if (variant === 'tl-br') roundRectTLBRRoundedPath(ctx, center.x, center.y, center.w, center.h, brCenter)
  else roundRectTRBLRoundedPath(ctx, center.x, center.y, center.w, center.h, brCenter)
  ctx.fill()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} styleId
 * @param {{ outer: object, hole: object, center: object, cellW: number, cellH: number }} metrics
 */
export function drawQrEyeComposite(ctx, styleId, metrics, fg, bg) {
  const { outer, hole, center, cellW, cellH, eyeCorner: ecIn, eyeDiagonalVariant: edIn } = metrics
  const eyeCorner = ecIn ?? 'tl'
  const eyeDiagonalVariant = edIn ?? 'tr-bl'
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const cmx = center.x + center.w / 2
  const cmy = center.y + center.h / 2
  const cmin = Math.min(cellW, cellH)

  switch (styleId) {
    case 'square': {
      ctx.fillStyle = fg
      ctx.fillRect(outer.x, outer.y, outer.w, outer.h)
      ctx.fillStyle = bg
      ctx.fillRect(hole.x, hole.y, hole.w, hole.h)
      ctx.fillStyle = fg
      ctx.fillRect(center.x, center.y, center.w, center.h)
      break
    }
    case 'round':
      drawEyeLayersRound(ctx, outer, hole, center, fg, bg, 0.14, 0.12, 0.22)
      break
    case 'roundThick':
      drawEyeLayersRound(ctx, outer, hole, center, fg, bg, 0.24, 0.2, 0.32)
      break
    case 'roundMedium':
      drawEyeLayersRound(ctx, outer, hole, center, fg, bg, 0.18, 0.15, 0.26)
      break
    case 'roundThin':
      drawEyeLayersRound(ctx, outer, hole, center, fg, bg, 0.08, 0.07, 0.15)
      break
    case 'circleThick':
      drawEyeCircleLayers(ctx, outer, fg, bg, 0.26)
      break
    case 'circleThin':
      drawEyeCircleLayers(ctx, outer, fg, bg, 0.16)
      break
    case 'diamondEye':
      drawEyeCircleRoundDiamondLayers(ctx, outer, fg, bg, 0.26, 0.88, 0.2)
      break
    case 'starEye':
      drawEyeCircleAstroidLayers(ctx, outer, fg, bg, 0.26, 0.9)
      break
    case 'eyeShape':
      /* tr-bl：左上 finder；tl-br：右上/左下 finder（弧朝码心一侧） */
      drawEyeDiagonalPairLayers(ctx, outer, hole, center, fg, bg, 0.42, eyeDiagonalVariant)
      break
    case 'singleCornerRound':
      drawDirectedEyeLeafLayers(ctx, outer, hole, center, fg, bg, eyeCorner, 0.42)
      break
    default:
      drawQrEyeComposite(ctx, 'square', metrics, fg, bg)
  }
}

function svgRectPlain(x, y, w, h, fill) {
  return `<rect x="${svgSanNum(x)}" y="${svgSanNum(y)}" width="${svgSanNum(w)}" height="${svgSanNum(h)}" fill="${fill}"/>`
}

function svgRoundRectPlain(x, y, w, h, rx, fill) {
  const r = Math.min(Math.max(0, rx), w / 2, h / 2)
  return `<rect x="${svgSanNum(x)}" y="${svgSanNum(y)}" width="${svgSanNum(w)}" height="${svgSanNum(h)}" rx="${svgSanNum(r)}" ry="${svgSanNum(r)}" fill="${fill}"/>`
}

function svgRoundRectOneCornerPlain(x, y, w, h, rx, fill, corner) {
  const br = Math.min(Math.max(0, rx), w / 2, h / 2)
  let path
  switch (corner) {
    case 'tr':
      path = `M ${svgSanNum(x)} ${svgSanNum(y)} H ${svgSanNum(x + w - br)} Q ${svgSanNum(x + w)} ${svgSanNum(y)} ${svgSanNum(x + w)} ${svgSanNum(y + br)} V ${svgSanNum(y + h)} H ${svgSanNum(x)} Z`
      break
    case 'bl':
      path = `M ${svgSanNum(x)} ${svgSanNum(y)} H ${svgSanNum(x + w)} V ${svgSanNum(y + h)} H ${svgSanNum(x + br)} Q ${svgSanNum(x)} ${svgSanNum(y + h)} ${svgSanNum(x)} ${svgSanNum(y + h - br)} V ${svgSanNum(y)} Z`
      break
    case 'br':
      path = `M ${svgSanNum(x)} ${svgSanNum(y)} H ${svgSanNum(x + w)} V ${svgSanNum(y + h - br)} Q ${svgSanNum(x + w)} ${svgSanNum(y + h)} ${svgSanNum(x + w - br)} ${svgSanNum(y + h)} H ${svgSanNum(x)} V ${svgSanNum(y)} Z`
      break
    default:
      path = `M ${svgSanNum(x + br)} ${svgSanNum(y)} H ${svgSanNum(x + w)} V ${svgSanNum(y + h)} H ${svgSanNum(x)} V ${svgSanNum(y + br)} Q ${svgSanNum(x)} ${svgSanNum(y)} ${svgSanNum(x + br)} ${svgSanNum(y)} Z`
  }
  return `<path d="${path}" fill="${fill}"/>`
}

function svgRoundRectTRBLPlain(x, y, w, h, rx, fill) {
  const br = Math.min(Math.max(0, rx), w / 2, h / 2)
  const path =
    `M ${svgSanNum(x)} ${svgSanNum(y)} H ${svgSanNum(x + w - br)} Q ${svgSanNum(x + w)} ${svgSanNum(y)} ${svgSanNum(x + w)} ${svgSanNum(y + br)} V ${svgSanNum(y + h)} H ${svgSanNum(x + br)} Q ${svgSanNum(x)} ${svgSanNum(y + h)} ${svgSanNum(x)} ${svgSanNum(y + h - br)} V ${svgSanNum(y + br)} L ${svgSanNum(x)} ${svgSanNum(y)} Z`
  return `<path d="${path}" fill="${fill}"/>`
}

/** 左上+右下圆弧（与 svgRoundRectTRBLPlain 镜像对角） */
function svgRoundRectTLBRPlain(x, y, w, h, rx, fill) {
  const br = Math.min(Math.max(0, rx), w / 2, h / 2)
  const path =
    `M ${svgSanNum(x + br)} ${svgSanNum(y)} H ${svgSanNum(x + w)} V ${svgSanNum(y + h - br)} Q ${svgSanNum(x + w)} ${svgSanNum(y + h)} ${svgSanNum(x + w - br)} ${svgSanNum(y + h)} H ${svgSanNum(x)} V ${svgSanNum(y + br)} Q ${svgSanNum(x)} ${svgSanNum(y)} ${svgSanNum(x + br)} ${svgSanNum(y)} Z`
  return `<path d="${path}" fill="${fill}"/>`
}

function svgEyeDiagonalPairLayersPlain(outer, hole, center, fgEsc, bgEsc, radiusFrac, variant) {
  const { x, y, w, h } = outer
  const { brOuter, brHole, brCenter } = finderEyeTRBLRadii(outer, hole, center, radiusFrac)
  if (variant === 'tl-br') {
    return (
      svgRoundRectTLBRPlain(x, y, w, h, brOuter, fgEsc) +
      svgRoundRectTLBRPlain(hole.x, hole.y, hole.w, hole.h, brHole, bgEsc) +
      svgRoundRectTLBRPlain(center.x, center.y, center.w, center.h, brCenter, fgEsc)
    )
  }
  return (
    svgRoundRectTRBLPlain(x, y, w, h, brOuter, fgEsc) +
    svgRoundRectTRBLPlain(hole.x, hole.y, hole.w, hole.h, brHole, bgEsc) +
    svgRoundRectTRBLPlain(center.x, center.y, center.w, center.h, brCenter, fgEsc)
  )
}

function svgEyeLayersRoundPlain(outer, hole, center, fg, bg, outerRF, innerRF, centerRF) {
  const { x, y, w, h } = outer
  return (
    svgRoundRectPlain(x, y, w, h, Math.min(w, h) * outerRF, fg) +
    svgRoundRectPlain(hole.x, hole.y, hole.w, hole.h, Math.min(hole.w, hole.h) * innerRF, bg) +
    svgRoundRectPlain(center.x, center.y, center.w, center.h, Math.min(center.w, center.h) * centerRF, fg)
  )
}

function svgEyeCircleLayersPlain(outer, fg, bg, ringFrac) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  const rc = rIn * 0.45
  return (
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rOut)}" fill="${fg}"/>` +
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rIn)}" fill="${bg}"/>` +
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rc)}" fill="${fg}"/>`
  )
}

function svgAstroidStarPathPlain(cx, cy, R, fgEsc, segments = 72) {
  let d = ''
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const px = cx + R * Math.pow(Math.cos(t), 3)
    const py = cy + R * Math.pow(Math.sin(t), 3)
    d += i === 0 ? `M${svgSanNum(px)},${svgSanNum(py)}` : `L${svgSanNum(px)},${svgSanNum(py)}`
  }
  return `<path d="${d}Z" fill="${fgEsc}"/>`
}

function svgEyeCircleAstroidLayersPlain(outer, fgEsc, bgEsc, ringFrac, astroidInHoleFrac) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  const Ra = rIn * astroidInHoleFrac
  return (
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rOut)}" fill="${fgEsc}"/>` +
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rIn)}" fill="${bgEsc}"/>` +
    svgAstroidStarPathPlain(cx, cy, Ra, fgEsc)
  )
}

function svgEyeCircleRoundDiamondLayersPlain(outer, fgEsc, bgEsc, ringFrac, tipInHoleFrac, cornerRelL) {
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const rOut = Math.min(w, h) * 0.5
  const rIn = rOut * (1 - ringFrac)
  const tipR = rIn * tipInHoleFrac
  const L = tipR * Math.SQRT2
  const rr = Math.min(Math.max(L * cornerRelL, 0), L * 0.48)
  return (
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rOut)}" fill="${fgEsc}"/>` +
    `<circle cx="${svgSanNum(cx)}" cy="${svgSanNum(cy)}" r="${svgSanNum(rIn)}" fill="${bgEsc}"/>` +
    `<g transform="translate(${svgSanNum(cx)},${svgSanNum(cy)}) rotate(45)">` +
    `<rect x="${svgSanNum(-L / 2)}" y="${svgSanNum(-L / 2)}" width="${svgSanNum(L)}" height="${svgSanNum(L)}" rx="${svgSanNum(rr)}" ry="${svgSanNum(rr)}" fill="${fgEsc}"/>` +
    `</g>`
  )
}

/** finder 区域 SVG 片段（fill 已转义） */
function svgQrEyeCompositePlain(styleId, metrics, fgEsc, bgEsc) {
  const { outer, hole, center, cellW, cellH, eyeCorner: ecIn, eyeDiagonalVariant: edIn } = metrics
  const eyeCorner = ecIn ?? 'tl'
  const eyeDiagonalVariant = edIn ?? 'tr-bl'
  const { x, y, w, h } = outer
  const cx = x + w / 2
  const cy = y + h / 2
  const cmx = center.x + center.w / 2
  const cmy = center.y + center.h / 2
  const cmin = Math.min(cellW, cellH)

  switch (styleId) {
    case 'square':
      return (
        svgRectPlain(outer.x, outer.y, outer.w, outer.h, fgEsc) +
        svgRectPlain(hole.x, hole.y, hole.w, hole.h, bgEsc) +
        svgRectPlain(center.x, center.y, center.w, center.h, fgEsc)
      )
    case 'round':
      return svgEyeLayersRoundPlain(outer, hole, center, fgEsc, bgEsc, 0.14, 0.12, 0.22)
    case 'roundThick':
      return svgEyeLayersRoundPlain(outer, hole, center, fgEsc, bgEsc, 0.24, 0.2, 0.32)
    case 'roundMedium':
      return svgEyeLayersRoundPlain(outer, hole, center, fgEsc, bgEsc, 0.18, 0.15, 0.26)
    case 'roundThin':
      return svgEyeLayersRoundPlain(outer, hole, center, fgEsc, bgEsc, 0.08, 0.07, 0.15)
    case 'circleThick':
      return svgEyeCircleLayersPlain(outer, fgEsc, bgEsc, 0.26)
    case 'circleThin':
      return svgEyeCircleLayersPlain(outer, fgEsc, bgEsc, 0.16)
    case 'diamondEye':
      return svgEyeCircleRoundDiamondLayersPlain(outer, fgEsc, bgEsc, 0.26, 0.88, 0.2)
    case 'starEye':
      return svgEyeCircleAstroidLayersPlain(outer, fgEsc, bgEsc, 0.26, 0.9)
    case 'eyeShape':
      return svgEyeDiagonalPairLayersPlain(outer, hole, center, fgEsc, bgEsc, 0.42, eyeDiagonalVariant)
    case 'singleCornerRound':
      return svgDirectedEyeLeafLayersPlain(outer, hole, center, fgEsc, bgEsc, eyeCorner, 0.42)
    default:
      return svgQrEyeCompositePlain('square', metrics, fgEsc, bgEsc)
  }
}

/** 24×24 视图下整块码眼缩略图（白底），用于弹出菜单预览 */
export function qrEyeThumbMarkup(styleId) {
  const vb = 24
  const pad = 1.5
  const iw = vb - 2 * pad
  const outer = { x: pad, y: pad, w: iw, h: iw }
  const step = iw / 7
  const hole = { x: pad + step, y: pad + step, w: iw - 2 * step, h: iw - 2 * step }
  const center = { x: pad + 2 * step, y: pad + 2 * step, w: 3 * step, h: 3 * step }
  const metrics = { outer, hole, center, cellW: step, cellH: step }
  return `<rect x="0" y="0" width="${vb}" height="${vb}" fill="#ffffff"/>` + svgQrEyeCompositePlain(styleId, metrics, '#1a1f1d', '#ffffff')
}

export function renderStyledQrCanvas(content, options) {
  const {
    width,
    errorCorrectionLevel = 'H',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 1,
    dotStyle = 'normal',
    eyeStyle = 'square',
  } = options

  const qrData = QRCode.create(content, { errorCorrectionLevel })
  const modCount = qrData.modules.size
  const marginModules = margin
  const totalCells = modCount + marginModules * 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = width
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, width)
  ctx.fillStyle = fgColor

  const matrixDark = (mr, mc) => {
    if (mr < 0 || mr >= modCount || mc < 0 || mc >= modCount) return false
    return qrData.modules.get(mr, mc)
  }

  if (dotStyle === 'liquefied') {
    ctx.beginPath()
    for (let row = 0; row < totalCells; row++) {
      for (let col = 0; col < totalCells; col++) {
        let dark = false
        let mr = 0
        let mc = 0
        if (
          row >= marginModules &&
          row < marginModules + modCount &&
          col >= marginModules &&
          col < marginModules + modCount
        ) {
          mr = row - marginModules
          mc = col - marginModules
          dark = qrData.modules.get(mr, mc)
        }
        if (!dark) continue
        if (isFinderModule(mr, mc, modCount)) continue
        const { x, y, w, h } = cellBounds(row, col, width, totalCells)
        const l = x
        const t = y
        const rgt = x + w
        const btm = y + h
        const rad = Math.min(LIQUEFIED_RADIUS_RATIO * Math.min(w, h), Math.min(w, h) / 2)
        const { nw, ne, se, sw } = liquefiedCornerFlags(
          matrixDark(mr - 1, mc),
          matrixDark(mr, mc + 1),
          matrixDark(mr + 1, mc),
          matrixDark(mr, mc - 1),
        )
        appendCanvasLiquefiedDarkModule(ctx, l, t, rgt, btm, rad, nw, ne, se, sw)
      }
    }
    ctx.fill()
  } else {
    for (let row = 0; row < totalCells; row++) {
      for (let col = 0; col < totalCells; col++) {
        const { x, y, w, h } = cellBounds(row, col, width, totalCells)
        let dark = false
        let mr = 0
        let mc = 0
        if (
          row >= marginModules &&
          row < marginModules + modCount &&
          col >= marginModules &&
          col < marginModules + modCount
        ) {
          mr = row - marginModules
          mc = col - marginModules
          dark = qrData.modules.get(mr, mc)
        }
        if (!dark) continue
        if (isFinderModule(mr, mc, modCount)) continue
        drawQrDotShape(ctx, dotStyle, x, y, w, h)
      }
    }
  }

  const fg = fgColor
  const bg = bgColor
  for (const [fr, fc] of finderCorners(modCount)) {
    const metrics = finderPaintMetrics(fr, fc, modCount, marginModules, width, totalCells)
    drawQrEyeComposite(ctx, eyeStyle, metrics, fg, bg)
  }

  return canvas
}

export function styledQrToDataUrl(content, options) {
  const canvas = renderStyledQrCanvas(content, options)
  return canvas.toDataURL('image/png')
}

export function styledQrToSvgString(content, options) {
  const {
    width,
    errorCorrectionLevel = 'H',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 1,
    dotStyle = 'normal',
    eyeStyle = 'square',
  } = options

  const qrData = QRCode.create(content, { errorCorrectionLevel })
  const modCount = qrData.modules.size
  const marginModules = margin
  const totalCells = modCount + marginModules * 2

  const esc = (c) =>
    String(c)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">`,
    `<rect width="100%" height="100%" fill="${esc(bgColor)}"/>`,
    `<g fill="${esc(fgColor)}">`,
  ]

  const matrixDarkSvg = (mr, mc) => {
    if (mr < 0 || mr >= modCount || mc < 0 || mc >= modCount) return false
    return qrData.modules.get(mr, mc)
  }

  if (dotStyle === 'liquefied') {
    let dAccum = ''
    for (let row = 0; row < totalCells; row++) {
      for (let col = 0; col < totalCells; col++) {
        let dark = false
        let mr = 0
        let mc = 0
        if (
          row >= marginModules &&
          row < marginModules + modCount &&
          col >= marginModules &&
          col < marginModules + modCount
        ) {
          mr = row - marginModules
          mc = col - marginModules
          dark = qrData.modules.get(mr, mc)
        }
        if (!dark) continue
        if (isFinderModule(mr, mc, modCount)) continue
        const { x, y, w, h } = cellBounds(row, col, width, totalCells)
        const rad = Math.min(LIQUEFIED_RADIUS_RATIO * Math.min(w, h), Math.min(w, h) / 2)
        const { nw, ne, se, sw } = liquefiedCornerFlags(
          matrixDarkSvg(mr - 1, mc),
          matrixDarkSvg(mr, mc + 1),
          matrixDarkSvg(mr + 1, mc),
          matrixDarkSvg(mr, mc - 1),
        )
        dAccum += svgPathLiquefiedDarkModule(x, y, x + w, y + h, rad, nw, ne, se, sw)
      }
    }
    if (dAccum.trim()) parts.push(`<path d="${dAccum.trim()}"/>`)
  } else {
    for (let row = 0; row < totalCells; row++) {
      for (let col = 0; col < totalCells; col++) {
        const { x, y, w, h } = cellBounds(row, col, width, totalCells)
        let dark = false
        let mr = 0
        let mc = 0
        if (
          row >= marginModules &&
          row < marginModules + modCount &&
          col >= marginModules &&
          col < marginModules + modCount
        ) {
          mr = row - marginModules
          mc = col - marginModules
          dark = qrData.modules.get(mr, mc)
        }
        if (!dark) continue
        if (isFinderModule(mr, mc, modCount)) continue
        parts.push(svgDotShape(dotStyle, x, y, w, h))
      }
    }
  }

  parts.push('</g>')

  const fgE = esc(fgColor)
  const bgE = esc(bgColor)
  for (const [fr, fc] of finderCorners(modCount)) {
    const metrics = finderPaintMetrics(fr, fc, modCount, marginModules, width, totalCells)
    parts.push(svgQrEyeCompositePlain(eyeStyle, metrics, fgE, bgE))
  }

  parts.push('</svg>')
  return parts.join('')
}
