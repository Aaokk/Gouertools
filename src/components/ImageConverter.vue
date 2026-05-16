<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip 图片格式转换</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 预览列 -->
      <div class="preview-stack">

        <!-- 操作栏 -->
        <div class="conv-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="triggerFileInput">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择文件
          </button>
          <AnchoredBubbleTip :visible="convertTipVisible" :text="convertTipText">
            <button type="button" class="btn btn-primary btn-sm" @click="handleConvertClick">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              {{ converting ? '转换中…' : '开始转换' }}
            </button>
          </AnchoredBubbleTip>
          <button v-if="selectedFile" class="btn btn-ghost btn-sm" @click="resetAll">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5M20 20v-5h-5M3.51 9a9 9 0 0114.85-3.36L20 7M4 17l1.64 1.36A9 9 0 0020.49 15"/></svg>
            重置
          </button>
        </div>

        <!-- 预览区 -->
        <div
          class="preview-area"
          @click="!selectedFile && triggerFileInput()"
          @drop.prevent="handleDrop"
          @dragover.prevent
          @dragenter.prevent
        >
          <input type="file" @change="handleFileChange" accept="image/*" ref="fileInput" style="display:none">
          <template v-if="!selectedFile">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片文件到此处</span>
            <span class="placeholder-hint">支持 JPG、PNG、WebP、BMP 格式</span>
          </template>
          <img v-else :src="previewUrl" :alt="selectedFile.name" class="preview-image">
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="control-panel">

        <div v-if="selectedFile" class="file-info-card">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>

        <div class="setting-card">
          <div class="setting-card-header" @click="cardOpen = !cardOpen">
            <h4>转换设置</h4>
            <svg class="arrow" :class="{ rotated: !cardOpen }" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="setting-card-body" v-show="cardOpen">
            <div class="setting-row">
              <label>目标格式</label>
              <div class="control">
                <div class="format-btns">
                  <button
                    v-for="fmt in formats"
                    :key="fmt.value"
                    :class="['format-btn', { active: targetFormat === fmt.value }]"
                    @click="targetFormat = fmt.value"
                  >{{ fmt.label }}</button>
                </div>
              </div>
            </div>
            <div class="setting-row" v-if="targetFormat === 'image/jpeg'">
              <label>输出质量</label>
              <div class="control">
                <div class="range-group">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    :value="quality"
                    @input="onQualityInput"
                  >
                  <span class="range-value">{{ quality }}%</span>
                </div>
              </div>
            </div>
            <div class="setting-row">
              <label>分辨率</label>
              <div class="control" style="display:flex;align-items:center;gap:4px;">
                <input class="input" type="number" v-model.number="newWidth" min="1" @input="updateHeight" @change="updatePreview">
                <span style="color:var(--color-text-muted);">×</span>
                <input class="input" type="number" v-model.number="newHeight" min="1" @input="updateWidth" @change="updatePreview">
              </div>
            </div>
            <div class="setting-row">
              <label>保持比例</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="maintainAspectRatio" @change="onAspectToggle">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
            <div class="setting-row">
              <label>大小限制</label>
              <div class="control">
                <label class="toggle">
                  <input type="checkbox" v-model="enableSizeLimit">
                  <span class="toggle-track"></span>
                </label>
              </div>
            </div>
            <div class="setting-row" v-show="enableSizeLimit">
              <label>上限</label>
              <div class="control" style="display:flex;align-items:center;gap:6px;">
                <input class="input" type="number" v-model.number="maxSizeInMB" min="0.1" step="0.1" style="width:80px;" @input="updatePreview" @change="updatePreview">
                <span style="font-size:13px;color:var(--color-text-muted);">MB</span>
              </div>
            </div>
            <div v-if="selectedFile && hasEstimate" class="setting-row">
              <label>预计大小</label>
              <div class="control">
                <span class="estimate-bytes">{{ formatFileSize(estimatedSize) }}</span>
                <span v-if="estimateOverLimit" class="estimate-warn">（已超过上限，开启限制时转换将失败）</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { watch } from 'vue'
import AnchoredBubbleTip from './AnchoredBubbleTip.vue'
import { showToast } from '../utils/toast.js'
import { downloadBlob } from '../utils/download.js'
import { anchoredBubbleExclusiveGen } from '../utils/anchoredBubbleCoordinator.js'

