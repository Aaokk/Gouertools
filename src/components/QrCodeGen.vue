<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 二维码生成</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧预览 -->
      <div class="preview-stack">
        <div class="qr-actions" @click.stop>
          <button class="btn btn-primary btn-sm" @click="generate">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M17 20h.01M20 20h.01"/></svg>
            生成二维码
          </button>
          <button type="button" class="btn btn-secondary btn-sm" @click="posterFileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            上传海报背景
          </button>
          <button v-if="posterSrc" type="button" class="btn btn-ghost btn-sm" @click="clearPoster">
            清除背景
          </button>
          <button v-if="qrDataUrl" class="btn btn-ghost btn-sm" @click="downloadSvg">
            下载 SVG
          </button>
          <input
            ref="posterFileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            class="qr-poster-file-input"
            @change="onPosterFileChange"
          />
        </div>

        <!-- 海报模式：contain 可视区域内的正方形选框（交互对齐图片裁剪页） -->
        <div
          v-if="posterSrc"
          class="preview-area qr-preview-area qr-preview-area--filled qr-poster-shell"
          @dragover.prevent="posterDragOver = true"
          @dragleave.self="posterDragOver = false"
          @drop.prevent="onPosterDrop"
          :class="{ dragging: posterDragOver }"
        >
          <div class="qr-poster-fit-inner">
            <img
              ref="posterImgRef"
              :src="posterSrc"
              class="qr-poster-img"
              alt=""
              draggable="false"
              @load="onPosterImageLoad"
            />
            <div
              v-if="posterFit.dw && placementBox"
              class="qr-poster-overlay-wrap"
              :style="posterOverlayWrapStyle"
            >
              <div class="qr-p-mask qr-p-mask-top" :style="placeMaskTop" />
              <div class="qr-p-mask qr-p-mask-bottom" :style="placeMaskBottom" />
              <div class="qr-p-mask qr-p-mask-left" :style="placeMaskLeft" />
              <div class="qr-p-mask qr-p-mask-right" :style="placeMaskRight" />
              <div
                class="qr-p-box"
                :style="placementBoxStyle"
                @pointerdown.prevent.stop="startPlacementMove"
              >
                <div class="qr-p-grid qr-p-grid-v1" />
                <div class="qr-p-grid qr-p-grid-v2" />
                <div class="qr-p-grid qr-p-grid-h1" />
                <div class="qr-p-grid qr-p-grid-h2" />
                <div
                  v-for="h in placementHandles"
                  :key="h"
                  :class="['qr-p-handle', `qr-p-handle-${h}`]"
                  @pointerdown.prevent.stop="startPlacementResize(h, $event)"
                />
                <img v-if="qrDataUrl" :src="qrDataUrl" class="qr-p-box-qr" alt="" draggable="false" />
                <span v-else class="qr-p-box-hint">生成二维码后将嵌入此处</span>
              </div>
              <div
                v-if="settings.showLabel && qrDataUrl"
                class="qr-p-label-below"
                :style="placementLabelStyle"
              >
                {{ settings.label || settings.content }}
              </div>
            </div>
          </div>
          <div v-if="placementBox && posterNaturalW" class="qr-poster-meta">
            <span>二维码边长（按原图像素）：≈ {{ placementSideNaturalPx }} px</span>
            <span class="qr-p-meta-sep">|</span>
            <span>海报 {{ posterNaturalW }} × {{ posterNaturalH }}</span>
          </div>
        </div>

        <!-- 无海报：纯二维码预览 -->
        <div
          v-else
          class="preview-area qr-preview-area"
          :class="{ 'qr-preview-area--filled': !!qrDataUrl }"
        >
          <div v-if="!qrDataUrl" class="qr-placeholder">
            <div class="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 20h3"/></svg>
            </div>
            <span class="placeholder-text">输入内容后点击生成</span>
            <span class="placeholder-hint">支持网址、文字、WiFi 等类型</span>
          </div>
          <div v-else class="qr-result">
            <div
              class="qr-wrap"
              :class="{ 'qr-wrap-transparent-bg': settings.bgTransparent }"
              :style="qrWrapStyle"
            >
              <img :src="qrDataUrl" alt="二维码" class="qr-img" />
              <p v-if="settings.showLabel" class="qr-label-text">{{ settings.label || settings.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧设置 -->
      <div class="control-panel">

        <!-- 内容输入 -->
        <div class="setting-card">
          <div class="setting-card-header" @click="s1 = !s1">
            <h4>二维码内容</h4>
            <svg class="arrow" :class="{ rotated: !s1 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s1">
            <div class="setting-row">
              <label>类型</label>
              <div class="control">
                <select class="select" v-model="contentType">
                  <option value="url">网址 URL</option>
                  <option value="text">纯文本</option>
                  <option value="phone">电话号码</option>
                  <option value="email">电子邮件</option>
                  <option value="wifi">WiFi 信息</option>
                </select>
              </div>
            </div>

            <!-- 普通内容 -->
            <template v-if="contentType !== 'wifi'">
              <div class="setting-row" style="align-items:flex-start;padding-top:4px;">
                <label style="padding-top:8px;">内容</label>
                <div class="control">
                  <textarea
                    class="input qr-textarea"
                    v-model="settings.content"
                    :placeholder="contentPlaceholder"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </template>

            <!-- WiFi -->
            <template v-else>
              <div class="setting-row">
                <label>WiFi名</label>
                <div class="control"><input class="input" v-model="wifi.ssid" placeholder="WiFi 名称"></div>
              </div>
              <div class="setting-row">
                <label>密码</label>
                <div class="control"><input class="input" v-model="wifi.password" placeholder="WiFi 密码"></div>
              </div>
              <div class="setting-row">
                <label>加密</label>
                <div class="control">
                  <select class="select" v-model="wifi.encryption">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">无密码</option>
                  </select>
                </div>
              </div>
            </template>

            <!-- 标签 -->
            <div class="setting-row">
              <label>显示标签</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="settings.showLabel">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
            <div v-if="settings.showLabel" class="setting-row">
              <label>标签文字</label>
              <div class="control"><input class="input" v-model="settings.label" placeholder="默认显示内容"></div>
            </div>

            <div class="setting-row qr-logo-setting-row">
              <label style="padding-top:6px;">中心 Logo</label>
              <div class="control qr-logo-stack">
                <div class="qr-logo-actions">
                  <button type="button" class="btn btn-secondary btn-sm" @click="qrLogoInput.click()">
                    上传 Logo
                  </button>
                  <button v-if="qrLogoDataUrl" type="button" class="btn btn-ghost btn-sm" @click="clearQrLogo">
                    清除
                  </button>
                </div>
                <input
                  ref="qrLogoInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="qr-logo-file-input"
                  @change="onQrLogoFileChange"
                />
                <div v-if="qrLogoDataUrl" class="qr-logo-preview-row">
                  <img :src="qrLogoDataUrl" alt="" class="qr-logo-thumb" draggable="false" />
                  <span class="qr-logo-tip">正方形居中嵌入；非正方形将居中裁剪；建议容错选「高 H」</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 样式设置（码点下拉超出卡片时需 overflow: visible） -->
        <div class="setting-card qr-dot-dropdown-host">
          <div class="setting-card-header" @click="s2 = !s2">
            <h4>样式设置</h4>
            <svg class="arrow" :class="{ rotated: !s2 }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="s2">
            <div class="setting-row">
              <label>尺寸</label>
              <div class="control">
                <div class="range-group">
                  <input type="range" min="128" max="1024" step="64" v-model.number="settings.size">
                  <span class="range-value">{{ settings.size }}px</span>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>容错级别</label>
              <div class="control">
                <select class="select" v-model="settings.errorLevel">
                  <option value="L">低 L（7%）</option>
                  <option value="M">中 M（15%）</option>
                  <option value="Q">较高 Q（25%）</option>
                  <option value="H">高 H（30%）</option>
                </select>
              </div>
            </div>
            <div class="setting-row">
              <label class="setting-label-with-hint">
                <span>码边距</span>
                <button
                  type="button"
                  class="qr-hint-trigger"
                  aria-label="码边距说明"
                  title="二维码图案距离四周的留白（按模块/色块计）。默认 1；ISO/IEC 18004 建议静默区不小于 4 个模块，扫码要求高时可改为 2～4。"
                >
                  ?
                </button>
              </label>
              <div class="control">
                <select class="select" v-model.number="settings.marginModules">
                  <option v-for="n in qrMarginOptions" :key="n" :value="n">{{ n }} 个色块</option>
                </select>
              </div>
            </div>
            <div class="setting-row">
              <label>码点形状</label>
              <div class="control">
                <div ref="dotDropdownEl" class="dot-style-dropdown">
                  <button
                    type="button"
                    class="dot-style-trigger"
                    :aria-expanded="dotStyleDropdownOpen"
                    aria-haspopup="listbox"
                    aria-controls="dot-style-listbox"
                    @click.stop="toggleDotStyleDropdown"
                  >
                    <span class="dot-style-trigger-main">
                      <span class="dot-style-trigger-thumb">
                        <svg class="dot-style-thumb-svg" viewBox="0 0 24 24" aria-hidden="true">
                          <rect width="24" height="24" fill="#ffffff" />
                          <g fill="#2a3330" v-html="qrDotThumbFragmentMarkup(settings.dotStyle)" />
                        </svg>
                      </span>
                      <span class="dot-style-trigger-label">{{ dotStyleLabel }}</span>
                    </span>
                    <svg
                      class="dot-style-chevron"
                      :class="{ open: dotStyleDropdownOpen }"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    ><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <div
                    v-show="dotStyleDropdownOpen"
                    id="dot-style-listbox"
                    class="dot-style-popover"
                    role="listbox"
                    @click.stop
                  >
                    <button
                      v-for="s in QR_DOT_STYLES"
                      :id="`dot-opt-${s.id}`"
                      :key="s.id"
                      type="button"
                      class="dot-style-cell"
                      role="option"
                      :class="{ active: settings.dotStyle === s.id }"
                      :aria-selected="settings.dotStyle === s.id"
                      @click="pickDotStyle(s.id)"
                    >
                      <span class="dot-style-thumb-wrap">
                        <span class="dot-style-thumb-frame">
                          <svg class="dot-style-thumb-svg" viewBox="0 0 24 24" aria-hidden="true">
                            <rect width="24" height="24" fill="#ffffff" />
                            <g fill="#1a1f1d" v-html="qrDotThumbFragmentMarkup(s.id)" />
                          </svg>
                        </span>
                      </span>
                      <span class="dot-style-cell-label">{{ s.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>码眼形状</label>
              <div class="control">
                <div ref="eyeDropdownEl" class="dot-style-dropdown">
                  <button
                    type="button"
                    class="dot-style-trigger"
                    :aria-expanded="eyeStyleDropdownOpen"
                    aria-haspopup="listbox"
                    aria-controls="eye-style-listbox"
                    @click.stop="toggleEyeStyleDropdown"
                  >
                    <span class="dot-style-trigger-main">
                      <span class="dot-style-trigger-thumb">
                        <svg
                          class="dot-style-thumb-svg"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          v-html="qrEyeThumbMarkup(settings.eyeStyle)"
                        />
                      </span>
                      <span class="dot-style-trigger-label">{{ eyeStyleLabel }}</span>
                    </span>
                    <svg
                      class="dot-style-chevron"
                      :class="{ open: eyeStyleDropdownOpen }"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    ><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <div
                    v-show="eyeStyleDropdownOpen"
                    id="eye-style-listbox"
                    class="dot-style-popover"
                    role="listbox"
                    @click.stop
                  >
                    <button
                      v-for="s in QR_EYE_STYLES"
                      :id="`eye-opt-${s.id}`"
                      :key="s.id"
                      type="button"
                      class="dot-style-cell"
                      role="option"
                      :class="{ active: settings.eyeStyle === s.id }"
                      :aria-selected="settings.eyeStyle === s.id"
                      @click="pickEyeStyle(s.id)"
                    >
                      <span class="dot-style-thumb-wrap">
                        <span class="dot-style-thumb-frame">
                          <svg
                            class="dot-style-thumb-svg"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            v-html="qrEyeThumbMarkup(s.id)"
                          />
                        </span>
                      </span>
                      <span class="dot-style-cell-label">{{ s.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>前景色</label>
              <div class="control" style="display:flex;align-items:center;gap:8px;">
                <div class="color-dot" :style="{ background: settings.fgColor }">
                  <input type="color" v-model="settings.fgColor">
                </div>
                <input class="input" v-model="settings.fgColor" maxlength="7" style="width:86px;">
              </div>
            </div>
            <div class="setting-row qr-bg-setting-row">
              <label>背景色</label>
              <div class="control qr-bg-control">
                <div class="qr-bg-picker" :class="{ 'is-disabled': settings.bgTransparent }">
                  <div
                    class="color-dot qr-bg-color-dot"
                    :style="qrBgColorDotStyle"
                  >
                    <input type="color" v-model="settings.bgColor" :disabled="settings.bgTransparent">
                  </div>
                  <input
                    class="input"
                    v-model="settings.bgColor"
                    maxlength="7"
                    style="width:86px;"
                    :disabled="settings.bgTransparent"
                  />
                </div>
                <label class="qr-bg-transparent-option">
                  <input type="checkbox" v-model="settings.bgTransparent">
                  <span>透明</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="qr-panel-footer-btns">
          <button type="button" class="btn btn-primary qr-panel-footer-btn" @click="generate">
            生成二维码
          </button>
          <AnchoredBubbleTip
            stretch
            :visible="downloadTip.visible"
            :text="downloadTip.text"
          >
            <button
              type="button"
              class="btn btn-secondary qr-panel-footer-btn"
              :class="{ 'qr-download-btn-idle': !qrDataUrl }"
              :title="qrDataUrl ? downloadRasterTitle : ''"
              @click.stop="handleFooterDownloadClick"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              {{ downloadRasterLabel }}
            </button>
          </AnchoredBubbleTip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onUnmounted, nextTick } from 'vue'
import {
  styledQrToDataUrl,
  styledQrToSvgString,
  QR_DOT_STYLES,
  QR_EYE_STYLES,
  QR_LOGO_DEFAULT_RELATIVE_SIZE,
  qrDotThumbFragmentMarkup,
  qrEyeThumbMarkup,
} from '../utils/qrStyled.js'
import { showToast } from '../utils/toast.js'
import { downloadDataUrl, downloadBlob } from '../utils/download.js'
import AnchoredBubbleTip from './AnchoredBubbleTip.vue'
import { useAnchoredBubbleTip } from '../composables/useAnchoredBubbleTip.js'

const s1 = ref(true)
const s2 = ref(true)
/** 码边距可选模块数（与 qrStyled margin 一致） */
const qrMarginOptions = [1, 2, 3, 4]
const dotStyleDropdownOpen = ref(false)
const eyeStyleDropdownOpen = ref(false)
const dotDropdownEl = ref(null)
const eyeDropdownEl = ref(null)
const qrDataUrl   = ref('')
const qrSvgString = ref('')
const contentType = ref('url')

const qrLogoInput = ref(null)
const qrLogoDataUrl = ref('')
const qrLogoImage = ref(null)

const downloadTip = useAnchoredBubbleTip({
  initialText: '请先点击「生成二维码」，生成成功后再下载',
})

/** 海报背景 + 正方形二维码选区（坐标相对 posterFit 内接矩形） */
const posterFileInput = ref(null)
const posterSrc = ref('')
const posterFilenameBase = ref('poster')
/** 合成导出：与上传海报一致的 MIME / 扩展名（画布无法输出的格式回退 PNG） */
const posterExportMime = ref('image/png')
const posterExportExt = ref('png')
const posterExportQuality = ref(null)
const posterImgRef = ref(null)
const posterNaturalW = ref(0)
const posterNaturalH = ref(0)
const posterFit = reactive({ ox: 0, oy: 0, dw: 0, dh: 0, scale: 1 })
const placementBox = ref(null)
const posterDragOver = ref(false)
const placementHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

let posterResizeObs = null
let placementDragState = null

const QR_PLACEMENT_MIN = 24

const settings = reactive({
  content:    'https://gouer.vip',
  size:       400,
  errorLevel: 'H',
  /** 四周留白模块数，对应 QR quiet zone */
  marginModules: 1,
  dotStyle:   'normal',
  eyeStyle:   'square',
  fgColor:    '#000000',
  bgColor:    '#ffffff',
  /** 透明背景（传给 qrStyled 为 transparent；栅格需 PNG） */
  bgTransparent: false,
  showLabel:  false,
  label:      '',
})

const wifi = reactive({ ssid: '', password: '', encryption: 'WPA' })

const contentPlaceholder = computed(() => {
  const map = {
    url: 'https://example.com',
    text: '输入任意文字内容',
    phone: 'tel:+8613800138000',
    email: 'mailto:hello@example.com',
  }
  return map[contentType.value] || ''
})

const qrWrapStyle = computed(() => {
  const base = {
    padding: '6px',
    borderRadius: '8px',
  }
  if (settings.bgTransparent) return { ...base, background: 'transparent' }
  return { ...base, background: settings.bgColor }
})

const qrBgColorDotStyle = computed(() => {
  if (settings.bgTransparent) {
    return {
      background:
        'repeating-conic-gradient(#cfd6da 0% 25%, #f0f3f5 0% 50%) 50% / 10px 10px',
    }
  }
  return { background: settings.bgColor }
})

const posterOverlayWrapStyle = computed(() => ({
  left: `${posterFit.ox}px`,
  top: `${posterFit.oy}px`,
  width: `${posterFit.dw}px`,
  height: `${posterFit.dh}px`,
}))

const placementBoxStyle = computed(() => {
  const b = placementBox.value
  if (!b) return {}
  return { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` }
})

const placeMaskTop = computed(() => {
  const b = placementBox.value
  if (!b || !posterFit.dh) return {}
  const { x, y, w } = b
  return { top: '0', left: `${x}px`, width: `${w}px`, height: `${y}px` }
})

const placeMaskBottom = computed(() => {
  const b = placementBox.value
  if (!b || !posterFit.dh) return {}
  const { x, y, w, h } = b
  const ih = posterFit.dh
  return {
    top: `${y + h}px`,
    left: `${x}px`,
    width: `${w}px`,
    height: `${ih - y - h}px`,
  }
})

const placeMaskLeft = computed(() => {
  const b = placementBox.value
  if (!b || !posterFit.dh) return {}
  const ih = posterFit.dh
  return { top: '0', left: '0', width: `${b.x}px`, height: `${ih}px` }
})

const placeMaskRight = computed(() => {
  const b = placementBox.value
  if (!b || !posterFit.dw || !posterFit.dh) return {}
  const { x, y, w, h } = b
  const iw = posterFit.dw
  const ih = posterFit.dh
  return {
    top: '0',
    left: `${x + w}px`,
    width: `${iw - x - w}px`,
    height: `${ih}px`,
  }
})

const placementLabelStyle = computed(() => {
  const b = placementBox.value
  if (!b || !posterFit.dw) return {}
  const fs = Math.max(10, Math.min(18, b.w * 0.065))
  const gap = Math.max(6, posterFit.dw * 0.012)
  return {
    left: `${b.x}px`,
    top: `${b.y + b.h + gap}px`,
    width: `${b.w}px`,
    fontSize: `${fs}px`,
  }
})

const placementSideNaturalPx = computed(() => {
  const b = placementBox.value
  const s = posterFit.scale
  if (!b || !s) return 0
  return Math.round(b.w / s)
})

/** 光栅下载按钮：固定文案「下载」（格式由后台文件名与 MIME 决定） */
const downloadRasterLabel = computed(() => '下载')

const downloadRasterTitle = computed(() =>
  posterSrc.value ? '下载海报合成图' : '下载二维码图片',
)

const dotStyleLabel = computed(() => {
  const f = QR_DOT_STYLES.find((s) => s.id === settings.dotStyle)
  return f ? f.label : settings.dotStyle
})

const eyeStyleLabel = computed(() => {
  const f = QR_EYE_STYLES.find((s) => s.id === settings.eyeStyle)
  return f ? f.label : settings.eyeStyle
})

function pickEyeStyle(id) {
  settings.eyeStyle = id
  eyeStyleDropdownOpen.value = false
}

function toggleEyeStyleDropdown() {
  eyeStyleDropdownOpen.value = !eyeStyleDropdownOpen.value
  if (eyeStyleDropdownOpen.value) dotStyleDropdownOpen.value = false
}

function pickDotStyle(id) {
  settings.dotStyle = id
  dotStyleDropdownOpen.value = false
}

function toggleDotStyleDropdown() {
  dotStyleDropdownOpen.value = !dotStyleDropdownOpen.value
  if (dotStyleDropdownOpen.value) eyeStyleDropdownOpen.value = false
}

function closeQrStyleMenusOnEscape(e) {
  if (e.key === 'Escape') {
    dotStyleDropdownOpen.value = false
    eyeStyleDropdownOpen.value = false
  }
}

function onQrStyleMenuPointerDown(e) {
  const t = e.target
  if (dotStyleDropdownOpen.value && dotDropdownEl.value && !dotDropdownEl.value.contains(t)) {
    dotStyleDropdownOpen.value = false
  }
  if (eyeStyleDropdownOpen.value && eyeDropdownEl.value && !eyeDropdownEl.value.contains(t)) {
    eyeStyleDropdownOpen.value = false
  }
}

watch([dotStyleDropdownOpen, eyeStyleDropdownOpen], ([dotOpen, eyeOpen]) => {
  const anyOpen = dotOpen || eyeOpen
  if (anyOpen) {
    document.addEventListener('keydown', closeQrStyleMenusOnEscape)
    document.addEventListener('mousedown', onQrStyleMenuPointerDown)
  } else {
    document.removeEventListener('keydown', closeQrStyleMenusOnEscape)
    document.removeEventListener('mousedown', onQrStyleMenuPointerDown)
  }
})

function updatePosterFitMetrics() {
  const img = posterImgRef.value
  if (!img?.naturalWidth) return
  posterNaturalW.value = img.naturalWidth
  posterNaturalH.value = img.naturalHeight
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  const cw = img.clientWidth
  const ch = img.clientHeight
  if (!cw || !ch) return
  const scaleFit = Math.min(cw / nw, ch / nh)
  posterFit.ox = (cw - nw * scaleFit) / 2
  posterFit.oy = (ch - nh * scaleFit) / 2
  posterFit.dw = nw * scaleFit
  posterFit.dh = nh * scaleFit
  posterFit.scale = scaleFit
}

function initPlacementBox() {
  const fm = posterFit
  if (!fm.dw || !fm.dh) return
  const side = Math.max(QR_PLACEMENT_MIN, Math.min(fm.dw, fm.dh) * 0.36)
  placementBox.value = {
    x: (fm.dw - side) / 2,
    y: (fm.dh - side) / 2,
    w: side,
    h: side,
  }
}

function rescalePlacementAfterFitChange(oldDw, oldDh) {
  const b = placementBox.value
  if (!b || oldDw <= 0 || oldDh <= 0 || !posterFit.dw) {
    initPlacementBox()
    return
  }
  const nx = b.x / oldDw
  const ny = b.y / oldDh
  let side = (b.w / oldDw) * posterFit.dw
  side = Math.max(QR_PLACEMENT_MIN, Math.min(side, posterFit.dw, posterFit.dh))
  let x = nx * posterFit.dw
  let y = ny * posterFit.dh
  x = Math.max(0, Math.min(x, posterFit.dw - side))
  y = Math.max(0, Math.min(y, posterFit.dh - side))
  placementBox.value = { x, y, w: side, h: side }
}

function detachPosterResizeObserver() {
  posterResizeObs?.disconnect()
  posterResizeObs = null
}

function attachPosterResizeObserver() {
  detachPosterResizeObserver()
  const el = posterImgRef.value
  if (!el) return
  posterResizeObs = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      const odw = posterFit.dw
      const odh = posterFit.dh
      updatePosterFitMetrics()
      if (placementBox.value && odw > 0 && odh > 0) rescalePlacementAfterFitChange(odw, odh)
      else initPlacementBox()
    })
  })
  posterResizeObs.observe(el)
}

async function onPosterImageLoad() {
  await nextTick()
  updatePosterFitMetrics()
  initPlacementBox()
  attachPosterResizeObserver()
}

function applyPosterExportSpecFromFile(file) {
  const type = (file.type || '').toLowerCase().trim()
  const name = (file.name || '').toLowerCase()

  const setPngFallback = (msg) => {
    if (msg) showToast({ message: msg, type: 'info' })
    posterExportMime.value = 'image/png'
    posterExportExt.value = 'png'
    posterExportQuality.value = null
  }

  if (type === 'image/jpeg' || type === 'image/jpg') {
    posterExportMime.value = 'image/jpeg'
    posterExportExt.value = 'jpg'
    posterExportQuality.value = 0.92
    return
  }
  if (type === 'image/png') {
    posterExportMime.value = 'image/png'
    posterExportExt.value = 'png'
    posterExportQuality.value = null
    return
  }
  if (type === 'image/webp') {
    posterExportMime.value = 'image/webp'
    posterExportExt.value = 'webp'
    posterExportQuality.value = 0.92
    return
  }

  if (type === 'image/gif' || name.endsWith('.gif')) {
    setPngFallback('GIF 无法在画布中原样导出，已改为 PNG')
    return
  }

  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    posterExportMime.value = 'image/jpeg'
    posterExportExt.value = 'jpg'
    posterExportQuality.value = 0.92
    return
  }
  if (name.endsWith('.png')) {
    posterExportMime.value = 'image/png'
    posterExportExt.value = 'png'
    posterExportQuality.value = null
    return
  }
  if (name.endsWith('.webp')) {
    posterExportMime.value = 'image/webp'
    posterExportExt.value = 'webp'
    posterExportQuality.value = 0.92
    return
  }

  if (type.startsWith('image/')) {
    setPngFallback(
      `无法在浏览器中导出为 ${type.replace(/^image\//, '').toUpperCase()}，已改为 PNG`,
    )
    return
  }

  setPngFallback(null)
}

function loadPosterFile(file) {
  if (!file) return
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  const looksImage =
    type.startsWith('image/') ||
    /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i.test(name)
  if (!looksImage) {
    showToast({ message: '请选择图片文件', type: 'info' })
    return
  }
  applyPosterExportSpecFromFile(file)
  posterFilenameBase.value = file.name.replace(/\.[^.]+$/, '') || 'poster'
  const url = URL.createObjectURL(file)
  if (posterSrc.value) URL.revokeObjectURL(posterSrc.value)
  posterSrc.value = url
  placementBox.value = null
}

function onPosterFileChange(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (f) loadPosterFile(f)
}

function onPosterDrop(e) {
  posterDragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (!f) return
  const type = (f.type || '').toLowerCase()
  const name = (f.name || '').toLowerCase()
  const looksImage =
    type.startsWith('image/') ||
    /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i.test(name)
  if (looksImage) loadPosterFile(f)
}

function clearPoster() {
  detachPosterResizeObserver()
  stopPlacementDrag()
  if (posterSrc.value) URL.revokeObjectURL(posterSrc.value)
  posterSrc.value = ''
  placementBox.value = null
  posterNaturalW.value = 0
  posterNaturalH.value = 0
  posterFit.ox = 0
  posterFit.oy = 0
  posterFit.dw = 0
  posterFit.dh = 0
  posterFit.scale = 1
  posterExportMime.value = 'image/png'
  posterExportExt.value = 'png'
  posterExportQuality.value = null
}

function startPlacementMove(e) {
  const b = placementBox.value
  if (!b) return
  placementDragState = { type: 'move', startX: e.clientX, startY: e.clientY, origBox: { ...b } }
  e.currentTarget.setPointerCapture?.(e.pointerId)
  window.addEventListener('pointermove', onPlacementPointerMove)
  window.addEventListener('pointerup', stopPlacementDrag)
}

function startPlacementResize(handle, e) {
  const b = placementBox.value
  if (!b) return
  placementDragState = {
    type: 'resize',
    handle,
    startX: e.clientX,
    startY: e.clientY,
    origBox: { ...b },
  }
  e.target.setPointerCapture?.(e.pointerId)
  window.addEventListener('pointermove', onPlacementPointerMove)
  window.addEventListener('pointerup', stopPlacementDrag)
}

function onPlacementPointerMove(e) {
  if (!placementDragState || !posterFit.dw) return
  const iw = posterFit.dw
  const ih = posterFit.dh
  const dx = e.clientX - placementDragState.startX
  const dy = e.clientY - placementDragState.startY
  const ob = placementDragState.origBox
  const r = 1

  if (placementDragState.type === 'move') {
    let nx = ob.x + dx
    let ny = ob.y + dy
    nx = Math.max(0, Math.min(iw - ob.w, nx))
    ny = Math.max(0, Math.min(ih - ob.h, ny))
    placementBox.value = { ...ob, x: nx, y: ny }
    return
  }

  let { x, y, w, h } = ob
  const h2 = placementDragState.handle

  if (h2.includes('e')) w = Math.max(QR_PLACEMENT_MIN, ob.w + dx)
  if (h2.includes('s')) h = Math.max(QR_PLACEMENT_MIN, ob.h + dy)
  if (h2.includes('w')) {
    x = ob.x + dx
    w = Math.max(QR_PLACEMENT_MIN, ob.w - dx)
  }
  if (h2.includes('n')) {
    y = ob.y + dy
    h = Math.max(QR_PLACEMENT_MIN, ob.h - dy)
  }

  if (h2.includes('e') || h2.includes('w')) {
    h = w / r
  } else {
    w = h * r
  }
  if (h2.includes('n')) y = ob.y + ob.h - h
  if (h2.includes('w')) x = ob.x + ob.w - w

  x = Math.max(0, x)
  y = Math.max(0, y)
  w = Math.min(iw - x, w)
  h = Math.min(ih - y, h)
  if (w < QR_PLACEMENT_MIN) w = QR_PLACEMENT_MIN
  if (h < QR_PLACEMENT_MIN) h = QR_PLACEMENT_MIN

  placementBox.value = { x, y, w, h }
}

function stopPlacementDrag() {
  placementDragState = null
  window.removeEventListener('pointermove', onPlacementPointerMove)
  window.removeEventListener('pointerup', stopPlacementDrag)
}

function truncateCanvasLabel(ctx, text, maxWidth) {
  const ellipsis = '…'
  if (ctx.measureText(text).width <= maxWidth) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const t = text.slice(0, mid) + ellipsis
    if (ctx.measureText(t).width <= maxWidth) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + ellipsis
}

function composePosterRasterBlob() {
  return new Promise((resolve) => {
    const fm = posterFit
    const box = placementBox.value
    const src = posterSrc.value
    const qr = qrDataUrl.value
    if (!fm.scale || !box || !src || !qr) {
      resolve(null)
      return
    }
    const nw = posterNaturalW.value
    const nh = posterNaturalH.value
    const sFit = fm.scale

    const sx = Math.round(box.x / sFit)
    const sy = Math.round(box.y / sFit)
    const sw = Math.round(box.w / sFit)
    const sh = Math.round(box.h / sFit)

    const mime = posterExportMime.value
    const quality = posterExportQuality.value

    const posterImg = new Image()
    posterImg.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = nw
      canvas.height = nh
      const ctx = canvas.getContext('2d')
      ctx.drawImage(posterImg, 0, 0)

      const qrImg = new Image()
      qrImg.onload = () => {
        ctx.drawImage(qrImg, sx, sy, sw, sh)
        if (settings.showLabel) {
          const raw = (settings.label || settings.content || '').trim()
          if (raw) {
            const ly = sy + sh + Math.max(4, Math.round(sw * 0.02))
            const fontPx = Math.max(14, Math.round(sw * 0.065))
            ctx.font = `${fontPx}px system-ui, -apple-system, "Segoe UI", sans-serif`
            ctx.fillStyle = settings.fgColor
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            const cx = sx + sw / 2
            const maxW = Math.min(sw * 1.35, nw - sx - 8)
            ctx.fillText(truncateCanvasLabel(ctx, raw, maxW), cx, ly)
          }
        }
        const qArg =
          mime === 'image/jpeg' || mime === 'image/webp'
            ? typeof quality === 'number'
              ? quality
              : 0.92
            : undefined
        canvas.toBlob(
          (blob) => resolve(blob),
          mime,
          qArg,
        )
      }
      qrImg.onerror = () => resolve(null)
      qrImg.src = qr
    }
    posterImg.onerror = () => resolve(null)
    posterImg.src = src
  })
}

const getContent = () => {
  if (contentType.value === 'wifi') {
    return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`
  }
  return settings.content.trim()
}

function onQrLogoFileChange(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f?.type?.startsWith('image/')) {
    showToast({ message: '请选择图片文件', type: 'info' })
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result
    if (typeof dataUrl !== 'string') return
    qrLogoDataUrl.value = dataUrl
    const img = new Image()
    img.onload = () => {
      qrLogoImage.value = img
      if (getContent()) generate()
    }
    img.onerror = () => {
      qrLogoImage.value = null
      qrLogoDataUrl.value = ''
      showToast({ message: 'Logo 加载失败', type: 'error' })
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(f)
}

function clearQrLogo() {
  qrLogoDataUrl.value = ''
  qrLogoImage.value = null
  if (qrDataUrl.value && getContent()) generate()
}

const generate = () => {
  const content = getContent()
  if (!content) {
    showToast({ message: '请先输入内容', type: 'info' })
    return
  }
  try {
    const margin = Math.min(4, Math.max(1, Math.round(Number(settings.marginModules)) || 1))
    const opts = {
      width: settings.size,
      errorCorrectionLevel: settings.errorLevel,
      fgColor: settings.fgColor,
      bgColor: settings.bgTransparent ? 'transparent' : settings.bgColor,
      margin,
      dotStyle: settings.dotStyle,
      eyeStyle: settings.eyeStyle,
      logoImage: qrLogoImage.value || null,
      logoDataUrl: qrLogoDataUrl.value || '',
      logoRelativeSize: QR_LOGO_DEFAULT_RELATIVE_SIZE,
    }
    qrDataUrl.value = styledQrToDataUrl(content, opts)
    qrSvgString.value = styledQrToSvgString(content, opts)
  } catch (err) {
    showToast({ message: `生成失败：${err.message}`, type: 'error' })
  }
}

/** 已有预览时，改颜色/尺寸/容错后立即重绘（避免用户误以为前景色无效） */
let regenTimer = null
watch(
  () => [
    settings.fgColor,
    settings.bgColor,
    settings.bgTransparent,
    settings.size,
    settings.errorLevel,
    settings.marginModules,
    settings.dotStyle,
    settings.eyeStyle,
    qrLogoDataUrl.value,
  ],
  () => {
    if (!qrDataUrl.value) return
    clearTimeout(regenTimer)
    regenTimer = setTimeout(() => {
      regenTimer = null
      generate()
    }, 80)
  }
)

watch(qrDataUrl, (v) => {
  if (v) downloadTip.hide()
})

onUnmounted(() => {
  clearTimeout(regenTimer)
  detachPosterResizeObserver()
  stopPlacementDrag()
  if (posterSrc.value) URL.revokeObjectURL(posterSrc.value)
  document.removeEventListener('keydown', closeQrStyleMenusOnEscape)
  document.removeEventListener('mousedown', onQrStyleMenuPointerDown)
})

function handleFooterDownloadClick() {
  if (!qrDataUrl.value) {
    downloadTip.flash()
    return
  }
  downloadTip.hide()
  downloadPng()
}

const downloadPng = async () => {
  if (!qrDataUrl.value) return
  if (posterSrc.value && placementBox.value) {
    const blob = await composePosterRasterBlob()
    if (blob) {
      const ext = posterExportExt.value || 'png'
      downloadBlob(blob, `${posterFilenameBase.value}_qrcode.${ext}`)
      showToast({ message: '导出成功', type: 'success' })
      return
    }
    showToast({ message: '合成导出失败', type: 'error' })
    return
  }
  downloadDataUrl(qrDataUrl.value, settings.bgTransparent ? 'qrcode.png' : 'qrcode.jpg')
}

const downloadSvg = () => {
  const blob = new Blob([qrSvgString.value], { type: 'image/svg+xml' })
  downloadBlob(blob, 'qrcode.svg')
}
</script>

<style scoped>
:deep(.tool-body) { padding-top: var(--spacing-md); }
.tool-page { flex: 1; display: flex; flex-direction: column; width: 100%; min-width: 0; }
.qr-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.qr-preview-area {
  display: flex; align-items: center; justify-content: center;
}

.preview-area.qr-preview-area.qr-preview-area--filled {
  background: rgba(44, 62, 58, 0.06);
  border-style: solid;
  border-color: var(--color-border);
}

.preview-area.qr-preview-area.qr-preview-area--filled.preview-area.dragover,
.preview-area.qr-preview-area.qr-preview-area--filled.preview-area.dragging {
  background: rgba(44, 62, 58, 0.1);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-sm);
}
/* placeholder 样式完全依赖全局 .preview-area .placeholder-* 规则，无需重复 */
.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.qr-result {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
/* qr-wrap 宽度由这里控制，图片自动填满 */
:global(.qr-wrap) {
  display: inline-flex !important;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 280px;
}

.qr-result .qr-wrap-transparent-bg {
  background-color: transparent !important;
  background-image: repeating-conic-gradient(
    rgba(130, 145, 155, 0.22) 0% 25%,
    rgba(130, 145, 155, 0.07) 0% 50%
  ) !important;
  background-size: 14px 14px !important;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.qr-bg-control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.qr-bg-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-bg-picker.is-disabled {
  opacity: 0.48;
  pointer-events: none;
}

.qr-bg-transparent-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-foreground);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.qr-bg-transparent-option input {
  margin: 0;
  cursor: pointer;
  accent-color: var(--color-accent);
}

.qr-bg-color-dot input[type='color']:disabled {
  cursor: not-allowed;
}
.qr-img {
  display: block;
  width: 100%;
  height: auto;
}
.qr-label-text {
  width: 100%;
  font-size: 12px;
  text-align: center;
  word-break: break-all;
  color: var(--color-foreground);
}
@media (max-width: 900px) {
  :global(.qr-wrap) { width: 240px; }
}
.qr-textarea { min-height: 72px; height: auto; resize: vertical; padding: 8px 10px; }

.control-panel { box-sizing: border-box; width: 100%; min-width: 0; overflow: visible; display: flex; flex-direction: column; gap: var(--spacing-sm); }

.qr-panel-footer-btns {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: stretch;
}

.qr-panel-footer-btn {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

:deep(.anchored-bubble-anchor--stretch) .qr-panel-footer-btn {
  flex: 1;
}

.qr-download-btn-idle {
  opacity: 0.72;
  cursor: not-allowed;
}

.arrow { transition: transform var(--transition-fast); color: var(--color-text-muted); flex-shrink: 0; }
.arrow.rotated { transform: rotate(-90deg); }

.qr-dot-dropdown-host {
  overflow: visible;
}

.setting-label-with-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.qr-hint-trigger {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--input-bg);
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}
.qr-hint-trigger:hover {
  border-color: var(--color-border-hover);
  color: var(--color-foreground);
}

.dot-style-dropdown {
  position: relative;
  width: 100%;
}
.dot-style-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--input-bg);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--color-foreground);
  text-align: left;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.dot-style-trigger:hover {
  border-color: var(--color-border-hover);
  background: var(--input-bg-focus);
}
.dot-style-trigger-main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.dot-style-trigger-thumb {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dot-style-trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dot-style-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}
.dot-style-chevron.open {
  transform: rotate(180deg);
}

/* 码点 / 码眼共用：列宽随内容收缩，避免 1fr 把格子拉得过宽显得空旷 */
.dot-style-popover {
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  z-index: 50;
  box-sizing: border-box;
  width: max-content;
  max-width: calc(100vw - 24px);
  padding: 4px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 4px 5px;
  justify-items: center;
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
}

.dot-style-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  width: max-content;
  max-width: 52px;
  padding: 1px 2px 0;
  margin: 0;
  border: none;
  border-radius: 4px;
  background: var(--color-muted);
  cursor: pointer;
  font-family: var(--font-body);
  transition: background var(--transition-fast);
}

.dot-style-cell:hover {
  background: var(--color-accent-dim);
}

.dot-style-thumb-wrap {
  width: auto;
  display: flex;
  justify-content: center;
}

.dot-style-thumb-frame {
  box-sizing: border-box;
  width: 100%;
  max-width: 22px;
  aspect-ratio: 1;
  padding: 2px;
  border-radius: 2px;
  border: 1px solid #e5e2dc;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.dot-style-thumb-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.dot-style-cell.active .dot-style-thumb-frame {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.dot-style-cell-label {
  font-size: 8px;
  font-weight: 500;
  line-height: 1.12;
  color: var(--color-text-muted);
  text-align: center;
  width: 100%;
  padding: 0;
  word-break: keep-all;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.dot-style-cell.active .dot-style-cell-label {
  color: var(--color-accent);
  font-weight: 600;
}

/* ── 海报背景 + 裁剪同款选框 ─────────────────────────────── */
.qr-poster-file-input {
  display: none;
}

.qr-poster-shell {
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  user-select: none;
  overflow: visible;
  height: auto;
  min-height: 480px;
  cursor: default;
  padding-bottom: var(--spacing-sm);
}

.qr-poster-fit-inner {
  position: relative;
  display: inline-flex;
  line-height: 0;
  max-width: 100%;
}

.qr-poster-img {
  display: block;
  max-width: 100%;
  max-height: 640px;
  width: auto;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.qr-poster-overlay-wrap {
  position: absolute;
  pointer-events: none;
  overflow: visible;
  box-sizing: border-box;
}

.qr-p-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.qr-p-box {
  position: absolute;
  border: 2px solid var(--color-accent);
  cursor: move;
  box-sizing: border-box;
  pointer-events: auto;
  touch-action: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
}

.qr-p-grid {
  position: absolute;
  background: rgba(255, 255, 255, 0.28);
  pointer-events: none;
}

.qr-p-grid-v1 {
  left: 33.33%;
  top: 0;
  width: 1px;
  height: 100%;
}

.qr-p-grid-v2 {
  left: 66.66%;
  top: 0;
  width: 1px;
  height: 100%;
}

.qr-p-grid-h1 {
  top: 33.33%;
  left: 0;
  height: 1px;
  width: 100%;
}

.qr-p-grid-h2 {
  top: 66.66%;
  left: 0;
  height: 1px;
  width: 100%;
}

.qr-p-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border: 2px solid #fff;
  border-radius: 3px;
  pointer-events: auto;
  box-sizing: border-box;
  touch-action: none;
}

.qr-p-handle::after {
  content: '';
  position: absolute;
  inset: -10px;
}

.qr-p-handle-nw {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.qr-p-handle-n {
  top: -5px;
  left: calc(50% - 5px);
  cursor: n-resize;
}

.qr-p-handle-ne {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.qr-p-handle-e {
  top: calc(50% - 5px);
  right: -5px;
  cursor: e-resize;
}

.qr-p-handle-se {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

.qr-p-handle-s {
  bottom: -5px;
  left: calc(50% - 5px);
  cursor: s-resize;
}

.qr-p-handle-sw {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.qr-p-handle-w {
  top: calc(50% - 5px);
  left: -5px;
  cursor: w-resize;
}

.qr-p-box-qr {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.qr-p-box-hint {
  position: relative;
  z-index: 1;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  padding: 6px;
  line-height: 1.35;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.qr-p-label-below {
  position: absolute;
  pointer-events: none;
  color: var(--color-foreground);
  text-align: center;
  word-break: break-all;
  line-height: 1.25;
  font-weight: 500;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.95),
    0 1px 2px rgba(255, 255, 255, 0.85);
}

.qr-poster-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: 8px var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-muted);
  width: 80%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.qr-p-meta-sep {
  opacity: 0.35;
}

.qr-logo-setting-row {
  align-items: flex-start;
}

.qr-logo-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.qr-logo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.qr-logo-file-input {
  display: none;
}

.qr-logo-preview-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.qr-logo-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  background: repeating-conic-gradient(#e8ecf0 0% 25%, #f8fafc 0% 50%) 50% / 10px 10px;
}

.qr-logo-tip {
  font-size: 11px;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.qr-logo-tip-muted {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--color-text-muted);
}
</style>
