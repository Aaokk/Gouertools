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
            <AnchoredBubbleTip :visible="tipClearList.visible" :text="tipClearList.text">
              <button type="button" class="btn btn-danger btn-sm" @click="handleClearListClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                清空列表
              </button>
            </AnchoredBubbleTip>
            <AnchoredBubbleTip :visible="tipReCompress.visible" :text="tipReCompress.text">
              <button type="button" class="btn btn-secondary btn-sm" @click="handleReCompressClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L20 7M4 17l1.64 1.36A9 9 0 0020.49 15"/></svg>
                重新压缩
              </button>
            </AnchoredBubbleTip>
            <AnchoredBubbleTip :visible="tipSaveAll.visible" :text="tipSaveAll.text">
              <button type="button" class="btn btn-primary btn-sm" @click="handleSaveAllClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                保存全部
              </button>
            </AnchoredBubbleTip>
            <AnchoredBubbleTip v-if="zipEligibleCount >= 2" :visible="tipZip.visible" :text="tipZip.text">
              <button type="button" class="btn btn-purple btn-sm" title="将已完成压缩的图片打包为一个 ZIP" @click="handleZipClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
                ZIP 打包下载
              </button>
            </AnchoredBubbleTip>
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
            <span class="placeholder-hint">支持批量添加 JPG、PNG、WebP、GIF、AVIF、SVG 格式</span>
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
                  <AnchoredBubbleTip
                    :visible="rowDlBubble.id === item.id"
                    :text="rowDlBubble.text"
                  >
                    <button
                      type="button"
                      class="icon-btn"
                      :class="{ 'icon-btn-idle': !item.outBlob }"
                      title="下载"
                      @click.stop="onRowDownloadClick(item)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                  </AnchoredBubbleTip>
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

        <!-- GIF 参数 -->
        <div class="setting-card" :class="{ collapsed: !s5 }">
          <div class="setting-card-header" @click="s5 = !s5">
            <h4>GIF参数</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body">
            <p class="param-label">输出颜色数量（2-256）</p>
            <div class="range-group">
              <input type="range" min="2" max="256" step="1" v-model.number="settings.gif.colors">
              <span class="range-value">{{ settings.gif.colors }}</span>
            </div>
            <div class="setting-row" style="margin-top:8px;">
              <label>开启抖色</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="settings.gif.dithering">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- AVIF 参数 -->
        <div class="setting-card" :class="{ collapsed: !s6 }">
          <div class="setting-card-header" @click="s6 = !s6">
            <h4>AVIF参数</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body">
            <p class="param-label">输出图片质量（1-100）</p>
            <div class="range-group">
              <input type="range" min="1" max="100" step="1" v-model.number="settings.avif.quality">
              <span class="range-value">{{ settings.avif.quality }}</span>
            </div>
            <p class="param-label" style="margin-top:6px;">设置压缩速度（1-10）</p>
            <div class="range-group">
              <input type="range" min="1" max="10" step="1" v-model.number="settings.avif.speed">
              <span class="range-value">{{ settings.avif.speed }}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-ghost" style="flex:1;" @click="resetSettings">重置选项</button>
          <div style="flex:2;min-width:0;">
            <AnchoredBubbleTip stretch :visible="tipApply.visible" :text="tipApply.text">
              <button type="button" class="btn btn-primary" style="width:100%;" @click="handleApplySettingsClick">
                应用选项
              </button>
            </AnchoredBubbleTip>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏文件输入 -->
    <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" style="display:none" @change="handleFilesSelected">
    <input ref="folderInput" type="file" webkitdirectory accept="image/*" style="display:none" @change="handleFilesSelected">
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import JSZip from 'jszip'
import AnchoredBubbleTip from './AnchoredBubbleTip.vue'
import { useAnchoredBubbleTip } from '../composables/useAnchoredBubbleTip.js'
import { anchoredBubbleExclusiveGen } from '../utils/anchoredBubbleCoordinator.js'
import { compress, getBlobDimension, formatFileSize } from '../utils/compress.js'
import { showToast } from '../utils/toast.js'
import { downloadBlob } from '../utils/download.js'

