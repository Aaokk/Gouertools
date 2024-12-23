<script setup>
import { ref, reactive, onMounted, watch, nextTick, onUnmounted } from 'vue'

// 从 localStorage 获取保存的设置或使用默认值
const getStoredSettings = () => {
  const stored = localStorage.getItem('watermarkSettings')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('解析存储的设置失败:', e)
    }
  }
  return {
    text: "仅用于办理住房公积金，他用无效。",
    color: "#000000",
    rgb: { r: 0, g: 0, b: 0, a: 0.4 },
    fontSize: 23,
    watermarkHeight: 180,
    watermarkWidth: 280,
    angle: -45,
    repeat: true,
    spacing: 100,
    isDragging: false,
    startAngle: 0,
    startX: 0
  }
}

// 初始化水印设置状态
const watermarkSettings = reactive(getStoredSettings())

// 图片相关状态
const imageList = ref([])
const currentImageIndex = ref(0)
const isDragging = ref(false)
const canvasRef = ref(null)

// 初始化水印
onMounted(() => {
  if (canvasRef.value) {
    updateWatermark()
  }
  document.addEventListener('mousemove', handleDragAngle)
  document.addEventListener('mouseup', stopDragAngle)
})

// 更新水印设置
const updateWatermark = () => {
  if (!canvasRef.value || !imageList.value.length) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  // 添加错误处理
  img.onerror = (error) => {
    console.error('图片加载失败:', error)
  }
  
  img.onload = () => {
    console.log('图片加载成功:', img.width, img.height) // 添加日志
    
    // 先设置画布为原始图片大小
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制原始图片
    ctx.drawImage(img, 0, 0)
    
    // 添加水印
    ctx.save()
    ctx.globalAlpha = watermarkSettings.rgb.a
    ctx.fillStyle = `rgba(${watermarkSettings.rgb.r}, ${watermarkSettings.rgb.g}, ${watermarkSettings.rgb.b}, ${watermarkSettings.rgb.a})`
    ctx.font = `${watermarkSettings.fontSize}px Arial`
    
    if (watermarkSettings.repeat) {
      // 计算需要的水印行数和列数
      const cols = Math.ceil(canvas.width / (watermarkSettings.watermarkWidth + watermarkSettings.spacing))
      const rows = Math.ceil(canvas.height / (watermarkSettings.watermarkHeight + watermarkSettings.spacing))
      
      // 绘制重复的水印
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * (watermarkSettings.watermarkWidth + watermarkSettings.spacing)
          const y = row * (watermarkSettings.watermarkHeight + watermarkSettings.spacing)
          
          ctx.save()
          ctx.translate(x + watermarkSettings.watermarkWidth/2, y + watermarkSettings.watermarkHeight/2)
          ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
          ctx.translate(-(watermarkSettings.watermarkWidth/2), -(watermarkSettings.watermarkHeight/2))
          ctx.fillText(watermarkSettings.text, 0, watermarkSettings.fontSize)
          ctx.restore()
        }
      }
    } else {
      // 单个水印
      const x = (canvas.width - watermarkSettings.watermarkWidth) / 2
      const y = (canvas.height - watermarkSettings.watermarkHeight) / 2
      
      ctx.translate(x + watermarkSettings.watermarkWidth/2, y + watermarkSettings.watermarkHeight/2)
      ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
      ctx.translate(-(watermarkSettings.watermarkWidth/2), -(watermarkSettings.watermarkHeight/2))
      ctx.fillText(watermarkSettings.text, 0, watermarkSettings.fontSize)
    }
    
    ctx.restore()
  }
  
  // 确保图片源是有效的
  const currentImage = imageList.value[currentImageIndex.value]
  if (currentImage && currentImage.src) {
    console.log('加载图片:', currentImage.src) // 添加日志
    img.src = currentImage.src
  }
}

// 处理文件上传
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = Array.from(e.dataTransfer.files)
  const imageFiles = files.filter(file => 
    file.type.startsWith('image/') || 
    file.name.match(/\.(jpg|jpeg|png|gif)$/i)
  )
  
  if (imageFiles.length === 0) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const newImage = {
      id: Date.now(),
      src: e.target.result,
      file: imageFiles[0],
      name: imageFiles[0].name
    }
    imageList.value = [newImage]
    currentImageIndex.value = 0
    
    // 确保 DOM 更新后再更新水印
    nextTick(() => {
      updateWatermark()
    })
  }
  reader.readAsDataURL(imageFiles[0])
}

