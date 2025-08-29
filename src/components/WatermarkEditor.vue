<template>
  <div>
    <div class="watermark-editor">
      <div class="main-container">
        <!-- 左侧区域 - 包含画布和文件列表 -->
        <div class="left-area">
          <!-- 画布区域 -->
          <div class="canvas-area">
            <div
                class="drop-zone"
                @dragover.prevent
                @dragenter="isDragging = true"
                @dragleave="isDragging = false"
                @drop="handleDrop"
                @click="!imageList.length && handleFileSelect()"
                :class="{ dragging: isDragging, clickable: !imageList.length }"
            >
              <canvas
                  ref="canvasRef"
                  v-show="imageList.length > 0"
                  @mousedown="startWatermarkDrag"
                  style="cursor: move;"
              />
              <div v-show="!imageList.length" class="drop-text">
                <div class="upload-icon">🖼️</div>
                <p>点击或拖拽图片文件到此处</p>
              </div>
            </div>
          </div>

          <!-- 多文件列表显示 - 在画布底部 -->
          <div v-if="imageList.length > 1" class="file-list-bottom">
            <h3>已选择 {{ imageList.length }} 个文件：</h3>
            <div class="file-items">
              <div
                v-for="(image, index) in imageList"
                :key="image.id"
                :class="['file-item', { active: index === currentImageIndex }]"
                @click="switchToImage(index)"
              >
                <div class="file-preview">
                  <img :src="image.src" :alt="image.name" class="file-thumbnail">
                </div>
                <div class="file-info">
                  <span class="file-name">{{ image.name }}</span>
                  <button @click.stop="removeImage(index)" class="remove-btn">删除</button>
                </div>
              </div>
            </div>
            <div class="navigation-buttons">
              <button @click="previousImage" :disabled="currentImageIndex === 0">上一张</button>
              <span class="current-info">{{ currentImageIndex + 1 }} / {{ imageList.length }}</span>
              <button @click="nextImage" :disabled="currentImageIndex === imageList.length - 1">下一张</button>
            </div>
          </div>
        </div>

        <!-- 右侧控制板 -->
        <div class="control-panel">
          <h1 class="app-title">Gouer.vip 图片加水印</h1>

          <div class="button-group">
            <button @click="handleFileSelect">选择文件</button>
            <button v-if="imageList.length" @click="saveImage">保存当前图片</button>
            <button v-if="imageList.length > 1" @click="saveAllImages" class="save-all-button">批量保存</button>
            <button v-if="imageList.length" @click="clearImageList" class="clear-button">清理列表</button>
            <button @click="resetSettings" class="reset-button">重置设置</button>
          </div>

          <div class="settings-group">
            <div class="setting-item">
              <label>配置模式:</label>
              <div class="mode-switch">
                <label class="switch-label">
                  <input
                    type="checkbox"
                    v-model="watermarkSettings.useProportionalMode"
                    @change="updateWatermark"
                  />
                  <span class="switch-text">
                    {{ watermarkSettings.useProportionalMode ? '比例模式' : '固定模式' }}
                  </span>
                </label>
                <div class="setting-tip">
                  {{ watermarkSettings.useProportionalMode ? '水印大小根据图片尺寸自动调整' : '使用固定像素值' }}
                </div>
              </div>
            </div>

            <div class="setting-item">
              <label>水印文字:</label>
              <input type="text" v-model="watermarkSettings.text" maxlength="130">
            </div>

            <!-- 添加提示文本 -->
            <div class="setting-tip">
              提示：可以在左侧预览窗口拖动水印位置
            </div>

            <template v-if="imageList.length > 0">
              <div class="setting-item">
                <label>添加LOGO:</label>
                <div class="logo-controls">
                  <button @click="handleLogoSelect" class="small-button">选择LOGO</button>
                  <select v-model="logoSettings.position" class="position-select">
                    <option value="top-left">左上角</option>
                    <option value="top-right">右上角</option>
                    <option value="bottom-left">左下角</option>
                    <option value="bottom-right">右下角</option>
                  </select>
                  <button
                      v-if="logoSettings.image"
                      @click="clearLogo"
                      class="small-button danger"
                  >清除</button>
                </div>
              </div>

              <div class="setting-item" v-if="logoSettings.image">
                <label>LOGO大小:</label>
                <input
                    type="range"
                    v-model="logoSettings.size"
                    min="20"
                    max="200"
                    @input="updateWatermark"
                >
                <span>{{ logoSettings.size }}px</span>
              </div>

              <div class="setting-item" v-if="logoSettings.image">
                <label>LOGO边距:</label>
                <input
                    type="range"
                    v-model="logoSettings.padding"
                    min="0"
                    max="100"
                    @input="updateWatermark"
                >
                <span>{{ logoSettings.padding }}px</span>
              </div>

              <div class="setting-item" v-if="logoSettings.image">
                <label>LOGO透明:</label>
                <input
                    type="range"
                    v-model="logoSettings.opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    @input="updateWatermark"
                >
                <span>{{ Math.round(logoSettings.opacity * 100) }}%</span>
              </div>
            </template>

            <div class="setting-item">
              <label>水印颜色:</label>
              <div class="color-picker-container">
                <div
                    class="color-preview"
                    @click="toggleColorPicker"
                    :style="{ backgroundColor: watermarkSettings.color }"
                ></div>
                <div
                    v-if="showColorPicker"
                    class="color-picker-popup"
                >
                  <Chrome
                      v-model="watermarkSettings.color"
                      :value="watermarkSettings.color"
                      @update:modelValue="updateColor"
                  />
                </div>
              </div>
            </div>

            <div class="setting-item">
              <label>水印透明:</label>
              <input
                  type="range"
                  v-model="watermarkSettings.rgb.a"
                  min="0"
                  max="1"
                  step="0.1"
              >
            </div>

            <!-- 字体大小控制 - 根据模式显示不同控制 -->
            <div class="setting-item" v-if="!watermarkSettings.useProportionalMode">
              <label>字体大小:</label>
              <input
                  type="range"
                  v-model="watermarkSettings.fontSize"
                  min="12"
                  max="100"
              >
              <span class="value-display">{{ watermarkSettings.fontSize }}px</span>
            </div>

            <div class="setting-item" v-else>
              <label>字体比例:</label>
              <input
                  type="range"
                  v-model="watermarkSettings.fontSizeRatio"
                  min="0.01"
                  max="0.1"
                  step="0.005"
              >
              <span class="value-display">{{ (watermarkSettings.fontSizeRatio * 100).toFixed(1) }}%</span>
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

            <!-- 水印间距控制 - 根据模式显示不同控制 -->
            <div class="setting-item" v-if="watermarkSettings.repeat && !watermarkSettings.useProportionalMode">
              <label>水印间距:</label>
              <input
                  type="range"
                  v-model="watermarkSettings.spacing"
                  min="0"
                  max="300"
              >
              <span class="value-display">{{ watermarkSettings.spacing }}px</span>
            </div>

            <div class="setting-item" v-if="watermarkSettings.repeat && watermarkSettings.useProportionalMode">
              <label>间距比例:</label>
              <input
                  type="range"
                  v-model="watermarkSettings.spacingRatio"
                  min="0"
                  max="0.2"
                  step="0.01"
              >
              <span class="value-display">{{ (watermarkSettings.spacingRatio * 100).toFixed(1) }}%</span>
            </div>

            <div class="setting-item">
              <label>重复水印:</label>
              <input type="checkbox" v-model="watermarkSettings.repeat">
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
                <button
                    v-if="imageList.length"
                    @click="rotate"
                    class="rotate-button"
                >旋转90°</button>
              </div>
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
import { Chrome } from '@ckpack/vue-color'
import { ref, reactive, onMounted, watch, nextTick, onUnmounted } from 'vue'
import Copyright from './Copyright.vue'

