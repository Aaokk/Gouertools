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

/** 从 CSS 变量读取当前主题色，转成 HSL 供粒子使用 */
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

function getHue(t) {
  return (accentHSL.h + Math.sin(t * 0.5) * 25 + 360) % 360
}

const SHAPES = {
  triangle: (() => { const v = []; for (let i = 0; i < 12; i++) { const s = Math.floor(i * 3 / 12), t = i * 3 / 12 - s; const a1 = Math.PI * 2 / 3 * s - Math.PI / 2, a2 = Math.PI * 2 / 3 * ((s + 1) % 3) - Math.PI / 2; v.push({ x: Math.cos(a1) * (1 - t) + Math.cos(a2) * t, y: Math.sin(a1) * (1 - t) + Math.sin(a2) * t }) } return v })(),
  diamond: (() => { const v = [], angs = [-Math.PI / 2, 0, Math.PI / 2, Math.PI], rads = [1, 0.58, 1, 0.58]; for (let i = 0; i < 12; i++) { const s = Math.floor(i * 4 / 12), t = i * 4 / 12 - s; const a1 = angs[s % 4], a2 = angs[(s + 1) % 4], r1 = rads[s % 4], r2 = rads[(s + 1) % 4]; v.push({ x: Math.cos(a1) * r1 * (1 - t) + Math.cos(a2) * r2 * t, y: Math.sin(a1) * r1 * (1 - t) + Math.sin(a2) * r2 * t }) } return v })(),
  hexagon: (() => { const v = []; for (let i = 0; i < 12; i++) { const a = Math.PI * 2 / 12 * i; v.push({ x: Math.cos(a), y: Math.sin(a) }) } return v })(),
  star: (() => { const v = []; for (let i = 0; i < 12; i++) { const a = Math.PI * 2 / 12 * i - Math.PI / 2, r = (i % 2 === 0) ? 1 : 0.4; v.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }) } return v })()
}
const SK = ['triangle', 'diamond', 'hexagon', 'star']
function lerpV(a, b, t) { const e = t * t * (3 - 2 * t); return a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * e, y: p.y + (b[i].y - p.y) * e })) }
function drawMorph(c, x, y, size, morphT, angle) {
  const seg = ((morphT % 1) + 1) % 1 * 4, idx = Math.floor(seg) % 4, nxt = (idx + 1) % 4, frac = seg - Math.floor(seg)
  const v = lerpV(SHAPES[SK[idx]], SHAPES[SK[nxt]], frac), s = Math.max(0.5, size)
  c.save(); c.translate(x, y); c.rotate(angle); c.beginPath()
  v.forEach((p, i) => { i === 0 ? c.moveTo(p.x * s, p.y * s) : c.lineTo(p.x * s, p.y * s) })
  c.closePath(); c.fill(); c.restore()
}

const DUST = []
function initDust() {
  DUST.length = 0
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * 130
    DUST.push({
      x: Math.cos(a) * d, y: Math.sin(a) * d,
      vx: (Math.random() - 0.5) * 1.8, vy: (Math.random() - 0.5) * 1.8,
      sz: 8 + Math.random() * 14, rot: Math.random() * Math.PI * 2,
      rs: (Math.random() - 0.5) * 0.025, ph: Math.random() * Math.PI * 2,
      cp: Math.random() * 6, ts: 0.8 + Math.random() * 2
    })
  }
}

function drawStardust(c, t) {
  const bh = getHue(t * 0.15)
  const glow = c.createRadialGradient(IC, IC, 0, IC, IC, 130)
  glow.addColorStop(0, `hsla(${bh},50%,40%,0.08)`)
  glow.addColorStop(1, `hsla(${bh},30%,20%,0)`)
  c.fillStyle = glow
  c.fillRect(0, 0, INTERNAL, INTERNAL)
  DUST.forEach(p => {
    p.x += p.vx; p.y += p.vy
    const d = Math.sqrt(p.x * p.x + p.y * p.y)
    if (d > 130) { p.vx *= -1; p.vy *= -1; p.x *= 0.97; p.y *= 0.97 }
    const tw = 0.45 + Math.sin(t * p.ts + p.ph) * 0.3
    const sz = p.sz + Math.sin(t * 1.4 + p.ph) * 1
    const h = getHue(t * 0.28 + p.cp)
    const sl = Math.max(50, accentHSL.s)
    const ll = Math.max(55, accentHSL.l + 10)
    c.fillStyle = `hsla(${h},${sl}%,${ll}%,${tw.toFixed(3)})`
    drawMorph(c, IC + p.x, IC + p.y, sz, (t / 7 + p.cp) % 1, p.rot + t * p.rs)
  })
  c.lineWidth = 0.5
  for (let i = 0; i < DUST.length; i++) {
    for (let j = i + 1; j < DUST.length; j++) {
      const dx = DUST[i].x - DUST[j].x, dy = DUST[i].y - DUST[j].y, dd = dx * dx + dy * dy
      if (dd < 1200) {
        const al = (1 - dd / 1200) * 0.2
        const h = getHue(t * 0.25 + (DUST[i].cp + DUST[j].cp) * 0.5)
        c.strokeStyle = `hsla(${h},${Math.max(50, accentHSL.s)}%,${Math.max(50, accentHSL.l)}%,${al.toFixed(4)})`
        c.beginPath(); c.moveTo(IC + DUST[i].x, IC + DUST[i].y); c.lineTo(IC + DUST[j].x, IC + DUST[j].y); c.stroke()
      }
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

/** 测量 G 字形在大画布上的实际像素边界 */
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
  off.width = INTERNAL; off.height = INTERNAL
  const oc = off.getContext('2d')

  initDust()
  accentHSL = getThemeAccentHSL()
  const themeObs = new MutationObserver(() => { accentHSL = getThemeAccentHSL() })
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  function render(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05)
    lastT = ts; time += dt

    oc.clearRect(0, 0, INTERNAL, INTERNAL)
    // 先画黑底 G
    setGFont(oc); oc.fillStyle = '#111111'
    oc.fillText('G', IC, IC)
    // 粒子叠在黑底上
    drawStardust(oc, time)
    // 裁剪到 G 形状
    oc.globalCompositeOperation = 'destination-in'
    setGFont(oc); oc.fillStyle = '#fff'
    oc.fillText('G', IC, IC)
    oc.globalCompositeOperation = 'source-over'
    drawGStroke(oc)

    ctx.clearRect(0, 0, c.width, c.height)
    const ox = (outSz - gBBox.w) / 2, oy = (outSz - gBBox.h) / 2
    ctx.drawImage(off, gBBox.x, gBBox.y, gBBox.w, gBBox.h, ox * dpr, oy * dpr, gBBox.w * dpr, gBBox.h * dpr)
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
