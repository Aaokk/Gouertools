<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 图片加水印</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 预览列：虚线框 + 其下文件缩略列表 -->
      <div class="preview-stack">

        <!-- 操作栏（与图片压缩风格一致） -->
        <div class="wm-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="handleFileSelect">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择文件
          </button>
          <button v-if="imageList.length" class="btn btn-primary btn-sm" @click="saveImage">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/></svg>
            保存当前
          </button>
          <button v-if="imageList.length > 1" class="btn btn-purple btn-sm" @click="saveAllImages">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            批量保存
          </button>
          <button v-if="imageList.length" class="btn btn-danger btn-sm" @click="clearImageList">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            清理列表
          </button>
        </div>

        <div
          class="preview-area"
          @dragover.prevent
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="!imageList.length && handleFileSelect()"
          :class="{ dragging: isDragging }"
        >
          <template v-if="!imageList.length">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片文件到此处</span>
            <span class="placeholder-hint">支持 JPG、PNG、WebP 格式</span>
          </template>
          <canvas
            v-show="imageList.length > 0"
            ref="canvasRef"
            @mousedown="startWatermarkDrag"
            class="preview-canvas"
          />
        </div>

        <div v-if="imageList.length" class="file-section">
          <div class="file-label">已选择 {{ imageList.length }} 个文件：</div>
          <div class="file-strip">
            <div
              v-for="(image, index) in imageList"
              :key="image.id"
              :class="['file-thumb', { active: index === currentImageIndex }]"
              @click="switchToImage(index)"
            >
              <img v-if="image.src" :src="image.src" :alt="image.name" style="width:100%;height:100%;object-fit:cover;">
            </div>
          </div>
          <div class="file-nav" v-if="imageList.length > 1">
            <button class="btn btn-ghost btn-sm" @click="previousImage" :disabled="currentImageIndex === 0">上一张</button>
            <span class="page-indicator">{{ currentImageIndex + 1 }} / {{ imageList.length }}</span>
            <button class="btn btn-ghost btn-sm" @click="nextImage" :disabled="currentImageIndex === imageList.length - 1">下一张</button>
          </div>
        </div>
      </div>

      <!-- 右侧控制面板（相对定位，供颜色弹层在其区域内居中） -->
      <div class="control-panel wm-control-panel-root">

        <!-- 基础设置 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="toggleCard('basic')">
            <h4>基础设置</h4>
            <svg class="arrow" :class="{ rotated: !cardOpen.basic }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="cardOpen.basic">
            <div class="setting-row">
              <label>配置模式</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="watermarkSettings.useProportionalMode" @change="updateWatermark" />
                  <span class="toggle-track"></span>
                  <span class="toggle-label">{{ watermarkSettings.useProportionalMode ? '比例模式' : '固定模式' }}</span>
                </label>
              </div>
            </div>
            <div class="setting-row">
              <label>水印文字</label>
              <div class="control"><input class="input" type="text" v-model="watermarkSettings.text" maxlength="130"></div>
            </div>
            <div class="setting-row">
              <label>文字颜色</label>
              <div class="control" style="display:flex;align-items:center;gap:8px;">
                <div
                  class="color-dot wm-color-swatch"
                  :style="{ background: watermarkSettings.color }"
                  role="button"
                  tabindex="0"
                  title="打开颜色选择"
                  @click="openColorPicker"
                  @keydown.enter.prevent="openColorPicker"
                  @keydown.space.prevent="openColorPicker"
                />
                <input class="input" :value="watermarkSettings.color"
                  @input="e => { watermarkSettings.color = e.target.value; updateColorFromHex(e.target.value) }"
                  style="width:90px;" maxlength="7" placeholder="#000000">
              </div>
            </div>
            <div class="setting-row">
              <label>不透明度</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0" max="100" :value="Math.round(watermarkSettings.rgb.a * 100)" @input="e => { watermarkSettings.rgb.a = Number(e.target.value) / 100; updateWatermark() }">
                  <span class="range-value">{{ Math.round(watermarkSettings.rgb.a * 100) }}%</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="!watermarkSettings.useProportionalMode">
              <label>字体大小</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="12" max="100" v-model.number="watermarkSettings.fontSize">
                  <span class="range-value">{{ watermarkSettings.fontSize }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-else>
              <label>字体比例</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0.5" max="10" step="0.5" :value="watermarkSettings.fontSizeRatio * 100" @input="e => { watermarkSettings.fontSizeRatio = Number(e.target.value) / 100; updateWatermark() }">
                  <span class="range-value">{{ (watermarkSettings.fontSizeRatio * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 高级设置 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="toggleCard('advanced')">
            <h4>高级设置</h4>
            <svg class="arrow" :class="{ rotated: !cardOpen.advanced }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="cardOpen.advanced">
            <div class="setting-row">
              <label>重复水印</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="watermarkSettings.repeat">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
            <div class="setting-row" v-if="watermarkSettings.repeat && !watermarkSettings.useProportionalMode">
              <label>水印间距</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0" max="300" v-model.number="watermarkSettings.spacing">
                  <span class="range-value">{{ watermarkSettings.spacing }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="watermarkSettings.repeat && watermarkSettings.useProportionalMode">
              <label>间距比例</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0" max="20" step="1" :value="watermarkSettings.spacingRatio * 100" @input="e => { watermarkSettings.spacingRatio = Number(e.target.value) / 100; updateWatermark() }">
                  <span class="range-value">{{ (watermarkSettings.spacingRatio * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>水印框宽</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="100" max="500" v-model.number="watermarkSettings.watermarkWidth">
                  <span class="range-value">{{ watermarkSettings.watermarkWidth }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>水印框高</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="100" max="500" v-model.number="watermarkSettings.watermarkHeight">
                  <span class="range-value">{{ watermarkSettings.watermarkHeight }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>旋转角度</label>
              <div class="control" style="display:flex;align-items:center;gap:6px;">
                <div class="range-group" style="flex:1;min-width:0;">
                  <input type="range" min="-90" max="90" v-model.number="watermarkSettings.angle" style="min-width:0;">
                  <span class="range-value">{{ watermarkSettings.angle }}°</span>
                </div>
                <button v-if="imageList.length" class="btn btn-secondary btn-sm" @click="rotate" style="flex-shrink:0;white-space:nowrap;">旋转90°</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Logo 设置 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="toggleCard('logo')">
            <h4>Logo 设置</h4>
            <svg class="arrow" :class="{ rotated: !cardOpen.logo }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="cardOpen.logo">
            <div class="setting-row">
              <label>选择Logo</label>
              <div class="control"><button class="btn btn-secondary btn-sm" @click="handleLogoSelect">选择文件</button></div>
            </div>
            <div class="setting-row" v-if="logoSettings.image">
              <label>位置</label>
              <div class="control">
                <select class="select" v-model="logoSettings.position">
                  <option value="top-left">左上角</option>
                  <option value="top-right">右上角</option>
                  <option value="bottom-left">左下角</option>
                  <option value="bottom-right">右下角</option>
                </select>
              </div>
            </div>
            <div class="setting-row" v-if="logoSettings.image">
              <label>Logo大小</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="20" max="200" v-model.number="logoSettings.size" @input="updateWatermark">
                  <span class="range-value">{{ logoSettings.size }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="logoSettings.image">
              <label>Logo边距</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0" max="100" v-model.number="logoSettings.padding" @input="updateWatermark">
                  <span class="range-value">{{ logoSettings.padding }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="logoSettings.image">
              <label>Logo透明</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="0" max="100" :value="Math.round(logoSettings.opacity * 100)" @input="e => { logoSettings.opacity = Number(e.target.value) / 100; updateWatermark() }">
                  <span class="range-value">{{ Math.round(logoSettings.opacity * 100) }}%</span>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="logoSettings.image">
              <label></label>
              <div class="control"><button class="btn btn-danger btn-sm" @click="clearLogo">清除Logo</button></div>
            </div>
          </div>
        </div>

        <button class="btn btn-ghost" style="align-self:center;" @click="resetSettings">重置全部设置</button>

        <!-- 自定义颜色弹层：在右侧控制栏区域内水平垂直居中 -->
        <div
          v-if="colorPickerOpen"
          class="wm-color-overlay"
          @click.self="cancelColorPicker"
        >
          <div
            class="wm-color-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wm-color-dialog-title"
            @click.stop
          >
            <div id="wm-color-dialog-title" class="wm-color-dialog-title">文字颜色</div>
            <div
              ref="svPlaneRef"
              class="wm-sv-plane"
              :style="{ '--wm-picker-h': pickerHue + 'deg' }"
              @pointerdown.prevent="onSvPointerDown"
            >
              <div class="wm-sv-indicator" :style="svIndicatorStyle"></div>
            </div>
            <div class="wm-hue-row">
              <span class="wm-hue-label">色相</span>
              <input
                type="range"
                class="wm-hue-slider"
                min="0"
                max="360"
                step="1"
                :value="pickerHue"
                @input="onHueInput"
              />
            </div>
            <div class="wm-color-dialog-footer">
              <input
                class="input wm-hex-input"
                :value="pickerHexLocal"
                maxlength="9"
                placeholder="#000000"
                spellcheck="false"
                @input="onPickerHexInput"
              />
              <div class="wm-color-preview" :style="{ background: pickerPreviewBg }"></div>
            </div>
            <div class="wm-color-dialog-actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="cancelColorPicker">取消</button>
              <button type="button" class="btn btn-primary btn-sm" @click="confirmColorPicker">确定</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { showToast } from '../utils/toast.js'
import { downloadDataUrl } from '../utils/download.js'

// Card toggle state
const cardOpen = reactive({
  basic: true,
  advanced: true,
  logo: false
})

function toggleCard(name) {
  cardOpen[name] = !cardOpen[name]
}

// 从 localStorage 获取保存的设置或使用默认值
const getStoredSettings = () => {
  const defaultSettings = {
    text: "+++ 输入你要添加的水印文字 +++",
    color: "#000000",
    rgb: {r: 0, g: 0, b: 0, a: 0.6},
    fontSize: 12,
    watermarkHeight: 100,
    watermarkWidth: 100,
    angle: -45,
    repeat: true,
    spacing: 0,
    useProportionalMode: true,
    fontSizeRatio: 0.03,
    spacingRatio: 0.05,
    watermarkHeightRatio: 0.15,
    watermarkWidthRatio: 0.25
  }

  const stored = localStorage.getItem('watermarkSettings')
  if (stored) {
    try {
      const settings = JSON.parse(stored)
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        rgb: { ...defaultSettings.rgb, ...settings.rgb }
      }
      mergedSettings.fontSize = parseInt(mergedSettings.fontSize) || defaultSettings.fontSize
      mergedSettings.watermarkHeight = parseInt(mergedSettings.watermarkHeight) || defaultSettings.watermarkHeight
      mergedSettings.watermarkWidth = parseInt(mergedSettings.watermarkWidth) || defaultSettings.watermarkWidth
      mergedSettings.spacing = parseInt(mergedSettings.spacing) || defaultSettings.spacing
      mergedSettings.angle = parseFloat(mergedSettings.angle) || defaultSettings.angle
      // logoConfig 在 logoSettings 声明后由 onMounted 恢复，此处仅附带传回
      mergedSettings._savedLogoConfig = settings.logoConfig || null
      return mergedSettings
    } catch (e) {
      console.error('解析存储的设置失败:', e)
      return defaultSettings
    }
  }
  return defaultSettings
}

const watermarkSettings = reactive(getStoredSettings())
const imageList = ref([])
const currentImageIndex = ref(0)
const isDragging = ref(false)
const canvasRef = ref(null)
const watermarkDragging = ref(false)
const watermarkStartPos = ref({ x: 0, y: 0 })
const watermarkOffset = reactive({ x: 100, y: 100 })

const logoSettings = reactive({
  image: null,
  position: 'top-right',
  size: 36,
  padding: 20,
  opacity: 0.6,
  aspectRatio: 1,
  originalWidth: 0,
  originalHeight: 0
})

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) =>
    Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')
  ).join('')
}

function rgbToHsv(r, g, b) {
  let rn = r / 255
  let gn = g / 255
  let bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h: h * 360, s, v }
}

function hsvToRgb(h, s, v) {
  const hh = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = v - c
  let rp = 0
  let gp = 0
  let bp = 0
  if (hh < 60) [rp, gp, bp] = [c, x, 0]
  else if (hh < 120) [rp, gp, bp] = [x, c, 0]
  else if (hh < 180) [rp, gp, bp] = [0, c, x]
  else if (hh < 240) [rp, gp, bp] = [0, x, c]
  else if (hh < 300) [rp, gp, bp] = [x, 0, c]
  else [rp, gp, bp] = [c, 0, x]
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255)
  }
}

const colorPickerOpen = ref(false)
const pickerHue = ref(0)
const pickerS = ref(1)
const pickerV = ref(1)
const pickerHexLocal = ref('#000000')
const svPlaneRef = ref(null)
let colorPickerSnapshot = null

const svIndicatorStyle = computed(() => ({
  left: `${pickerS.value * 100}%`,
  top: `${(1 - pickerV.value) * 100}%`
}))

const pickerPreviewBg = computed(() => {
  const { r, g, b } = hsvToRgb(pickerHue.value, pickerS.value, pickerV.value)
  return `rgb(${r},${g},${b})`
})

function syncPickerHexLocal() {
  const { r, g, b } = hsvToRgb(pickerHue.value, pickerS.value, pickerV.value)
  pickerHexLocal.value = rgbToHex(r, g, b)
}

/** 弹层打开期间实时预览（取消时用 snapshot 恢复） */
function applyPickerPreviewToWatermark() {
  const { r, g, b } = hsvToRgb(pickerHue.value, pickerS.value, pickerV.value)
  watermarkSettings.rgb.r = r
  watermarkSettings.rgb.g = g
  watermarkSettings.rgb.b = b
  watermarkSettings.color = rgbToHex(r, g, b)
  updateWatermark()
}

function openColorPicker() {
  colorPickerSnapshot = {
    color: watermarkSettings.color,
    rgb: { ...watermarkSettings.rgb }
  }
  const { h, s, v } = rgbToHsv(watermarkSettings.rgb.r, watermarkSettings.rgb.g, watermarkSettings.rgb.b)
  pickerHue.value = Number.isFinite(h) ? Math.round(h) : 0
  pickerS.value = Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 1
  pickerV.value = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
  syncPickerHexLocal()
  colorPickerOpen.value = true
}

function cancelColorPicker() {
  if (colorPickerSnapshot) {
    watermarkSettings.color = colorPickerSnapshot.color
    watermarkSettings.rgb.r = colorPickerSnapshot.rgb.r
    watermarkSettings.rgb.g = colorPickerSnapshot.rgb.g
    watermarkSettings.rgb.b = colorPickerSnapshot.rgb.b
    watermarkSettings.rgb.a = colorPickerSnapshot.rgb.a
    updateWatermark()
  }
  colorPickerSnapshot = null
  colorPickerOpen.value = false
}

function confirmColorPicker() {
  colorPickerSnapshot = null
  colorPickerOpen.value = false
}

function updateSvFromClientXY(clientX, clientY) {
  const el = svPlaneRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
  pickerS.value = x
  pickerV.value = 1 - y
  syncPickerHexLocal()
  applyPickerPreviewToWatermark()
}

function onSvPointerDown(e) {
  updateSvFromClientXY(e.clientX, e.clientY)
  const move = (ev) => updateSvFromClientXY(ev.clientX, ev.clientY)
  const up = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('pointercancel', up)
  }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
  document.addEventListener('pointercancel', up)
}

function onHueInput(e) {
  pickerHue.value = Number(e.target.value)
  syncPickerHexLocal()
  applyPickerPreviewToWatermark()
}

function onPickerHexInput(e) {
  pickerHexLocal.value = e.target.value
  let v = pickerHexLocal.value.trim()
  if (v.length && !v.startsWith('#')) {
    pickerHexLocal.value = '#' + v
    v = pickerHexLocal.value
  }
  const result = /^#([a-f\d]{6})$/i.exec(v)
  if (!result) return
  const hex = result[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const { h, s, vv } = rgbToHsv(r, g, b)
  pickerHue.value = Number.isFinite(h) ? Math.round(h) : 0
  pickerS.value = Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 1
  pickerV.value = Number.isFinite(vv) ? Math.min(1, Math.max(0, vv)) : 1
  applyPickerPreviewToWatermark()
}

function onColorPickerKeydown(ev) {
  if (ev.key === 'Escape' && colorPickerOpen.value) {
    ev.preventDefault()
    cancelColorPicker()
  }
}

watch(colorPickerOpen, (open) => {
  if (open) document.addEventListener('keydown', onColorPickerKeydown)
  else document.removeEventListener('keydown', onColorPickerKeydown)
})

onMounted(() => {
  // 恢复 logoConfig（须在 logoSettings 声明后执行，避免 TDZ）
  const saved = watermarkSettings._savedLogoConfig
  if (saved) {
    logoSettings.position = saved.position || 'top-right'
    logoSettings.size     = parseInt(saved.size)    || 36
    logoSettings.padding  = parseInt(saved.padding) || 20
    logoSettings.opacity  = parseFloat(saved.opacity) || 0.6
  }
  delete watermarkSettings._savedLogoConfig

  if (canvasRef.value) {
    updateWatermark()
  }
  document.addEventListener('mousemove', handleWatermarkDrag)
  document.addEventListener('mouseup', stopWatermarkDrag)
  document.addEventListener('click', handleClickOutside)
})

const calculateWatermarkParams = (imageWidth, imageHeight) => {
  if (watermarkSettings.useProportionalMode) {
    return {
      fontSize: Math.max(12, Math.round(imageWidth * watermarkSettings.fontSizeRatio)),
      spacing: Math.round(imageWidth * watermarkSettings.spacingRatio),
      watermarkHeight: Math.round(imageHeight * watermarkSettings.watermarkHeightRatio),
      watermarkWidth: Math.round(imageWidth * watermarkSettings.watermarkWidthRatio)
    }
  } else {
    return {
      fontSize: watermarkSettings.fontSize,
      spacing: watermarkSettings.spacing,
      watermarkHeight: watermarkSettings.watermarkHeight,
      watermarkWidth: watermarkSettings.watermarkWidth
    }
  }
}

const createOptimizedDataURL = (canvas, format, quality) => {
  if (format === 'image/png') {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx.fillStyle = '#FFFFFF'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.drawImage(canvas, 0, 0)
    return tempCanvas.toDataURL('image/png')
  } else {
    return canvas.toDataURL(format, quality)
  }
}

const updateWatermark = () => {
  if (!canvasRef.value || !imageList.value.length) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const logo = logoSettings.image ? new Image() : null

  const loadImages = () => {
    return new Promise((resolve) => {
      img.onload = () => {
        if (logo) {
          logo.onload = resolve
          logo.src = logoSettings.image
        } else {
          resolve()
        }
      }
      const currentImage = imageList.value[currentImageIndex.value]
      if (currentImage && currentImage.src) {
        img.src = currentImage.src
      }
    })
  }

  loadImages().then(() => {
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const actualParams = calculateWatermarkParams(canvas.width, canvas.height)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const currentImage = imageList.value[currentImageIndex.value]
    if (currentImage && currentImage.name.toLowerCase().endsWith('.png')) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(img, 0, 0)
    ctx.save()
    ctx.globalAlpha = watermarkSettings.rgb.a
    ctx.fillStyle = `rgba(${watermarkSettings.rgb.r}, ${watermarkSettings.rgb.g}, ${watermarkSettings.rgb.b}, ${watermarkSettings.rgb.a})`
    ctx.font = `${actualParams.fontSize}px Arial`

    if (watermarkSettings.repeat) {
      const gridWidth = Math.max(actualParams.watermarkWidth, actualParams.fontSize * watermarkSettings.text.length)
      const gridHeight = Math.max(actualParams.watermarkHeight, actualParams.fontSize * 1.5)
      const spacing = parseInt(actualParams.spacing)
      const cellWidth = gridWidth + spacing
      const cellHeight = gridHeight + spacing
      const cols = Math.ceil(canvas.width / cellWidth) + 2
      const rows = Math.ceil(canvas.height / cellHeight) + 2
      const offsetX = ((watermarkOffset.x % cellWidth) + cellWidth) % cellWidth - cellWidth
      const offsetY = ((watermarkOffset.y % cellHeight) + cellHeight) % cellHeight - cellHeight

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = offsetX + col * cellWidth
          const y = offsetY + row * cellHeight
          ctx.save()
          ctx.translate(x + gridWidth/2, y + gridHeight/2)
          ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
          const textWidth = ctx.measureText(watermarkSettings.text).width
          ctx.fillText(watermarkSettings.text, -textWidth/2, actualParams.fontSize/3)
          ctx.restore()
        }
      }
    } else {
      const textWidth = ctx.measureText(watermarkSettings.text).width
      if (watermarkOffset.x === 100 && watermarkOffset.y === 100) {
        watermarkOffset.x = canvas.width / 2
        watermarkOffset.y = canvas.height / 2
      }
      ctx.save()
      ctx.translate(watermarkOffset.x, watermarkOffset.y)
      ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
      ctx.fillText(watermarkSettings.text, -textWidth/2, actualParams.fontSize/3)
      ctx.restore()
    }
    ctx.restore()

    if (logo) {
      const padding = logoSettings.padding
      const baseSize = logoSettings.size
      let width, height
      if (logoSettings.aspectRatio > 1) {
        width = baseSize
        height = baseSize / logoSettings.aspectRatio
      } else {
        height = baseSize
        width = baseSize * logoSettings.aspectRatio
      }
      let x, y
      switch (logoSettings.position) {
        case 'top-left':
          x = padding; y = padding
          break
        case 'top-right':
          x = canvas.width - width - padding; y = padding
          break
        case 'bottom-left':
          x = padding; y = canvas.height - height - padding
          break
        case 'bottom-right':
          x = canvas.width - width - padding; y = canvas.height - height - padding
          break
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.save()
      ctx.globalAlpha = logoSettings.opacity
      ctx.drawImage(logo, x, y, width, height)
      ctx.restore()
    }
  })
}

const handleDragEnter = (e) => { e.preventDefault(); isDragging.value = true }
const handleDragLeave = (e) => {
  e.preventDefault()
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX; const y = e.clientY
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragging.value = false
  }
}

const handleDrop = (e) => {
  e.preventDefault(); isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  const imageFiles = files.filter(file =>
    file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif)$/i)
  )
  if (imageFiles.length === 0) return
  imageList.value = []; currentImageIndex.value = 0
  imageFiles.forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const newImage = { id: Date.now() + index, src: e.target.result, file: file, name: file.name }
      imageList.value.push(newImage)
      if (imageList.value.length === 1) {
        nextTick(() => { updateWatermark() })
      }
    }
    reader.readAsDataURL(file)
  })
}