// 从 localStorage 获取保存的设置或使用默认值
const getStoredSettings = () => {
  const defaultSettings = {
    text: "+++ 输入你要添加的水印文字 +++",
    color: "#000000",
    rgb: {r: 0, g: 0, b: 0, a: 0.6},
    fontSize: 12,
    watermarkHeight: 100,
    watermarkWidth: 100,
    angle: -45,
    repeat: true,
    spacing: 0,
    // 新增：比例模式配置
    useProportionalMode: true, // 是否使用比例模式
    fontSizeRatio: 0.03, // 字体大小相对于图片宽度的比例 (3%)
    spacingRatio: 0.05, // 间距相对于图片宽度的比例 (5%)
    watermarkHeightRatio: 0.15, // 水印高度相对于图片高度的比例 (15%)
    watermarkWidthRatio: 0.25 // 水印宽度相对于图片宽度的比例 (25%)
  }

  const stored = localStorage.getItem('watermarkSettings')
  if (stored) {
    try {
      const settings = JSON.parse(stored)
      // 合并默认设置和存储的设置，确保所有属性都存在
      const mergedSettings = {
        ...defaultSettings,
        ...settings,
        // 确保 rgb 对象的完整性
        rgb: { ...defaultSettings.rgb, ...settings.rgb }
      }

      // 确保数值类型的正确性
      mergedSettings.fontSize = parseInt(mergedSettings.fontSize) || defaultSettings.fontSize
      mergedSettings.watermarkHeight = parseInt(mergedSettings.watermarkHeight) || defaultSettings.watermarkHeight
      mergedSettings.watermarkWidth = parseInt(mergedSettings.watermarkWidth) || defaultSettings.watermarkWidth
      mergedSettings.spacing = parseInt(mergedSettings.spacing) || defaultSettings.spacing
      mergedSettings.angle = parseFloat(mergedSettings.angle) || defaultSettings.angle

      // 恢复 LOGO 配置（不包括图片数据）
      if (settings.logoConfig) {
        logoSettings.position = settings.logoConfig.position || 'top-right'
        logoSettings.size = parseInt(settings.logoConfig.size) || 100
        logoSettings.padding = parseInt(settings.logoConfig.padding) || 20
        logoSettings.opacity = parseFloat(settings.logoConfig.opacity) || 0.6
      }

      return mergedSettings
    } catch (e) {
      console.error('解析存储的设置失败:', e)
      return defaultSettings
    }
  }
  return defaultSettings
}

