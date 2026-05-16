<template>
  <canvas ref="cvs" class="logo-canvas" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const DISPLAY = 48
const INTERNAL = 400
const G_FONT = 340
const IC = INTERNAL / 2

const cvs = ref(null)
let raf = 0, time = 0, lastT = 0
let gBBox = null

function getThemeAccentHSL() {
  const el = document.documentElement
  const raw = getComputedStyle(el).getPropertyValue('--color-accent').trim()
  if (!raw) return { h: 160, s: 55, l: 50 }
  const d = document.createElement('div')
  d.style.color = raw; document.body.appendChild(d)
  const rgb = getComputedStyle(d).color; d.remove()
  const m = rgb.match(/(\d+)/g)
  if (!m) return { h: 160, s: 55, l: 50 }
  let r = +m[0] / 255, g = +m[1] / 255, b = +m[2] / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d2 = max - min
  let h = 0, s = 0, l = (max + min) / 2
  if (d2 > 0) {
    s = l > 0.5 ? d2 / (2 - max - min) : d2 / (max + min)
    if (max === r) h = ((g - b) / d2 + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d2 + 2) * 60
    else h = ((r - g) / d2 + 4) * 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

let accentHSL = { h: 160, s: 55, l: 50 }

/* ===== 几何网格（仿 Three.js PlaneGeometry flat-shading）===== */
const GRID = 10
const CELL = INTERNAL / GRID
const verts = []
const faces = []

function initMesh() {
  verts.length = 0; faces.length = 0
  for (let row = 0; row <= GRID; row++) {
    for (let col = 0; col <= GRID; col++) {
      const bx = col * CELL, by = row * CELL
      const x = bx + (Math.random() - 0.5) * CELL * 0.5
      const y = by + (Math.random() - 0.5) * CELL * 0.5
      const dx = bx - IC, dy = by - IC
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      verts.push({
        bx, by, x, y,
        nx: dx / dist,
        ny: dy / dist,
        dist,
        speed: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        amp: 0.2 + Math.random() * 0.3
      })
    }
  }
  const cols = GRID + 1
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const tl = row * cols + col, tr = tl + 1
      const bl = (row + 1) * cols + col, br = bl + 1
      faces.push([tl, tr, bl])
      faces.push([tr, br, bl])
    }
  }
}

const PALETTE = [
  [118, 22, 68], [141, 36, 67], [162, 55, 63], [181, 81, 55],
  [193, 109, 49], [198, 134, 46], [195, 168, 51], [187, 196, 69]
]

function lerpRGB(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function samplePalette(t) {
  const n = PALETTE.length - 1
  const pos = ((t % 1) + 1) % 1 * n
  const i = Math.min(Math.floor(pos), n - 1)
  return lerpRGB(PALETTE[i], PALETTE[i + 1], pos - i)
}

function drawMesh(c, t) {
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i]
    const pulse = Math.sin(t * v.speed - v.dist * 0.018 + v.phase) * CELL * v.amp
    v.x = v.bx + v.nx * pulse
    v.y = v.by + v.ny * pulse
  }

  for (let i = 0; i < faces.length; i++) {
    const f = faces[i]
    const a = verts[f[0]], b = verts[f[1]], cv2 = verts[f[2]]
    const cy = (a.y + b.y + cv2.y) / 3

    const pos = cy / INTERNAL + Math.sin(t * 0.6 + i * 0.015) * 0.08
    const rgb = samplePalette(pos)
    const alpha = 0.18 + Math.sin(t * 2 + i * 0.3) * 0.08

    c.fillStyle = `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${alpha.toFixed(2)})`
    c.beginPath()
    c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cv2.x, cv2.y)
    c.closePath(); c.fill()

    c.strokeStyle = `rgba(${Math.min(255, Math.round(rgb[0]) + 30)},${Math.min(255, Math.round(rgb[1]) + 30)},${Math.min(255, Math.round(rgb[2]) + 30)},0.12)`
    c.lineWidth = 0.5
    c.stroke()
  }

  // 钻石折射：多层不同速度/方向的彩虹色扫光
  const sweeps = [
    { speed: -0.9, mul: 1.5, hueOff: 0 },
    { speed: 0.7,  mul: -2,  hueOff: 120 },
    { speed: -1.1, mul: 1,   hueOff: 240 },
  ]
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i]
    const a = verts[f[0]], b = verts[f[1]], cv2 = verts[f[2]]
    const cx = (a.x + b.x + cv2.x) / 3, cy = (a.y + b.y + cv2.y) / 3
    const angle = Math.atan2(cy - IC, cx - IC)
    const dist = Math.sqrt((cx - IC) ** 2 + (cy - IC) ** 2)

    for (const sw of sweeps) {
      const flash = Math.sin(t * sw.speed + angle * sw.mul + dist * 0.008)
      if (flash > 0.7) {
        const intensity = (flash - 0.7) * 2.5
        const hue = (angle * 57.3 + sw.hueOff + t * 15) % 360
        c.fillStyle = `hsla(${hue},100%,65%,${(intensity * 0.75).toFixed(2)})`
        c.beginPath()
        c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cv2.x, cv2.y)
        c.closePath(); c.fill()
      }
    }

    // 白色火彩闪点
    const spark = Math.sin(t * 2.2 + i * 2.3 + angle * 3)
    if (spark > 0.92) {
      c.fillStyle = `rgba(255,255,255,${(spark - 0.92) * 8})`
      c.beginPath()
      c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(cv2.x, cv2.y)
      c.closePath(); c.fill()
    }
  }
}

