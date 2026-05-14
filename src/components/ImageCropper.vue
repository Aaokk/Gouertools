<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 图片裁剪</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 预览/裁剪区 -->
      <div class="preview-stack">
        <!-- 操作栏 -->
        <div class="crop-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择图片
          </button>
          <button v-if="imgSrc" class="btn btn-primary btn-sm" @click="doCrop">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/></svg>
            裁剪并下载
          </button>
          <button v-if="imgSrc" class="btn btn-ghost btn-sm" @click="resetCrop">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L20 7M4 17l1.64 1.36A9 9 0 0020.49 15"/></svg>
            重置
          </button>
        </div>

        <!-- 裁剪画布 -->
        <div
          class="preview-area crop-container"
          ref="containerRef"
          @dragover.prevent
          @drop.prevent="onDrop"
          @click="!imgSrc && fileInput.click()"
          :class="{ dragging: isDragging }"
          @dragenter="isDragging = true"
          @dragleave="isDragging = false"
        >
          <!-- 空状态 -->
          <template v-if="!imgSrc">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片到此处</span>
            <span class="placeholder-hint">支持 JPG、PNG、WebP 格式</span>
            <div class="format-tags">
              <span class="format-tag">JPG</span>
              <span class="format-tag">PNG</span>
              <span class="format-tag">WebP</span>
            </div>
          </template>

          <!-- 图片 + 裁剪框 -->
          <template v-else>
            <div class="img-wrap" ref="imgWrapRef">
              <img
                ref="imgRef"
                :src="imgSrc"
                class="crop-image"
                @load="onImageLoad"
                draggable="false"
              />
              <!-- 遮罩层 + 裁剪框（坐标系与图片对齐）-->
              <div class="crop-overlay" v-if="cropBox">
                <!-- 四角遮罩 -->
                <div class="mask mask-top"    :style="maskTop" />
                <div class="mask mask-bottom" :style="maskBottom" />
                <div class="mask mask-left"   :style="maskLeft" />
                <div class="mask mask-right"  :style="maskRight" />

                <!-- 裁剪框本体 -->
                <div
                  class="crop-box"
                  :style="cropBoxStyle"
                  @mousedown.prevent="startDragBox"
                >
                  <!-- 九宫格辅助线 -->
                  <div class="grid-line grid-v1" /><div class="grid-line grid-v2" />
                  <div class="grid-line grid-h1" /><div class="grid-line grid-h2" />
                  <!-- 8个控制点 -->
                  <div v-for="h in handles" :key="h" :class="['handle', `handle-${h}`]"
                    @mousedown.prevent.stop="startResize(h, $event)" />
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 尺寸信息 -->
        <div v-if="imgSrc && cropBox" class="crop-info">
          <span>裁剪区域：{{ Math.round(cropBox.w / imgScale) }} × {{ Math.round(cropBox.h / imgScale) }} px</span>
          <span class="sep">|</span>
          <span>原图：{{ origWidth }} × {{ origHeight }} px</span>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <div class="control-panel">

        <!-- 比例预设 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>裁剪比例</h4>
            <svg class="arrow" :class="{ rotated: !s1 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <div class="ratio-grid">
              <button
                v-for="p in presets"
                :key="p.id"
                :class="['ratio-btn', { active: activePreset === p.id }]"
                @click="applyPreset(p)"
              >
                <span class="ratio-label">{{ p.label }}</span>
                <span class="ratio-sub">{{ p.sub }}</span>
              </button>
            </div>

            <!-- 自定义比例 -->
            <div class="setting-row" style="margin-top:10px;">
              <label>自定义</label>
              <div class="control" style="display:flex;align-items:center;gap:4px;">
                <input class="input" type="number" v-model.number="customW" min="1" style="width:56px;" placeholder="宽">
                <span style="color:var(--color-text-muted);font-size:13px;">:</span>
                <input class="input" type="number" v-model.number="customH" min="1" style="width:56px;" placeholder="高">
                <button class="btn btn-secondary btn-sm" @click="applyCustomRatio">应用</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输出设置 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s2 = !s2">
            <h4>输出设置</h4>
            <svg class="arrow" :class="{ rotated: !s2 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s2">
            <div class="setting-row">
              <label>输出格式</label>
              <div class="control">
                <select class="select" v-model="outputFormat">
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            </div>
            <div class="setting-row" v-if="outputFormat !== 'image/png'">
              <label>输出质量</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="10" max="100" v-model.number="outputQuality">
                  <span class="range-value">{{ outputQuality }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;" :disabled="!imgSrc" @click="doCrop">
          裁剪并下载
        </button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onFileChange">
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { showToast } from '../utils/toast.js'

/* ── 文件 ────────────────────────────────────────────────── */
const fileInput    = ref(null)
const imgRef       = ref(null)
const imgWrapRef   = ref(null)
const containerRef = ref(null)
const imgSrc       = ref('')
const origWidth    = ref(0)
const origHeight   = ref(0)
const fileName     = ref('image')
const isDragging   = ref(false)

/* ── 折叠 ────────────────────────────────────────────────── */
const s1 = ref(true)
const s2 = ref(true)

/* ── 输出 ────────────────────────────────────────────────── */
const outputFormat  = ref('image/jpeg')
const outputQuality = ref(90)

/* ── 比例预设 ────────────────────────────────────────────── */
const presets = [
  { id: 'free',   label: '自由',   sub: '',        ratio: null },
  { id: '1:1',    label: '正方形', sub: '1:1',     ratio: 1/1 },
  { id: '4:3',    label: '横版',   sub: '4:3',     ratio: 4/3 },
  { id: '16:9',   label: '宽屏',   sub: '16:9',    ratio: 16/9 },
  { id: '3:4',    label: '竖版',   sub: '3:4',     ratio: 3/4 },
  { id: '9:16',   label: '手机',   sub: '9:16',    ratio: 9/16 },
  { id: 'id1',    label: '一寸照', sub: '25×35mm', ratio: 25/35 },
  { id: 'id2',    label: '二寸照', sub: '35×49mm', ratio: 35/49 },
  { id: 'xs1',    label: '小一寸', sub: '22×32mm', ratio: 22/32 },
  { id: 'big1',   label: '大一寸', sub: '33×48mm', ratio: 33/48 },
  { id: 'pass',   label: '护照照', sub: '33×48mm', ratio: 33/48 },
  { id: 'idcard', label: '身份证', sub: '26×32mm', ratio: 26/32 },
]

const activePreset = ref('free')
const lockedRatio  = ref(null)   // null = 自由
const customW      = ref(1)
const customH      = ref(1)

/* ── 裁剪框状态 ──────────────────────────────────────────── */
// 坐标全部为屏幕像素（相对于 crop-image 左上角）
const cropBox  = ref(null)   // { x, y, w, h }
const imgScale = ref(1)      // 显示尺寸 / 原图尺寸

const handles = ['nw','n','ne','e','se','s','sw','w']

/* ── 计算样式 ─────────────────────────────────────────────── */
const cropBoxStyle = computed(() => {
  if (!cropBox.value) return {}
  const { x, y, w, h } = cropBox.value
  return { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }
})
const maskTop    = computed(() => {
  if (!cropBox.value || !imgRef.value) return {}
  const { x, y, w } = cropBox.value
  const iw = imgRef.value.offsetWidth
  return { top: '0', left: x+'px', width: w+'px', height: y+'px' }
})
const maskBottom = computed(() => {
  if (!cropBox.value || !imgRef.value) return {}
  const { x, y, w, h } = cropBox.value
  const ih = imgRef.value.offsetHeight
  const iw = imgRef.value.offsetWidth
  return { top: (y+h)+'px', left: x+'px', width: w+'px', height: (ih - y - h)+'px' }
})
const maskLeft   = computed(() => {
  if (!cropBox.value || !imgRef.value) return {}
  const { y, h } = cropBox.value
  const ih = imgRef.value.offsetHeight
  return { top: '0', left: '0', width: cropBox.value.x+'px', height: ih+'px' }
})
const maskRight  = computed(() => {
  if (!cropBox.value || !imgRef.value) return {}
  const { x, y, w, h } = cropBox.value
  const iw = imgRef.value.offsetWidth
  const ih = imgRef.value.offsetHeight
  return { top: '0', left: (x+w)+'px', width: (iw - x - w)+'px', height: ih+'px' }
})

/* ── 文件加载 ─────────────────────────────────────────────── */
const onFileChange = (e) => {
  const f = e.target.files[0]
  e.target.value = ''
  if (f) loadFile(f)
}
const onDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) loadFile(f)
}
const loadFile = (f) => {
  fileName.value = f.name.replace(/\.[^.]+$/, '')
  const url = URL.createObjectURL(f)
  if (imgSrc.value) URL.revokeObjectURL(imgSrc.value)
  imgSrc.value = url
}