// 初始化水印设置状态
const watermarkSettings = reactive(getStoredSettings())

// 图片相关状态
const imageList = ref([])
const currentImageIndex = ref(0)
const isDragging = ref(false)
const canvasRef = ref(null)

// 添加水印拖动相关的状态
const watermarkDragging = ref(false)
const watermarkStartPos = ref({ x: 0, y: 0 })
const watermarkOffset = reactive({ x: 100, y: 100 }) // 水印的初始位置

// 添加颜色选择器显示状态
const showColorPicker = ref(false)
const colorPickerPosition = reactive({ top: '0px', left: '0px' })

// 添加 LOGO 相关状态
const logoSettings = reactive({
  image: null,
  position: 'top-right',
  size: 36,
  padding: 20,
  opacity: 0.6,
  aspectRatio: 1,
  originalWidth: 0,
  originalHeight: 0
})

// 初始化水印
onMounted(() => {
  if (canvasRef.value) {
    updateWatermark()
  }
  document.addEventListener('mousemove', handleDragAngle)
  document.addEventListener('mouseup', stopDragAngle)
  document.addEventListener('mousemove', handleWatermarkDrag)
  document.addEventListener('mouseup', stopWatermarkDrag)
  document.addEventListener('click', handleClickOutside)
})

// 计算实际水印参数（基于图片尺寸和配置模式）
const calculateWatermarkParams = (imageWidth, imageHeight) => {
  if (watermarkSettings.useProportionalMode) {
    return {
      fontSize: Math.max(12, Math.round(imageWidth * watermarkSettings.fontSizeRatio)),
      spacing: Math.round(imageWidth * watermarkSettings.spacingRatio),
      watermarkHeight: Math.round(imageHeight * watermarkSettings.watermarkHeightRatio),
      watermarkWidth: Math.round(imageWidth * watermarkSettings.watermarkWidthRatio)
    }
  } else {
    return {
      fontSize: watermarkSettings.fontSize,
      spacing: watermarkSettings.spacing,
      watermarkHeight: watermarkSettings.watermarkHeight,
      watermarkWidth: watermarkSettings.watermarkWidth
    }
  }
}

// 创建优化的PNG数据URL，确保预览正常
const createOptimizedDataURL = (canvas, format, quality) => {
  if (format === 'image/png') {
    // 对于PNG，创建一个临时canvas确保背景正确
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    // 填充白色背景
    tempCtx.fillStyle = '#FFFFFF'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // 绘制原始canvas内容
    tempCtx.drawImage(canvas, 0, 0)

    return tempCanvas.toDataURL('image/png')
  } else {
    return canvas.toDataURL(format, quality)
  }
}