// 旋转水印
const rotate = () => {
  watermarkSettings.angle = (watermarkSettings.angle + 90) % 360
  updateWatermark()
}

// 保存图片
const saveImage = async () => {
  if (!canvasRef.value) return
  
  if (window.electron) {
    try {
      const result = await window.electron.selectDirectory()
      if (!result || !result.filePaths || !result.filePaths[0]) return
      
      const outputDir = result.filePaths[0]
      const dataUrl = canvasRef.value.toDataURL('image/png')
      const fileName = `watermark_${imageList.value[currentImageIndex.value].name}`
      
      await window.electron.saveImage({
        dataUrl,
        path: `${outputDir}/${fileName}`
      })
      
      alert('保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败: ' + error.message)
    }
  } else {
    // 浏览器环境下的保存
    const link = document.createElement('a')
    link.download = `watermark_${imageList.value[currentImageIndex.value].name}`
    link.href = canvasRef.value.toDataURL('image/png')
    link.click()
  }
}

// 添加颜色更新函数
const updateColor = () => {
  // 将十六进制颜色转换为 RGB
  const hex = watermarkSettings.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  watermarkSettings.rgb = {
    ...watermarkSettings.rgb,
    r, g, b
  }
  
  updateWatermark()
}

// 修改监听设置变化
watch([
  () => watermarkSettings.text,
  () => watermarkSettings.color,
  () => watermarkSettings.rgb,
  () => watermarkSettings.fontSize,
  () => watermarkSettings.watermarkHeight,
  () => watermarkSettings.watermarkWidth,
  () => watermarkSettings.angle,
  () => watermarkSettings.repeat,
  () => watermarkSettings.spacing
], () => {
  // 过滤掉不需要保存的临时状态
  const settingsToSave = {
    text: watermarkSettings.text,
    color: watermarkSettings.color,
    rgb: watermarkSettings.rgb,
    fontSize: watermarkSettings.fontSize,
    watermarkHeight: watermarkSettings.watermarkHeight,
    watermarkWidth: watermarkSettings.watermarkWidth,
    angle: watermarkSettings.angle,
    repeat: watermarkSettings.repeat,
    spacing: watermarkSettings.spacing
  }
  localStorage.setItem('watermarkSettings', JSON.stringify(settingsToSave))
  updateWatermark()
}, { deep: true })

// 修改文件选择处理
const handleFileSelect = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  
  input.onchange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // 清空现有图片列表
    imageList.value = []
    currentImageIndex.value = 0
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        imageList.value.push({
          id: Date.now(),
          src: e.target.result,
          file: file,
          name: file.name
        })
        // 如果是第一张图片，更新水印
        if (imageList.value.length === 1) {
          nextTick(() => {
            updateWatermark()
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }
  
  input.click()
}

// 添加角度拖动处理函数
const startDragAngle = (e) => {
  watermarkSettings.isDragging = true
  watermarkSettings.startAngle = watermarkSettings.angle
  watermarkSettings.startX = e.clientX
}

const handleDragAngle = (e) => {
  if (!watermarkSettings.isDragging) return
  
  const deltaX = e.clientX - watermarkSettings.startX
  watermarkSettings.angle = watermarkSettings.startAngle + deltaX
  updateWatermark()
}

const stopDragAngle = () => {
  watermarkSettings.isDragging = false
}

// 在组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragAngle)
  document.removeEventListener('mouseup', stopDragAngle)
})

// 修改重置设置的功能
const resetSettings = () => {
  const defaultSettings = {
    text: "仅用于办理住房公积金，他用无效。",
    color: "#000000",
    rgb: { r: 0, g: 0, b: 0, a: 0.4 },
    fontSize: 23,
    watermarkHeight: 180,
    watermarkWidth: 280,
    angle: -45,
    repeat: true,
    spacing: 100
  }
  
  Object.assign(watermarkSettings, defaultSettings)
  localStorage.removeItem('watermarkSettings')
}
</script>