function setGFont(c) {
  c.font = `900 ${G_FONT}px Arial, Helvetica, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
}

function drawGStroke(c) {
  c.save()
  setGFont(c)
  c.shadowColor = 'rgba(212,20,90,0.4)'; c.shadowBlur = 18
  c.strokeStyle = 'rgba(212,20,90,0.25)'; c.lineWidth = 3
  c.strokeText('G', IC, IC)
  c.shadowBlur = 7; c.shadowColor = 'rgba(212,20,90,0.55)'
  c.strokeStyle = 'rgba(212,20,90,0.6)'; c.lineWidth = 1.8
  c.strokeText('G', IC, IC)
  c.shadowBlur = 0
  c.strokeStyle = 'rgba(240,100,140,0.3)'; c.lineWidth = 0.6
  c.strokeText('G', IC, IC)
  c.restore()
}

function measureGBBox() {
  const tmp = document.createElement('canvas')
  tmp.width = INTERNAL; tmp.height = INTERNAL
  const tc = tmp.getContext('2d')
  setGFont(tc)
  tc.fillStyle = '#fff'
  tc.fillText('G', IC, IC)
  const id = tc.getImageData(0, 0, INTERNAL, INTERNAL).data
  let t = INTERNAL, l = INTERNAL, b = 0, r = 0
  for (let y = 0; y < INTERNAL; y++) {
    for (let x = 0; x < INTERNAL; x++) {
      if (id[(y * INTERNAL + x) * 4 + 3] > 10) {
        if (x < l) l = x; if (x > r) r = x
        if (y < t) t = y; if (y > b) b = y
      }
    }
  }
  const pad = 6
  return { x: Math.max(0, l - pad), y: Math.max(0, t - pad), w: r - l + pad * 2, h: b - t + pad * 2 }
}

onMounted(() => {
  const c = cvs.value
  if (!c) return
  gBBox = measureGBBox()
  const outSz = Math.max(gBBox.w, gBBox.h)
  const dpr = window.devicePixelRatio || 2
  c.width = outSz * dpr; c.height = outSz * dpr
  c.style.width = DISPLAY + 'px'; c.style.height = DISPLAY + 'px'
  const ctx = c.getContext('2d')

  const off = document.createElement('canvas')
  off.width = INTERNAL * dpr; off.height = INTERNAL * dpr
  const oc = off.getContext('2d')
  oc.scale(dpr, dpr)

  initMesh()
  accentHSL = getThemeAccentHSL()
  const themeObs = new MutationObserver(() => { accentHSL = getThemeAccentHSL() })
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  function render(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05)
    lastT = ts; time += dt

    oc.clearRect(0, 0, INTERNAL, INTERNAL)
    setGFont(oc); oc.fillStyle = '#000000'
    oc.fillText('G', IC, IC)
    drawMesh(oc, time)
    oc.globalCompositeOperation = 'destination-in'
    setGFont(oc); oc.fillStyle = '#fff'
    oc.fillText('G', IC, IC)
    oc.globalCompositeOperation = 'source-over'
    drawGStroke(oc)

    ctx.clearRect(0, 0, c.width, c.height)
    const ox = (outSz - gBBox.w) / 2, oy = (outSz - gBBox.h) / 2
    ctx.drawImage(off, gBBox.x * dpr, gBBox.y * dpr, gBBox.w * dpr, gBBox.h * dpr, ox * dpr, oy * dpr, gBBox.w * dpr, gBBox.h * dpr)
    raf = requestAnimationFrame(render)
  }
  raf = requestAnimationFrame(render)
})

onUnmounted(() => { cancelAnimationFrame(raf) })
</script>

<style scoped>
.logo-canvas {
  display: block;
  flex-shrink: 0;
}
</style>
