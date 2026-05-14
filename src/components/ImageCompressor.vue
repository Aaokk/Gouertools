<template>
  <div
    class="tool-page"
    @dragover.prevent="globalDragOver = true"
    @dragleave.self="globalDragOver = false"
    @drop.prevent="onGlobalDrop"
  >
    <div class="tool-header">
      <h2>Gouer.vip 图片压缩</h2>
      <div class="divider"></div>
    </div>

    <div class="comp-body">
      <!-- 左侧主区域 -->
      <div class="comp-main">
        <!-- 操作栏 -->
        <div class="comp-actions" @click.stop>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              批量添加
            </button>
            <button class="btn btn-secondary btn-sm" @click="folderInput.click()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              添加文件夹
            </button>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-danger btn-sm" :disabled="!fileList.length" @click="clearList">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              清空列表
            </button>
            <button class="btn btn-secondary btn-sm" :disabled="!fileList.length || processing" @click="reCompress">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L20 7M4 17l1.64 1.36A9 9 0 0020.49 15"/></svg>
              重新压缩
            </button>
            <button class="btn btn-primary btn-sm" :disabled="!doneCount" @click="saveAll">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              保存全部
            </button>
          </div>
        </div>

        <!-- 文件表格 / 空状态 -->
        <div
          class="comp-table-wrap"
          :class="{ 'drag-over': globalDragOver && !fileList.length, 'has-files': fileList.length }"
          @click="!fileList.length && fileInput.click()"
        >
          <!-- 空状态 -->
          <div v-if="!fileList.length" class="comp-empty">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片到此处</span>
            <span class="placeholder-hint">支持批量添加 JPG、PNG、WebP 格式</span>
          </div>

          <!-- 表格 -->
          <table v-else class="comp-table">
            <thead>
              <tr>
                <th class="col-status">状态</th>
                <th class="col-thumb">预览</th>
                <th class="col-name">文件名</th>
                <th class="col-dim">尺寸</th>
                <th class="col-dim">新尺寸</th>
                <th class="col-sz">大小</th>
                <th class="col-sz">新大小</th>
                <th class="col-ratio">压缩率</th>
                <th class="col-act">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in fileList" :key="item.id">
                <!-- 状态图标 -->
                <td class="col-status">
                  <span v-if="item.status === 'waiting'" class="status-icon waiting" title="等待中">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </span>
                  <span v-else-if="item.status === 'compressing'" class="status-icon spinning" title="压缩中">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  </span>
                  <span v-else-if="item.status === 'done'" class="status-icon done" title="完成">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </span>
                  <span v-else-if="item.status === 'error'" class="status-icon error" title="失败">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  </span>
                </td>

                <!-- 缩略图 -->
                <td class="col-thumb">
                  <img v-if="item.thumbSrc" :src="item.thumbSrc" class="row-thumb" :alt="item.name" />
                </td>

                <!-- 文件名 -->
                <td class="col-name">
                  <span class="name-text" :title="item.name">{{ item.name }}</span>
                </td>

                <!-- 原始尺寸 -->
                <td class="col-dim">
                  <span class="dim-text">{{ item.origWidth }}×{{ item.origHeight }}</span>
                </td>

                <!-- 新尺寸 -->
                <td class="col-dim">
                  <span v-if="item.outWidth" class="dim-text">{{ item.outWidth }}×{{ item.outHeight }}</span>
                  <span v-else class="muted">—</span>
                </td>

                <!-- 原始大小 -->
                <td class="col-sz">{{ fmtSize(item.origSize) }}</td>

                <!-- 压缩后大小 -->
                <td class="col-sz">
                  <span v-if="item.outBlob" :class="item.outBlob.size < item.origSize ? 'sz-good' : 'sz-bad'">
                    {{ fmtSize(item.outBlob.size) }}
                  </span>
                  <span v-else class="muted">—</span>
                </td>

                <!-- 压缩率 -->
                <td class="col-ratio">
                  <span v-if="item.outBlob" :class="['ratio-val', calcRatio(item.origSize, item.outBlob.size) > 0 ? 'ratio-good' : 'ratio-bad']">
                    {{ calcRatio(item.origSize, item.outBlob.size) }}%
                    <svg v-if="calcRatio(item.origSize, item.outBlob.size) > 0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                  </span>
                  <span v-else class="muted">—</span>
                </td>

                <!-- 操作 -->
                <td class="col-act" @click.stop>
                  <button class="icon-btn" :disabled="!item.outBlob" title="下载" @click.stop="downloadItem(item)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </button>
                  <button class="icon-btn danger" title="移除" @click.stop="removeItem(item)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 汇总栏 -->
        <div v-if="fileList.length" class="comp-summary">
          <span class="sum-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ doneCount }} / {{ fileList.length }}
          </span>
          <span class="sum-sep">|</span>
          <span class="sum-item">压缩前：{{ fmtSize(totalOrigSize) }}</span>
          <span class="sum-sep">|</span>
          <span class="sum-item">压缩后：<span class="sz-good">{{ fmtSize(totalOutSize) }}</span></span>
          <span class="sum-sep">|</span>
          <span v-if="totalRatio > 0" class="sum-item ratio-good">压缩率：{{ totalRatio }}% ↓</span>
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <div class="comp-sidebar">
        <!-- 调整图片尺寸 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>调整图片尺寸</h4>
            <svg class="arrow" :class="{ rotated: !s1 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <div class="setting-row">
              <label>调整模式</label>
              <div class="control">
                <select class="select" v-model="settings.resizeMethod">
                  <option value="">不调整</option>
                  <option value="fitWidth">设置宽度，高度自动缩放</option>
                  <option value="fitHeight">设置高度，宽度自动缩放</option>
                  <option value="setShort">设置短边，长边自动缩放</option>
                  <option value="setLong">设置长边，短边自动缩放</option>
                  <option value="setCropRatio">裁剪模式，设置裁剪比例</option>
                  <option value="setCropSize">裁剪模式，设置裁剪尺寸</option>
                </select>
              </div>
            </div>
            <!-- fitWidth -->
            <div v-if="settings.resizeMethod === 'fitWidth'" class="setting-row">
              <label>宽度 px</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.width" min="100" max="8000"></div>
            </div>
            <!-- fitHeight -->
            <div v-if="settings.resizeMethod === 'fitHeight'" class="setting-row">
              <label>高度 px</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.height" min="100" max="8000"></div>
            </div>
            <!-- setShort -->
            <div v-if="settings.resizeMethod === 'setShort'" class="setting-row">
              <label>短边 px</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.short" min="100" max="4000"></div>
            </div>
            <!-- setLong -->
            <div v-if="settings.resizeMethod === 'setLong'" class="setting-row">
              <label>长边 px</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.long" min="100" max="8000"></div>
            </div>
            <!-- setCropRatio -->
            <template v-if="settings.resizeMethod === 'setCropRatio'">
              <div class="setting-row">
                <label>宽比</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropWidthRatio" min="1" max="100"></div>
              </div>
              <div class="setting-row">
                <label>高比</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropHeightRatio" min="1" max="100"></div>
              </div>
            </template>
            <!-- setCropSize -->
            <template v-if="settings.resizeMethod === 'setCropSize'">
              <div class="setting-row">
                <label>裁剪宽 px</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropWidthSize" min="100" max="8000"></div>
              </div>
              <div class="setting-row">
                <label>裁剪高 px</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropHeightSize" min="100" max="8000"></div>
              </div>
            </template>
          </div>
        </div>

        <!-- 输出格式 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s2 = !s2">
            <h4>设置输出格式</h4>
            <svg class="arrow" :class="{ rotated: !s2 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s2">
            <div class="setting-row">
              <label>目标格式</label>
              <div class="control">
                <select class="select" v-model="settings.targetFormat">
                  <option value="">保持原格式</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>
            <div v-if="settings.targetFormat === 'jpeg'" class="setting-row">
              <label>背景色</label>
              <div class="control" style="display:flex;align-items:center;gap:8px;">
                <div class="color-dot" :style="{ background: settings.transparentFill }">
                  <input type="color" v-model="settings.transparentFill">
                </div>
                <input class="input" v-model="settings.transparentFill" maxlength="7" style="width:86px;">
              </div>
            </div>
          </div>
        </div>

        <!-- JPEG/WEBP 参数 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s3 = !s3">
            <h4>JPEG/WEBP参数</h4>
            <svg class="arrow" :class="{ rotated: !s3 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s3">
            <p class="param-label">设置输出图片质量（0-1）</p>
            <div class="range-group">
              <input type="range" min="10" max="100" step="1" :value="Math.round(settings.jpeg.quality * 100)"
                @input="e => { settings.jpeg.quality = Number(e.target.value) / 100 }">
              <span class="range-value">{{ Math.round(settings.jpeg.quality * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- PNG 参数 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s4 = !s4">
            <h4>PNG参数</h4>
            <svg class="arrow" :class="{ rotated: !s4 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s4">
            <p class="param-label">设置输出颜色数量（2-256）</p>
            <div class="range-group">
              <input type="range" min="2" max="256" step="1" v-model.number="settings.png.colors">
              <span class="range-value">{{ settings.png.colors }}</span>
            </div>
            <p class="param-label" style="margin-top:6px;">设置抖色系数（0-1）</p>
            <div class="range-group">
              <input type="range" min="0" max="100" step="1" :value="Math.round(settings.png.dithering * 100)"
                @input="e => { settings.png.dithering = Number(e.target.value) / 100 }">
              <span class="range-value">{{ settings.png.dithering.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost" style="flex:1;" @click="resetSettings">重置选项</button>
          <button class="btn btn-primary" style="flex:2;" :disabled="!fileList.length || processing" @click="applySettings">
            应用选项
          </button>
        </div>
      </div>
    </div>

    <!-- 隐藏文件输入 -->
    <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp" style="display:none" @change="handleFilesSelected">
    <input ref="folderInput" type="file" webkitdirectory accept="image/*" style="display:none" @change="handleFilesSelected">
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { compress, getBlobDimension, formatFileSize } from '../utils/compress.js'
import { showToast } from '../utils/toast.js'

/* ── 文件输入 refs ────────────────────────────────────────── */
const fileInput   = ref(null)
const folderInput = ref(null)

/* ── 状态 ────────────────────────────────────────────────── */
const fileList      = ref([])   // FileItem[]
const processing    = ref(false)
const globalDragOver = ref(false)

/* ── 折叠状态 ────────────────────────────────────────────── */
const s1 = ref(true)
const s2 = ref(true)
const s3 = ref(true)
const s4 = ref(true)

/* ── 压缩设置 ────────────────────────────────────────────── */
const settings = reactive({
  jpeg: { quality: 0.8 },
  png:  { colors: 128, dithering: 0.5 },
  resizeMethod:    '',
  width:           1920,
  height:          1080,
  short:           1080,
  long:            1920,
  cropWidthRatio:  16,
  cropHeightRatio: 9,
  cropWidthSize:   1280,
  cropHeightSize:  720,
  targetFormat:    '',
  transparentFill: '#ffffff',
})

/* ── 计算属性 ────────────────────────────────────────────── */
const doneCount = computed(() => fileList.value.filter(f => f.status === 'done').length)

const totalOrigSize = computed(() =>
  fileList.value.reduce((s, f) => s + (f.origSize || 0), 0)
)
const totalOutSize = computed(() =>
  fileList.value.filter(f => f.outBlob).reduce((s, f) => s + f.outBlob.size, 0)
)
const totalRatio = computed(() => {
  if (!totalOrigSize.value || !totalOutSize.value) return 0
  return Math.max(0, Math.round((1 - totalOutSize.value / totalOrigSize.value) * 100))
})

/* ── 工具函数 ────────────────────────────────────────────── */
const fmtSize   = formatFileSize
const calcRatio = (orig, out) => Math.round((1 - out / orig) * 100)

let _idCounter = 0
function makeId() { return ++_idCounter }

/* ── 队列 ────────────────────────────────────────────────── */
class Queue {
  constructor(max = 2) {
    this.max = max
    this.list = []
    this.running = 0
  }
  push(task) {
    this.list.push(task)
    this._run()
  }
  async _run() {
    if (this.running >= this.max || !this.list.length) return
    this.running++
    const task = this.list.shift()
    try { await task() } catch {}
    this.running--
    this._run()
  }
}
const queue = new Queue(2)

/* ── 处理选中的文件 ──────────────────────────────────────── */
const handleFilesSelected = async (e) => {
  const files = Array.from(e.target.files || []).filter(f => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name))
  e.target.value = ''
  if (!files.length) return
  addFiles(files)
}

const addFiles = async (files) => {
  for (const file of files) {
    const blob = new Blob([await file.arrayBuffer()], {
      type: file.type || guessMime(file.name)
    })
    let origWidth = 0, origHeight = 0
    try {
      const dim = await getBlobDimension(blob)
      origWidth  = dim.width
      origHeight = dim.height
    } catch {}

    const thumbSrc = URL.createObjectURL(blob)
    const item = reactive({
      id: makeId(),
      name:       file.name,
      blob,
      origSize:   blob.size,
      origWidth,
      origHeight,
      thumbSrc,
      status:     'waiting',
      outBlob:    null,
      outSrc:     null,
      outWidth:   null,
      outHeight:  null,
    })
    fileList.value.push(item)
    scheduleCompress(item)
  }
}

const scheduleCompress = (item) => {
  processing.value = true
  queue.push(async () => {
    item.status = 'compressing'
    try {
      const { blob: outBlob, width, height } = await compress(
        item.blob, { width: item.origWidth, height: item.origHeight },
        buildOption()
      )
      if (item.outSrc) URL.revokeObjectURL(item.outSrc)
      item.outBlob   = outBlob
      item.outSrc    = URL.createObjectURL(outBlob)
      item.outWidth  = width
      item.outHeight = height
      item.status    = 'done'
    } catch (err) {
      item.status = 'error'
      console.error('压缩失败:', err)
    }
    // 检查是否全部完成
    const stillRunning = fileList.value.some(f => f.status === 'waiting' || f.status === 'compressing')
    if (!stillRunning) processing.value = false
  })
}

const buildOption = () => ({
  jpeg:            { ...settings.jpeg },
  png:             { ...settings.png },
  resizeMethod:    settings.resizeMethod || null,
  width:           settings.width,
  height:          settings.height,
  short:           settings.short,
  long:            settings.long,
  cropWidthRatio:  settings.cropWidthRatio,
  cropHeightRatio: settings.cropHeightRatio,
  cropWidthSize:   settings.cropWidthSize,
  cropHeightSize:  settings.cropHeightSize,
  targetFormat:    settings.targetFormat || null,
  transparentFill: settings.transparentFill,
})

/* ── 拖放 ───────────────────────────────────────────────── */
const onGlobalDrop = async (e) => {
  globalDragOver.value = false
  const files = Array.from(e.dataTransfer.files).filter(f =>
    /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)
  )
  if (files.length) {
    addFiles(files)
  } else {
    showToast({ message: '请拖入 JPG / PNG / WebP 图片', type: 'info' })
  }
}

/* ── 列表操作 ────────────────────────────────────────────── */
const clearList = () => {
  fileList.value.forEach(f => {
    if (f.thumbSrc) URL.revokeObjectURL(f.thumbSrc)
    if (f.outSrc)   URL.revokeObjectURL(f.outSrc)
  })
  fileList.value = []
  processing.value = false
  showToast({ message: '列表已清空', type: 'info' })
}

const removeItem = (item) => {
  if (item.thumbSrc) URL.revokeObjectURL(item.thumbSrc)
  if (item.outSrc)   URL.revokeObjectURL(item.outSrc)
  fileList.value = fileList.value.filter(f => f.id !== item.id)
}

/* ── 重新压缩 / 应用选项 ─────────────────────────────────── */
const reCompress = () => {
  processing.value = true
  for (const item of fileList.value) {
    if (item.outSrc) URL.revokeObjectURL(item.outSrc)
    item.outBlob  = null
    item.outSrc   = null
    item.outWidth = null
    item.outHeight = null
    item.status   = 'waiting'
    scheduleCompress(item)
  }
}

const applySettings = () => reCompress()

const resetSettings = () => {
  settings.jpeg.quality    = 0.8
  settings.png.colors      = 128
  settings.png.dithering   = 0.5
  settings.resizeMethod    = ''
  settings.width           = 1920
  settings.height          = 1080
  settings.short           = 1080
  settings.long            = 1920
  settings.cropWidthRatio  = 16
  settings.cropHeightRatio = 9
  settings.cropWidthSize   = 1280
  settings.cropHeightSize  = 720
  settings.targetFormat    = ''
  settings.transparentFill = '#ffffff'
}

/* ── 下载 ────────────────────────────────────────────────── */
const downloadItem = (item) => {
  if (!item.outSrc) return
  const ext = (item.outBlob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const base = item.name.replace(/\.[^.]+$/, '')
  const link = document.createElement('a')
  link.href = item.outSrc
  link.download = `${base}_compressed.${ext}`
  link.click()
}

const saveAll = async () => {
  const done = fileList.value.filter(f => f.status === 'done' && f.outSrc)
  if (!done.length) return
  for (const item of done) {
    downloadItem(item)
    await new Promise(r => setTimeout(r, 150))
  }
  showToast({ message: `已下载 ${done.length} 个文件`, type: 'success' })
}

/* ── 工具 ────────────────────────────────────────────────── */
const guessMime = (name) => {
  const n = name.toLowerCase()
  if (n.endsWith('.png'))  return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
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

/* ── 整体布局 ─────────────────────────────────────────────── */
.comp-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-2xl);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  flex: 1;
  align-items: start;
}

.comp-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* ── 操作栏 ──────────────────────────────────────────────── */
.comp-actions {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

/* ── 表格区域 ────────────────────────────────────────────── */
.comp-table-wrap {
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  height: 500px;
  position: relative;
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal), background var(--transition-normal);
}
/* hover 光晕层（与 .preview-area::before 一致） */
.comp-table-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, var(--color-accent-dim), transparent 70%);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-normal);
  z-index: 0;
}
/* 空状态时 hover 效果 */
.comp-table-wrap:not(.has-files):hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-glow);
}
.comp-table-wrap:not(.has-files):hover::before {
  opacity: 1;
}
/* 拖拽进入效果 */
.comp-table-wrap.drag-over {
  border-color: var(--color-accent);
  background: rgba(74,155,142,0.03);
  box-shadow: 0 0 20px var(--color-accent-glow);
}
/* 有文件时切回实线，高度随内容自动撑开 */
.comp-table-wrap.has-files {
  border-style: solid;
  height: auto;
  min-height: unset;
}
.comp-table-wrap.has-files::before {
  display: none;
}