// 更新水印设置
const updateWatermark = () => {
  if (!canvasRef.value || !imageList.value.length) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const logo = logoSettings.image ? new Image() : null

  // 创建一个 Promise 来处理图片加载
  const loadImages = () => {
    return new Promise((resolve) => {
      img.onload = () => {
        if (logo) {
          logo.onload = resolve
          logo.src = logoSettings.image
        } else {
          resolve()
        }
      }

      const currentImage = imageList.value[currentImageIndex.value]
      if (currentImage && currentImage.src) {
        img.src = currentImage.src
      }
    })
  }

  // 使用 async/await 处理图片加载和绘制
  loadImages().then(() => {
    // 设置画布大小
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // 计算当前图片的实际水印参数
    const actualParams = calculateWatermarkParams(canvas.width, canvas.height)

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 对于PNG图片，先填充白色背景以确保预览正常
    const currentImage = imageList.value[currentImageIndex.value]
    if (currentImage && currentImage.name.toLowerCase().endsWith('.png')) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 绘制原始图片
    ctx.drawImage(img, 0, 0)

    // 绘制水印
    ctx.save()
    ctx.globalAlpha = watermarkSettings.rgb.a
    ctx.fillStyle = `rgba(${watermarkSettings.rgb.r}, ${watermarkSettings.rgb.g}, ${watermarkSettings.rgb.b}, ${watermarkSettings.rgb.a})`
    ctx.font = `${actualParams.fontSize}px Arial`

    if (watermarkSettings.repeat) {
      // 计算水印网格的总宽度和高度（使用实际参数）
      const gridWidth = Math.max(actualParams.watermarkWidth, actualParams.fontSize * watermarkSettings.text.length)
      const gridHeight = Math.max(actualParams.watermarkHeight, actualParams.fontSize * 1.5)
      const spacing = parseInt(actualParams.spacing)

      // 计算实际的网格大小（包含间距）
      const cellWidth = gridWidth + spacing
      const cellHeight = gridHeight + spacing

      // 计算需要的水印行列数
      const cols = Math.ceil(canvas.width / cellWidth) + 2
      const rows = Math.ceil(canvas.height / cellHeight) + 2

      // 计算起始偏移，使用模运算确保水印位置循环
      const offsetX = ((watermarkOffset.x % cellWidth) + cellWidth) % cellWidth - cellWidth
      const offsetY = ((watermarkOffset.y % cellHeight) + cellHeight) % cellHeight - cellHeight

      // 绘制水印网格
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = offsetX + col * cellWidth
          const y = offsetY + row * cellHeight

          ctx.save()
          ctx.translate(x + gridWidth/2, y + gridHeight/2)
          ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
          const textWidth = ctx.measureText(watermarkSettings.text).width
          ctx.fillText(watermarkSettings.text, -textWidth/2, watermarkSettings.fontSize/3)
          ctx.restore()
        }
      }
    } else {
      // 单个水印，默认居中显示（使用实际参数）
      const textWidth = ctx.measureText(watermarkSettings.text).width
      const textHeight = actualParams.fontSize * 1.5

      // 如果是首次显示或重置后将水印位置设置到中心
      if (watermarkOffset.x === 100 && watermarkOffset.y === 100) {
        watermarkOffset.x = canvas.width / 2
        watermarkOffset.y = canvas.height / 2
      }

      ctx.save()
      ctx.translate(watermarkOffset.x, watermarkOffset.y)
      ctx.rotate((watermarkSettings.angle * Math.PI) / 180)
      ctx.fillText(watermarkSettings.text, -textWidth/2, watermarkSettings.fontSize/3)
      ctx.restore()
    }

    ctx.restore()

    // 绘制 LOGO
    if (logo) {
      const padding = logoSettings.padding
      const baseSize = logoSettings.size
      let width, height

      // 根据原始宽高比计算实际尺寸
      if (logoSettings.aspectRatio > 1) {
        width = baseSize
        height = baseSize / logoSettings.aspectRatio
      } else {
        height = baseSize
        width = baseSize * logoSettings.aspectRatio
      }

      let x, y

      switch (logoSettings.position) {
        case 'top-left':
          x = padding
          y = padding
          break
        case 'top-right':
          x = canvas.width - width - padding
          y = padding
          break
        case 'bottom-left':
          x = padding
          y = canvas.height - height - padding
          break
        case 'bottom-right':
          x = canvas.width - width - padding
          y = canvas.height - height - padding
          break
      }

      // 设置抗锯齿
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.save()
      ctx.globalAlpha = logoSettings.opacity
      ctx.drawImage(logo, x, y, width, height)
      ctx.restore()
    }
  })
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
      // 获取当前图片的文件名和类型
      const currentImage = imageList.value[currentImageIndex.value]
      const originalName = currentImage.name
      const originalType = currentImage.file.type || 'image/jpeg'

      // 生成时间戳的新文件名
      const now = new Date()
      const timestamp = now.getFullYear() +
          ('0' + (now.getMonth() + 1)).slice(-2) +
          ('0' + now.getDate()).slice(-2) +
          '_' +
          ('0' + now.getHours()).slice(-2) +
          ('0' + now.getMinutes()).slice(-2) +
          ('0' + now.getSeconds()).slice(-2)

      // 分离文件名和扩展名
      const lastDotIndex = originalName.lastIndexOf('.')
      const nameWithoutExt = originalName.substring(0, lastDotIndex)
      const extension = originalName.substring(lastDotIndex)

      // 构建新的文件名
      const suggestedName = `${nameWithoutExt}_${timestamp}${extension}`

      // 获取画布数据，使用优化函数确保PNG预览正常
      const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.92)

      // 调用保存文件对话框
      const savePath = await window.electron.saveFile(suggestedName)
      if (!savePath) return

      // 保存图片
      await window.electron.saveImage({
        dataUrl,
        path: savePath
      })

      alert('保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败: ' + error.message)
    }
  } else {
    // 浏览器环境下的保存
    const currentImage = imageList.value[currentImageIndex.value]
    const originalType = currentImage.file.type || 'image/jpeg'
    const now = new Date()
    const timestamp = now.getFullYear() +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2) +
        '_' +
        ('0' + now.getHours()).slice(-2) +
        ('0' + now.getMinutes()).slice(-2) +
        ('0' + now.getSeconds()).slice(-2)

    const lastDotIndex = currentImage.name.lastIndexOf('.')
    const nameWithoutExt = currentImage.name.substring(0, lastDotIndex)
    const extension = currentImage.name.substring(lastDotIndex)
    const fileName = `${nameWithoutExt}_${timestamp}${extension}`

    const link = document.createElement('a')
    link.download = fileName

    // 使用优化函数确保PNG预览正常
    link.href = createOptimizedDataURL(canvasRef.value, originalType, 0.92)

    link.click()
  }
}