const onImageLoad = () => {
  const img = imgRef.value
  origWidth.value  = img.naturalWidth
  origHeight.value = img.naturalHeight
  imgScale.value = img.offsetWidth / img.naturalWidth
  initCropBox()
}

/* ── 初始化裁剪框 ─────────────────────────────────────────── */
const initCropBox = () => {
  const img = imgRef.value
  if (!img) return
  const iw = imgWrapRef.value?.offsetWidth  || img.offsetWidth
  const ih = imgWrapRef.value?.offsetHeight || img.offsetHeight
  // 默认占 80% 居中
  if (lockedRatio.value) {
    const r = lockedRatio.value
    let w = iw * 0.8
    let h = w / r
    if (h > ih * 0.8) { h = ih * 0.8; w = h * r }
    cropBox.value = { x: (iw - w) / 2, y: (ih - h) / 2, w, h }
  } else {
    const w = iw * 0.8, h = ih * 0.8
    cropBox.value = { x: (iw - w) / 2, y: (ih - h) / 2, w, h }
  }
}

/* ── 比例应用 ─────────────────────────────────────────────── */
const applyPreset = (p) => {
  activePreset.value = p.id
  lockedRatio.value  = p.ratio
  if (imgSrc.value) initCropBox()
}

const applyCustomRatio = () => {
  if (!customW.value || !customH.value) return
  activePreset.value = 'custom'
  lockedRatio.value  = customW.value / customH.value
  if (imgSrc.value) initCropBox()
}