/* ── 文件输入 refs ────────────────────────────────────────── */
const fileInput   = ref(null)
const folderInput = ref(null)

/* ── 状态 ────────────────────────────────────────────────── */
const fileList      = ref([])   // FileItem[]
const processing    = ref(false)
const globalDragOver = ref(false)
const zipBusy       = ref(false)

const tipClearList = useAnchoredBubbleTip({ initialText: '请先添加图片' })
const tipReCompress = useAnchoredBubbleTip({ initialText: '请先添加图片' })
const tipSaveAll = useAnchoredBubbleTip({ initialText: '请先添加并完成压缩后再保存' })
const tipZip = useAnchoredBubbleTip({
  initialText: '至少需要 2 张已完成压缩的图片后再 ZIP 打包下载',
})
const tipApply = useAnchoredBubbleTip({ initialText: '请先添加图片' })

const rowDlBubble = reactive({ id: null, text: '' })
const rowDlLastGen = ref(-1)
let rowDlBubbleTimer = null

watch(anchoredBubbleExclusiveGen, (g) => {
  if (rowDlBubble.id == null) return
  if (rowDlLastGen.value !== g) hideRowDlBubble()
})

function hideRowDlBubble() {
  rowDlBubble.id = null
  rowDlBubble.text = ''
  clearTimeout(rowDlBubbleTimer)
  rowDlBubbleTimer = null
}
function flashRowDlBubble(item, msg) {
  const g = anchoredBubbleExclusiveGen.value + 1
  rowDlLastGen.value = g
  anchoredBubbleExclusiveGen.value = g
  rowDlBubble.id = item.id
  rowDlBubble.text = msg
  clearTimeout(rowDlBubbleTimer)
  rowDlBubbleTimer = setTimeout(() => hideRowDlBubble(), 2800)
}

onUnmounted(() => clearTimeout(rowDlBubbleTimer))

/* ── 折叠状态 ────────────────────────────────────────────── */
const s1 = ref(true)
const s2 = ref(true)
const s3 = ref(false)
const s4 = ref(true)
const s5 = ref(false)
const s6 = ref(false)

/* ── 压缩设置 ────────────────────────────────────────────── */
const settings = reactive({
  jpeg: { quality: 0.8 },
  png:  { colors: 128, dithering: 0.5 },
  gif:  { colors: 128, dithering: false },
  avif: { quality: 50,  speed: 8 },
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

/** 已有压缩输出，可计入 ZIP（与 handleZipClick / downloadZipAll 判定一致） */
const zipEligibleCount = computed(() =>
  fileList.value.filter(f => f.status === 'done' && f.outBlob).length,
)

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
  const files = Array.from(e.target.files || []).filter(f =>
    /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(f.type) ||
    /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f.name)
  )
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
        buildOption(item)
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
      showToast({ message: `${item.name} 压缩失败：${err?.message || '未知错误'}`, type: 'error' })
    }
    // 检查是否全部完成
    const stillRunning = fileList.value.some(f => f.status === 'waiting' || f.status === 'compressing')
    if (!stillRunning) processing.value = false
  })
}

const buildOption = (item) => ({
  jpeg:            { ...settings.jpeg },
  png:             { ...settings.png },
  gif:             { ...settings.gif },
  avif:            { ...settings.avif },
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
  _fileName:       item?.name || '',
})