// 修改颜色更新函数
const updateColor = (color) => {
  // 更新十六进制颜色值
  watermarkSettings.color = color.hex

  // 更新 RGB 值
  watermarkSettings.rgb = {
    ...watermarkSettings.rgb,
    r: color.rgba.r,
    g: color.rgba.g,
    b: color.rgba.b
  }

  updateWatermark()
}

// 修改颜色选择器显示/隐藏处理函数
const toggleColorPicker = (event) => {
  const rect = event.target.getBoundingClientRect()
  const popup = document.querySelector('.color-picker-popup')
  if (popup) {
    popup.style.transform = `translate(${rect.left}px, ${rect.bottom + 5}px)`
  }
  showColorPicker.value = !showColorPicker.value
}

// 添加点击外部关闭颜色选择器
const handleClickOutside = (event) => {
  if (showColorPicker.value && !event.target.closest('.color-picker-container')) {
    showColorPicker.value = false
  }
}

// 修改监听置变
watch([
  () => watermarkSettings.text,
  () => watermarkSettings.color,
  () => watermarkSettings.rgb,
  () => watermarkSettings.fontSize,
  () => watermarkSettings.watermarkHeight,
  () => watermarkSettings.watermarkWidth,
  () => watermarkSettings.angle,
  () => watermarkSettings.repeat,
  () => watermarkSettings.spacing,
  () => watermarkSettings.useProportionalMode,
  () => watermarkSettings.fontSizeRatio,
  () => watermarkSettings.spacingRatio,
  () => watermarkSettings.watermarkHeightRatio,
  () => watermarkSettings.watermarkWidthRatio
], (newValues, oldValues) => {
  // 查是否是 repeat 值发生变化
  const repeatIndex = 7 // repeat 在数组中的索引
  if (newValues[repeatIndex] !== oldValues[repeatIndex]) {
    // 如果从重复切换到单个水印，重置位置到中心
    if (!newValues[repeatIndex] && canvasRef.value) {
      watermarkOffset.x = canvasRef.value.width / 2
      watermarkOffset.y = canvasRef.value.height / 2
    }
  }

  // 保存设置的逻辑保持不变
  const settingsToSave = {
    text: watermarkSettings.text,
    color: watermarkSettings.color,
    rgb: watermarkSettings.rgb,
    fontSize: watermarkSettings.fontSize,
    watermarkHeight: watermarkSettings.watermarkHeight,
    watermarkWidth: watermarkSettings.watermarkWidth,
    angle: watermarkSettings.angle,
    repeat: watermarkSettings.repeat,
    spacing: watermarkSettings.spacing,
    // 新增比例模式参数
    useProportionalMode: watermarkSettings.useProportionalMode,
    fontSizeRatio: watermarkSettings.fontSizeRatio,
    spacingRatio: watermarkSettings.spacingRatio,
    watermarkHeightRatio: watermarkSettings.watermarkHeightRatio,
    watermarkWidthRatio: watermarkSettings.watermarkWidthRatio,
    // 添加 LOGO 设置
    logoSettings: {
      image: logoSettings.image,
      position: logoSettings.position,
      size: logoSettings.size,
      padding: logoSettings.padding,
      opacity: logoSettings.opacity
    }
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

    // 清空现有图片表
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
        // 如果是第一张图片，更水印
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

// 切换到指定图片
const switchToImage = (index) => {
  if (index >= 0 && index < imageList.value.length) {
    currentImageIndex.value = index
    nextTick(() => {
      updateWatermark()
    })
  }
}

// 删除指定图片
const removeImage = (index) => {
  if (imageList.value.length <= 1) {
    // 如果只有一张图片，清空所有
    imageList.value = []
    currentImageIndex.value = 0
    return
  }

  imageList.value.splice(index, 1)

  // 调整当前索引
  if (currentImageIndex.value >= imageList.value.length) {
    currentImageIndex.value = imageList.value.length - 1
  } else if (currentImageIndex.value > index) {
    currentImageIndex.value--
  }

  nextTick(() => {
    updateWatermark()
  })
}

// 上一张图片
const previousImage = () => {
  if (currentImageIndex.value > 0) {
    switchToImage(currentImageIndex.value - 1)
  }
}

// 下一张图片
const nextImage = () => {
  if (currentImageIndex.value < imageList.value.length - 1) {
    switchToImage(currentImageIndex.value + 1)
  }
}

// 批量保存所有图片
const saveAllImages = async () => {
  if (!canvasRef.value || imageList.value.length === 0) return

  if (window.electron) {
    try {
      // 选择保存目录
      const result = await window.electron.selectDirectory()
      if (!result || result.canceled) return

      const saveDir = result.filePaths[0]
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < imageList.value.length; i++) {
        try {
          console.log(`开始处理第 ${i + 1} 张图片...`)

          // 切换到当前图片
          currentImageIndex.value = i
          await new Promise(resolve => {
            nextTick(() => {
              updateWatermark()
              setTimeout(resolve, 200) // 增加等待时间确保渲染完成
            })
          })

          // 获取当前图片信息
          const currentImage = imageList.value[i]
          if (!currentImage) {
            throw new Error(`无法获取第 ${i + 1} 张图片信息`)
          }

          console.log(`处理图片: ${currentImage.name}`)

          const originalName = currentImage.name
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
          const extension = originalName.substring(originalName.lastIndexOf('.')) || '.jpg'

          // 生成文件名
          const now = new Date()
          const timestamp = now.getFullYear() +
              ('0' + (now.getMonth() + 1)).slice(-2) +
              ('0' + now.getDate()).slice(-2) +
              ('0' + now.getHours()).slice(-2) +
              ('0' + now.getMinutes()).slice(-2) +
              ('0' + now.getSeconds()).slice(-2) +
              ('0' + now.getMilliseconds()).slice(-3) // 添加毫秒避免重名

          const fileName = `${nameWithoutExt}_watermark_${timestamp}${extension}`
          const filePath = `${saveDir}/${fileName}`

          // 检查canvas是否有内容
          if (!canvasRef.value) {
            throw new Error('Canvas未初始化')
          }

          // 保存图片 - 保持原始格式并优化PNG
          const originalType = currentImage.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.9)

          if (!dataUrl || dataUrl === 'data:,') {
            throw new Error('无法生成图片数据')
          }

          await window.electron.saveImage({ dataUrl, path: filePath })
          console.log(`第 ${i + 1} 张图片保存成功: ${fileName}`)

          successCount++
        } catch (error) {
          console.error(`保存第 ${i + 1} 张图片失败:`, error)
          failCount++
        }
      }

      alert(`批量保存完成！成功：${successCount} 张，失败：${failCount} 张`)
    } catch (error) {
      console.error('批量保存失败:', error)
      alert('批量保存失败: ' + error.message)
    }
  } else {
    // 浏览器版本的批量保存
    try {
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < imageList.value.length; i++) {
        try {
          console.log(`开始处理第 ${i + 1} 张图片...`)

          // 切换到当前图片
          currentImageIndex.value = i
          await new Promise(resolve => {
            nextTick(() => {
              updateWatermark()
              setTimeout(resolve, 200) // 增加等待时间确保渲染完成
            })
          })

          // 获取当前图片信息
          const currentImage = imageList.value[i]
          if (!currentImage) {
            throw new Error(`无法获取第 ${i + 1} 张图片信息`)
          }

          console.log(`处理图片: ${currentImage.name}`)

          const originalName = currentImage.name
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
          const extension = originalName.substring(originalName.lastIndexOf('.')) || '.jpg'

          // 生成文件名
          const now = new Date()
          const timestamp = now.getFullYear() +
              ('0' + (now.getMonth() + 1)).slice(-2) +
              ('0' + now.getDate()).slice(-2) +
              ('0' + now.getHours()).slice(-2) +
              ('0' + now.getMinutes()).slice(-2) +
              ('0' + now.getSeconds()).slice(-2) +
              ('0' + now.getMilliseconds()).slice(-3) // 添加毫秒避免重名

          const fileName = `${nameWithoutExt}_watermark_${timestamp}${extension}`

          // 检查canvas是否有内容
          if (!canvasRef.value) {
            throw new Error('Canvas未初始化')
          }

          // 保存图片
          const originalType = currentImage.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
          const dataUrl = createOptimizedDataURL(canvasRef.value, originalType, 0.9)

          if (!dataUrl || dataUrl === 'data:,') {
            throw new Error('无法生成图片数据')
          }

          const link = document.createElement('a')
          link.download = fileName
          link.href = dataUrl
          link.click()

          console.log(`第 ${i + 1} 张图片保存成功: ${fileName}`)

          successCount++

          // 添加延迟避免浏览器阻止多个下载
          await new Promise(resolve => setTimeout(resolve, 800))
        } catch (error) {
          console.error(`保存第 ${i + 1} 张图片失败:`, error)
          failCount++
        }
      }

      alert(`批量保存完成！成功：${successCount} 张，失败：${failCount} 张`)
    } catch (error) {
      console.error('批量保存失败:', error)
      alert('批量保存失败: ' + error.message)
    }
  }
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

// 添加水印拖动处理函数
const startWatermarkDrag = (e) => {
  e.preventDefault()
  watermarkDragging.value = true

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  watermarkStartPos.value = {
    x: e.clientX - (watermarkOffset.x / scaleX),
    y: e.clientY - (watermarkOffset.y / scaleY)
  }
}

const handleWatermarkDrag = (e) => {
  if (!watermarkDragging.value || !canvasRef.value) return

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  watermarkOffset.x = (e.clientX - watermarkStartPos.value.x) * scaleX
  watermarkOffset.y = (e.clientY - watermarkStartPos.value.y) * scaleY

  updateWatermark()
}

const stopWatermarkDrag = () => {
  watermarkDragging.value = false
}

// 在组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragAngle)
  document.removeEventListener('mouseup', stopDragAngle)
  document.removeEventListener('mousemove', handleWatermarkDrag)
  document.removeEventListener('mouseup', stopWatermarkDrag)
  document.removeEventListener('click', handleClickOutside)
})

