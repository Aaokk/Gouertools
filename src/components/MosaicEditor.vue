<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 局部打码</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧 -->
      <div class="preview-stack">
        <div class="mosaic-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择图片
          </button>
          <button v-if="imgLoaded" class="btn btn-danger btn-sm" @click="undoLast" :disabled="!history.length">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-1"/></svg>
            撤销
          </button>
          <button v-if="imgLoaded" class="btn btn-ghost btn-sm" @click="clearAll">
            全部清除
          </button>
          <button v-if="imgLoaded" class="btn btn-primary btn-sm" @click="downloadResult">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            下载
          </button>
        </div>

        <!-- 画布区 -->
        <div
          class="preview-area mosaic-canvas-wrap"
          @dragover.prevent @dragenter="isDragging=true" @dragleave="isDragging=false"
          @drop.prevent="onDrop" :class="{ dragging: isDragging }"
          @click="!imgLoaded && fileInput.click()"
        >
          <!-- 空状态 -->
          <template v-if="!imgLoaded">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片到此处</span>
            <span class="placeholder-hint">拖拽选区进行打码，支持马赛克和模糊两种效果</span>
            <div class="format-tags">
              <span class="format-tag">JPG</span>
              <span class="format-tag">PNG</span>
              <span class="format-tag">WebP</span>
            </div>
          </template>

          <!-- 画布 -->
          <canvas
            v-show="imgLoaded"
            ref="canvasRef"
            class="mosaic-canvas"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          ></canvas>
        </div>
      </div>

      <!-- 右侧设置 -->
      <div class="control-panel">
        <div class="setting-card">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>打码设置</h4>
            <svg class="arrow" :class="{ rotated: !s1 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <!-- 操作模式 -->
            <div class="setting-row">
              <label>操作模式</label>
              <div class="control">
                <div class="mode-btns">
                  <button :class="['mode-btn', { active: drawMode === 'rect' }]" @click="drawMode = 'rect'" title="矩形选框">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
                    矩形选框
                  </button>
                  <button :class="['mode-btn', { active: drawMode === 'brush' }]" @click="drawMode = 'brush'" title="画笔涂抹">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                    画笔涂抹
                  </button>
                </div>
              </div>
            </div>

            <!-- 画笔大小（画笔模式时显示） -->
            <div v-if="drawMode === 'brush'" class="setting-row">
              <label>画笔大小</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="10" max="120" step="5" v-model.number="brushSize">
                  <span class="range-value">{{ brushSize }}px</span>
                </div>
              </div>
            </div>

            <div class="setting-row">
              <label>效果类型</label>
              <div class="control">
                <select class="select" v-model="mosaicType">
                  <option value="mosaic">马赛克</option>
                  <option value="blur">高斯模糊</option>
                  <option value="black">黑色遮罩</option>
                </select>
              </div>
            </div>
            <div v-if="mosaicType === 'mosaic'" class="setting-row">
              <label>像素块大小</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="4" max="40" step="2" v-model.number="blockSize">
                  <span class="range-value">{{ blockSize }}px</span>
                </div>
              </div>
            </div>
            <div v-if="mosaicType === 'blur'" class="setting-row">
              <label>模糊强度</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="2" max="30" step="1" v-model.number="blurRadius">
                  <span class="range-value">{{ blurRadius }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mosaic-tip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span v-if="drawMode === 'rect'">矩形选框：拖拽选区一键打码，可撤销</span>
          <span v-else>画笔模式：按住鼠标随意涂抹，松开后自动打码，可撤销</span>
        </div>

        <button v-if="imgLoaded" class="btn btn-primary" style="width:100%;" @click="downloadResult">
          下载打码图片
        </button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onFileChange">
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast } from '../utils/toast.js'
import { downloadDataUrl } from '../utils/download.js'

const fileInput  = ref(null)
const canvasRef  = ref(null)
const isDragging = ref(false)
const imgLoaded  = ref(false)
const fileName   = ref('image')
const s1 = ref(true)

const mosaicType = ref('mosaic')
const blockSize  = ref(16)
const blurRadius = ref(10)
const drawMode   = ref('brush')  // 'rect' | 'brush'
const brushSize  = ref(40)

let origImage = null
let baseImageData = null
const history = ref([])