export default {
  name: 'ImageConverter',
  components: { AnchoredBubbleTip },
  data() {
    return {
      selectedFile: null,
      previewUrl: '',
      converting: false,
      targetFormat: 'image/jpeg',
      quality: 90,
      newWidth: 0,
      newHeight: 0,
      originalWidth: 0,
      originalHeight: 0,
      maintainAspectRatio: true,
      enableSizeLimit: false,
      maxSizeInMB: 1,
      estimatedSize: 0,
      hasEstimate: false,
      aspectRatio: 1,
      _previewSeq: 0,
      cardOpen: true,
      convertTipVisible: false,
      convertTipText: '请先选择图片后再转换',
      convertTipLastGen: -1,
      _convertTipTimer: null,
      _stopBubbleGenWatch: null,
      formats: [
        { label: 'JPG',  value: 'image/jpeg' },
        { label: 'PNG',  value: 'image/png'  },
        { label: 'WEBP', value: 'image/webp' }
      ]
    }
  },
  computed: {
    estimateOverLimit() {
      if (!this.enableSizeLimit) return false
      const max = this.maxSizeInMB * 1024 * 1024
      return this.hasEstimate && max > 0 && this.estimatedSize > max
    },
  },
  watch: {
    targetFormat() { this.updatePreview() },
    maxSizeInMB() { this.updatePreview() },
  },
  mounted() {
    this._stopBubbleGenWatch = watch(
      anchoredBubbleExclusiveGen,
      (g) => {
        if (!this.convertTipVisible) return
        if (this.convertTipLastGen !== g) {
          clearTimeout(this._convertTipTimer)
          this.convertTipVisible = false
          this._convertTipTimer = null
        }
      }
    )
  },
  beforeUnmount() {
    clearTimeout(this._convertTipTimer)
    this._stopBubbleGenWatch?.()
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
  },
  methods: {
    triggerFileInput() { this.$refs.fileInput.click() },
    flashConvertTip(msg) {
      const g = anchoredBubbleExclusiveGen.value + 1
      this.convertTipLastGen = g
      anchoredBubbleExclusiveGen.value = g
      if (typeof msg === 'string') this.convertTipText = msg
      this.convertTipVisible = true
      clearTimeout(this._convertTipTimer)
      this._convertTipTimer = setTimeout(() => {
        this.convertTipVisible = false
        this._convertTipTimer = null
      }, 2800)
    },
    handleConvertClick() {
      if (!this.selectedFile) {
        this.flashConvertTip()
        return
      }
      if (this.converting) {
        this.flashConvertTip('转换进行中，请稍候')
        return
      }
      clearTimeout(this._convertTipTimer)
      this.convertTipVisible = false
      this.convertImage()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file && file.type.startsWith('image/')) this.handleImageFile(file)
      else showToast({ message: '请选择图片文件', type: 'info' })
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) this.handleImageFile(file)
      else showToast({ message: '请选择图片文件', type: 'info' })
    },
    async handleImageFile(file) {
      clearTimeout(this._convertTipTimer)
      this.convertTipVisible = false
      this.selectedFile = file
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
      this.previewUrl = URL.createObjectURL(file)
      const img = await this.loadImage(this.previewUrl)
      this.originalWidth = img.width; this.originalHeight = img.height
      this.newWidth = img.width; this.newHeight = img.height
      this.aspectRatio = img.width / img.height
      this.updatePreview()
    },
    updateWidth() {
      if (this.maintainAspectRatio && this.newHeight)
        this.newWidth = Math.round(this.newHeight * this.aspectRatio)
      this.updatePreview()
    },
    updateHeight() {
      if (this.maintainAspectRatio && this.newWidth)
        this.newHeight = Math.round(this.newWidth / this.aspectRatio)
      this.updatePreview()
    },
    onAspectToggle() {
      if (this.maintainAspectRatio && this.newWidth)
        this.newHeight = Math.round(this.newWidth / this.aspectRatio)
      else if (this.maintainAspectRatio && this.newHeight)
        this.newWidth = Math.round(this.newHeight * this.aspectRatio)
      this.updatePreview()
    },
    onQualityInput(e) {
      const v = Number(e.target.value)
      if (!Number.isFinite(v)) return
      this.quality = v
      this.updatePreview()
    },
    async updatePreview() {
      if (!this.selectedFile) return
      const seq = ++this._previewSeq
      try {
        const img = await this.loadImage(this.previewUrl)
        if (seq !== this._previewSeq) return
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = this.newWidth
        canvas.height = this.newHeight
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, this.newWidth, this.newHeight)

        const mime = this.targetFormat
        const encodeQuality = mime === 'image/jpeg' ? this.quality / 100 : undefined
        const blob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), mime, encodeQuality)
        })
        if (seq !== this._previewSeq) return
        if (!blob) return
        this.estimatedSize = blob.size
        this.hasEstimate = true
      } catch (error) {
        console.error('预览更新失败:', error)
      }
    },
    async convertImage() {
      if (!this.selectedFile) return
      this.converting = true
      try {
        const img = await this.loadImage(this.previewUrl)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = this.newWidth
        canvas.height = this.newHeight
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, this.newWidth, this.newHeight)

        const mime = this.targetFormat
        const encodeQuality = mime === 'image/jpeg' ? this.quality / 100 : undefined
        const blob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), mime, encodeQuality)
        })
        if (!blob) throw new Error('导出失败（浏览器未生成文件）')

        const maxBytes = this.maxSizeInMB * 1024 * 1024
        if (this.enableSizeLimit && blob.size > maxBytes) {
          throw new Error(`转换后文件大小(${this.formatFileSize(blob.size)})超过限制(${this.maxSizeInMB}MB)`)
        }

        let extension = mime.split('/')[1] || 'jpg'
        if (extension === 'jpeg') extension = 'jpg'

        const originalName = this.selectedFile.name
        const dotIdx = originalName.lastIndexOf('.')
        const baseName = dotIdx > 0 ? originalName.substring(0, dotIdx) : originalName
        const filename = `${baseName}_${this.newWidth}x${this.newHeight}.${extension}`
        downloadBlob(blob, filename)
      } catch (error) {
        console.error('转换失败:', error)
        showToast({ message: `图片转换失败：${error.message}`, type: 'error' })
      } finally {
        this.converting = false
      }
    },
    loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = url
      })
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    resetAll() {
      clearTimeout(this._convertTipTimer)
      this.convertTipVisible = false
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
      this.selectedFile   = null
      this.previewUrl     = ''
      this.newWidth       = 0
      this.newHeight      = 0
      this.originalWidth  = 0
      this.originalHeight = 0
      this.estimatedSize  = 0
      this.hasEstimate    = false
      this.enableSizeLimit = false
    }
  },
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