/* 空状态 — 与全局 .preview-area 占位样式对齐 */
.comp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  padding: var(--spacing-2xl);
  gap: var(--spacing-sm);
  position: relative;
  z-index: 1;
}
.comp-empty .placeholder-icon svg {
  width: 56px;
  height: 56px;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}
.comp-empty .placeholder-text {
  font-size: 14px;
  color: var(--color-text-muted);
}
.comp-empty .placeholder-hint {
  font-size: 12px;
  color: rgba(90,111,142,0.6);
  margin-top: 4px;
}
.comp-empty .format-tags {
  display: flex;
  gap: 6px;
  margin-top: 14px;
}
.comp-empty .format-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-family: var(--font-heading);
  font-weight: 600;
  background: var(--color-accent-dim);
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  letter-spacing: 0.5px;
}

/* 表格 */
.comp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.comp-table thead th {
  background: rgba(0, 255, 170, 0.04);
  border-bottom: 1px solid var(--color-border);
  padding: 10px 10px;
  font-family: var(--font-heading);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  white-space: nowrap;
}
.comp-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}
.comp-table tbody tr:last-child { border-bottom: none; }
.comp-table tbody tr:hover { background: var(--color-muted); }
.comp-table td {
  padding: 8px 10px;
  vertical-align: middle;
  color: var(--color-foreground);
}