/* ── 拖动裁剪框 ──────────────────────────────────────────── */
let dragState = null

const startDragBox = (e) => {
  const cb = cropBox.value
  dragState = { type: 'move', startX: e.clientX, startY: e.clientY, origBox: { ...cb } }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

const startResize = (handle, e) => {
  const cb = cropBox.value
  dragState = { type: 'resize', handle, startX: e.clientX, startY: e.clientY, origBox: { ...cb } }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
}

const onMouseMove = (e) => {
  if (!dragState || !imgWrapRef.value) return
  const img = imgRef.value
  const iw = imgWrapRef.value.offsetWidth
  const ih = imgWrapRef.value.offsetHeight
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  const ob = dragState.origBox
  const r  = lockedRatio.value

  if (dragState.type === 'move') {
    let nx = ob.x + dx
    let ny = ob.y + dy
    nx = Math.max(0, Math.min(iw - ob.w, nx))
    ny = Math.max(0, Math.min(ih - ob.h, ny))
    cropBox.value = { ...ob, x: nx, y: ny }
    return
  }

  // resize
  let { x, y, w, h } = ob
  const h2 = dragState.handle

  if (h2.includes('e')) w = Math.max(20, ob.w + dx)
  if (h2.includes('s')) h = Math.max(20, ob.h + dy)
  if (h2.includes('w')) { x = ob.x + dx; w = Math.max(20, ob.w - dx) }
  if (h2.includes('n')) { y = ob.y + dy; h = Math.max(20, ob.h - dy) }

  if (r) {
    // 锁定比例时以较大维度为主
    if (h2.includes('e') || h2.includes('w')) {
      h = w / r
    } else {
      w = h * r
    }
    if (h2.includes('n')) y = ob.y + ob.h - h
    if (h2.includes('w')) x = ob.x + ob.w - w
  }

  // 边界约束
  x = Math.max(0, x); y = Math.max(0, y)
  w = Math.min(iw - x, w); h = Math.min(ih - y, h)
  if (w < 20) w = 20; if (h < 20) h = 20

  cropBox.value = { x, y, w, h }
}

const stopDrag = () => {
  dragState = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
}

/* ── 重置 ─────────────────────────────────────────────────── */
const resetCrop = () => {
  activePreset.value = 'free'
  lockedRatio.value  = null
  initCropBox()
}

/* ── 裁剪并下载 ───────────────────────────────────────────── */
const doCrop = () => {
  if (!imgRef.value || !cropBox.value) return
  const { x, y, w, h } = cropBox.value
  const scale = origWidth.value / imgRef.value.offsetWidth

  const sx = Math.round(x * scale)
  const sy = Math.round(y * scale)
  const sw = Math.round(w * scale)
  const sh = Math.round(h * scale)

  const canvas = document.createElement('canvas')
  canvas.width  = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.src = imgSrc.value
  img.onload = () => {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    const ext = outputFormat.value.split('/')[1] || 'jpg'
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName.value}_cropped.${ext}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast({ message: `裁剪完成：${sw} × ${sh} px`, type: 'success' })
    }, outputFormat.value, outputQuality.value / 100)
  }
}
</script>