/* 与图片压缩页顶部间距对齐 */
:deep(.tool-body) {
  padding-top: var(--spacing-md);
}

/* 预览框上方操作栏 */
.preview-stack {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.conv-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.control-panel {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.arrow {
  transition: transform var(--transition-fast);
  color: var(--color-text-muted);
}
.arrow.rotated {
  transform: rotate(-90deg);
}

.file-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
}
.file-info-card .file-name {
  color: var(--color-foreground);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.file-info-card .file-size {
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-left: var(--spacing-sm);
}

.format-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.format-btn {
  padding: 3px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-body);
  transition: all var(--transition-fast);
  color: var(--color-text-muted);
}
.format-btn:hover {
  border-color: var(--color-secondary);
  color: var(--color-secondary);
  background: var(--color-cyan-dim);
}
.format-btn.active {
  background: var(--color-accent);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 0 10px var(--color-accent-glow);
}

@media (max-width: 900px) {
  .preview-area {
    height: 450px;
  }
}

.estimate-bytes {
  font-size: 13px;
  color: var(--color-accent);
  font-weight: 600;
}
.estimate-warn {
  font-size: 12px;
  color: var(--color-destructive);
  margin-left: 6px;
  font-weight: 500;
}
</style>

<style>
/* 避免与 scoped 冲突：桃杏主题下选中格式用深字（与 .btn-primary 一致） */
html[data-theme='rose'] .format-btn.active {
  color: #3d332f;
}
</style>
