<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 应用图标</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <div class="preview-stack">
        <div class="wm-actions" @click.stop>
          <button type="button" class="btn btn-secondary btn-sm" @click="fileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            添加图片
          </button>
          <button
            v-if="items.length"
            type="button"
            class="btn btn-danger btn-sm"
            @click="clearAll"
          >
            清空列表
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!canGenerate || generating"
            @click="generateZip"
          >
            <svg v-if="generating" class="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
            {{ generating ? '生成中…' : '生成并下载 ZIP' }}
          </button>
        </div>

        <div
          class="preview-area"
          :class="{ dragging: isDragging, 'appicon-preview-area--filled': items.length }"
          @dragover.prevent
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop"
          @click="!items.length && fileInput.click()"
        >
          <template v-if="!items.length">
            <div class="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="5" height="5" rx="1"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片文件到此处</span>
            <span class="placeholder-hint">支持批量；ZIP 内按文件名分子目录；可继续拖入追加</span>
          </template>

          <div v-else class="appicon-preview-fill">
            <div class="appicon-preview-stage">
              <img
                v-if="previewUrl"
                :src="previewUrl"
                class="appicon-preview-img"
                alt="图标预览"
                draggable="false"
              >
              <span v-else class="muted appicon-preview-loading">生成预览…</span>
            </div>
            <div class="appicon-preview-caption" :title="currentItem?.name">
              {{ currentItem?.name }}
            </div>
          </div>
        </div>

        <div v-if="items.length" class="file-section">
          <div class="file-label">
            已选择 {{ items.length }} 个文件，点击下方缩略图切换预览：
          </div>
          <div class="file-strip">
            <div
              v-for="(row, index) in items"
              :key="row.id"
              class="file-thumb-slot"
              @click="currentIndex = index"
            >
              <div :class="['file-thumb', { active: index === currentIndex }]">
                <img
                  :src="row.thumb"
                  :alt="row.name"
                  style="width:100%;height:100%;object-fit:cover;"
                  draggable="false"
                >
              </div>
              <button
                type="button"
                class="file-thumb-remove"
                title="移除此图"
                @click.stop="removeAt(index)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          class="visually-hidden"
          @change="onInputChange"
        >
      </div>

      <div class="control-panel">
        <div class="setting-card">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>输出套件</h4>
            <svg class="arrow" :class="{ rotated: !s1 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <div class="setting-row">
              <label>Android</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="packAndroid">
                  <span class="toggle-track"></span>
                </label>
                <span class="hint-inline">mipmap-* + Play 512</span>
              </div>
            </div>
            <div class="setting-row">
              <label>iOS</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="packIos">
                  <span class="toggle-track"></span>
                </label>
                <span class="hint-inline">AppIcon.appiconset</span>
              </div>
            </div>
            <div class="setting-row">
              <label>网站图标</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="packWeb">
                  <span class="toggle-track"></span>
                </label>
                <span class="hint-inline">favicon.ico / touch / PWA</span>
              </div>
            </div>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-card-header" @click="s2 = !s2">
            <h4>外形</h4>
            <svg class="arrow" :class="{ rotated: !s2 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s2">
            <div class="setting-row">
              <label>置入方式</label>
              <div class="control">
                <select class="select" v-model="fitMode">
                  <option value="cover">铺满裁切（不规则图推荐）</option>
                  <option value="contain">完整显示（透明边）</option>
                </select>
              </div>
            </div>
            <div class="setting-row">
              <label>样式</label>
              <div class="control">
                <select class="select" v-model="shape">
                  <option value="rounded">圆角矩形</option>
                  <option value="circle">正圆</option>
                </select>
              </div>
            </div>
            <div v-if="shape === 'rounded'" class="setting-row">
              <label>圆角强度</label>
              <div class="control range-row">
                <input type="range" v-model.number="cornerPct" min="0" max="100" step="1" />
                <span class="range-value">{{ cornerPct }}%</span>
              </div>
            </div>
            <p class="fine-print">
              「铺满裁切」会按正方形居中缩放并裁剪多余部分（图标常见做法）；「完整显示」不裁剪，可能有透明边。
              圆角/圆形作用在整个导出方形上。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import JSZip from 'jszip'
import { showToast } from '../utils/toast.js'
import { downloadBlob } from '../utils/download.js'
import {
  ANDROIDMipmaps,
  ANDROID_PLAYSTORE_SIZE,
  WEB_EXPORT_SIZES,
  ICO_EMBED_SIZES,
  iosUniquePixelSizes,
  iosIconFilename,
  buildIosContentsObject,
} from '../utils/appIconSpec.js'
import {
  loadDecodedImage,
  renderAppIconToBlob,
  blobToUint8Array,
} from '../utils/renderAppIcon.js'
import { buildIcoFromPngs } from '../utils/pngToIco.js'