const rotate = () => { watermarkSettings.angle = (watermarkSettings.angle + 90) % 360; updateWatermark() }

const saveImage = async () => {
  if (!canvasRef.value) return
  if (window.electron) {
    try {
      const currentImage = imageList.value[currentImageIndex.value]
      const originalName = currentImage.name; const originalType = currentImage.file.type || 'image/jpeg'
      const now = new Date()
      const timestamp = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '_' + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
      const lastDotIndex = originalName.lastIndexOf('.')
      const nameWithoutExt = originalName.substring(0, lastDotIndex)
      const extension = originalName.substring(lastDotIndex)
      const suggestedName = `${nameWithoutExt}_${timestamp}${extension}`
      const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.92)
      const savePath = await window.electron.saveFile(suggestedName)
      if (!savePath) return
      await window.electron.saveImage({ dataUrl, path: savePath })
      showToast({ message: '保存成功', type: 'success' })
    } catch (error) {
      console.error('保存失败:', error)
      showToast({ message: `保存失败：${error.message}`, type: 'error' })
    }
  } else {
    const currentImage = imageList.value[currentImageIndex.value]
    const originalType = currentImage.file.type || 'image/jpeg'
    const now = new Date()
    const timestamp = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '_' + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2)
    const lastDotIndex = currentImage.name.lastIndexOf('.')
    const nameWithoutExt = currentImage.name.substring(0, lastDotIndex)
    const extension = currentImage.name.substring(lastDotIndex)
    const fileName = `${nameWithoutExt}_${timestamp}${extension}`
    downloadDataUrl(createOptimizedDataURL(canvasRef.value, originalType, 0.92), fileName)
  }
}

