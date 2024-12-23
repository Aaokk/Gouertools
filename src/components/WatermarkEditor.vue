<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// 水印设置
const watermarkSettings = reactive({
  text: '示例水印',
  fontSize: 24,
  color: '#000000',
  opacity: 0.5,
  angle: 0,
  x: 50,
  y: 50
})

// 图片列表
const imageList = ref([])
// 当前选中的图片索引
const currentImageIndex = ref(0)
// 拖拽状态
const isDragging = ref(false)

// 添加图片尺寸相关的响应式变量
const imageRef = ref(null)
const previewAreaRef = ref(null)
const scale = ref(1)

// 计算图片缩放比例
const updateScale = () => {
  if (!imageRef.value || !previewAreaRef.value) return
  
  const img = imageRef.value
  const container = previewAreaRef.value
  const containerRatio = container.clientWidth / container.clientHeight
  const imageRatio = img.naturalWidth / img.naturalHeight
  
  if (imageRatio > containerRatio) {
    // 图片更宽，以宽度为准
    scale.value = container.clientWidth / img.naturalWidth * 0.9
  } else {
    // 图片更高，以高度为准
    scale.value = container.clientHeight / img.naturalHeight * 0.9
  }
}

// 监听图片加载完成
const onImageLoad = () => {
  updateScale()
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', updateScale)
  // 设置水印初始位置在中心
  watermarkSettings.x = 100
  watermarkSettings.y = 100
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
})

// 处理文件拖放
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = Array.from(e.dataTransfer.files)
  const imageFiles = files.filter(file => 
    file.type.startsWith('image/') || 
    file.name.match(/\.(jpg|jpeg|png|gif)$/i)
  )
  
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageList.value.push({
        id: Date.now(),
        src: e.target.result,
        file: file,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
}

// 预览水印
const previewWatermark = (ctx, canvas) => {
  ctx.save()
  ctx.globalAlpha = watermarkSettings.opacity
  ctx.fillStyle = watermarkSettings.color
  ctx.font = `${watermarkSettings.fontSize}px Arial`
  
  // 移动到中心点
  ctx.translate(watermarkSettings.x, watermarkSettings.y)
  ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
  
  ctx.fillText(watermarkSettings.text, 0, 0)
  ctx.restore()
}

// 修改计算实际水印位置的函数
const calculateWatermarkPosition = () => {
  if (!imageRef.value) return { x: 0, y: 0 }
  
  const img = imageRef.value
  const imgRect = img.getBoundingClientRect()
  
  // 计算图片的实际显示尺寸与原始尺寸的比例
  const scaleRatio = img.naturalWidth / imgRect.width
  
  // 直接使用比例转换坐标
  return {
    x: watermarkSettings.x * scaleRatio,
    y: watermarkSettings.y * scaleRatio,
    fontSize: watermarkSettings.fontSize * scaleRatio
  }
}

// 修改水印添加函数
const addWatermark = (ctx, img, canvas) => {
  const { x, y, fontSize } = calculateWatermarkPosition()
  
  ctx.save()
  ctx.globalAlpha = watermarkSettings.opacity
  ctx.fillStyle = watermarkSettings.color
  ctx.font = `${Math.round(fontSize)}px Arial`
  
  ctx.translate(x, y)
  ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
  ctx.fillText(watermarkSettings.text, 0, 0)
  
  ctx.restore()
}

// 添加环境检查函数
const isElectron = () => {
  return window && window.electron
}

// 修改保存图片的逻辑
const saveImages = async () => {
  try {
    // 检查是否在 Electron 环境中
    if (!isElectron()) {
      console.log('非 Electron 环境，使用浏览器下载方式')
      // 使用浏览器的下载方式
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      for (const image of imageList.value) {
        const img = new Image()
        img.src = image.src
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            ctx.drawImage(img, 0, 0)
            
            // 使用新的水印添加方法
            addWatermark(ctx, img, canvas)
            
            // 创建下载链接
            const link = document.createElement('a')
            link.download = `watermark_${image.name}`
            link.href = canvas.toDataURL('image/png')
            link.click()
            
            resolve()
          }
        })
      }
      alert('图片已准备下载！')
      return
    }

    // Electron 环境下的保存逻辑
    console.log('Starting save process...')
    const result = await window.electron.selectDirectory()
    console.log('Directory selection result:', result)
    
    if (!result || !result.filePaths || !result.filePaths[0]) {
      console.log('No directory selected')
      return
    }

    const outputDir = result.filePaths[0]
    console.log('Output directory:', outputDir)
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 为每张图片添加水印
    for (const image of imageList.value) {
      try {
        const img = new Image()
        img.src = image.src
        
        await new Promise((resolve, reject) => {
          img.onload = async () => {
            try {
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              ctx.drawImage(img, 0, 0)
              
              // 使用新的水印添加方法
              addWatermark(ctx, img, canvas)
              
              // 导出图片
              const dataUrl = canvas.toDataURL('image/png')
              const fileName = `watermark_${image.name}`
              
              // 保存图片
              await window.electron.saveImage({
                dataUrl,
                path: `${outputDir}/${fileName}`
              })
              
              resolve()
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = reject
        })
      } catch (error) {
        console.error(`处理图片 ${image.name} 失败:`, error)
      }
    }
    
    alert('图片保存成功！')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + (error.message || '未知错误'))
  }
}