/** 写入 ZIP 内 web/head-snippet.txt（与站内 UI 无关） */
const HEAD_SNIPPET_FOR_ZIP =
  `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
`

const fileInput = ref(null)
const isDragging = ref(false)
const items = ref([])
const currentIndex = ref(0)
const generating = ref(false)
const previewUrl = ref('')
let previewObjectUrl = ''

const s1 = ref(true)
const s2 = ref(true)

const packAndroid = ref(true)
const packIos = ref(true)
const packWeb = ref(true)
const shape = ref('rounded')
// 近似 iOS 图层圆角 10∶57（√ r≈边长×10/57）；此处 r=(边长/2)×(pct/100) → pct=200/57≈35。Android mip 由各厂商面具裁切，PNG 无外置统一弧度。
const cornerPct = ref(35)
/** @type {import('vue').Ref<'cover'|'contain'>} */
const fitMode = ref('cover')
const canGenerate = computed(() =>
  items.value.length > 0 &&
  (packAndroid.value || packIos.value || packWeb.value),
)

const currentItem = computed(() => items.value[currentIndex.value] || null)

function buildOpts () {
  return {
    shape: shape.value,
    cornerPct: Number(cornerPct.value),
    paddingPct: 0,
    fit: fitMode.value,
  }
}

function sanitizeZipBase (name) {
  let base = name.replace(/\.[^.]+$/, '')
  if (!base.trim()) base = 'icon'
  return base.replace(/[/\\:*?"<>|]/g, '_').slice(0, 120)
}

let idSeq = 0
function revokeRow (row) {
  if (row.thumb) URL.revokeObjectURL(row.thumb)
}

async function thumbFromFile (file) {
  try {
    const img = await loadDecodedImage(file)
    const r = Math.min(img.naturalWidth, img.naturalHeight, 72)
    const canvas = document.createElement('canvas')
    canvas.width = r
    canvas.height = r
    const sx = (img.naturalWidth - r) / 2
    const sy = (img.naturalHeight - r) / 2
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, r, r, 0, 0, r, r)
    const blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), 'image/jpeg', 0.85))
    return URL.createObjectURL(blob)
  } catch {
    return URL.createObjectURL(file)
  }
}

async function appendFiles (fileListLike) {
  const arr = [...fileListLike].filter(
    (f) => f.type.startsWith('image/') &&
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type),
  )
  if (!arr.length) {
    showToast({ message: '请选择 JPG / PNG / WebP / GIF 图片', type: 'info' })
    return
  }
  for (const file of arr) {
    const thumb = await thumbFromFile(file)
    items.value.push({
      id: ++idSeq,
      file,
      name: file.name,
      thumb,
    })
  }
  currentIndex.value = Math.max(0, items.value.length - 1)
}

const onInputChange = (e) => {
  appendFiles(e.target.files)
  e.target.value = ''
}

const handleDragEnter = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragging.value = false
  }
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  appendFiles(e.dataTransfer.files)
}

const removeAt = (i) => {
  const row = items.value[i]
  if (!row) return
  revokeRow(row)
  items.value.splice(i, 1)
  if (currentIndex.value >= items.value.length) {
    currentIndex.value = Math.max(0, items.value.length - 1)
  } else if (i < currentIndex.value) {
    currentIndex.value -= 1
  }
}

const clearAll = () => {
  for (const row of items.value) revokeRow(row)
  items.value = []
  currentIndex.value = 0
}

async function refreshPreview () {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = ''
    previewUrl.value = ''
  }
  const file = currentItem.value?.file
  if (!file) return
  try {
    const img = await loadDecodedImage(file)
    const previewPx =
      typeof window !== 'undefined'
        ? Math.min(576, Math.round(240 * Math.min(3, window.devicePixelRatio || 2)))
        : 448
    const blob = await renderAppIconToBlob(img, buildOpts(), previewPx)
    previewObjectUrl = URL.createObjectURL(blob)
    previewUrl.value = previewObjectUrl
  } catch (e) {
    console.warn(e)
  }
}

let debounceT = null
watch(
  [items, currentIndex, shape, cornerPct, fitMode],
  () => {
    clearTimeout(debounceT)
    debounceT = setTimeout(refreshPreview, 180)
  },
  { deep: true },
)