const updateColorFromHex = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    watermarkSettings.rgb.r = parseInt(result[1], 16)
    watermarkSettings.rgb.g = parseInt(result[2], 16)
    watermarkSettings.rgb.b = parseInt(result[3], 16)
    updateWatermark()
  }
}


const handleClickOutside = (event) => {
}

watch([
  () => watermarkSettings.text,
  () => watermarkSettings.color,
  () => watermarkSettings.rgb,
  () => watermarkSettings.fontSize,
  () => watermarkSettings.watermarkHeight,
  () => watermarkSettings.watermarkWidth,
  () => watermarkSettings.angle,
  () => watermarkSettings.repeat,
  () => watermarkSettings.spacing,
  () => watermarkSettings.useProportionalMode,
  () => watermarkSettings.fontSizeRatio,
  () => watermarkSettings.spacingRatio,
  () => watermarkSettings.watermarkHeightRatio,
  () => watermarkSettings.watermarkWidthRatio
], (newValues, oldValues) => {
  const repeatIndex = 7
  if (newValues[repeatIndex] !== oldValues[repeatIndex]) {
    if (!newValues[repeatIndex] && canvasRef.value) {
      watermarkOffset.x = canvasRef.value.width / 2
      watermarkOffset.y = canvasRef.value.height / 2
    }
  }
  const settingsToSave = {
    text: watermarkSettings.text,
    color: watermarkSettings.color,
    rgb: watermarkSettings.rgb,
    fontSize: watermarkSettings.fontSize,
    watermarkHeight: watermarkSettings.watermarkHeight,
    watermarkWidth: watermarkSettings.watermarkWidth,
    angle: watermarkSettings.angle,
    repeat: watermarkSettings.repeat,
    spacing: watermarkSettings.spacing,
    useProportionalMode: watermarkSettings.useProportionalMode,
    fontSizeRatio: watermarkSettings.fontSizeRatio,
    spacingRatio: watermarkSettings.spacingRatio,
    watermarkHeightRatio: watermarkSettings.watermarkHeightRatio,
    watermarkWidthRatio: watermarkSettings.watermarkWidthRatio,
    logoSettings: {
      image: logoSettings.image,
      position: logoSettings.position,
      size: logoSettings.size,
      padding: logoSettings.padding,
      opacity: logoSettings.opacity
    }
  }
  localStorage.setItem('watermarkSettings', JSON.stringify(settingsToSave))
  updateWatermark()
}, { deep: true })