/* ── 拖放 ───────────────────────────────────────────────── */
const onGlobalDrop = async (e) => {
  globalDragOver.value = false
  const files = Array.from(e.dataTransfer.files).filter(f =>
    /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(f.type) ||
    /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f.name)
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

function handleClearListClick() {
  if (!fileList.value.length) {
    tipClearList.flash()
    return
  }
  clearList()
}

function handleReCompressClick() {
  if (!fileList.value.length) {
    tipReCompress.flash()
    return
  }
  if (processing.value) {
    tipReCompress.flash('压缩进行中，请稍候')
    return
  }
  reCompress()
}

function handleSaveAllClick() {
  if (!doneCount.value) {
    tipSaveAll.flash()
    return
  }
  saveAll()
}

function handleZipClick() {
  if (zipBusy.value) {
    tipZip.flash('打包进行中，请稍候')
    return
  }
  const done = fileList.value.filter(f => f.status === 'done' && f.outBlob)
  if (done.length < 2) {
    tipZip.flash()
    return
  }
  downloadZipAll()
}

function handleApplySettingsClick() {
  if (!fileList.value.length) {
    tipApply.flash()
    return
  }
  if (processing.value) {
    tipApply.flash('压缩进行中，请稍候')
    return
  }
  applySettings()
}

function onRowDownloadClick(item) {
  if (item.outBlob) {
    hideRowDlBubble()
    downloadItem(item)
    return
  }
  flashRowDlBubble(item, '请等待该行压缩完成后再下载')
}

const resetSettings = () => {
  settings.jpeg.quality    = 0.8
  settings.png.colors      = 128
  settings.png.dithering   = 0.5
  settings.gif.colors      = 128
  settings.gif.dithering   = false
  settings.avif.quality    = 50
  settings.avif.speed      = 8
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
  if (!item.outSrc || !item.outBlob) return
  const ext = (item.outBlob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const base = item.name.replace(/\.[^.]+$/, '')
  downloadBlob(item.outSrc, `${base}_compressed.${ext}`, false)
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

function extFromMime(blob) {
  const sub = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  return sub === 'svg+xml' ? 'svg' : sub
}

function sanitizeZipBase(name) {
  let base = name.replace(/\.[^.]+$/, '')
  if (!base.trim()) base = 'image'
  return base.replace(/[/\\:*?"<>|]/g, '_').slice(0, 120)
}

/** 至少 2 张已完成时可打包 ZIP（入口已由 handleZipClick 校验） */
const downloadZipAll = async () => {
  const done = fileList.value.filter(f => f.status === 'done' && f.outBlob)
  if (done.length < 2) return
  zipBusy.value = true
  try {
    const zip = new JSZip()
    const usedNames = new Set()
    for (const item of done) {
      const ext = extFromMime(item.outBlob)
      const base = sanitizeZipBase(item.name)
      let entryName = `${base}_compressed.${ext}`
      let n = 1
      while (usedNames.has(entryName.toLowerCase())) {
        entryName = `${base}_compressed (${n}).${ext}`
        n++
      }
      usedNames.add(entryName.toLowerCase())
      zip.file(entryName, item.outBlob)
    }
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    const now = new Date()
    const ts =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    downloadBlob(blob, `compressed_${ts}.zip`)
    showToast({ message: `已打包下载 ${done.length} 个文件`, type: 'success' })
  } catch (e) {
    console.error(e)
    showToast({ message: `ZIP 打包失败：${e?.message || '未知错误'}`, type: 'error' })
  } finally {
    zipBusy.value = false
  }
}

/* ── 工具 ────────────────────────────────────────────────── */
const guessMime = (name) => {
  const n = name.toLowerCase()
  if (n.endsWith('.png'))  return 'image/png'
  if (n.endsWith('.webp')) return 'image/webp'
  if (n.endsWith('.gif'))  return 'image/gif'
  if (n.endsWith('.avif')) return 'image/avif'
  if (n.endsWith('.svg'))  return 'image/svg+xml'
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
  background: var(--color-surface-drop, var(--color-surface));
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  height: 600px;
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
  background: var(--color-accent-dim);
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

/* 空状态 — 与全局 .preview-area 占位样式完全对齐（去掉 gap，靠 margin 控制） */
.comp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  padding: var(--spacing-2xl);
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
.icon-btn:hover:not(:disabled):not(.icon-btn-idle) {
  background: var(--color-accent-dim);
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.icon-btn.danger:hover:not(:disabled):not(.icon-btn-idle) {
  background: rgba(255,68,102,0.1);
  border-color: var(--color-destructive);
  color: var(--color-destructive);
}
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.icon-btn-idle {
  opacity: 0.55;
  cursor: not-allowed;
}

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
  width: 80%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
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