<template>
  <div class="watermark-editor">
    <div class="main-container">
      <!-- 左侧画布区域 -->
      <div class="canvas-area">
        <div 
          class="drop-zone"
          @dragover.prevent
          @dragenter="isDragging = true"
          @dragleave="isDragging = false"
          @drop="handleDrop"
          :class="{ dragging: isDragging }"
        >
          <canvas 
            ref="canvasRef"
            v-show="imageList.length > 0"
          />
          <div v-show="!imageList.length" class="drop-text">
            拖放图片到这里
          </div>
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="control-panel">
        <div class="button-group">
          <button @click="handleFileSelect">选择文件</button>
          <button v-if="imageList.length" @click="rotate">旋转</button>
          <button v-if="imageList.length" @click="saveImage">保存</button>
          <button @click="resetSettings" class="reset-button">重置设置</button>
        </div>

        <div class="settings-group">
          <div class="setting-item">
            <label>水印文案:</label>
            <input type="text" v-model="watermarkSettings.text" maxlength="130">
          </div>

          <div class="setting-item">
            <label>水印颜色:</label>
            <input type="color" v-model="watermarkSettings.color" @input="updateColor">
          </div>

          <div class="setting-item">
            <label>透明度:</label>
            <input 
              type="range" 
              v-model="watermarkSettings.rgb.a" 
              min="0" 
              max="1" 
              step="0.1"
            >
          </div>

          <div class="setting-item">
            <label>字体大小:</label>
            <input 
              type="range" 
              v-model="watermarkSettings.fontSize" 
              min="12" 
              max="100"
            >
          </div>

          <div class="setting-item">
            <label>水印框宽:</label>
            <input 
              type="range" 
              v-model="watermarkSettings.watermarkWidth" 
              min="100" 
              max="500"
            >
          </div>

          <div class="setting-item">
            <label>水印框高:</label>
            <input 
              type="range" 
              v-model="watermarkSettings.watermarkHeight" 
              min="100" 
              max="500"
            >
          </div>

          <div class="setting-item">
            <label>重复水印:</label>
            <input type="checkbox" v-model="watermarkSettings.repeat">
          </div>
          
          <div class="setting-item" v-if="watermarkSettings.repeat">
            <label>水印间距:</label>
            <input 
              type="range" 
              v-model="watermarkSettings.spacing" 
              min="0" 
              max="300"
            >
            <span>{{ watermarkSettings.spacing }}px</span>
          </div>
          
          <div class="setting-item">
            <label>角度:</label>
            <div class="angle-control">
              <div 
                class="angle-slider"
                @mousedown="startDragAngle"
              >
                <div 
                  class="angle-handle"
                  :style="{ transform: `rotate(${watermarkSettings.angle}deg)` }"
                ></div>
              </div>
              <input 
                type="number" 
                v-model="watermarkSettings.angle"
                min="0"
                max="360"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watermark-editor {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
}

.main-container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.canvas-area {
  flex: 1;
  min-width: 300px;
  height: calc(100vh - 100px);
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
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;
}

.drop-zone.dragging {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
}

.control-panel {
  width: 400px;
  padding: 0 20px;
  flex-shrink: 0;
  overflow-y: auto;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
}

.setting-item label {
  width: 80px;
  flex-shrink: 0;
  white-space: nowrap;
}

.setting-item > :nth-child(2) {
  flex: 1;
  min-width: 0;
}

input[type="text"],
input[type="range"],
input[type="color"] {
  width: 100%;
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

input[type="text"] {
  flex: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input[type="range"] {
  flex: 1;
}

.drop-text {
  font-size: 1.2em;
  color: #666;
  text-align: center;
  padding: 20px;
}

.angle-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.angle-slider {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ccc;
  position: relative;
  cursor: pointer;
}

.angle-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 20px;
  background: #4CAF50;
  transform-origin: bottom center;
  margin-left: -1px;
  margin-top: -20px;
}

input[type="number"] {
  width: 60px;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.reset-button {
  background: #ff4444;
}

.reset-button:hover {
  background: #cc0000;
}
</style> 