/* ── 加载文件 ─────────────────────────────────────────────── */
const onFileChange = (e) => {
  const f = e.target.files[0]; e.target.value = ''
  if (f) loadFile(f)
}
const onDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) loadFile(f)
}
const loadFile = (f) => {
  fileName.value = f.name.replace(/\.[^.]+$/, '')
  history.value = []
  const url = URL.createObjectURL(f)
  const img = new Image()
  img.onload = () => {
    origImage = img
    URL.revokeObjectURL(url)
    const canvas = canvasRef.value
    const maxW = canvas.parentElement.offsetWidth || 800
    const scale = Math.min(1, maxW / img.naturalWidth)
    canvas.width  = Math.round(img.naturalWidth  * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    imgLoaded.value = true
  }
  img.src = url
}

/* ── 坐标转换 ─────────────────────────────────────────────── */
let dragging = false
let startX = 0, startY = 0
let selRect = null
let brushPath = []       // 画笔路径点集

const getCanvasPos = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width  / rect.width
  const scaleY = canvasRef.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  }
}

/* ── 鼠标事件（矩形 & 画笔统一入口）─────────────────────── */
const onMouseDown = (e) => {
  if (!imgLoaded.value) return
  dragging = true
  const pos = getCanvasPos(e)
  if (drawMode.value === 'brush') {
    history.value.push(baseImageData)  // 画笔：鼠标按下时保存快照
    brushPath = [pos]
  } else {
    startX = pos.x; startY = pos.y
    selRect = null
  }
}

const onMouseMove = (e) => {
  if (!dragging || !imgLoaded.value) return
  const pos = getCanvasPos(e)
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  if (drawMode.value === 'brush') {
    brushPath.push(pos)
    // 在 baseImageData 副本上实时预览画笔路径圆圈
    ctx.putImageData(baseImageData, 0, 0)
    applyBrushStroke(ctx, brushPath)
    // 画笔光标预览圆
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, brushSize.value / 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,255,170,0.7)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 2])
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    selRect = {
      x: Math.min(startX, pos.x),
      y: Math.min(startY, pos.y),
      w: Math.abs(pos.x - startX),
      h: Math.abs(pos.y - startY),
    }
    ctx.putImageData(baseImageData, 0, 0)
    ctx.strokeStyle = 'rgba(0,255,170,0.9)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(selRect.x, selRect.y, selRect.w, selRect.h)
    ctx.setLineDash([])
  }
}