const handleFileSelect = () => {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    imageList.value = []; currentImageIndex.value = 0
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        imageList.value.push({ id: Date.now() + index, src: e.target.result, file: file, name: file.name })
        if (imageList.value.length === 1) {
          nextTick(() => { updateWatermark() })
        }
      }
      reader.readAsDataURL(file)
    })
  }
  input.click()
}

const switchToImage = (index) => {
  if (index >= 0 && index < imageList.value.length) {
    currentImageIndex.value = index
    nextTick(() => { updateWatermark() })
  }
}

const removeImage = (index) => {
  if (imageList.value.length <= 1) {
    imageList.value = []; currentImageIndex.value = 0
    return
  }
  imageList.value.splice(index, 1)
  if (currentImageIndex.value >= imageList.value.length) {
    currentImageIndex.value = imageList.value.length - 1
  } else if (currentImageIndex.value > index) {
    currentImageIndex.value--
  }
  nextTick(() => { updateWatermark() })
}

const previousImage = () => { if (currentImageIndex.value > 0) switchToImage(currentImageIndex.value - 1) }
const nextImage = () => { if (currentImageIndex.value < imageList.value.length - 1) switchToImage(currentImageIndex.value + 1) }

const saveAllImages = async () => {
  if (!canvasRef.value || imageList.value.length === 0) return
  if (window.electron) {
    try {
      const result = await window.electron.selectDirectory()
      if (!result || result.canceled) return
      const saveDir = result.filePaths[0]
      let successCount = 0; let failCount = 0
      for (let i = 0; i < imageList.value.length; i++) {
        try {
          currentImageIndex.value = i
          await new Promise(resolve => { nextTick(() => { updateWatermark(); setTimeout(resolve, 200) }) })
          const currentImage = imageList.value[i]
          if (!currentImage) throw new Error(`无法获取第 ${i + 1} 张图片信息`)
          const originalName = currentImage.name
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
          const extension = originalName.substring(originalName.lastIndexOf('.')) || '.jpg'
          const now = new Date()
          const timestamp = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2) + ('0' + now.getMilliseconds()).slice(-3)
          const fileName = `${nameWithoutExt}_watermark_${timestamp}${extension}`
          const filePath = `${saveDir}/${fileName}`
          if (!canvasRef.value) throw new Error('Canvas未初始化')
          const originalType = currentImage.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.9)
          if (!dataUrl || dataUrl === 'data:,') throw new Error('无法生成图片数据')
          await window.electron.saveImage({ dataUrl, path: filePath })
          successCount++
        } catch (error) {
          console.error(`保存第 ${i + 1} 张图片失败:`, error)
          failCount++
        }
      }
      showToast({
        message: `批量保存完成 · 成功 ${successCount} 张 · 失败 ${failCount} 张`,
        type: failCount === 0 ? 'success' : successCount === 0 ? 'error' : 'info',
      })
    } catch (error) {
      console.error('批量保存失败:', error)
      showToast({ message: `批量保存失败：${error.message}`, type: 'error' })
    }
  } else {
    try {
      let successCount = 0; let failCount = 0
      for (let i = 0; i < imageList.value.length; i++) {
        try {
          currentImageIndex.value = i
          await new Promise(resolve => { nextTick(() => { updateWatermark(); setTimeout(resolve, 200) }) })
          const currentImage = imageList.value[i]
          if (!currentImage) throw new Error(`无法获取第 ${i + 1} 张图片信息`)
          const originalName = currentImage.name
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
          const extension = originalName.substring(originalName.lastIndexOf('.')) || '.jpg'
          const now = new Date()
          const timestamp = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2) + ('0' + now.getMilliseconds()).slice(-3)
          const fileName = `${nameWithoutExt}_watermark_${timestamp}${extension}`
          if (!canvasRef.value) throw new Error('Canvas未初始化')
          const originalType = currentImage.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.9)
          if (!dataUrl || dataUrl === 'data:,') throw new Error('无法生成图片数据')
          downloadDataUrl(dataUrl, fileName)
          successCount++
          await new Promise(resolve => setTimeout(resolve, 800))
        } catch (error) {
          console.error(`保存第 ${i + 1} 张图片失败:`, error)
          failCount++
        }
      }
      showToast({
        message: `批量保存完成 · 成功 ${successCount} 张 · 失败 ${failCount} 张`,
        type: failCount === 0 ? 'success' : successCount === 0 ? 'error' : 'info',
      })
    } catch (error) {
      console.error('批量保存失败:', error)
      showToast({ message: `批量保存失败：${error.message}`, type: 'error' })
    }
  }
}

