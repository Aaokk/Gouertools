<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip EXIF 查看/清除</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧 -->
      <div class="preview-stack">
        <div class="exif-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择图片
          </button>
          <button v-if="previewUrl" class="btn btn-danger btn-sm" @click="clearAndDownload">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            清除 EXIF 并下载
          </button>
        </div>

        <!-- 预览区 -->
        <div
          class="preview-area"
          @click="!previewUrl && fileInput.click()"
          @dragover.prevent @dragenter="isDragging=true" @dragleave="isDragging=false"
          @drop.prevent="onDrop" :class="{ dragging: isDragging }"
        >
          <template v-if="!previewUrl">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片到此处</span>
            <span class="placeholder-hint">支持 JPG、PNG、WebP，读取 EXIF 信息</span>
            <div class="format-tags">
              <span class="format-tag">JPG</span>
              <span class="format-tag">PNG</span>
              <span class="format-tag">WebP</span>
            </div>
          </template>
          <img v-else :src="previewUrl" class="exif-preview-img" alt="预览图" />
        </div>
      </div>

      <!-- 右侧 EXIF 数据 -->
      <div class="control-panel">
        <div v-if="!exifData && !previewUrl" class="exif-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p>选择图片后显示 EXIF 信息</p>
        </div>

        <div v-else-if="previewUrl && !exifData" class="exif-empty">
          <p style="color:var(--color-text-muted);">该图片不含 EXIF 信息，或已清除。</p>
          <p style="font-size:11px;margin-top:4px;color:var(--color-text-muted);">（PNG、截图通常没有 EXIF）</p>
        </div>

        <template v-else-if="exifData">
          <!-- 摘要警告 -->
          <div v-if="hasGps" class="exif-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
            检测到 GPS 位置信息！建议发送前清除。
          </div>

          <!-- EXIF 字段列表 -->
          <div class="exif-list">
            <div v-for="(val, key) in exifFlat" :key="key" class="exif-row">
              <span class="exif-key">{{ formatKey(key) }}</span>
              <span class="exif-val" :class="{ 'exif-gps': isGpsKey(key) }">{{ formatVal(val) }}</span>
            </div>
          </div>

          <button class="btn btn-danger" style="width:100%;" @click="clearAndDownload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            清除全部 EXIF 并下载
          </button>
        </template>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" style="display:none" @change="onFileChange">
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from '../utils/toast.js'
import { downloadBlob } from '../utils/download.js'

const fileInput  = ref(null)
const isDragging = ref(false)
const previewUrl = ref('')
const exifData   = ref(null)
const currentFile = ref(null)
const fileName   = ref('image')

const onFileChange = (e) => {
  const f = e.target.files[0]; e.target.value = ''
  if (f) loadFile(f)
}
const onDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) loadFile(f)
}

const loadFile = async (f) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  fileName.value = f.name.replace(/\.[^.]+$/, '')
  currentFile.value = f
  previewUrl.value = URL.createObjectURL(f)
  exifData.value = null

  try {
    const exifr = (await import('exifr')).default
    const data = await exifr.parse(f, { gps: true, tiff: true, xmp: true, iptc: true })
    exifData.value = data || null
  } catch (err) {
    console.warn('EXIF 读取:', err)
    exifData.value = null
  }
}

const exifFlat = computed(() => {
  if (!exifData.value) return {}
  const flat = {}
  const skip = ['thumbnail', 'ThumbnailImage', 'JpegIFByteCount']
  for (const [k, v] of Object.entries(exifData.value)) {
    if (skip.includes(k)) continue
    if (v !== null && v !== undefined && v !== '') flat[k] = v
  }
  return flat
})

const hasGps = computed(() => {
  if (!exifData.value) return false
  return 'latitude' in exifData.value || 'longitude' in exifData.value ||
         'GPSLatitude' in exifData.value || 'GPSLongitude' in exifData.value
})

const isGpsKey = (k) => /gps|latitude|longitude/i.test(k)

const formatKey = (k) => k.replace(/([A-Z])/g, ' $1').trim()

const formatVal = (v) => {
  if (v instanceof Date) return v.toLocaleString('zh-CN')
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(6)
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

/* 通过 Canvas 重绘来剥离 EXIF */
const clearAndDownload = () => {
  if (!previewUrl.value) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d').drawImage(img, 0, 0)
    const mime = currentFile.value?.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const ext  = mime === 'image/png' ? 'png' : 'jpg'
    canvas.toBlob((blob) => {
      downloadBlob(blob, `${fileName.value}_noexif.${ext}`)
      showToast({ message: 'EXIF 已清除，图片已下载', type: 'success' })
    }, mime, 0.95)
  }
  img.src = previewUrl.value
}
</script>

<style scoped>
:deep(.tool-body) { padding-top: var(--spacing-md); }
.tool-page { flex: 1; display: flex; flex-direction: column; width: 100%; min-width: 0; }
.preview-stack { min-width: 0; width: 100%; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.exif-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.exif-preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }

.control-panel { box-sizing: border-box; width: 100%; min-width: 0; overflow-x: hidden; display: flex; flex-direction: column; gap: var(--spacing-md); }

.exif-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: var(--spacing-xl); color: var(--color-text-muted); text-align: center;
  min-height: 200px; opacity: 0.6;
}

.exif-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px;
  background: rgba(201,90,74,0.10);
  border: 1px solid var(--color-destructive);
  border-radius: var(--radius-md);
  font-size: 12px; font-weight: 600; color: var(--color-destructive); line-height: 1.4;
}

.exif-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 460px;
  overflow-y: auto;
}
.exif-row {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}
.exif-row:last-child { border-bottom: none; }
.exif-key {
  flex-shrink: 0; width: 110px; color: var(--color-text-muted);
  font-weight: 500; font-family: var(--font-heading); font-size: 11px;
  padding-top: 1px;
}
.exif-val {
  flex: 1; color: var(--color-foreground); word-break: break-all; line-height: 1.5;
}
.exif-gps { color: var(--color-destructive); font-weight: 600; }
</style>
