<template>
  <div class="image-converter">
    <div class="main-container">
      <!-- 左侧预览区域 -->
      <div class="preview-container">
        <div
          class="drop-zone"
          @click="triggerFileInput"
          @drop.prevent="handleDrop"
          @dragover.prevent
          @dragenter.prevent
        >
          <input
            type="file"
            @change="handleFileChange"
            accept="image/*"
            ref="fileInput"
            style="display: none"
          >
          <template v-if="!selectedFile">
            <div class="upload-icon">🖼️</div>
            <p>点击或拖拽图片文件到此处</p>
          </template>
          <div v-else class="preview-area">
            <img :src="previewUrl" :alt="selectedFile.name" class="preview-image">
          </div>
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="control-panel">
        <h1 class="panel-title">Gouer.vip 图片格式转换</h1>
        
        <div v-if="selectedFile" class="file-info">
          <p>已选择文件：{{ selectedFile.name }}</p>
          <p class="file-size">原始大小：{{ formatFileSize(selectedFile.size) }}</p>
        </div>

        <div class="settings-group">
          <div class="setting-item">
            <label>目标格式：</label>
            <div class="format-buttons">
              <button
                v-for="format in formats"
                :key="format.value"
                :class="['format-btn', { active: targetFormat === format.value }]"
                @click="targetFormat = format.value"
              >
                {{ format.label }}
              </button>
            </div>
          </div>
          
          <div v-if="targetFormat === 'image/jpeg'" class="setting-item">
            <label>质量：</label>
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="quality" 
                min="1" 
                max="100"
                step="1"
                @input="updatePreview"
              >
              <span class="slider-value">{{ quality }}%</span>
            </div>
          </div>

          <div class="setting-item">
            <label>分辨率：</label>
            <div class="resolution-inputs">
              <input 
                type="number" 
                v-model.number="newWidth" 
                min="1"
                @input="updateHeight"
              >
              <span>×</span>
              <input 
                type="number" 
                v-model.number="newHeight" 
                min="1"
                @input="updateWidth"
              >
              <span>px</span>
            </div>
          </div>

          <div class="setting-item">
            <label>保持比例：</label>
            <input type="checkbox" v-model="maintainAspectRatio">
          </div>

          <div class="setting-item">
            <label>大小限制：</label>
            <div class="size-inputs">
              <input 
                type="number" 
                v-model.number="maxSizeInMB" 
                min="0.1" 
                step="0.1"
              >
              <span>MB</span>
            </div>
          </div>

          <div v-if="estimatedSize" class="setting-item estimated-size">
            <label>预计大小：</label>
            <span>{{ formatFileSize(estimatedSize) }}</span>
          </div>
        </div>

        <div class="actions">
          <button @click="triggerFileInput" class="select-btn">
            选择文件
          </button>
          <button @click="convertImage" class="convert-btn" :disabled="converting || !selectedFile">
            {{ converting ? '转换中...' : '开始转换' }}
          </button>
        </div>
      </div>
    </div>
    <Copyright />
  </div>
</template>

<script>
import Copyright from './Copyright.vue'

