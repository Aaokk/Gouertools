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
          <button v-if="qrDataUrl" class="btn btn-secondary btn-sm" @click="downloadPng">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            下载 PNG
          </button>
          <button v-if="qrDataUrl" class="btn btn-ghost btn-sm" @click="downloadSvg">
            下载 SVG
          </button>
        </div>

        <!-- 预览框 -->
        <div class="preview-area qr-preview-area">
          <div v-if="!qrDataUrl" class="qr-placeholder">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01"/></svg>
            <span class="placeholder-text" style="margin-top:16px;">输入内容后点击生成</span>
          </div>
          <div v-else class="qr-result">
            <div class="qr-wrap" :style="qrWrapStyle">
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
          </div>
        </div>

        <!-- 样式设置 -->
        <div class="setting-card">
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
              <label>前景色</label>
              <div class="control" style="display:flex;align-items:center;gap:8px;">
                <div class="color-dot" :style="{ background: settings.fgColor }">
                  <input type="color" v-model="settings.fgColor">
                </div>
                <input class="input" v-model="settings.fgColor" maxlength="7" style="width:86px;">
              </div>
            </div>
            <div class="setting-row">
              <label>背景色</label>
              <div class="control" style="display:flex;align-items:center;gap:8px;">
                <div class="color-dot" :style="{ background: settings.bgColor }">
                  <input type="color" v-model="settings.bgColor">
                </div>
                <input class="input" v-model="settings.bgColor" maxlength="7" style="width:86px;">
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;" @click="generate">
          生成二维码
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import QRCode from 'qrcode'
import { showToast } from '../utils/toast.js'
import { downloadDataUrl, downloadBlob } from '../utils/download.js'

const s1 = ref(true)
const s2 = ref(true)
const qrDataUrl   = ref('')
const qrSvgString = ref('')
const contentType = ref('url')

const settings = reactive({
  content:    'https://gouer.vip',
  size:       400,
  errorLevel: 'M',
  fgColor:    '#000000',
  bgColor:    '#ffffff',
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

const qrWrapStyle = computed(() => ({
  background: settings.bgColor,
  padding:    '16px',
  borderRadius: '8px',
  display:    'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap:        '10px',
}))

const getContent = () => {
  if (contentType.value === 'wifi') {
    return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`
  }
  return settings.content.trim()
}

const generate = async () => {
  const content = getContent()
  if (!content) {
    showToast({ message: '请先输入内容', type: 'info' })
    return
  }
  try {
    qrDataUrl.value = await QRCode.toDataURL(content, {
      width: settings.size,
      errorCorrectionLevel: settings.errorLevel,
      color: { dark: settings.fgColor, light: settings.bgColor },
      margin: 2,
    })
    qrSvgString.value = await QRCode.toString(content, {
      type: 'svg',
      errorCorrectionLevel: settings.errorLevel,
      color: { dark: settings.fgColor, light: settings.bgColor },
      margin: 2,
    })
  } catch (err) {
    showToast({ message: `生成失败：${err.message}`, type: 'error' })
  }
}

const downloadPng = () => {
  downloadDataUrl(qrDataUrl.value, 'qrcode.png')
}

const downloadSvg = () => {
  const blob = new Blob([qrSvgString.value], { type: 'image/svg+xml' })
  downloadBlob(blob, 'qrcode.svg')
}
</script>

<style scoped>
:deep(.tool-body) { padding-top: var(--spacing-md); }
.tool-page { flex: 1; display: flex; flex-direction: column; width: 100%; min-width: 0; }
.preview-stack { min-width: 0; width: 100%; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.qr-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.qr-preview-area {
  display: flex; align-items: center; justify-content: center;
}
.qr-placeholder {
  display: flex; flex-direction: column; align-items: center;
  color: var(--color-text-muted); opacity: 0.5;
}
.qr-result { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.qr-img { display: block; max-width: 100%; max-height: 480px; }
.qr-label-text {
  font-size: 13px; color: var(--color-foreground);
  text-align: center; max-width: 300px; word-break: break-all;
}
.qr-textarea { min-height: 72px; height: auto; resize: vertical; padding: 8px 10px; }

.control-panel { box-sizing: border-box; width: 100%; min-width: 0; overflow-x: hidden; display: flex; flex-direction: column; gap: var(--spacing-md); }
.arrow { transition: transform var(--transition-fast); color: var(--color-text-muted); flex-shrink: 0; }
.arrow.rotated { transform: rotate(-90deg); }
</style>