const startWatermarkDrag = (e) => {
  e.preventDefault()
  watermarkDragging.value = true
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  watermarkStartPos.value = { x: e.clientX - (watermarkOffset.x / scaleX), y: e.clientY - (watermarkOffset.y / scaleY) }
}

const handleWatermarkDrag = (e) => {
  if (!watermarkDragging.value || !canvasRef.value) return
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  watermarkOffset.x = (e.clientX - watermarkStartPos.value.x) * scaleX
  watermarkOffset.y = (e.clientY - watermarkStartPos.value.y) * scaleY
  updateWatermark()
}

const stopWatermarkDrag = () => { watermarkDragging.value = false }

onUnmounted(() => {
  document.removeEventListener('mousemove', handleWatermarkDrag)
  document.removeEventListener('mouseup', stopWatermarkDrag)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', onColorPickerKeydown)
})

const clearImageList = () => {
  imageList.value = []; currentImageIndex.value = 0
  if (canvasRef.value) {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canvas.width = 800; canvas.height = 600
  }
  watermarkOffset.x = 100; watermarkOffset.y = 100
}

const resetSettings = () => {
  const defaultSettings = {
    text: "+++ 输入你要添加的水印文字 +++",
    color: "#000000",
    rgb: {r: 0, g: 0, b: 0, a: 0.6},
    fontSize: 12, watermarkHeight: 100, watermarkWidth: 100,
    angle: -45, repeat: true, spacing: 0,
    useProportionalMode: true,
    fontSizeRatio: 0.03,
    spacingRatio: 0.05,
    watermarkHeightRatio: 0.15,
    watermarkWidthRatio: 0.25
  }
  Object.assign(watermarkSettings, defaultSettings)
  Object.assign(logoSettings, { image: null, position: 'top-right', size: 100, padding: 20, opacity: 0.6 })
  if (canvasRef.value) {
    watermarkOffset.x = canvasRef.value.width / 2
    watermarkOffset.y = canvasRef.value.height / 2
  } else {
    watermarkOffset.x = 100; watermarkOffset.y = 100
  }
  localStorage.removeItem('watermarkSettings')
}