// 修改拖动处理函数
const startDrag = (e) => {
  e.preventDefault()
  
  const img = imageRef.value
  const imgRect = img.getBoundingClientRect()
  
  // 计算鼠标相对于图片的偏移
  const offsetX = e.clientX - imgRect.left - watermarkSettings.x
  const offsetY = e.clientY - imgRect.top - watermarkSettings.y

  const moveHandler = (e) => {
    // 计算新位置（相对于图片）
    let newX = e.clientX - imgRect.left - offsetX
    let newY = e.clientY - imgRect.top - offsetY
    
    // 限制水印在图片范围内
    watermarkSettings.x = Math.max(0, Math.min(newX, imgRect.width))
    watermarkSettings.y = Math.max(0, Math.min(newY, imgRect.height))
  }

  const upHandler = () => {
    document.removeEventListener('mousemove', moveHandler)
    document.removeEventListener('mouseup', upHandler)
  }

  document.addEventListener('mousemove', moveHandler)
  document.addEventListener('mouseup', upHandler)
}
</script>

<template>
  <div class="watermark-editor">
    <!-- 顶部设置区域 -->
    <div class="settings-panel">
      <div class="setting-item">
        <label>水印文字:</label>
        <input type="text" v-model="watermarkSettings.text">
      </div>
      <div class="setting-item">
        <label>字体大小:</label>
        <input type="range" v-model="watermarkSettings.fontSize" min="12" max="72">
        <span>{{ watermarkSettings.fontSize }}px</span>
      </div>
      <div class="setting-item">
        <label>颜色:</label>
        <input type="color" v-model="watermarkSettings.color">
      </div>
      <div class="setting-item">
        <label>透明度:</label>
        <input type="range" v-model="watermarkSettings.opacity" min="0" max="1" step="0.1">
      </div>
      <div class="setting-item">
        <label>角度:</label>
        <input type="range" v-model="watermarkSettings.angle" min="0" max="360">
        <span>{{ watermarkSettings.angle }}°</span>
      </div>
    </div>

    <!-- 中间预览区域 -->
    <div 
      ref="previewAreaRef"
      class="preview-area"
      @dragover.prevent
      @dragenter="isDragging = true"
      @dragleave="isDragging = false"
      @drop="handleDrop"
      :class="{ dragging: isDragging }"
    >
      <div v-if="imageList.length === 0" class="drop-zone">
        拖放图片或文件夹到这里
      </div>
      <div v-else class="image-preview">
        <div class="image-container">
          <img 
            ref="imageRef"
            :src="imageList[currentImageIndex]?.src" 
            alt="预览图"
            @load="onImageLoad"
          >
          <div 
            class="watermark-layer"
            :style="{
              transform: `translate(${watermarkSettings.x}px, ${watermarkSettings.y}px) rotate(${watermarkSettings.angle}deg)`,
              color: watermarkSettings.color,
              fontSize: `${watermarkSettings.fontSize}px`,
              opacity: watermarkSettings.opacity
            }"
            @mousedown="startDrag"
          >
            {{ watermarkSettings.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部缩略图区域 -->
    <div class="thumbnail-panel">
      <div 
        v-for="(image, index) in imageList" 
        :key="image.id"
        class="thumbnail"
        :class="{ active: index === currentImageIndex }"
        @click="currentImageIndex = index"
      >
        <img :src="image.src" :alt="image.name">
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="action-panel">
      <button @click="saveImages" :disabled="imageList.length === 0">
        保存图片
      </button>
    </div>
  </div>
</template>

<style scoped>
.watermark-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  gap: 20px;
}

.settings-panel {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-area {
  flex: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 400px;
  padding: 20px;
  max-height: calc(100vh - 300px);
}

.preview-area.dragging {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.drop-zone {
  font-size: 1.2em;
  color: #666;
}

.image-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.image-preview img {
  display: block;
  max-width: min(800px, 100%);
  max-height: min(600px, calc(100vh - 300px));
  width: auto;
  height: auto;
  object-fit: contain;
}

.watermark-layer {
  position: absolute;
  left: 0;
  top: 0;
  cursor: move;
  user-select: none;
  white-space: nowrap;
  pointer-events: auto;
  z-index: 10;
}

.thumbnail-panel {
  height: 120px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.thumbnail {
  width: 100px;
  height: 100px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail.active {
  border-color: #4CAF50;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.action-panel {
  display: flex;
  justify-content: center;
  padding: 10px;
}

button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #45a049;
}
</style> 