// 清理图片列表
const clearImageList = () => {
  if (confirm('确定要清理所有图片吗？此操作不可撤销。')) {
    // 清空图片列表
    imageList.value = []
    currentImageIndex.value = 0

    // 清空画布
    if (canvasRef.value) {
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 重置画布大小
      canvas.width = 800
      canvas.height = 600
    }

    // 重置水印位置
    watermarkOffset.x = 100
    watermarkOffset.y = 100

    console.log('图片列表已清理')
  }
}

// 修改重置设置的功能
const resetSettings = () => {
  const defaultSettings = {
    text: "+++ 输入你要添加的水印文字 +++",
    color: "#000000",
    rgb: {r: 0, g: 0, b: 0, a: 0.6},
    fontSize: 12,
    watermarkHeight: 100,
    watermarkWidth: 100,
    angle: -45,
    repeat: true,
    spacing: 0
  }

  Object.assign(watermarkSettings, defaultSettings)

  // 重置 LOGO 设置
  Object.assign(logoSettings, {
    image: null,
    position: 'top-right',
    size: 100,
    padding: 20,
    opacity: 0.6
  })

  // 如果有画布，将水印位置重置到中心
  if (canvasRef.value) {
    watermarkOffset.x = canvasRef.value.width / 2
    watermarkOffset.y = canvasRef.value.height / 2
  } else {
    watermarkOffset.x = 100
    watermarkOffset.y = 100
  }

  localStorage.removeItem('watermarkSettings')
}