watch([() => watermarkOffset.x, () => watermarkOffset.y], () => {
  const settings = JSON.parse(localStorage.getItem('watermarkSettings') || '{}')
  settings.watermarkOffset = {x: watermarkOffset.x, y: watermarkOffset.y}
  localStorage.setItem('watermarkSettings', JSON.stringify(settings))
}, {deep: true})

const handleLogoSelect = () => {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        logoSettings.originalWidth = img.width
        logoSettings.originalHeight = img.height
        logoSettings.aspectRatio = img.width / img.height
        logoSettings.image = e.target.result
        updateWatermark()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const clearLogo = () => { logoSettings.image = null; updateWatermark() }

watch(logoSettings, () => {
  const settings = JSON.parse(localStorage.getItem('watermarkSettings') || '{}')
  settings.logoConfig = {
    position: logoSettings.position,
    size: logoSettings.size,
    padding: logoSettings.padding,
    opacity: logoSettings.opacity
  }
  localStorage.setItem('watermarkSettings', JSON.stringify(settings))
  if (imageList.value.length > 0) updateWatermark()
}, { deep: true })
</script>

<style scoped>
/* 工具页结构与首页一致，视觉由全局 style.css（对齐 preview.html）承担 */

/* 与图片压缩页顶部间距对齐 */
:deep(.tool-body) {
  padding-top: var(--spacing-md);
}

/* 预览框上方操作栏 */
.wm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

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

.preview-canvas {
  max-width: 100%;
  max-height: 100%;
  cursor: move;
  object-fit: contain;
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
}
.arrow.rotated {
  transform: rotate(-90deg);
}

/* File Section — 跟在预览框下，不占整页居中宽 */
.file-section {
  padding: 0;
  margin: 0;
  width: 100%;
  max-width: none;
}
.file-section .file-strip {
  padding: var(--spacing-sm) 0;
  margin: 0;
  max-width: none;
  overflow-x: auto;
}
.file-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
}
.file-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
.page-indicator {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.wm-control-panel-root {
  position: relative;
}

.wm-color-swatch:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.wm-color-overlay {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: transparent;
  border-radius: var(--radius-lg);
}

.wm-color-dialog {
  width: min(100%, 268px);
  box-sizing: border-box;
  padding: var(--spacing-md);
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.wm-color-dialog-title {
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--spacing-sm);
}

.wm-sv-plane {
  position: relative;
  height: 140px;
  border-radius: 0;
  overflow: hidden;
  cursor: crosshair;
  touch-action: none;
  border: 1px solid var(--color-border);
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, hsl(var(--wm-picker-h), 100%, 50%));
}

.wm-sv-indicator {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.wm-hue-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: var(--spacing-sm);
}

.wm-hue-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.wm-hue-slider {
  flex: 1;
  min-width: 0;
  height: 8px;
  border-radius: 4px;
  appearance: none;
  background: linear-gradient(
    to right,
    #f00,
    #ff0,
    #0f0,
    #0ff,
    #00f,
    #f0f,
    #f00
  );
}

.wm-hue-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface-solid);
  border: 2px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(44, 62, 58, 0.2);
}

.wm-hue-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface-solid);
  border: 2px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(44, 62, 58, 0.2);
}

.wm-color-dialog-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.wm-hex-input {
  flex: 1;
  min-width: 0;
}

.wm-color-preview {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
}

.wm-color-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

@media (max-width: 900px) {
  .preview-area {
    height: 450px;
  }
}
</style>