<style scoped>
.tool-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.preview-stack {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.crop-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 裁剪容器 */
.crop-container {
  position: relative;
  cursor: crosshair;
  user-select: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* img-wrap 与图片尺寸完全一致，overlay 坐标系以此为基准 */
.img-wrap {
  position: relative;
  display: inline-flex;
  line-height: 0;
  max-width: 100%;
  max-height: 100%;
}

.crop-image {
  display: block;
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
  pointer-events: none;
}

/* 遮罩 — inset:0 相对 img-wrap（即图片本身） */
.crop-overlay { position: absolute; inset: 0; pointer-events: none; }
.mask {
  position: absolute;
  background: rgba(0,0,0,0.45);
  pointer-events: none;
}

/* 裁剪框 */
.crop-box {
  position: absolute;
  border: 2px solid var(--color-accent);
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
  cursor: move;
  box-sizing: border-box;
  pointer-events: all;
}

/* 九宫格辅助线 */
.grid-line {
  position: absolute;
  background: rgba(255,255,255,0.25);
  pointer-events: none;
}
.grid-v1 { left: 33.33%; top: 0; width: 1px; height: 100%; }
.grid-v2 { left: 66.66%; top: 0; width: 1px; height: 100%; }
.grid-h1 { top: 33.33%; left: 0; height: 1px; width: 100%; }
.grid-h2 { top: 66.66%; left: 0; height: 1px; width: 100%; }

/* 控制点 */
.handle {
  position: absolute;
  width: 10px; height: 10px;
  background: var(--color-accent);
  border: 2px solid #fff;
  border-radius: 2px;
  pointer-events: all;
  box-sizing: border-box;
}
.handle-nw { top: -5px; left: -5px; cursor: nw-resize; }
.handle-n  { top: -5px; left: calc(50% - 5px); cursor: n-resize; }
.handle-ne { top: -5px; right: -5px; cursor: ne-resize; }
.handle-e  { top: calc(50% - 5px); right: -5px; cursor: e-resize; }
.handle-se { bottom: -5px; right: -5px; cursor: se-resize; }
.handle-s  { bottom: -5px; left: calc(50% - 5px); cursor: s-resize; }
.handle-sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.handle-w  { top: calc(50% - 5px); left: -5px; cursor: w-resize; }

/* 裁剪信息 */
.crop-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-muted);
}
.sep { opacity: 0.4; }

/* 比例预设网格 */
.ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.ratio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
  gap: 2px;
}
.ratio-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
}
.ratio-btn.active {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
  color: var(--color-accent);
}
.ratio-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-foreground);
}
.ratio-btn.active .ratio-label { color: var(--color-accent); }
.ratio-sub {
  font-size: 10px;
  color: var(--color-text-muted);
  font-family: var(--font-heading);
}

.control-panel {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.arrow {
  transition: transform var(--transition-fast);
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.arrow.rotated { transform: rotate(-90deg); }
</style>