export default {
  name: 'ImageConverter',
  components: {
    Copyright
  },
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
      maxSizeInMB: 1,
      estimatedSize: 0,
      aspectRatio: 1,
      formats: [
        { label: 'JPG', value: 'image/jpeg' },
        { label: 'PNG', value: 'image/png' },
        { label: 'WEBP', value: 'image/webp' },
        { label: 'GIF', value: 'image/gif' }
      ]
    }
  },
  watch: {
    targetFormat() {
      this.updatePreview()
    },
    maxSizeInMB() {
      this.updatePreview()
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file && file.type.startsWith('image/')) {
        this.handleImageFile(file)
      } else {
        alert('请选择图片文件')
      }
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.handleImageFile(file)
      } else {
        alert('请选择图片文件')
      }
    },
    async handleImageFile(file) {
      this.selectedFile = file
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }
      this.previewUrl = URL.createObjectURL(file)

      // 获取图片原始尺寸
      const img = await this.loadImage(this.previewUrl)
      this.originalWidth = img.width
      this.originalHeight = img.height
      this.newWidth = img.width
      this.newHeight = img.height
      this.aspectRatio = img.width / img.height

      this.updatePreview()
    },
    updateWidth() {
      if (this.maintainAspectRatio && this.newHeight) {
        this.newWidth = Math.round(this.newHeight * this.aspectRatio)
      }
      this.updatePreview()
    },
    updateHeight() {
      if (this.maintainAspectRatio && this.newWidth) {
        this.newHeight = Math.round(this.newWidth / this.aspectRatio)
      }
      this.updatePreview()
    },
    async updatePreview() {
      if (!this.selectedFile) return
      
      try {
        const img = await this.loadImage(this.previewUrl)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = this.newWidth
        canvas.height = this.newHeight
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, this.newWidth, this.newHeight)
        
        // 根据当前质量设置生成预览
        const options = this.targetFormat === 'image/jpeg' ? { quality: this.quality / 100 } : undefined
        const dataUrl = canvas.toDataURL(this.targetFormat, options)
        
        // 估算转换后的文件大小
        const base64str = dataUrl.split(',')[1]
        const decoded = atob(base64str)
        this.estimatedSize = decoded.length
        
        // 如果预计大小超过限制，自动调整质量
        if (this.targetFormat === 'image/jpeg' && this.estimatedSize > this.maxSizeInMB * 1024 * 1024) {
          let tempQuality = this.quality
          while (tempQuality > 10 && this.estimatedSize > this.maxSizeInMB * 1024 * 1024) {
            tempQuality -= 5
            const newDataUrl = canvas.toDataURL(this.targetFormat, { quality: tempQuality / 100 })
            const newBase64str = newDataUrl.split(',')[1]
            const newSize = atob(newBase64str).length
            if (newSize <= this.maxSizeInMB * 1024 * 1024) {
              this.estimatedSize = newSize
              if (tempQuality !== this.quality) {
                this.quality = tempQuality
              }
              break
            }
            this.estimatedSize = newSize
          }
        }
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
        
        const options = this.targetFormat === 'image/jpeg' ? { quality: this.quality / 100 } : undefined
        const dataUrl = canvas.toDataURL(this.targetFormat, options)
        
        // 检查文件大小是否超过限制
        const base64str = dataUrl.split(',')[1]
        const fileSize = atob(base64str).length
        if (fileSize > this.maxSizeInMB * 1024 * 1024) {
          throw new Error(`转换后文件大小(${this.formatFileSize(fileSize)})超过限制(${this.maxSizeInMB}MB)`)
        }
        
        const link = document.createElement('a')
        link.href = dataUrl
        
        const extension = this.targetFormat.split('/')[1]
        const originalName = this.selectedFile.name
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'))
        link.download = `${baseName}_${this.newWidth}x${this.newHeight}.${extension}`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
      } catch (error) {
        console.error('转换失败:', error)
        alert('图片转换失败: ' + error.message)
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
    }
  },
  beforeUnmount() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
  }
}
</script>

<style scoped>
.image-converter {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

.main-container {
  display: flex;
  gap: 20px;
  height: 100%;
  padding-bottom: 40px;
}

.preview-container {
  flex: 1;
  min-width: 300px;
  height: calc(80vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.drop-zone {
  width: 100%;
  height: 100%;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  cursor: pointer;
  transition: border-color 0.3s ease;
  padding: 20px;
}

.drop-zone:hover {
  border-color: #409EFF;
}

.preview-area {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.control-panel {
  width: 400px;
  padding: 0 10px;
  flex-shrink: 0;
  overflow-y: auto;
}

.panel-title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 1.2em;
  padding: 8px 0;
  border-bottom: 2px solid #409EFF;
}

.file-info {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.file-size {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item label {
  min-width: 80px;
  text-align: right;
  color: #606266;
}

.setting-item select,
.setting-item input[type="number"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
}

.format-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
}

.format-btn {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.format-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.format-btn.active {
  background: #409EFF;
  color: white;
  border-color: #409EFF;
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-container input[type="range"] {
  flex: 1;
}

.slider-value {
  min-width: 45px;
  text-align: right;
  color: #606266;
}

.resolution-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.resolution-inputs input {
  width: 70px;
}

.resolution-inputs span {
  color: #606266;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
}

.size-inputs input {
  width: 80px;
}

.estimated-size {
  color: #409EFF;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.select-btn {
  padding: 8px 16px;
  background: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.select-btn:hover {
  background: #66b1ff;
}

.convert-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.convert-btn:hover:not(:disabled) {
  background: #45a049;
}

.convert-btn:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
</style> 