// 添加位置保存到 localStorage
watch([() => watermarkOffset.x, () => watermarkOffset.y], () => {
  const settings = JSON.parse(localStorage.getItem('watermarkSettings') || '{}')
  settings.watermarkOffset = {x: watermarkOffset.x, y: watermarkOffset.y}
  localStorage.setItem('watermarkSettings', JSON.stringify(settings))
}, {deep: true})

// 添加 LOGO 选择函数
const handleLogoSelect = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        logoSettings.originalWidth = img.width
        logoSettings.originalHeight = img.height
        logoSettings.aspectRatio = img.width / img.height
        logoSettings.image = e.target.result
        updateWatermark()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  input.click()
}

// 清除 LOGO
const clearLogo = () => {
  logoSettings.image = null
  updateWatermark()
}

// 加对 logoSettings 的监听
watch(
    logoSettings,
    () => {
      // 保存 LOGO 配置（不包括图片数据）
      const settings = JSON.parse(localStorage.getItem('watermarkSettings') || '{}')
      settings.logoConfig = {
        position: logoSettings.position,
        size: logoSettings.size,
        padding: logoSettings.padding,
        opacity: logoSettings.opacity
      }
      localStorage.setItem('watermarkSettings', JSON.stringify(settings))

      // 只有在有图片的情况下才更新预览
      if (imageList.value.length > 0) {
        updateWatermark()
      }
    },
    { deep: true }
)
</script>

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
  padding-bottom: 40px;
}