/* Column widths */
.col-status { width: 32px; text-align: center; }
.col-thumb  { width: 48px; }
.col-name   { min-width: 0; max-width: 180px; }
.col-dim    { width: 90px; white-space: nowrap; }
.col-sz     { width: 80px; white-space: nowrap; }
.col-ratio  { width: 90px; }
.col-act    { width: 68px; white-space: nowrap; }

.name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--color-foreground);
}
.dim-text {
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.muted { color: var(--color-text-muted); opacity: 0.5; font-size: 11px; }

/* 缩略图 */
.row-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  display: block;
}

/* 状态图标 */
.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.status-icon.waiting  { color: var(--color-text-muted); opacity: 0.6; }
.status-icon.done     { color: var(--color-accent); }
.status-icon.error    { color: var(--color-destructive); }
.status-icon.spinning { color: var(--color-secondary); animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 大小颜色 */
.sz-good { color: var(--color-accent); }
.sz-bad  { color: var(--color-destructive); }

/* 压缩率 */
.ratio-val {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.ratio-good { color: var(--color-accent); }
.ratio-bad  { color: var(--color-destructive); }

/* 图标按钮 */
.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  margin-right: 4px;
}
.icon-btn:hover:not(:disabled) {
  background: var(--color-accent-dim);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.icon-btn.danger:hover:not(:disabled) {
  background: rgba(255,68,102,0.1);
  border-color: var(--color-destructive);
  color: var(--color-destructive);
}
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── 汇总栏 ──────────────────────────────────────────────── */
.comp-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-muted);
  flex-wrap: wrap;
}
.sum-sep  { opacity: 0.3; }
.sum-item { display: inline-flex; align-items: center; gap: 4px; }

/* ── 右侧设置栏 ───────────────────────────────────────────── */
.comp-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: sticky;
  top: 24px;
}

.arrow {
  transition: transform var(--transition-fast);
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.arrow.rotated { transform: rotate(-90deg); }

/* 设置卡片内的描述性标签（无 control 兄弟，不受全局 label 宽度限制）*/
.param-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  margin: 0 0 6px;
  white-space: nowrap;
}

/* ── 响应式 ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .comp-body {
    grid-template-columns: 1fr;
  }
  .comp-sidebar {
    position: static;
  }
}
</style>