async function addAndroidFolder (zip, base, img, opts) {
  for (const { folder, size } of ANDROIDMipmaps) {
    const blob = await renderAppIconToBlob(img, opts, size)
    zip.file(`${base}/android/res/${folder}/ic_launcher.png`, blob)
  }
  const b512 = await renderAppIconToBlob(img, opts, ANDROID_PLAYSTORE_SIZE)
  zip.file(`${base}/android/ic_launcher-playstore.png`, b512)
}

async function addIosFolder (zip, base, img, opts) {
  const path = `${base}/ios/AppIcon.appiconset`
  for (const px of iosUniquePixelSizes()) {
    const blob = await renderAppIconToBlob(img, opts, px)
    zip.file(`${path}/${iosIconFilename(px)}`, blob)
  }
  const json = JSON.stringify(buildIosContentsObject(), null, 2)
  zip.file(`${path}/Contents.json`, json)
}

function webManifestSnippet () {
  return JSON.stringify(
    {
      name: 'My App',
      short_name: 'App',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    null,
    2,
  )
}

async function addWebFolder (zip, base, img, opts) {
  const w = `${base}/web`
  for (const [filename, px] of Object.entries(WEB_EXPORT_SIZES)) {
    const blob = await renderAppIconToBlob(img, opts, px)
    zip.file(`${w}/${filename}`, blob)
  }
  const icoChunks = []
  for (const px of ICO_EMBED_SIZES) {
    const blob = await renderAppIconToBlob(img, opts, px)
    const u8 = await blobToUint8Array(blob)
    icoChunks.push({ width: px, height: px, png: u8 })
  }
  zip.file(`${w}/favicon.ico`, new Uint8Array(buildIcoFromPngs(icoChunks)))
  zip.file(`${w}/site.webmanifest`, webManifestSnippet())
  zip.file(`${w}/head-snippet.txt`, HEAD_SNIPPET_FOR_ZIP)
}

async function generateZip () {
  if (!canGenerate.value || generating.value) return
  generating.value = true
  try {
    const zip = new JSZip()
    const opts = buildOpts()
    for (const row of items.value) {
      const base = sanitizeZipBase(row.name)
      const img = await loadDecodedImage(row.file)
      if (packAndroid.value) await addAndroidFolder(zip, base, img, opts)
      if (packIos.value) await addIosFolder(zip, base, img, opts)
      if (packWeb.value) await addWebFolder(zip, base, img, opts)
    }
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    const ts = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, '')
    downloadBlob(blob, `app_icons_${ts}.zip`)
    showToast({ message: `已生成 ${items.value.length} 套图标`, type: 'success' })
  } catch (e) {
    console.error(e)
    showToast({ message: `生成失败：${e?.message || '未知错误'}`, type: 'error' })
  } finally {
    generating.value = false
  }
}

onUnmounted(() => {
  clearTimeout(debounceT)
  for (const row of items.value) revokeRow(row)
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
})
</script>

<style scoped>
/* 与图片压缩 / 水印等工具页顶部间距对齐（参见 WatermarkEditor、ImageCropper） */
:deep(.tool-body) {
  padding-top: var(--spacing-md);
}

.tool-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.wm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-area.appicon-preview-area--filled {
  cursor: default;
  padding: 0;
  align-items: stretch;
}

.appicon-preview-fill {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.appicon-preview-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background:
    repeating-conic-gradient(rgba(44, 62, 58, 0.06) 0% 25%, transparent 0% 50%)
    50% / 16px 16px;
}

.appicon-preview-img {
  max-width: min(432px, 86%);
  max-height: min(432px, 58vh);
  width: auto;
  height: auto;
  object-fit: contain;
}

.appicon-preview-loading {
  font-size: 13px;
}

.appicon-preview-caption {
  flex-shrink: 0;
  padding: 8px 14px 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  border-top: 1px solid var(--color-border);
  background: rgba(44, 62, 58, 0.03);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 与水印页一致：预览框下的横向列表 */
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
  width: 100%;
  overflow-x: auto;
}

.file-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);
}

.file-thumb-slot {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.file-thumb-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface-solid);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: 2;
  box-shadow: var(--shadow-sm);
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.file-thumb-remove:hover {
  background: rgba(201, 90, 74, 0.12);
  border-color: var(--color-destructive);
  color: var(--color-destructive);
}

.control-panel .setting-row > .control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.control-panel .setting-row > label {
  align-self: center;
  line-height: 1.25;
}

.muted {
  color: var(--color-text-muted);
  font-size: 12px;
}

.hint-inline {
  margin-left: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.25;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.range-row input[type='range'] {
  flex: 1;
}

.fine-print {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.45;
}
.fine-print code {
  font-size: 10px;
}

.visually-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