/* 左侧区域 - 垂直布局 */
.left-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.canvas-area {
  min-width: 300px;
  max-height: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.drop-zone {
  width: 100%;
  max-height: 460px;
  height: 460px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.drop-zone.dragging {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.drop-zone.clickable {
  cursor: pointer;
}

.drop-zone.clickable:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  cursor: move; /* 添加移动光标 */
}

.control-panel {
  width: 400px;
  padding: 0 10px;
  flex-shrink: 0;
  overflow-y: auto;
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
  width: 80px;
  flex-shrink: 0;
  white-space: nowrap;
}

.setting-item > :nth-child(2) {
  flex: 1;
  min-width: 0;
}

input[type="text"],
input[type="color"] {
  width: 100%;
  min-width: 0;
}

input[type="range"] {
  width: 60%; /* 调整滑动条宽度为60% */
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

.app-title {
  text-align: center;
  color: #333;
  margin-bottom: 12px;
  font-size: 1.2em;
  padding: 8px 0;
  border-bottom: 2px solid #4CAF50;
}

/* 修改版权样式 */
.copyright {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;  /* 防止版本号换行 */
}

.copyright a {
  color: #666;
  text-decoration: none;
}

.copyright a:hover {
  color: #4CAF50;
}

.color-picker-container {
  position: relative;
  display: inline-block;
}

.color-preview {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: border-color 0.3s;
}

.color-preview:hover {
  border-color: #4CAF50;
}

.color-picker-popup {
  position: fixed;
  z-index: 1000;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 10px;
}

.rotate-button {
  padding: 4px 8px;
  font-size: 12px;
  height: 28px;
  min-width: 60px;
}

.logo-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.small-button {
  padding: 2px 8px;
  font-size: 12px;
  height: 24px;
}

.danger {
  background: #ff4444;
}

.danger:hover {
  background: #cc0000;
}

.position-select {
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
}

/* 调整输入框的度 */
input[type="text"],
input[type="number"] {
  height: 24px;
  padding: 2px 5px;
}

/* 调整范围滑块的大小 */
input[type="range"] {
  height: 4px;
  margin: 8px 0;
}

/* 调整选择框的高度 */
.position-select {
  height: 24px;
  padding: 2px 4px;
}

/* 调整小按钮的高度 */
.small-button {
  padding: 2px 8px;
  height: 24px;
}

.setting-tip {
  font-size: 12px;
  color: #666;
  padding-left: 86px;  /* 与输入框对齐 */
  margin-top: -4px;
  margin-bottom: 2px;
}

/* 模式切换样式 */
.mode-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.switch-label input[type="checkbox"] {
  margin: 0;
}

.switch-text {
  font-weight: 500;
  color: #333;
}

.value-display {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.save-all-button {
  background: #9c27b0;
}

.save-all-button:hover {
  background: #7b1fa2;
}

.clear-button {
  background: #f44336;
}

.clear-button:hover {
  background: #d32f2f;
}

/* 多文件列表样式 - 位于画布底部 */
.file-list-bottom {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin: 0 20px; /* 与画布区域的padding保持一致 */
  box-sizing: border-box;
}

.file-list h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 13px;
  text-align: center;
}

.file-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
  justify-content: flex-start;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 80px;
  min-height: 100px;
}

.file-item:hover {
  border-color: #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-item.active {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.file-preview {
  width: 50px;
  height: 50px;
  margin-bottom: 6px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.file-name {
  font-size: 10px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
  line-height: 1.2;
}

.remove-btn {
  padding: 2px 6px;
  font-size: 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #d32f2f;
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.navigation-buttons button {
  padding: 4px 10px;
  font-size: 11px;
  background: #2196F3;
}

.navigation-buttons button:hover:not(:disabled) {
  background: #1976D2;
}

.navigation-buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.current-info {
  font-size: 11px;
  color: #666;
  font-weight: bold;
}
</style>