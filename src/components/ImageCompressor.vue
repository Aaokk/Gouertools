<template>
    <div>
      <div class="image-compressor">
        <div class="main-container">
          <!-- 左侧预览区域 -->
          <div class="preview-area">
            <div
              class="drop-zone"
              @dragover.prevent
              @dragenter="isDragging = true"
              @dragleave="isDragging = false"
              @drop="handleDrop"
              :class="{ dragging: isDragging }"
              @click="handleFileSelect"
            >
              <div v-if="!previewUrl" class="drop-text">
                <div class="upload-icon">🖼️</div>
                <p>点击或拖拽图片文件到此处</p>
              </div>
              <div v-else class="preview-container">
                <img :src="previewUrl" alt="预览图" class="preview-image" />
                <div class="image-info" v-if="imageInfo">
                  <p>原始大小: {{ formatFileSize(imageInfo.originalSize) }}</p>
                  <p>压缩后: {{ formatFileSize(imageInfo.compressedSize) }}</p>
                  <p>压缩率: {{ imageInfo.compressionRatio }}%</p>
                </div>
              </div>
            </div>
          </div>
  
          <!-- 右侧控制面板 -->
          <div class="control-panel">
            <h1 class="app-title">Gouer.vip 图片压缩</h1>
  
            <div class="button-group">
              <button @click="handleFileSelect">选择文件</button>
              <button v-if="compressedFile" @click="saveImage">保存</button>
              <button @click="resetSettings" class="reset-button">重置设置</button>
            </div>
  
            <div class="settings-group">
              <div class="setting-item">
                <label>压缩质量:</label>
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                  <input
                    type="range"
                    v-model="settings.quality"
                    min="0.1"
                    max="1"
                    step="0.1"
                  >
                  <span style="min-width: 45px;">{{ Math.round(settings.quality * 100) }}%</span>
                </div>
              </div>
  
              <div class="setting-tip">
                提示：压缩质量越低，文件越小，但图片质量也会降低
              </div>
            </div>
          </div>
        </div>
  
        <!-- 修改版权信息 -->
        <Copyright />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, watch } from 'vue'
  import Compressor from 'compressorjs'
  import Copyright from './Copyright.vue'
  
  const isDragging = ref(false)
  const previewUrl = ref('')
  const compressedFile = ref(null)
  const imageInfo = ref(null)
  const originalFile = ref(null)
  
  const settings = reactive({
    quality: 0.8
  })
  
  // 监听质量变化
  watch(() => settings.quality, (newQuality) => {
    if (originalFile.value) {
      handleCompress()
    }
  })
  
  // 处理文件选择
  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        processImage(file)
      }
    }
    input.click()
  }
  
  // 处理拖放
  const handleDrop = (e) => {
    e.preventDefault()
    isDragging.value = false
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      processImage(file)
    }
  }
  
  // 处理图片压缩
  const handleCompress = async () => {
    if (!originalFile.value) return
    await processImage(originalFile.value)
  }
  
  // 处理图片
  const processImage = async (file) => {
    try {
      // 保存原始文件
      originalFile.value = file

      new Compressor(file, {
        quality: Number(settings.quality),
        success(result) {
          compressedFile.value = result
          // 更新预览
          previewUrl.value = URL.createObjectURL(result)
          // 更新信息
          imageInfo.value = {
            originalSize: file.size,
            compressedSize: result.size,
            compressionRatio: Math.round((1 - result.size / file.size) * 100)
          }
        },
        error(err) {
          console.error('压缩失败:', err)
        }
      })
    } catch (error) {
      console.error('压缩失败:', error)
    }
  }
  
  // 保存图片
  const saveImage = () => {
    if (!compressedFile.value) return
    const link = document.createElement('a')
    link.href = previewUrl.value
    link.download = `compressed_${Date.now()}.${compressedFile.value.type.split('/')[1]}`
    link.click()
  }
  
  // 重置设置
  const resetSettings = () => {
    settings.quality = 0.8
    if (originalFile.value) {
      handleCompress()
    }
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  </script>
  
  <style scoped>
  .image-compressor {
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
  
  .preview-area {
    flex: 1;
    min-width: 300px;
    height: calc(80vh - 100px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    /* background: #f5f5f5; */
    border-radius: 8px;
  }
  
  .drop-zone {
  width: 100%;
  height: 100%;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;
}
  
  .drop-zone.dragging {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.1);
  }
  
  .drop-text {
    text-align: center;
    color: #666;
  }
  
  .upload-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }
  
  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .preview-image {
    max-width: 100%;
    max-height: 80%;
    object-fit: contain;
  }
  
  .image-info {
    margin-top: 20px;
    text-align: center;
    color: #666;
  }
  
  .control-panel {
    width: 400px;
    padding: 0 10px;
    flex-shrink: 0;
    overflow-y: auto;
  }
  
  .app-title {
    text-align: center;
    color: #333;
    margin-bottom: 12px;
    font-size: 1.2em;
    padding: 8px 0;
    border-bottom: 2px solid #4CAF50;
  }
  
  .button-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    justify-content: center;
  }
  
  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 26px;
  }
  
  .setting-item label {
    width: 100px;
    flex-shrink: 0;
    white-space: nowrap;
    color: #606266;
    font-size: 14px;
  }
  
  .setting-item > :nth-child(2) {
    flex: 1;
    min-width: 0;
  }
  
  button {
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #45a049;
  }
  
  .reset-button {
    background: #ff4444;
  }
  
  .reset-button:hover {
    background: #cc0000;
  }
  
  input[type="number"] {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    color: #606266;
    height: 32px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }
  
  input[type="number"]:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    opacity: 1;
    height: 24px;
  }
  
  input[type="range"] {
    width: 100%;
    margin: 0;
  }
  
  .setting-tip {
    font-size: 12px;
    color: #909399;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
    line-height: 1.4;
    margin-top: 4px;
  }
  </style> 