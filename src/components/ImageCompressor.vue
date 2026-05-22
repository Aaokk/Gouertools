<template>
  <div
    class="tool-page tool-page--compress"
    @dragover.prevent="globalDragOver = true"
    @dragleave.self="globalDragOver = false"
    @drop.prevent="onGlobalDrop"
  >
    <div class="tool-header">
      <h2>{{ t('compressor.header') }}</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧主区域：与其它工具页一致为 preview-stack -->
      <div class="preview-stack">
        <div class="wm-actions wm-actions--split" @click.stop>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              {{ t('compressor.batchAdd') }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="folderInput.click()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              {{ t('compressor.addFolder') }}
            </button>
          </div>
          <div style="display:flex;gap:8px;">
            <AnchoredBubbleTip :visible="tipClearList.visible" :text="tipClearList.text">
              <button type="button" class="btn btn-danger btn-sm" @click="handleClearListClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                {{ t('compressor.clearList') }}
              </button>
            </AnchoredBubbleTip>
            <AnchoredBubbleTip :visible="tipReCompress.visible" :text="tipReCompress.text">
              <button type="button" class="btn btn-secondary btn-sm" @click="handleReCompressClick">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L20 7M4 17l1.64 1.36A9 9 0 0020.49 15"/></svg>
                {{ t('compressor.recompress') }}
              </button>
            </AnchoredBubbleTip>
            <AnchoredBubbleTip :visible="tipSaveAll.visible" :text="tipSaveAll.text">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :title="t('compressor.saveAllTitle')"
                :disabled="zipBusy"
                @click="handleSaveAllClick"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                {{ t('compressor.saveAll') }}
              </button>
            </AnchoredBubbleTip>
          </div>
        </div>

        <!-- 文件表格 / 空状态 -->
        <div
          class="compress-drop-zone"
          :class="{ 'drag-over': globalDragOver && !fileList.length, 'has-files': fileList.length }"
          @click="!fileList.length && fileInput.click()"
        >
          <!-- 空状态 -->
          <div v-if="!fileList.length" class="compress-empty">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">{{ t('compressor.dropPlaceholder') }}</span>
            <span class="placeholder-hint">{{ t('compressor.dropHint') }}</span>
          </div>

          <!-- 表格 -->
          <table v-else class="compress-table">
            <thead>
              <tr>
                <th class="col-status">{{ t('compressor.colStatus') }}</th>
                <th class="col-thumb">{{ t('compressor.colPreview') }}</th>
                <th class="col-name">{{ t('compressor.colName') }}</th>
                <th class="col-dim">{{ t('compressor.colDim') }}</th>
                <th class="col-dim">{{ t('compressor.colNewDim') }}</th>
                <th class="col-sz">{{ t('compressor.colSize') }}</th>
                <th class="col-sz">{{ t('compressor.colNewSize') }}</th>
                <th class="col-ratio">{{ t('compressor.colRatio') }}</th>
                <th class="col-act">{{ t('compressor.colAction') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in fileList" :key="item.id">
                <!-- 状态图标 -->
                <td class="col-status">
                  <span v-if="item.status === 'waiting'" class="status-icon waiting" :title="t('compressor.statusWaiting')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </span>
                  <span v-else-if="item.status === 'compressing'" class="status-icon spinning" :title="t('compressor.statusCompressing')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  </span>
                  <span v-else-if="item.status === 'done'" class="status-icon done" :title="t('compressor.statusDone')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </span>
                  <span v-else-if="item.status === 'error'" class="status-icon error" :title="t('compressor.statusError')">
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
                      :title="t('compressor.actionDownload')"
                      @click.stop="onRowDownloadClick(item)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                  </AnchoredBubbleTip>
                  <button class="icon-btn danger" :title="t('compressor.actionRemove')" @click.stop="removeItem(item)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 汇总栏 -->
        <div v-if="fileList.length" class="compress-summary">
          <span class="sum-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ doneCount }} / {{ fileList.length }}
          </span>
          <span class="sum-sep">|</span>
          <span class="sum-item">{{ t('compressor.sumBefore') }}{{ fmtSize(totalOrigSize) }}</span>
          <span class="sum-sep">|</span>
          <span class="sum-item">{{ t('compressor.sumAfter') }}<span class="sz-good">{{ fmtSize(totalOutSize) }}</span></span>
          <span class="sum-sep">|</span>
          <span v-if="totalRatio > 0" class="sum-item ratio-good">{{ t('compressor.sumRatio') }}{{ totalRatio }}% ↓</span>
        </div>
      </div>

      <!-- 右侧设置面板（与裁剪等页统一 control-panel） -->
      <div class="control-panel">
        <!-- 调整图片尺寸 -->
        <div class="setting-card" :class="{ collapsed: !s1 }">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>{{ t('compressor.titleAdjustSize') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <div class="setting-row">
              <label>{{ t('compressor.resizeMode') }}</label>
              <div class="control">
                <select class="select" v-model="settings.resizeMethod">
                  <option value="">{{ t('compressor.resizeNone') }}</option>
                  <option value="fitWidth">{{ t('compressor.resizeFitWidth') }}</option>
                  <option value="fitHeight">{{ t('compressor.resizeFitHeight') }}</option>
                  <option value="setShort">{{ t('compressor.resizeSetShort') }}</option>
                  <option value="setLong">{{ t('compressor.resizeSetLong') }}</option>
                  <option value="setCropRatio">{{ t('compressor.resizeCropRatio') }}</option>
                  <option value="setCropSize">{{ t('compressor.resizeCropSize') }}</option>
                </select>
              </div>
            </div>
            <!-- fitWidth -->
            <div v-if="settings.resizeMethod === 'fitWidth'" class="setting-row">
              <label>{{ t('compressor.widthPx') }}</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.width" min="100" max="8000"></div>
            </div>
            <!-- fitHeight -->
            <div v-if="settings.resizeMethod === 'fitHeight'" class="setting-row">
              <label>{{ t('compressor.heightPx') }}</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.height" min="100" max="8000"></div>
            </div>
            <!-- setShort -->
            <div v-if="settings.resizeMethod === 'setShort'" class="setting-row">
              <label>{{ t('compressor.shortPx') }}</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.short" min="100" max="4000"></div>
            </div>
            <!-- setLong -->
            <div v-if="settings.resizeMethod === 'setLong'" class="setting-row">
              <label>{{ t('compressor.longPx') }}</label>
              <div class="control"><input class="input" type="number" v-model.number="settings.long" min="100" max="8000"></div>
            </div>
            <!-- setCropRatio -->
            <template v-if="settings.resizeMethod === 'setCropRatio'">
              <div class="setting-row">
                <label>{{ t('compressor.widthRatio') }}</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropWidthRatio" min="1" max="100"></div>
              </div>
              <div class="setting-row">
                <label>{{ t('compressor.heightRatio') }}</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropHeightRatio" min="1" max="100"></div>
              </div>
            </template>
            <!-- setCropSize -->
            <template v-if="settings.resizeMethod === 'setCropSize'">
              <div class="setting-row">
                <label>{{ t('compressor.cropWidthPx') }}</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropWidthSize" min="100" max="8000"></div>
              </div>
              <div class="setting-row">
                <label>{{ t('compressor.cropHeightPx') }}</label>
                <div class="control"><input class="input" type="number" v-model.number="settings.cropHeightSize" min="100" max="8000"></div>
              </div>
            </template>
          </div>
        </div>

        <!-- 输出格式 -->
        <div class="setting-card" :class="{ collapsed: !s2 }">
          <div class="setting-card-header" @click="s2 = !s2">
            <h4>{{ t('compressor.titleOutputFormat') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s2">
            <div class="setting-row">
              <label>{{ t('compressor.targetFormat') }}</label>
              <div class="control">
                <select class="select" v-model="settings.targetFormat">
                  <option value="">{{ t('compressor.formatKeep') }}</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>
            <div v-if="settings.targetFormat === 'jpeg'" class="setting-row">
              <label>{{ t('compressor.bgColor') }}</label>
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
        <div class="setting-card" :class="{ collapsed: !s3 }">
          <div class="setting-card-header" @click="s3 = !s3">
            <h4>{{ t('compressor.titleJpegWebp') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s3">
            <p class="param-label">{{ t('compressor.qualityDesc') }}</p>
            <div class="range-group">
              <input type="range" min="10" max="100" step="1" :value="Math.round(settings.jpeg.quality * 100)"
                @input="e => { settings.jpeg.quality = Number(e.target.value) / 100 }">
              <span class="range-value">{{ Math.round(settings.jpeg.quality * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- PNG 参数 -->
        <div class="setting-card" :class="{ collapsed: !s4 }">
          <div class="setting-card-header" @click="s4 = !s4">
            <h4>{{ t('compressor.titlePng') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s4">
            <p class="param-label">{{ t('compressor.colorsDesc') }}</p>
            <div class="range-group">
              <input type="range" min="2" max="256" step="1" v-model.number="settings.png.colors">
              <span class="range-value">{{ settings.png.colors }}</span>
            </div>
            <p class="param-label" style="margin-top:4px;">{{ t('compressor.ditherDesc') }}</p>
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
            <h4>{{ t('compressor.titleGif') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body">
            <p class="param-label">{{ t('compressor.gifColorsDesc') }}</p>
            <div class="range-group">
              <input type="range" min="2" max="256" step="1" v-model.number="settings.gif.colors">
              <span class="range-value">{{ settings.gif.colors }}</span>
            </div>
            <div class="setting-row" style="margin-top:6px;">
              <label>{{ t('compressor.enableDither') }}</label>
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
            <h4>{{ t('compressor.titleAvif') }}</h4>
            <svg class="arrow" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body">
            <p class="param-label">{{ t('compressor.avifQualityDesc') }}</p>
            <div class="range-group">
              <input type="range" min="1" max="100" step="1" v-model.number="settings.avif.quality">
              <span class="range-value">{{ settings.avif.quality }}</span>
            </div>
            <p class="param-label" style="margin-top:4px;">{{ t('compressor.avifSpeedDesc') }}</p>
            <div class="range-group">
              <input type="range" min="1" max="10" step="1" v-model.number="settings.avif.speed">
              <span class="range-value">{{ settings.avif.speed }}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-ghost" style="flex:1;" @click="resetSettings">{{ t('compressor.resetSettings') }}</button>
          <div style="flex:2;min-width:0;">
            <AnchoredBubbleTip stretch :visible="tipApply.visible" :text="tipApply.text">
              <button type="button" class="btn btn-primary" style="width:100%;" @click="handleApplySettingsClick">
                {{ t('compressor.applySettings') }}
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
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

/* ── 文件输入 refs ────────────────────────────────────────── */
const fileInput   = ref(null)
const folderInput = ref(null)

/* ── 状态 ────────────────────────────────────────────────── */
const fileList      = ref([])   // FileItem[]
const processing    = ref(false)
const globalDragOver = ref(false)
const zipBusy       = ref(false)

const tipClearList = useAnchoredBubbleTip({ initialText: t('compressor.noImageYet') })
const tipReCompress = useAnchoredBubbleTip({ initialText: t('compressor.noImageYet') })
const tipSaveAll = useAnchoredBubbleTip({
  initialText: t('compressor.needDoneFirst'),
})
const tipApply = useAnchoredBubbleTip({ initialText: t('compressor.noImageYet') })

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
      showToast({ message: `${item.name} ${t('compressor.compressFailed')}：${err?.message || ''}`, type: 'error' })
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
    showToast({ message: t('compressor.invalidImage'), type: 'info' })
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
  showToast({ message: t('compressor.listCleared'), type: 'info' })
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
    tipReCompress.flash(t('compressor.compressingWait'))
    return
  }
  reCompress()
}

function handleSaveAllClick() {
  if (zipBusy.value) {
    tipSaveAll.flash(t('compressor.packagingWait'))
    return
  }
  const done = fileList.value.filter(f => f.status === 'done' && f.outBlob)
  if (!done.length) {
    tipSaveAll.flash()
    return
  }
  downloadAllAsZip()
}

function handleApplySettingsClick() {
  if (!fileList.value.length) {
    tipApply.flash()
    return
  }
  if (processing.value) {
    tipApply.flash(t('compressor.compressingWait'))
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
  flashRowDlBubble(item, t('compressor.waitRowDone'))
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

function extFromMime(blob) {
  const sub = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  return sub === 'svg+xml' ? 'svg' : sub
}

function sanitizeZipBase(name) {
  let base = name.replace(/\.[^.]+$/, '')
  if (!base.trim()) base = 'image'
  return base.replace(/[/\\:*?"<>|]/g, '_').slice(0, 120)
}

/** 「保存全部」：将已完成条目打包为一个 ZIP（入口已由 handleSaveAllClick 校验） */
const downloadAllAsZip = async () => {
  const done = fileList.value.filter(f => f.status === 'done' && f.outBlob)
  if (!done.length) return
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
    showToast({ message: t('compressor.downloadZip', { count: done.length }), type: 'success' })
  } catch (e) {
    console.error(e)
    showToast({ message: `${t('compressor.packFailed')}：${e?.message || ''}`, type: 'error' })
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
/* 与裁剪/水印等共用全局 .tool-body / .preview-stack / .control-panel；表格与顶栏在 style.css */
.tool-page.tool-page--compress {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

/* 折叠卡内补充说明（无 control 兄弟的 label；全局 .setting-row label 不覆盖此类） */
.param-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  margin: 0 0 4px;
  white-space: nowrap;
}
</style>