const onMouseUp = () => {
  if (!dragging) return
  dragging = false

  if (drawMode.value === 'brush') {
    if (brushPath.length < 2) {
      // 单点：用圆形区域打码
      const p = brushPath[0]
      const r = brushSize.value / 2
      applyMosaic({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 })
    } else {
      // 多点：把路径上每段圆形全部打码（提交最终结果）
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      ctx.putImageData(baseImageData, 0, 0)
      applyBrushStroke(ctx, brushPath)
      baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
    brushPath = []
  } else {
    if (!selRect || selRect.w < 4 || selRect.h < 4) { selRect = null; return }
    history.value.push(baseImageData)
    applyMosaic(selRect)
    selRect = null
  }
}

/* ── 画笔涂抹：沿路径对每个圆形区域打码 ────────────────── */
const applyBrushStroke = (ctx, path) => {
  const r  = Math.floor(brushSize.value / 2)
  const bs = Math.max(4, blockSize.value)
  const canvas = canvasRef.value

  for (const { x, y } of path) {
    const xi = Math.max(0, Math.floor(x - r))
    const yi = Math.max(0, Math.floor(y - r))
    const wi = Math.min(canvas.width  - xi, Math.ceil(r * 2))
    const hi = Math.min(canvas.height - yi, Math.ceil(r * 2))
    if (wi <= 0 || hi <= 0) continue

    if (mosaicType.value === 'black') {
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()

    } else if (mosaicType.value === 'mosaic') {
      const imgData = ctx.getImageData(xi, yi, wi, hi)
      for (let row = 0; row < hi; row += bs) {
        for (let col = 0; col < wi; col += bs) {
          // 块中心颜色
          const cx = Math.min(col + Math.floor(bs / 2), wi - 1)
          const cy = Math.min(row + Math.floor(bs / 2), hi - 1)
          const si = (cy * wi + cx) * 4
          const rv = imgData.data[si], gv = imgData.data[si+1], bv = imgData.data[si+2]
          // 填充块内每个在圆内的像素
          for (let dy = row; dy < Math.min(row + bs, hi); dy++) {
            for (let dx = col; dx < Math.min(col + bs, wi); dx++) {
              // 判断是否在画笔圆内（绝对坐标）
              const absX = xi + dx, absY = yi + dy
              if ((absX - x) ** 2 + (absY - y) ** 2 > r * r) continue
              const pi = (dy * wi + dx) * 4
              imgData.data[pi] = rv; imgData.data[pi+1] = gv; imgData.data[pi+2] = bv
            }
          }
        }
      }
      ctx.putImageData(imgData, xi, yi)

    } else if (mosaicType.value === 'blur') {
      ctx.save()
      ctx.filter = `blur(${blurRadius.value}px)`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(canvas, 0, 0)
      ctx.restore()
      ctx.filter = 'none'
    }
  }
}

/* ── 打码算法 ─────────────────────────────────────────────── */
const applyMosaic = (rect) => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const { x, y, w, h } = rect
  const xi = Math.floor(x), yi = Math.floor(y)
  const wi = Math.max(1, Math.floor(w)), hi = Math.max(1, Math.floor(h))

  if (mosaicType.value === 'black') {
    ctx.fillStyle = '#000000'
    ctx.fillRect(xi, yi, wi, hi)
  } else if (mosaicType.value === 'mosaic') {
    const bs = blockSize.value
    const imgData = ctx.getImageData(xi, yi, wi, hi)
    for (let row = 0; row < hi; row += bs) {
      for (let col = 0; col < wi; col += bs) {
        // 取块中心颜色
        const cx = Math.min(col + Math.floor(bs/2), wi - 1)
        const cy = Math.min(row + Math.floor(bs/2), hi - 1)
        const idx = (cy * wi + cx) * 4
        const r = imgData.data[idx], g = imgData.data[idx+1], b = imgData.data[idx+2]
        // 填充整块
        for (let dy = row; dy < Math.min(row+bs, hi); dy++) {
          for (let dx = col; dx < Math.min(col+bs, wi); dx++) {
            const i = (dy * wi + dx) * 4
            imgData.data[i] = r; imgData.data[i+1] = g; imgData.data[i+2] = b
          }
        }
      }
    }
    ctx.putImageData(imgData, xi, yi)
  } else if (mosaicType.value === 'blur') {
    // 简单箱式模糊
    const radius = blurRadius.value
    const imgData = ctx.getImageData(Math.max(0, xi-radius), Math.max(0, yi-radius),
      wi + radius*2, hi + radius*2)
    ctx.filter = `blur(${radius}px)`
    ctx.drawImage(canvas, xi, yi, wi, hi, xi, yi, wi, hi)
    ctx.filter = 'none'
  }

  baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

/* ── 撤销/清除/下载 ───────────────────────────────────────── */
const undoLast = () => {
  if (!history.value.length) return
  baseImageData = history.value.pop()
  canvasRef.value.getContext('2d').putImageData(baseImageData, 0, 0)
}

const clearAll = () => {
  history.value = []
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  ctx.drawImage(origImage, 0, 0, canvas.width, canvas.height)
  baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

const downloadResult = () => {
  const url = canvasRef.value.toDataURL('image/png')
  downloadDataUrl(url, `${fileName.value}_mosaic.png`)
  showToast({ message: '下载成功', type: 'success' })
}
</script>

<style scoped>
:deep(.tool-body) { padding-top: var(--spacing-md); }
.tool-page { flex: 1; display: flex; flex-direction: column; width: 100%; min-width: 0; }
.preview-stack { min-width: 0; width: 100%; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.mosaic-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mosaic-canvas-wrap { display: flex; align-items: center; justify-content: center; }
.mosaic-canvas { max-width: 100%; max-height: 580px; display: block; cursor: crosshair; }

.mode-btns { display: flex; gap: 6px; }
.mode-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 11px; font-weight: 600; font-family: var(--font-body);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}
.mode-btn:hover { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-dim); }
.mode-btn.active { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-dim); }

.control-panel { box-sizing: border-box; width: 100%; min-width: 0; overflow-x: hidden; display: flex; flex-direction: column; gap: var(--spacing-md); }
.arrow { transition: transform var(--transition-fast); color: var(--color-text-muted); flex-shrink: 0; }
.arrow.rotated { transform: rotate(-90deg); }

.mosaic-tip {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 8px 10px;
  background: var(--color-accent-dim);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 11px; color: var(--color-text-muted); line-height: 1.5;
}
.mosaic-tip svg { flex-shrink: 0; margin-top: 1px; color: var(--color-accent); }
</style>
